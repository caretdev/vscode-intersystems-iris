use crate::{
    config::ConfigManager, connection::ConnectionManager, protocol::*, workspace::Workspace,
};
use async_trait::async_trait;
use futures::lock::Mutex;
use jsonrpc::{server::Result, Middleware};
use jsonrpc_derive::{jsonrpc_method, jsonrpc_server};
use log::trace;
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use std::{mem, path::PathBuf, sync::Arc};

#[allow(dead_code)]
pub struct InterSystemsLspServer<C> {
    client: Arc<C>,
    client_capabilities: OnceCell<Arc<ClientCapabilities>>,
    client_info: OnceCell<Option<ClientInfo>>,
    config_manager: OnceCell<ConfigManager<C>>,
    action_manager: ActionManager,
    connection_manager: OnceCell<ConnectionManager<C>>,
    workspace: Workspace,
}

#[derive(Debug, PartialEq, Eq, Clone, Serialize, Deserialize)]
pub struct ProductionsRequestParams {
  id: Option<String>,
}

#[derive(Debug, PartialEq, Eq, Clone, Serialize, Deserialize)]
pub struct GlobalsRequestParams {}

#[jsonrpc_server]
impl<C: LspClient + Send + Sync + 'static> InterSystemsLspServer<C> {
    pub fn new(client: Arc<C>, current_dir: Arc<PathBuf>) -> Self {
        let workspace = Workspace::new(Arc::clone(&current_dir));
        Self {
            client: Arc::clone(&client),
            client_capabilities: OnceCell::new(),
            client_info: OnceCell::new(),
            config_manager: OnceCell::new(),
            action_manager: ActionManager::default(),
            connection_manager: OnceCell::new(),
            workspace,
        }
    }

    fn client_capabilities(&self) -> Arc<ClientCapabilities> {
        Arc::clone(
            self.client_capabilities
                .get()
                .expect("initialize has not been called"),
        )
    }

    fn config_manager(&self) -> &ConfigManager<C> {
        self.config_manager
            .get()
            .expect("initialize has not been called")
    }

    fn connection_manager(&self) -> &ConnectionManager<C> {
        self.connection_manager
            .get()
            .expect("initialize has not been called")
    }

    #[jsonrpc_method("initialize", kind = "request")]
    pub async fn initialize(&self, params: InitializeParams) -> Result<InitializeResult> {
        trace!("initialize: {:?}", params);
        self.client_capabilities
            .set(Arc::new(params.capabilities))
            .expect("initialize was called two times");

        self.client_info
            .set(params.client_info)
            .expect("initialize was called two times");

        let _ = self.config_manager.set(ConfigManager::new(
            Arc::clone(&self.client),
            self.client_capabilities(),
        ));

        let _ = self
            .connection_manager
            .set(ConnectionManager::new(Arc::clone(&self.client)));

        let capabilities = ServerCapabilities {
            ..ServerCapabilities::default()
        };

        Ok(InitializeResult {
            capabilities,
            server_info: Some(ServerInfo {
                name: "InterSystems Language Server".to_owned(),
                version: Some(env!("CARGO_PKG_VERSION").to_owned()),
            }),
        })
    }

    #[jsonrpc_method("initialized", kind = "notification")]
    pub async fn initialized(&self, _params: InitializedParams) {
        self.action_manager.push(Action::PullConfiguration).await;
        self.action_manager.push(Action::RegisterCapabilities).await;
    }

    #[jsonrpc_method("shutdown", kind = "request")]
    pub async fn shutdown(&self, _params: ()) -> Result<()> {
        trace!("shutdown");
        Ok(())
    }

    #[jsonrpc_method("exit", kind = "notification")]
    pub async fn exit(&self, _params: ()) {
        trace!("exit");
    }

    #[jsonrpc_method("$/cancelRequest", kind = "notification")]
    pub async fn cancel_request(&self, _params: CancelParams) {}

    #[jsonrpc_method("workspace/didChangeConfiguration", kind = "notification")]
    pub async fn did_change_configuration(&self, params: DidChangeConfigurationParams) {
        let config_manager = self.config_manager();
        config_manager.push(params.settings).await;
        let options = config_manager.get().await;
        self.connection_manager().reparse(&options).await;
        // self.workspace.reparse(&options).await;
    }

    async fn pull_configuration(&self) -> Options {
        let config_manager = self.config_manager();
        let has_changed = config_manager.pull().await;
        let options = config_manager.get().await;
        if has_changed {
            // self.workspace.reparse(&options).await;
            self.connection_manager().reparse(&options).await;
        }
        options
    }

    #[jsonrpc_method("intersystems/productions", kind = "request")]
    pub async fn productions(
        &self,
        _params: ProductionsRequestParams,
    ) -> Result<ProductionsResult> {
        let list = self.connection_manager().productions().await;
        Ok(ProductionsResult { list })
    }

    #[jsonrpc_method("intersystems/productions/services", kind = "request")]
    pub async fn production_services(
        &self,
        params: ProductionsRequestParams,
    ) -> Result<ProductionServicesResult> {
        let list = self.connection_manager().production_services(params.id.unwrap_or_default()).await;
        Ok(ProductionServicesResult { list })
    }

    #[jsonrpc_method("intersystems/productions/operations", kind = "request")]
    pub async fn production_operations(
        &self,
        params: ProductionsRequestParams,
    ) -> Result<ProductionOperationsResult> {
        let list = self.connection_manager().production_operations(params.id.unwrap_or_default()).await;
        Ok(ProductionOperationsResult { list })
    }

    #[jsonrpc_method("intersystems/productions/processes", kind = "request")]
    pub async fn production_processes(
        &self,
        params: ProductionsRequestParams,
    ) -> Result<ProductionProcessesResult> {
        let list = self.connection_manager().production_processes(params.id.unwrap_or_default()).await;
        Ok(ProductionProcessesResult { list })
    }

    #[jsonrpc_method("intersystems/globals", kind = "request")]
    pub async fn globals(
        &self,
        _params: GlobalsRequestParams,
    ) -> Result<GlobalsResult> {
        let list = self.connection_manager().globals().await;
        Ok(GlobalsResult { list })
    }
}

#[async_trait]
impl<C: LspClient + Send + Sync + 'static> Middleware for InterSystemsLspServer<C> {
    async fn before_message(&self) {}

    async fn after_message(&self) {
        for action in self.action_manager.take().await {
            match action {
                Action::RegisterCapabilities => {
                    let config_manager = self.config_manager();
                    config_manager.register().await;
                }
                Action::PullConfiguration => {
                    self.pull_configuration().await;
                }
            }
        }
    }
}

#[derive(Debug, PartialEq, Clone)]
enum Action {
    RegisterCapabilities,
    PullConfiguration,
}

#[derive(Debug, Default)]
struct ActionManager {
    actions: Mutex<Vec<Action>>,
}

impl ActionManager {
    pub async fn push(&self, action: Action) {
        let mut actions = self.actions.lock().await;
        actions.push(action);
    }

    pub async fn take(&self) -> Vec<Action> {
        let mut actions = self.actions.lock().await;
        mem::replace(&mut *actions, Vec::new())
    }
}
