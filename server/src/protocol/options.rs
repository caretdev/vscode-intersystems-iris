use serde::{Deserialize, Serialize};

#[derive(Debug, PartialEq, Eq, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Conn {
	pub active: Option<bool>,
	pub host: Option<String>,
	pub port: Option<u16>,
	pub super_port: Option<u16>,
	pub ns: Option<String>,
	pub username: Option<String>,
	pub password: Option<String>,
}

#[derive(Debug, PartialEq, Eq, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Objectscript {
	pub conn: Option<Conn>,
}

#[derive(Debug, PartialEq, Eq, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Options {
	pub objectscript: Option<Objectscript>,
}
