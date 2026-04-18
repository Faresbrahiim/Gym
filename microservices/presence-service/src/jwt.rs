use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: Option<String>,
}

fn decode_claims(token: &str, public_key_pem: &str) -> Option<Claims> {
    let key = DecodingKey::from_rsa_pem(public_key_pem.as_bytes()).ok()?;

    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_required_spec_claims(&["exp"]);
    validation.set_audience(&["MyGymUsers"]);
    validation.set_issuer(&["MyGymApp"]);

    match decode::<Claims>(token, &key, &validation) {
        Ok(data) => Some(data.claims),
        Err(e) => {
            tracing::error!("JWT validation failed: {:?}", e);
            None
        }
    }
}

pub fn extract_user_id(token: &str, public_key_pem: &str) -> Option<String> {
    decode_claims(token, public_key_pem).map(|c| c.sub)
}

pub fn extract_admin(token: &str, public_key_pem: &str) -> bool {
    decode_claims(token, public_key_pem)
        .and_then(|c| c.role)
        .map(|r| r == "ADMIN")
        .unwrap_or(false)
}

pub fn extract_bearer_token(auth_header: &str) -> Option<&str> {
    auth_header.strip_prefix("Bearer ").map(|t| t.trim_end())
}
