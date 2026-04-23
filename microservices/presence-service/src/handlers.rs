use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::Json,
    Json as RequestJson,
};
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;

use crate::{jwt, presence, state::SharedState};

#[derive(Deserialize)]
pub struct BulkPresenceRequest {
    #[serde(rename = "userIds")]
    user_ids: Vec<String>,
}

pub async fn get_user_presence(
    Path(user_id): Path<String>,
    State(state): State<SharedState>,
) -> Result<Json<Value>, StatusCode> {
    let mut conn = state.redis.clone();
    let online = presence::is_online(&mut conn, &user_id).await;
    Ok(Json(json!({ "userId": user_id, "online": online })))
}

pub async fn get_all_online(
    headers: HeaderMap,
    State(state): State<SharedState>,
) -> Result<Json<Value>, StatusCode> {
    let token = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| jwt::extract_bearer_token(v))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !jwt::extract_admin(token, &state.jwt_public_key) {
        return Err(StatusCode::FORBIDDEN);
    }

    let mut conn = state.redis.clone();
    let online = presence::get_all_online(&mut conn).await;
    Ok(Json(json!({ "online": online })))
}

pub async fn get_bulk_presence(
    State(state): State<SharedState>,
    RequestJson(payload): RequestJson<BulkPresenceRequest>,
) -> Result<Json<HashMap<String, bool>>, StatusCode> {
    if payload.user_ids.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let mut conn = state.redis.clone();
    let mut presence_map = HashMap::with_capacity(payload.user_ids.len());

    for user_id in payload.user_ids {
        let is_online = presence::is_online(&mut conn, &user_id).await;
        presence_map.insert(user_id, is_online);
    }

    Ok(Json(presence_map))
}
