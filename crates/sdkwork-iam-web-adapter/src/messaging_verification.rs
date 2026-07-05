//! Server-side verification against `messaging_verification_challenge` rows.
//!
//! Verification-code delivery is owned by `sdkwork-messaging`; IAM consumes the
//! authoritative challenge store when co-deployed against a shared database.

use chrono::Utc;
use sdkwork_utils_rust::{secure_compare, sha256_hash};
use sqlx::{PgPool, Row};

pub const MESSAGING_VERIFICATION_SCENE_RESET_PASSWORD: &str = "RESET_PASSWORD";
pub const MESSAGING_VERIFICATION_SCENE_BIND_EMAIL: &str = "BIND_EMAIL";
pub const MESSAGING_VERIFICATION_SCENE_BIND_PHONE: &str = "BIND_PHONE";

pub fn messaging_verification_enabled() -> bool {
    read_env_flag(&[
        "SDKWORK_IAM_MESSAGING_VERIFICATION_ENABLED",
        "SDKWORK_IAM_MESSAGING_VERIFICATION",
    ])
}

pub fn messaging_verification_target_hash(target: &str, channel: &str) -> String {
    let normalized = if channel == "email" {
        target.trim().to_ascii_lowercase()
    } else {
        target.trim().to_owned()
    };
    sha256_hash(normalized.as_bytes())
}

pub fn messaging_verification_code_hash(code: &str) -> String {
    sha256_hash(code.trim().as_bytes())
}

pub struct MessagingVerificationRequest<'a> {
    pub tenant_id: &'a str,
    pub organization_id: &'a str,
    pub scene_code: &'a str,
    pub channel: &'a str,
    pub target: &'a str,
    pub code: &'a str,
}

pub async fn messaging_verification_table_available(pg: &PgPool) -> bool {
    sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS ( \
            SELECT 1 FROM information_schema.tables \
            WHERE table_schema = 'public' AND table_name = 'messaging_verification_challenge' \
         )",
    )
    .fetch_one(pg)
    .await
    .unwrap_or(false)
}

pub async fn verify_and_consume_messaging_challenge(
    pg: &PgPool,
    request: &MessagingVerificationRequest<'_>,
) -> Result<(), String> {
    if !messaging_verification_table_available(pg).await {
        return Err("messaging verification store is not available".to_string());
    }

    let tenant_id = parse_scope_id(request.tenant_id, "tenant_id")?;
    let organization_id = parse_scope_id(request.organization_id, "organization_id")?;
    let target_hash = messaging_verification_target_hash(request.target, request.channel);
    let code_hash = messaging_verification_code_hash(request.code);
    let now = Utc::now();

    let mut tx = pg
        .begin()
        .await
        .map_err(|error| format!("begin messaging verification transaction failed: {error}"))?;

    let row = sqlx::query(
        "SELECT id, code_hash, attempt_count \
         FROM messaging_verification_challenge \
         WHERE tenant_id = $1 AND organization_id = $2 AND scene_code = $3 \
           AND channel = $4 AND target_hash = $5 AND status = 'pending' \
           AND expires_at > $6 \
         ORDER BY created_at DESC \
         FOR UPDATE \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(organization_id)
    .bind(request.scene_code)
    .bind(request.channel)
    .bind(&target_hash)
    .bind(now)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|error| format!("load messaging verification challenge failed: {error}"))?;

    let Some(row) = row else {
        tx.rollback()
            .await
            .map_err(|error| format!("rollback missing messaging challenge failed: {error}"))?;
        return Err("verification code is invalid or expired".to_string());
    };

    let challenge_id: i64 = row.get(0);
    let stored_code_hash: String = row.get(1);
    let attempt_count: i32 = row.get(2);
    let timestamp = now.to_rfc3339();

    if !secure_compare(&stored_code_hash, &code_hash) {
        let next_attempt_count = attempt_count.saturating_add(1);
        let status = if next_attempt_count >= 5 {
            "locked"
        } else {
            "pending"
        };
        sqlx::query(
            "UPDATE messaging_verification_challenge \
             SET attempt_count = $2, status = $3, locked_at = CASE WHEN $3 = 'locked' THEN $4::timestamptz ELSE locked_at END, updated_at = $4::timestamptz \
             WHERE id = $1",
        )
        .bind(challenge_id)
        .bind(next_attempt_count)
        .bind(status)
        .bind(&timestamp)
        .execute(&mut *tx)
        .await
        .map_err(|error| format!("record messaging verification failure failed: {error}"))?;
        tx.commit()
            .await
            .map_err(|error| format!("commit messaging verification failure failed: {error}"))?;
        return Err("verification code is invalid".to_string());
    }

    sqlx::query(
        "UPDATE messaging_verification_challenge \
         SET status = 'verified', verified_at = $2::timestamptz, updated_at = $2::timestamptz \
         WHERE id = $1",
    )
    .bind(challenge_id)
    .bind(&timestamp)
    .execute(&mut *tx)
    .await
    .map_err(|error| format!("mark messaging verification challenge verified failed: {error}"))?;

    tx.commit()
        .await
        .map_err(|error| format!("commit messaging verification success failed: {error}"))?;

    Ok(())
}

fn parse_scope_id(value: &str, field: &str) -> Result<i64, String> {
    value
        .trim()
        .parse::<i64>()
        .map_err(|_| format!("{field} must be a numeric scope id"))
}

fn read_env_flag(keys: &[&str]) -> bool {
    for key in keys {
        if let Ok(value) = std::env::var(key) {
            let normalized = value.trim().to_ascii_lowercase();
            if matches!(normalized.as_str(), "1" | "true" | "yes" | "on") {
                return true;
            }
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn target_hash_normalizes_email_case() {
        let lower = messaging_verification_target_hash("User@Example.com", "email");
        let upper = messaging_verification_target_hash("user@example.com", "email");
        assert_eq!(lower, upper);
    }

    #[test]
    fn code_hash_trims_whitespace() {
        let trimmed = messaging_verification_code_hash("123456");
        let padded = messaging_verification_code_hash(" 123456 ");
        assert_eq!(trimmed, padded);
    }
}
