use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use serde_json::{json, Value};

use crate::{presence, state::SharedState};

pub async fn get_user_presence(
    Path(user_id): Path<String>,
    State(state): State<SharedState>,
) -> Result<Json<Value>, StatusCode> {
    let mut conn = state.redis.lock().await;
    let online = presence::is_online(&mut conn, &user_id).await;
    Ok(Json(json!({ "userId": user_id, "online": online })))
}

pub async fn get_all_online(
    State(state): State<SharedState>,
) -> Result<Json<Value>, StatusCode> {
    let mut conn = state.redis.lock().await;
    let online = presence::get_all_online(&mut conn).await;
    Ok(Json(json!({ "online": online })))
}
