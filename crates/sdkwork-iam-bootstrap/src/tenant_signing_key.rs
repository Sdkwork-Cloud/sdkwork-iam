use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use rand_core::{OsRng, RngCore};
use sha2::{Digest, Sha256};
use sqlx::{PgPool, Row, SqlitePool};

const LEGACY_ENCRYPTED_PREFIX: &str = "enc:v1:";
const PRIMARY_SIGNING_KID_SUFFIX: &str = "local-hs256:primary";

/// Historical deployment KEKs used only to read legacy `enc:v1:` rows during migration.
const LEGACY_ENCRYPTED_SIGNING_MASTER_SECRETS: &[&str] = &[
    "sdkwork-workspace-dev-tenant-signing-master-secret-v1",
    "sdkwork-im-dev-tenant-signing-master-secret-v1",
    "integration-test-signing-master-secret",
    "sdkwork-knowledgebase-dev-signing-secret",
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TenantSigningKeyMaterial {
    pub tenant_id: String,
    pub kid: String,
    pub secret: Vec<u8>,
}

pub fn tenant_primary_signing_kid(tenant_id: &str) -> String {
    format!("{tenant_id}:{PRIMARY_SIGNING_KID_SUFFIX}")
}

pub fn encode_signing_secret_ref(plaintext: &[u8]) -> String {
    URL_SAFE_NO_PAD.encode(plaintext)
}

pub fn decode_signing_secret_ref(secret_ref: &str) -> Result<Vec<u8>, String> {
    if let Some(encoded) = secret_ref.strip_prefix(LEGACY_ENCRYPTED_PREFIX) {
        return decode_legacy_encrypted_signing_secret_ref(encoded);
    }

    URL_SAFE_NO_PAD
        .decode(secret_ref)
        .map_err(|error| format!("decode tenant signing secret failed: {error}"))
}

pub async fn ensure_postgres_tenant_signing_key(
    pool: &PgPool,
    tenant_id: &str,
) -> Result<(), sqlx::Error> {
    if tenant_id.trim().is_empty() {
        return Ok(());
    }

    let kid = tenant_primary_signing_kid(tenant_id);
    let mut secret = vec![0u8; 64];
    OsRng.fill_bytes(&mut secret);
    let secret_ref = encode_signing_secret_ref(&secret);
    let secret_hash = hash_signing_secret_ref(&secret_ref);

    sqlx::query(
        "INSERT INTO iam_tenant_signing_key \
         (id, tenant_id, kid, alg, secret_ref, secret_hash, status, active_from, created_at, updated_at) \
         VALUES ($1, $2, $3, 'HS256', $4, $5, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) \
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

pub async fn ensure_sqlite_tenant_signing_key(
    pool: &SqlitePool,
    tenant_id: &str,
) -> Result<(), sqlx::Error> {
    if tenant_id.trim().is_empty() {
        return Ok(());
    }

    let now = chrono::Utc::now().to_rfc3339();
    let kid = tenant_primary_signing_kid(tenant_id);
    let mut secret = vec![0u8; 64];
    OsRng.fill_bytes(&mut secret);
    let secret_ref = encode_signing_secret_ref(&secret);
    let secret_hash = hash_signing_secret_ref(&secret_ref);

    sqlx::query(
        "INSERT INTO iam_tenant_signing_key \
         (id, tenant_id, kid, alg, secret_ref, secret_hash, status, active_from, created_at, updated_at) \
         VALUES (?1, ?2, ?3, 'HS256', ?4, ?5, 'active', ?6, ?6, ?6) \
         ON CONFLICT (tenant_id, kid) DO NOTHING",
    )
    .bind(uuid::Uuid::now_v7().to_string())
    .bind(tenant_id)
    .bind(&kid)
    .bind(&secret_ref)
    .bind(&secret_hash)
    .bind(&now)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn load_sqlite_active_tenant_signing_key(
    pool: &SqlitePool,
    tenant_id: &str,
) -> Result<Option<TenantSigningKeyMaterial>, sqlx::Error> {
    if tenant_id.trim().is_empty() {
        return Ok(None);
    }

    let primary_kid = tenant_primary_signing_kid(tenant_id);
    let row = sqlx::query(
        "SELECT tenant_id, kid, secret_ref FROM iam_tenant_signing_key \
         WHERE tenant_id = ?1 AND status = 'active' \
         ORDER BY CASE WHEN kid = ?2 THEN 0 ELSE 1 END, active_from DESC \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(&primary_kid)
    .fetch_optional(pool)
    .await?;

    let Some(row) = row else {
        return Ok(None);
    };

    let tenant_id: String = row.get(0);
    let kid: String = row.get(1);
    let secret_ref: String = row.get(2);
    let secret =
        decode_signing_secret_ref(&secret_ref).map_err(|error| sqlx::Error::Protocol(error))?;
    Ok(Some(TenantSigningKeyMaterial {
        tenant_id,
        kid,
        secret,
    }))
}

pub async fn load_postgres_active_tenant_signing_key(
    pool: &PgPool,
    tenant_id: &str,
) -> Result<Option<TenantSigningKeyMaterial>, sqlx::Error> {
    if tenant_id.trim().is_empty() {
        return Ok(None);
    }

    let primary_kid = tenant_primary_signing_kid(tenant_id);
    let row = sqlx::query(
        "SELECT tenant_id, kid, secret_ref FROM iam_tenant_signing_key \
         WHERE tenant_id = $1 AND status = 'active' \
         ORDER BY CASE WHEN kid = $2 THEN 0 ELSE 1 END, active_from DESC \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(&primary_kid)
    .fetch_optional(pool)
    .await?;

    let Some(row) = row else {
        return Ok(None);
    };

    let tenant_id: String = row.get(0);
    let kid: String = row.get(1);
    let secret_ref: String = row.get(2);
    let secret =
        decode_signing_secret_ref(&secret_ref).map_err(|error| sqlx::Error::Protocol(error))?;
    Ok(Some(TenantSigningKeyMaterial {
        tenant_id,
        kid,
        secret,
    }))
}

pub async fn resolve_sqlite_tenant_signing_key_by_kid(
    pool: &SqlitePool,
    kid: &str,
) -> Result<Option<TenantSigningKeyMaterial>, sqlx::Error> {
    let now = chrono::Utc::now().to_rfc3339();
    let tenant_hint = kid.split(':').next().filter(|value| !value.is_empty());
    let row = sqlx::query(
        "SELECT tenant_id, kid, secret_ref FROM iam_tenant_signing_key \
         WHERE kid = ?1 AND status IN ('active', 'rotating') \
           AND (active_until IS NULL OR active_until > ?2) \
         ORDER BY active_from DESC \
         LIMIT 1",
    )
    .bind(kid)
    .bind(&now)
    .fetch_optional(pool)
    .await?;

    let Some(row) = row else {
        return Ok(None);
    };

    let tenant_id: String = row.get(0);
    if tenant_hint.is_some_and(|hint| hint != tenant_id) {
        return Ok(None);
    }

    let kid: String = row.get(1);
    let secret_ref: String = row.get(2);
    let secret =
        decode_signing_secret_ref(&secret_ref).map_err(|error| sqlx::Error::Protocol(error))?;
    Ok(Some(TenantSigningKeyMaterial {
        tenant_id,
        kid,
        secret,
    }))
}

pub async fn resolve_postgres_tenant_signing_key_by_kid(
    pool: &PgPool,
    kid: &str,
) -> Result<Option<TenantSigningKeyMaterial>, sqlx::Error> {
    let now = chrono::Utc::now();
    let tenant_hint = kid.split(':').next().filter(|value| !value.is_empty());
    let row = sqlx::query(
        "SELECT tenant_id, kid, secret_ref FROM iam_tenant_signing_key \
         WHERE kid = $1 AND status IN ('active', 'rotating') \
           AND (active_until IS NULL OR active_until::timestamptz > $2::timestamptz) \
         ORDER BY active_from DESC \
         LIMIT 1",
    )
    .bind(kid)
    .bind(now)
    .fetch_optional(pool)
    .await?;

    let Some(row) = row else {
        return Ok(None);
    };

    let tenant_id: String = row.get(0);
    if tenant_hint.is_some_and(|hint| hint != tenant_id) {
        return Ok(None);
    }

    let kid: String = row.get(1);
    let secret_ref: String = row.get(2);
    let secret =
        decode_signing_secret_ref(&secret_ref).map_err(|error| sqlx::Error::Protocol(error))?;
    Ok(Some(TenantSigningKeyMaterial {
        tenant_id,
        kid,
        secret,
    }))
}

fn hash_signing_secret_ref(secret_ref: &str) -> String {
    let digest = Sha256::digest(secret_ref.as_bytes());
    format!("{:x}", digest)
}

fn decode_legacy_encrypted_signing_secret_ref(encoded: &str) -> Result<Vec<u8>, String> {
    let payload = URL_SAFE_NO_PAD
        .decode(encoded)
        .map_err(|error| format!("decode legacy encrypted signing secret failed: {error}"))?;
    if payload.len() <= 12 {
        return Err("legacy encrypted signing secret payload is too short".to_string());
    }
    let (nonce_bytes, ciphertext) = payload.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    let mut last_error = "decrypt legacy signing secret failed".to_string();
    for secret in LEGACY_ENCRYPTED_SIGNING_MASTER_SECRETS {
        let key = derive_master_key_from_secret(secret)?;
        let cipher = Aes256Gcm::new(&key);
        match cipher.decrypt(nonce, ciphertext) {
            Ok(plaintext) => return Ok(plaintext),
            Err(error) => last_error = format!("decrypt legacy signing secret failed: {error}"),
        }
    }
    Err(last_error)
}

fn derive_master_key_from_secret(secret: &str) -> Result<Key<Aes256Gcm>, String> {
    let digest = Sha256::digest(secret.as_bytes());
    Ok(*Key::<Aes256Gcm>::from_slice(&digest))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tenant_primary_signing_kid_is_stable_per_tenant() {
        assert_eq!(
            tenant_primary_signing_kid("100001"),
            "100001:local-hs256:primary"
        );
    }

    #[test]
    fn database_native_signing_secret_roundtrip() {
        let plaintext = b"tenant-signing-secret-material";
        let secret_ref = encode_signing_secret_ref(plaintext);
        assert!(!secret_ref.starts_with(LEGACY_ENCRYPTED_PREFIX));
        let decoded = decode_signing_secret_ref(&secret_ref).expect("decode signing secret");
        assert_eq!(decoded, plaintext);
    }

    #[test]
    fn legacy_encrypted_signing_secret_remains_readable() {
        use aes_gcm::aead::{AeadCore, OsRng as AesOsRng};
        let plaintext = b"legacy-encrypted-signing-secret";
        let legacy_master = "integration-test-signing-master-secret";
        let key = derive_master_key_from_secret(legacy_master).expect("derive key");
        let cipher = Aes256Gcm::new(&key);
        let nonce = Aes256Gcm::generate_nonce(&mut AesOsRng);
        let ciphertext = cipher
            .encrypt(&nonce, plaintext.as_ref())
            .expect("encrypt legacy secret");
        let mut payload = nonce.to_vec();
        payload.extend(ciphertext);
        let secret_ref = format!(
            "{LEGACY_ENCRYPTED_PREFIX}{}",
            URL_SAFE_NO_PAD.encode(payload)
        );
        let decoded = decode_signing_secret_ref(&secret_ref).expect("decode legacy secret");
        assert_eq!(decoded, plaintext);
    }
}
