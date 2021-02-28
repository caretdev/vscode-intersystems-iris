use jsonrpc::client::Result;
use jsonrpc_derive::{jsonrpc_client, jsonrpc_method};
use lsp_types::*;
use super::InterSystemsConnectedParams;

#[jsonrpc_client(InterSystemsLspClient)]
pub trait LspClient {
    #[jsonrpc_method("workspace/configuration", kind = "request")]
    async fn configuration(&self, params: ConfigurationParams) -> Result<serde_json::Value>;

    #[jsonrpc_method("window/showMessage", kind = "notification")]
    async fn show_message(&self, params: ShowMessageParams);

    #[jsonrpc_method("client/registerCapability", kind = "request")]
    async fn register_capability(&self, params: RegistrationParams) -> Result<()>;

    #[jsonrpc_method("$/progress", kind = "notification")]
    async fn progress(&self, params: ProgressParams);

    #[jsonrpc_method("window/workDoneProgress/create", kind = "request")]
    async fn work_done_progress_create(&self, params: WorkDoneProgressCreateParams) -> Result<()>;

    #[jsonrpc_method("window/logMessage", kind = "notification")]
    async fn log_message(&self, params: LogMessageParams);

    #[jsonrpc_method("intersystems/connected", kind = "notification")]
    async fn connected(&self, params: InterSystemsConnectedParams);
}
