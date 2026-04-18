use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

#[derive(Deserialize)]
struct Claims {
    sub: String,
}

pub fn extract_user_id(token: &str, public_key_pem: &str) -> Option<String> {
    let key = DecodingKey::from_rsa_pem(public_key_pem.as_bytes()).ok()?;

    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_required_spec_claims(&["exp"]);

    decode::<Claims>(token, &key, &validation)
        .ok()
        .map(|data| data.claims.sub)
}

pub fn extract_bearer_token(auth_header: &str) -> Option<&str> {
    auth_header.strip_prefix("Bearer ")
}
