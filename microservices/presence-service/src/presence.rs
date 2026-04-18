use redis::{aio::ConnectionManager, AsyncCommands};

const ONLINE_SET: &str = "presence:online";

fn user_key(user_id: &str) -> String {
    format!("presence:{}", user_id)
}

pub async fn set_online(conn: &mut ConnectionManager, user_id: &str, ttl_secs: u64) {
    let key = user_key(user_id);
    let _: () = conn.set_ex(&key, "1", ttl_secs).await.unwrap_or(());
    let _: () = conn.sadd(ONLINE_SET, user_id).await.unwrap_or(());
}

pub async fn set_offline(conn: &mut ConnectionManager, user_id: &str) {
    let key = user_key(user_id);
    let _: () = conn.del(&key).await.unwrap_or(());
    let _: () = conn.srem(ONLINE_SET, user_id).await.unwrap_or(());
}

pub async fn is_online(conn: &mut ConnectionManager, user_id: &str) -> bool {
    let key = user_key(user_id);
    conn.exists(&key).await.unwrap_or(false)
}

pub async fn get_all_online(conn: &mut ConnectionManager) -> Vec<String> {
    let members: Vec<String> = conn.smembers(ONLINE_SET).await.unwrap_or_default();

    let mut online = Vec::with_capacity(members.len());
    for user_id in members {
        let key = user_key(&user_id);
        let exists: bool = conn.exists(&key).await.unwrap_or(false);
        if exists {
            online.push(user_id);
        } else {
            let _: () = conn.srem(ONLINE_SET, &user_id).await.unwrap_or(());
        }
    }
    online
}
