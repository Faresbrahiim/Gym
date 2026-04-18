use axum::{
    extract::{Query, State, WebSocketUpgrade},
    http::StatusCode,
    response::Response,
};
use axum::extract::ws::{Message, WebSocket};
use serde::Deserialize;
use tokio::time::{timeout, Duration};

use crate::{jwt, presence, state::SharedState};

#[derive(Deserialize)]
pub struct WsQuery {
    token: String,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<WsQuery>,
    State(state): State<SharedState>,
) -> Result<Response, StatusCode> {
    let user_id = jwt::extract_user_id(&query.token, &state.jwt_public_key)
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let ttl = state.presence_ttl_secs;

    Ok(ws.on_upgrade(move |socket| handle_socket(socket, user_id, state, ttl)))
}

async fn handle_socket(
    mut socket: WebSocket,
    user_id: String,
    state: SharedState,
    ttl: u64,
) {
    tracing::info!("user {} connected", user_id);

    let mut conn = state.redis.clone();
    presence::set_online(&mut conn, &user_id, ttl).await;

    let idle_timeout = Duration::from_secs(ttl);

    loop {
        match timeout(idle_timeout, socket.recv()).await {
            Ok(Some(Ok(msg))) => match msg {
                Message::Ping(_) | Message::Text(_) => {
                    presence::set_online(&mut conn, &user_id, ttl).await;
                }
                Message::Close(_) => break,
                _ => {}
            },
            Ok(Some(Err(e))) => {
                tracing::info!("user {} socket error: {}", user_id, e);
                break;
            }
            Ok(None) => break,
            Err(_) => {
                tracing::info!("user {} heartbeat timeout after {}s", user_id, ttl);
                break;
            }
        }
    }

    presence::set_offline(&mut conn, &user_id).await;

    tracing::info!("user {} disconnected", user_id);
}
