use redis::{aio::ConnectionManager, AsyncCommands, RedisResult};

const ONLINE_SET: &str = "presence:online";

fn user_key(user_id: &str) -> String {
    format!("presence:{}", user_id)
}

pub async fn set_online(conn: &mut ConnectionManager, user_id: &str, ttl_secs: u64) {
    let key = user_key(user_id);

    let setex: RedisResult<()> = conn.set_ex(&key, "1", ttl_secs).await;
    if let Err(e) = setex {
        tracing::error!("redis SETEX {} failed: {}", key, e);
    }

    let sadd: RedisResult<()> = conn.sadd(ONLINE_SET, user_id).await;
    if let Err(e) = sadd {
        tracing::error!("redis SADD {} {} failed: {}", ONLINE_SET, user_id, e);
    }
}

pub async fn set_offline(conn: &mut ConnectionManager, user_id: &str) {
    let key = user_key(user_id);

    let del: RedisResult<()> = conn.del(&key).await;
    if let Err(e) = del {
        tracing::error!("redis DEL {} failed: {}", key, e);
    }

    let srem: RedisResult<()> = conn.srem(ONLINE_SET, user_id).await;
    if let Err(e) = srem {
        tracing::error!("redis SREM {} {} failed: {}", ONLINE_SET, user_id, e);
    }
}

pub async fn is_online(conn: &mut ConnectionManager, user_id: &str) -> bool {
    let key = user_key(user_id);
    match conn.exists(&key).await {
        Ok(v) => v,
        Err(e) => {
            tracing::error!("redis EXISTS {} failed: {}", key, e);
            false
        }
    }
}

pub async fn get_all_online(conn: &mut ConnectionManager) -> Vec<String> {
    let members: Vec<String> = match conn.smembers(ONLINE_SET).await {
        Ok(v) => v,
        Err(e) => {
            tracing::error!("redis SMEMBERS {} failed: {}", ONLINE_SET, e);
            return Vec::new();
        }
    };

    let mut online = Vec::with_capacity(members.len());
    for user_id in members {
        let key = user_key(&user_id);
        match conn.exists::<_, bool>(&key).await {
            Ok(true) => online.push(user_id),
            Ok(false) => {
                let srem: RedisResult<()> = conn.srem(ONLINE_SET, &user_id).await;
                if let Err(e) = srem {
                    tracing::error!(
                        "redis SREM {} {} (stale cleanup) failed: {}",
                        ONLINE_SET,
                        user_id,
                        e
                    );
                }
            }
            Err(e) => {
                tracing::error!("redis EXISTS {} failed: {}", key, e);
                online.push(user_id);
            }
        }
    }
    online
}
