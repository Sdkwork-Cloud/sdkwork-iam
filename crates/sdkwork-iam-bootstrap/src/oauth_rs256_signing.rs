//! RS256 OAuth authorization-server signing keys and JWKS publication.

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use rsa::pkcs8::{DecodePrivateKey, EncodePrivateKey, EncodePublicKey};
use rsa::traits::PublicKeyParts;
use rsa::RsaPrivateKey;
use serde_json::{json, Value};
use sqlx::{PgPool, Row};

use crate::tenant_signing_key::{
    decode_signing_secret_ref, encode_signing_secret_ref, hash_secret_ref,
};

const OAUTH_RS256_KID_SUFFIX: &str = "oauth-rs256:primary";
const OAUTH_RS256_KEY_BITS: usize = 2048;

#[derive(Clone, Debug)]
pub struct OAuthRs256SigningMaterial {
    pub tenant_id: String,
    pub kid: String,
    pub private_key: RsaPrivateKey,
    pub public_spki_der: Vec<u8>,
}

pub fn oauth_rs256_signing_kid(tenant_id: &str) -> String {
    format!("{tenant_id}:{OAUTH_RS256_KID_SUFFIX}")
}

pub async fn ensure_postgres_oauth_rs256_signing_key(
    pool: &PgPool,
    tenant_id: &str,
) -> Result<(), sqlx::Error> {
    if tenant_id.trim().is_empty() {
        return Ok(());
    }

    let kid = oauth_rs256_signing_kid(tenant_id);
    let existing = sqlx::query_scalar::<_, String>(
        "SELECT id FROM iam_tenant_signing_key WHERE tenant_id = $1 AND kid = $2 LIMIT 1",
    )
    .bind(tenant_id)
    .bind(&kid)
    .fetch_optional(pool)
    .await?;
    if existing.is_some() {
        return Ok(());
    }

    let private_key = RsaPrivateKey::new(&mut rsa::rand_core::OsRng, OAUTH_RS256_KEY_BITS)
        .map_err(|error| sqlx::Error::Protocol(error.to_string()))?;
    let pkcs8 = private_key
        .to_pkcs8_der()
        .map_err(|error| sqlx::Error::Protocol(error.to_string()))?;
    let secret_ref = encode_signing_secret_ref(pkcs8.as_bytes());
    let secret_hash = hash_secret_ref(&secret_ref);

    sqlx::query(
        "INSERT INTO iam_tenant_signing_key \
         (id, tenant_id, kid, alg, secret_ref, secret_hash, status, active_from, created_at, updated_at) \
         VALUES ($1, $2, $3, 'RS256', $4, $5, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) \
         ON CONFLICT (tenant_id, kid) DO NOTHING",
    )
    .bind(uuid::Uuid::now_v7().to_string())
    .bind(tenant_id)
    .bind(&kid)
    .bind(&secret_ref)
    .bind(&secret_hash)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn load_postgres_oauth_rs256_signing_key(
    pool: &PgPool,
    tenant_id: &str,
) -> Result<Option<OAuthRs256SigningMaterial>, sqlx::Error> {
    if tenant_id.trim().is_empty() {
        return Ok(None);
    }

    let kid = oauth_rs256_signing_kid(tenant_id);
    let row = sqlx::query(
        "SELECT tenant_id, kid, secret_ref FROM iam_tenant_signing_key \
         WHERE tenant_id = $1 AND kid = $2 AND alg = 'RS256' AND status = 'active' \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(&kid)
    .fetch_optional(pool)
    .await?;

    let Some(row) = row else {
        return Ok(None);
    };

    let tenant_id: String = row.get(0);
    let kid: String = row.get(1);
    let secret_ref: String = row.get(2);
    let pkcs8 = decode_signing_secret_ref(&secret_ref).map_err(sqlx::Error::Protocol)?;
    let private_key = RsaPrivateKey::from_pkcs8_der(&pkcs8)
        .map_err(|error| sqlx::Error::Protocol(error.to_string()))?;
    let public_spki_der = private_key
        .to_public_key()
        .to_public_key_der()
        .map_err(|error| sqlx::Error::Protocol(error.to_string()))?
        .to_vec();

    Ok(Some(OAuthRs256SigningMaterial {
        tenant_id,
        kid,
        private_key,
        public_spki_der,
    }))
}

pub async fn list_postgres_oauth_jwks_document(pool: &PgPool) -> Result<Value, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT kid, secret_ref FROM iam_tenant_signing_key \
         WHERE alg = 'RS256' AND status = 'active' \
           AND kid LIKE '%:oauth-rs256:%' \
         ORDER BY active_from DESC",
    )
    .fetch_all(pool)
    .await?;

    let mut keys = Vec::new();
    for row in rows {
        let kid: String = row.get(0);
        let secret_ref: String = row.get(1);
        let pkcs8 = match decode_signing_secret_ref(&secret_ref) {
            Ok(value) => value,
            Err(_) => continue,
        };
        let private_key = match RsaPrivateKey::from_pkcs8_der(&pkcs8) {
            Ok(value) => value,
            Err(_) => continue,
        };
        if let Some(jwk) = rsa_public_key_to_jwk(&kid, &private_key) {
            keys.push(jwk);
        }
    }

    Ok(json!({ "keys": keys }))
}

pub fn sign_rs256_jwt(
    material: &OAuthRs256SigningMaterial,
    header: &Value,
    payload: &Value,
) -> Result<String, String> {
    use rsa::pkcs1v15::SigningKey;
    use rsa::rand_core::OsRng;
    use rsa::signature::{RandomizedSigner, SignatureEncoding};

    let mut header_object = header
        .as_object()
        .cloned()
        .ok_or_else(|| "JWT header must be an object".to_string())?;
    header_object.insert("alg".to_owned(), json!("RS256"));
    header_object.insert("kid".to_owned(), json!(material.kid));
    header_object.insert("typ".to_owned(), json!("JWT"));

    let header_json = serde_json::to_string(&Value::Object(header_object))
        .map_err(|error| format!("serialize JWT header failed: {error}"))?;
    let payload_json = serde_json::to_string(payload)
        .map_err(|error| format!("serialize JWT payload failed: {error}"))?;

    let header_b64 = URL_SAFE_NO_PAD.encode(header_json.as_bytes());
    let payload_b64 = URL_SAFE_NO_PAD.encode(payload_json.as_bytes());
    let signing_input = format!("{header_b64}.{payload_b64}");

    let signing_key = SigningKey::<sha2::Sha256>::new(material.private_key.clone());
    let signature = signing_key.sign_with_rng(&mut OsRng, signing_input.as_bytes());

    Ok(format!(
        "{signing_input}.{}",
        URL_SAFE_NO_PAD.encode(signature.to_bytes())
    ))
}

pub fn verify_rs256_jwt(
    material: &OAuthRs256SigningMaterial,
    token: &str,
) -> Result<Value, String> {
    use rsa::pkcs1v15::{Signature, VerifyingKey};
    use rsa::signature::Verifier;

    let mut parts = token.split('.');
    let header_b64 = parts
        .next()
        .ok_or_else(|| "JWT header is missing".to_string())?;
    let payload_b64 = parts
        .next()
        .ok_or_else(|| "JWT payload is missing".to_string())?;
    let signature_b64 = parts
        .next()
        .ok_or_else(|| "JWT signature is missing".to_string())?;
    if parts.next().is_some() {
        return Err("JWT must contain exactly three segments".to_string());
    }

    let header: Value = serde_json::from_slice(
        &URL_SAFE_NO_PAD
            .decode(header_b64)
            .map_err(|error| format!("decode JWT header failed: {error}"))?,
    )
    .map_err(|error| format!("parse JWT header failed: {error}"))?;
    if header.get("alg").and_then(Value::as_str) != Some("RS256") {
        return Err("JWT alg must be RS256".to_string());
    }
    if header.get("kid").and_then(Value::as_str) != Some(material.kid.as_str()) {
        return Err("JWT kid does not match signing material".to_string());
    }

    let signature_bytes = URL_SAFE_NO_PAD
        .decode(signature_b64)
        .map_err(|error| format!("decode JWT signature failed: {error}"))?;
    let signature = Signature::try_from(signature_bytes.as_slice())
        .map_err(|error| format!("parse JWT signature failed: {error}"))?;
    let signing_input = format!("{header_b64}.{payload_b64}");
    let verifying_key = VerifyingKey::<sha2::Sha256>::new(material.private_key.to_public_key());
    verifying_key
        .verify(signing_input.as_bytes(), &signature)
        .map_err(|_| "JWT RS256 signature verification failed".to_string())?;

    serde_json::from_slice(
        &URL_SAFE_NO_PAD
            .decode(payload_b64)
            .map_err(|error| format!("decode JWT payload failed: {error}"))?,
    )
    .map_err(|error| format!("parse JWT payload failed: {error}"))
}

fn rsa_public_key_to_jwk(kid: &str, private_key: &RsaPrivateKey) -> Option<Value> {
    let public_key = private_key.to_public_key();
    let n = URL_SAFE_NO_PAD.encode(public_key.n().to_bytes_be());
    let e = URL_SAFE_NO_PAD.encode(public_key.e().to_bytes_be());
    Some(json!({
        "kty": "RSA",
        "kid": kid,
        "use": "sig",
        "alg": "RS256",
        "n": n,
        "e": e,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn oauth_rs256_kid_is_stable() {
        assert_eq!(
            oauth_rs256_signing_kid("100001"),
            "100001:oauth-rs256:primary"
        );
    }

    #[test]
    fn sign_rs256_jwt_produces_three_segments() {
        let private_key =
            RsaPrivateKey::new(&mut rsa::rand_core::OsRng, OAUTH_RS256_KEY_BITS).expect("rsa key");
        let public_spki = private_key
            .to_public_key()
            .to_public_key_der()
            .expect("spki")
            .to_vec();
        let material = OAuthRs256SigningMaterial {
            tenant_id: "100001".to_owned(),
            kid: oauth_rs256_signing_kid("100001"),
            private_key,
            public_spki_der: public_spki,
        };
        let token = sign_rs256_jwt(
            &material,
            &json!({ "typ": "JWT" }),
            &json!({ "sub": "user-1", "exp": 4_102_444_800_i64 }),
        )
        .expect("token");
        assert_eq!(token.split('.').count(), 3);
    }

    #[test]
    fn verify_rs256_jwt_rejects_tampering() {
        let private_key =
            RsaPrivateKey::new(&mut rsa::rand_core::OsRng, OAUTH_RS256_KEY_BITS).expect("rsa key");
        let material = OAuthRs256SigningMaterial {
            tenant_id: "100001".to_string(),
            kid: oauth_rs256_signing_kid("100001"),
            public_spki_der: private_key
                .to_public_key()
                .to_public_key_der()
                .expect("public key der")
                .as_bytes()
                .to_vec(),
            private_key,
        };
        let token =
            sign_rs256_jwt(&material, &json!({}), &json!({"sub":"42"})).expect("sign token");
        assert_eq!(verify_rs256_jwt(&material, &token).unwrap()["sub"], "42");

        let mut parts = token.split('.').map(str::to_string).collect::<Vec<_>>();
        parts[1].push('A');
        assert!(verify_rs256_jwt(&material, &parts.join(".")).is_err());
    }
}
