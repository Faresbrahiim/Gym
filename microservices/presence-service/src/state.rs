use redis::aio::ConnectionManager;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct AppState {
    pub redis: Mutex<ConnectionManager>,
    pub presence_ttl_secs: u64,
    pub jwt_public_key: String,
}

pub type SharedState = Arc<AppState>;
