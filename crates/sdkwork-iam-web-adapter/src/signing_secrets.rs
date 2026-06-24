use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use sha2::{Digest, Sha256};
use std::sync::OnceLock;

const ENCRYPTED_PREFIX: &str = "enc:v1:";

static SIGNING_MASTER_SECRET: OnceLock<String> = OnceLock::new();

/// Primes the process-wide signing master secret cache from the current environment.
///
/// Router and web-adapter session resolution share this cache so encrypted tenant signing
/// keys remain readable across crate boundaries in the same process.
pub fn prime_signing_master_secret() {
    let _ = signing_master_secret();
}

pub fn encode_signing_secret_ref(plaintext: &[u8]) -> Result<String, String> {
    let key = derive_master_key_from_secret(&signing_master_secret()?)?;
    let cipher = Aes256Gcm::new(&key);
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, plaintext)
        .map_err(|error| format!("encrypt signing secret failed: {error}"))?;
    let mut payload = nonce.to_vec();
    payload.extend(ciphertext);
    Ok(format!(
        "{ENCRYPTED_PREFIX}{}",
        URL_SAFE_NO_PAD.encode(payload)
    ))
}

pub fn decode_signing_secret_ref(secret_ref: &str) -> Result<Vec<u8>, String> {
    if let Some(encoded) = secret_ref.strip_prefix(ENCRYPTED_PREFIX) {
        let payload = URL_SAFE_NO_PAD
            .decode(encoded)
            .map_err(|error| format!("decode encrypted signing secret failed: {error}"))?;
        if payload.len() <= 12 {
            return Err("encrypted signing secret payload is too short".to_string());
        }
        let (nonce_bytes, ciphertext) = payload.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        let mut last_error = "decrypt signing secret failed".to_string();
        for secret in candidate_signing_master_secrets()? {
            let key = derive_master_key_from_secret(&secret)?;
            let cipher = Aes256Gcm::new(&key);
            match cipher.decrypt(nonce, ciphertext) {
                Ok(plaintext) => return Ok(plaintext),
                Err(error) => last_error = format!("decrypt signing secret failed: {error}"),
            }
        }
        return Err(last_error);
    }

    URL_SAFE_NO_PAD
        .decode(secret_ref)
        .map_err(|error| format!("decode legacy signing secret failed: {error}"))
}

fn derive_master_key_from_secret(secret: &str) -> Result<Key<Aes256Gcm>, String> {
    let digest = Sha256::digest(secret.as_bytes());
    Ok(*Key::<Aes256Gcm>::from_slice(&digest))
}

fn signing_master_secret() -> Result<String, String> {
    if let Some(secret) = SIGNING_MASTER_SECRET.get() {
        return Ok(secret.clone());
    }
    let secret = resolve_signing_master_secret_from_env()?;
    let _ = SIGNING_MASTER_SECRET.set(secret.clone());
    Ok(secret)
}

fn resolve_signing_master_secret_from_env() -> Result<String, String> {
    first_env_value(&[
        "SDKWORK_IAM_TENANT_SIGNING_MASTER_SECRET",
        "SDKWORK_CLAW_APP_SESSION_SECRET",
    ])
    .ok_or_else(|| {
        "tenant signing master secret is required (SDKWORK_IAM_TENANT_SIGNING_MASTER_SECRET or SDKWORK_CLAW_APP_SESSION_SECRET)"
            .to_string()
    })
}

fn candidate_signing_master_secrets() -> Result<Vec<String>, String> {
    let mut secrets = Vec::new();
    if let Ok(primary) = signing_master_secret() {
        if !secrets.iter().any(|existing| existing == &primary) {
            secrets.push(primary);
        }
    }
    for name in [
        "SDKWORK_IAM_TENANT_SIGNING_MASTER_SECRET",
        "SDKWORK_CLAW_APP_SESSION_SECRET",
    ] {
        if let Some(value) = std::env::var(name)
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
        {
            if !secrets.iter().any(|existing| existing == &value) {
                secrets.push(value);
            }
        }
    }
    if secrets.is_empty() {
        return Err(
            "tenant signing master secret is required (SDKWORK_IAM_TENANT_SIGNING_MASTER_SECRET or SDKWORK_CLAW_APP_SESSION_SECRET)"
                .to_string(),
        );
    }
    Ok(secrets)
}

fn first_env_value(names: &[&str]) -> Option<String> {
    names.iter().find_map(|name| {
        std::env::var(name)
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn signing_secret_roundtrip_uses_encrypted_prefix() {
        // SAFETY: single-threaded unit test.
        unsafe {
            std::env::set_var(
                "SDKWORK_IAM_TENANT_SIGNING_MASTER_SECRET",
                "unit-test-signing-master-secret",
            );
        }
        let _ = SIGNING_MASTER_SECRET.set("unit-test-signing-master-secret".to_string());
        let plaintext = b"tenant-signing-secret-material";
        let secret_ref = encode_signing_secret_ref(plaintext).expect("encode signing secret");
        assert!(secret_ref.starts_with(ENCRYPTED_PREFIX));
        let decoded = decode_signing_secret_ref(&secret_ref).expect("decode signing secret");
        assert_eq!(decoded, plaintext);
    }

    #[test]
    fn legacy_plain_signing_secret_ref_remains_readable() {
        // SAFETY: single-threaded unit test.
        unsafe {
            std::env::set_var(
                "SDKWORK_IAM_TENANT_SIGNING_MASTER_SECRET",
                "unit-test-signing-master-secret",
            );
        }
        let _ = SIGNING_MASTER_SECRET.set("unit-test-signing-master-secret".to_string());
        let plaintext = b"legacy-plain-signing-secret";
        let secret_ref = URL_SAFE_NO_PAD.encode(plaintext);
        let decoded = decode_signing_secret_ref(&secret_ref).expect("decode legacy secret");
        assert_eq!(decoded, plaintext);
    }
}
