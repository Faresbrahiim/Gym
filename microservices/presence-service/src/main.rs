mod config;
mod presence;
mod state;

use axum::{Router, routing::get};
use redis::{Client, aio::ConnectionManager};
use state::{AppState, SharedState};
use std::sync::Arc;
use tokio::sync::Mutex;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    dotenvy::dotenv().ok();

    let config = config::Config::from_env();

    let client = Client::open(config.redis_url.as_str()).expect("Invalid REDIS_URL");
    let redis_conn = ConnectionManager::new(client).await.expect("Failed to connect to Redis");

    let state: SharedState = Arc::new(AppState {
        redis: Mutex::new(redis_conn),
        presence_ttl_secs: config.presence_ttl_secs,
        jwt_public_key: config.jwt_public_key,
    });

    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    tracing::info!("presence-service listening on {}", addr);
    axum::serve(listener, app).await.unwrap();
}
