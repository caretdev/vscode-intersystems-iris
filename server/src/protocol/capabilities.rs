use lsp_types::ClientCapabilities;

pub trait ClientCapabilitiesExt {
	fn has_pull_configuration_support(&self) -> bool;

	fn has_push_configuration_support(&self) -> bool;
}

impl ClientCapabilitiesExt for ClientCapabilities {
	fn has_pull_configuration_support(&self) -> bool {
		self.workspace.as_ref().and_then(|cap| cap.configuration) == Some(true)
	}

	fn has_push_configuration_support(&self) -> bool {
		self
			.workspace
			.as_ref()
			.and_then(|cap| cap.did_change_configuration)
			.and_then(|cap| cap.dynamic_registration)
			== Some(true)
	}
}
