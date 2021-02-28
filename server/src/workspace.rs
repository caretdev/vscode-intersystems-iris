use crate::protocol::Options;
use std::{path::PathBuf, sync::Arc};

pub struct Workspace {
    _current_dir: Arc<PathBuf>,
}

impl Workspace {
    pub fn new(_current_dir: Arc<PathBuf>) -> Self {
        Self {
            _current_dir,
        }
    }

    pub async fn reparse(&self, _options: &Options) {
    }
}
