use std::env;

pub struct Config {
    pub redis_url: String,
    pub presence_ttl_secs: u64,
    pub port: u16,
    pub jwt_public_key: String,
}

impl Config {
    pub fn from_env() -> Self {
        Config {
            redis_url: env::var("REDIS_URL").expect("REDIS_URL must be set"),
            presence_ttl_secs: env::var("PRESENCE_TTL_SECS")
                .unwrap_or_else(|_| "60".to_string())
                .parse()
                .expect("PRESENCE_TTL_SECS must be a number"),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .expect("PORT must be a number"),
            jwt_public_key: env::var("JWT_PUBLIC_KEY").expect("JWT_PUBLIC_KEY must be set"),
        }
    }
}
