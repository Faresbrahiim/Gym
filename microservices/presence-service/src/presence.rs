use redis::{aio::ConnectionManager, AsyncCommands};

pub async fn set_online(conn: &mut ConnectionManager, user_id: &str, ttl_secs: u64) {
    let key = format!("presence:{}", user_id);
    let _: () = conn
        .set_ex(&key, "1", ttl_secs)
        .await
        .unwrap_or(());
}

pub async fn set_offline(conn: &mut ConnectionManager, user_id: &str) {
    let key = format!("presence:{}", user_id);
    let _: () = conn.del(&key).await.unwrap_or(());
}

pub async fn is_online(conn: &mut ConnectionManager, user_id: &str) -> bool {
    let key = format!("presence:{}", user_id);
    conn.exists(&key).await.unwrap_or(false)
}

pub async fn get_all_online(conn: &mut ConnectionManager) -> Vec<String> {
    let keys: Vec<String> = redis::cmd("KEYS")
        .arg("presence:*")
        .query_async(conn)
        .await
        .unwrap_or_default();

    keys.into_iter()
        .filter_map(|k| k.strip_prefix("presence:").map(|s| s.to_string()))
        .collect()
}
