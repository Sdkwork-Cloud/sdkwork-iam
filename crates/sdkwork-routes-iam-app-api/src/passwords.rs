use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use password_hash::SaltString;
use rand_core::OsRng;
use serde_json::Value;
use sqlx::{PgPool, Postgres, Row};
use std::sync::{Arc, OnceLock};
use tokio::sync::Semaphore;

use sdkwork_iam_web_adapter::{
    messaging_verification_enabled, verify_and_consume_messaging_challenge,
    MessagingVerificationRequest, MESSAGING_VERIFICATION_SCENE_RESET_PASSWORD,
};

use crate::state::*;
use crate::utils::*;

static PASSWORD_HASH_PERMITS: OnceLock<Arc<Semaphore>> = OnceLock::new();

async fn run_password_cpu_task<T>(task: impl FnOnce() -> T + Send + 'static) -> Option<T>
where
    T: Send + 'static,
{
    let permits = PASSWORD_HASH_PERMITS
        .get_or_init(|| Arc::new(Semaphore::new(32)))
        .clone();
    let permit = permits.acquire_owned().await.ok()?;
    tokio::task::spawn_blocking(move || {
        let _permit = permit;
        task()
    })
    .await
    .ok()
}

// ── Rate limiting ──────────────────────────────────────────────────

// Rate limiting is implemented in `ephemeral.rs` using PostgreSQL-backed artifacts.

const COMMON_PASSWORDS: &[&str] = &[
    "password",
    "password1",
    "password123",
    "87654321",
    "987654321",
    "qwerty123",
    "admin123",
    "letmein1",
    "welcome1",
    "monkey123",
    "abc12345",
    "football1",
    "iloveyou1",
    "trustno1",
    "sunshine1",
    "master123",
    "login123",
    "princess1",
    "qwertyuiop",
    "solo1234",
    "passw0rd",
    "P@ssw0rd",
    "Password1",
    "Admin123",
    "Qwerty123",
];

fn is_common_password(password: &str) -> bool {
    let lower = password.to_ascii_lowercase();
    COMMON_PASSWORDS
        .iter()
        .any(|p| p.eq_ignore_ascii_case(&lower))
}

// ── Password policy ────────────────────────────────────────────────

pub(crate) fn password_is_within_policy(password: &str, config: &LocalIamConfig) -> bool {
    let len = password.chars().count();
    if len < config.password_min_length || len > config.password_max_length {
        return false;
    }
    if crate::is_blank(Some(password)) {
        return false;
    }
    if is_common_password(password) {
        return false;
    }
    if config.password_require_complexity {
        let has_letter = password.chars().any(|c| c.is_alphabetic());
        let has_digit = password.chars().any(|c| c.is_ascii_digit());
        if !has_letter || !has_digit {
            return false;
        }
    }
    true
}

pub(crate) fn password_policy_description(config: &LocalIamConfig) -> String {
    let mut desc = format!(
        "password must be {}-{} characters",
        config.password_min_length, config.password_max_length
    );
    if config.password_require_complexity {
        desc.push_str(" with at least one letter and one digit");
    }
    desc.push_str(" and must not be a commonly used password");
    desc
}

pub(crate) fn is_password_grant(body: &Value) -> bool {
    optional_string(body.get("grantType"))
        .or_else(|| optional_string(body.get("grant_type")))
        .is_some_and(|grant_type| grant_type.eq_ignore_ascii_case("password"))
}

pub(crate) enum PasswordAuthenticationOutcome {
    Authenticated(LocalIamUser),
    AccountLocked,
    InvalidCredentials,
}

fn local_iam_user_from_auth_row(row: &sqlx::postgres::PgRow) -> LocalIamUser {
    LocalIamUser {
        id: row.get(0),
        tenant_id: row.get(1),
        username: row.get(2),
        display_name: row.get(3),
        email: row.get(4),
        phone: row.get(5),
        email_verified: row.get::<i32, _>(6) != 0,
        phone_verified: row.get::<i32, _>(7) != 0,
        last_login_at: row.get(8),
        password_changed_at: row.get(9),
    }
}

pub(crate) async fn finalize_successful_password_login(pg: &PgPool, user: &LocalIamUser) {
    let now = current_timestamp_utc();
    let _ = sqlx::query(
        "UPDATE iam_credential SET failed_attempts = 0, locked_until = NULL, last_used_at = $2, updated_at = $3 \
         WHERE user_id = $1 AND credential_type = 'password'",
    )
    .bind(&user.id)
    .bind(&now)
    .bind(&now)
    .execute(pg)
    .await;
    let _ = sqlx::query("UPDATE iam_user SET last_login_at = $2, updated_at = $3 WHERE id = $1")
        .bind(&user.id)
        .bind(&now)
        .bind(&now)
        .execute(pg)
        .await;
}

async fn record_failed_password_attempt(
    pg: &PgPool,
    user_id: &str,
    tenant_id: &str,
    account_key: &str,
    failed_attempts: i32,
    config: &LocalIamConfig,
) {
    let now = current_timestamp_utc();
    let new_attempts = failed_attempts + 1;
    let lock = if new_attempts >= config.login_max_attempts as i32 {
        Some(now + chrono::Duration::minutes(i64::from(config.login_lockout_minutes)))
    } else {
        None
    };
    let lock_until_text = lock.as_ref().map(chrono::DateTime::to_rfc3339);
    let _ = sqlx::query(
        "UPDATE iam_credential SET failed_attempts = $2, locked_until = $3, updated_at = $4 \
         WHERE user_id = $1 AND credential_type = 'password'",
    )
    .bind(user_id)
    .bind(new_attempts)
    .bind(&lock_until_text)
    .bind(&now)
    .execute(pg)
    .await;
    if lock.is_some() {
        crate::security_events::record_account_locked(pg, tenant_id, user_id, account_key).await;
    }
}

/// Authenticate a user by account (username/email/phone) and password against the database.
pub(crate) async fn authenticate_password(
    pg: &PgPool,
    tenant_id: &str,
    account: &str,
    password: &str,
    config: &LocalIamConfig,
) -> PasswordAuthenticationOutcome {
    let account_key = canonical_identity(account);
    let now = current_timestamp_utc();

    let rows = match sqlx::query(
        "SELECT u.id, u.tenant_id, u.username, u.display_name, u.email, u.phone, \
                u.email_verified, u.phone_verified, u.last_login_at, u.password_changed_at, \
                c.credential_hash, c.failed_attempts, c.locked_until \
         FROM iam_user u \
         JOIN iam_credential c ON c.user_id = u.id AND c.credential_type = 'password' AND c.status = 'active' \
         JOIN iam_tenant_member m ON m.tenant_id = u.tenant_id AND m.user_id = u.id AND m.status = 'active' \
         WHERE u.tenant_id = $1 \
           AND (LOWER(u.username) = $2 OR LOWER(u.email) = $2 OR u.phone = $2) \
           AND u.status = 'active' AND u.is_deleted = 0 \
           AND NULLIF(TRIM(u.tenant_id), '') IS NOT NULL \
         LIMIT $3",
    )
    .bind(tenant_id)
    .bind(&account_key)
    .bind(sdkwork_iam_bootstrap::limits::IAM_PASSWORD_AUTH_USER_ROW_LIMIT + 1)
    .fetch_all(pg)
    .await
    {
        Ok(rows) => rows,
        Err(_) => return PasswordAuthenticationOutcome::InvalidCredentials,
    };

    if rows.is_empty() {
        return PasswordAuthenticationOutcome::InvalidCredentials;
    }

    if rows.len() > sdkwork_iam_bootstrap::limits::IAM_PASSWORD_AUTH_USER_ROW_LIMIT as usize {
        return PasswordAuthenticationOutcome::InvalidCredentials;
    }

    let mut authenticated_users = Vec::new();
    let mut locked_with_valid_password = false;

    for row in &rows {
        let user = local_iam_user_from_auth_row(row);
        let password_hash: String = row.get(10);
        let failed_attempts: i32 = row.get(11);
        let locked_until = parse_optional_timestamp_from_row(row, 12);

        if let Some(lock_time) = locked_until {
            if lock_time > now {
                if verify_password_async(password_hash.clone(), password.to_owned()).await {
                    locked_with_valid_password = true;
                }
                continue;
            }
        }

        if !verify_password_async(password_hash.clone(), password.to_owned()).await {
            record_failed_password_attempt(
                pg,
                &user.id,
                &user.tenant_id,
                &account_key,
                failed_attempts,
                config,
            )
            .await;
            continue;
        }

        authenticated_users.push(user);
    }

    match authenticated_users.len() {
        0 => {
            if locked_with_valid_password {
                PasswordAuthenticationOutcome::AccountLocked
            } else {
                PasswordAuthenticationOutcome::InvalidCredentials
            }
        }
        1 => {
            let user = authenticated_users.remove(0);
            finalize_successful_password_login(pg, &user).await;
            PasswordAuthenticationOutcome::Authenticated(user)
        }
        _ => PasswordAuthenticationOutcome::InvalidCredentials,
    }
}

pub(crate) async fn identity_exists_global(pg: &PgPool, identity: &str) -> Result<bool, String> {
    let identity_key = canonical_identity(identity);
    let row = sqlx::query(
        "SELECT EXISTS(SELECT 1 FROM iam_user WHERE (LOWER(username) = $1 OR LOWER(email) = $1 OR phone = $1) AND status = 'active' AND is_deleted = 0) as exists_flag",
    )
    .bind(&identity_key)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("check identity exists failed: {error}"))?;
    Ok(row.map(|r| r.get::<bool, _>(0)).unwrap_or(false))
}

/// Check whether an identity (username, email, or phone) already exists in the database.
pub(crate) async fn identity_exists(
    pg: &PgPool,
    tenant_id: &str,
    identity: &str,
) -> Result<bool, String> {
    let identity_key = canonical_identity(identity);
    let row = sqlx::query(
        "SELECT EXISTS(SELECT 1 FROM iam_user WHERE tenant_id = $1 AND (LOWER(username) = $2 OR LOWER(email) = $2 OR phone = $2) AND status = 'active' AND is_deleted = 0) as exists_flag",
    )
    .bind(tenant_id)
    .bind(&identity_key)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("check identity exists failed: {error}"))?;
    Ok(row.map(|r| r.get::<bool, _>(0)).unwrap_or(false))
}

pub(crate) async fn password_reused_in_history(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    password: &str,
    history_count: usize,
) -> Result<bool, String> {
    if history_count == 0 {
        return Ok(false);
    }
    let history_rows: Vec<(String,)> = sqlx::query_as(
        "SELECT password_hash FROM iam_password_history \
         WHERE tenant_id = $1 AND user_id = $2 \
         ORDER BY created_at DESC LIMIT $3",
    )
    .bind(tenant_id)
    .bind(user_id)
    .bind(history_count as i64)
    .fetch_all(pg)
    .await
    .map_err(|error| format!("check password history failed: {error}"))?;

    for (old_hash,) in history_rows {
        if verify_password_async(old_hash, password.to_owned()).await {
            return Ok(true);
        }
    }
    Ok(false)
}

pub(crate) async fn record_password_history<'e, E>(
    executor: E,
    tenant_id: &str,
    user_id: &str,
    password_hash: &str,
) -> Result<(), String>
where
    E: sqlx::Executor<'e, Database = Postgres>,
{
    let now = current_timestamp_utc();
    sqlx::query(
        "INSERT INTO iam_password_history (id, tenant_id, user_id, password_hash, created_at) \
         VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(uuid::Uuid::now_v7().to_string())
    .bind(tenant_id)
    .bind(user_id)
    .bind(password_hash)
    .bind(now)
    .execute(executor)
    .await
    .map_err(|error| format!("insert password history failed: {error}"))?;
    Ok(())
}

/// Create a user with password credentials in the database.
/// Returns the created user record, or an error string on failure.
pub(crate) async fn set_user_password(
    pg: &PgPool,
    user: &LocalIamUser,
    password: &str,
    config: &LocalIamConfig,
) -> Result<(), String> {
    let password_hash = hash_password_async(password.to_owned())
        .await
        .ok_or_else(|| "hash password failed".to_string())?;
    let now = current_timestamp_utc();
    let email_verified = user.email_verified as i32;
    let tenant_id = &user.tenant_id;

    if password_reused_in_history(
        pg,
        tenant_id,
        &user.id,
        password,
        config.password_history_count,
    )
    .await?
    {
        return Err("password was used recently - choose a different password".to_owned());
    }
    let mut tx = pg
        .begin()
        .await
        .map_err(|error| format!("begin create password transaction failed: {error}"))?;

    // Insert user — ON CONFLICT DO NOTHING prevents overwriting existing users
    let result = sqlx::query(
        "INSERT INTO iam_user (id, tenant_id, username, display_name, email, phone, \
                email_verified, phone_verified, password_changed_at, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $11) \
         ON CONFLICT (tenant_id, username) DO NOTHING",
    )
    .bind(&user.id).bind(tenant_id).bind(&user.username).bind(&user.display_name)
    .bind(&user.email).bind(&user.phone)
    .bind(email_verified).bind(user.phone_verified as i32)
    .bind(&now).bind(&now).bind(&now)
    .execute(&mut *tx).await
    .map_err(|error| format!("insert user failed: {error}"))?;

    if result.rows_affected() == 0 {
        return Err("account already exists".to_string());
    }

    let credential_id = uuid::Uuid::now_v7().to_string();

    sqlx::query(
        "INSERT INTO iam_credential (id, tenant_id, user_id, credential_type, credential_hash, failed_attempts, status, created_at, updated_at) \
         VALUES ($1, $2, $3, 'password', $4, 0, 'active', $5, $6) \
         ON CONFLICT (tenant_id, user_id, credential_type) DO UPDATE SET \
           credential_hash = EXCLUDED.credential_hash, \
           failed_attempts = 0, locked_until = NULL, \
           status = 'active', updated_at = EXCLUDED.updated_at",
    )
    .bind(&credential_id).bind(tenant_id).bind(&user.id)
    .bind(&password_hash).bind(&now).bind(&now)
    .execute(&mut *tx).await
    .map_err(|error| format!("insert credential failed: {error}"))?;

    record_password_history(&mut *tx, tenant_id, &user.id, &password_hash).await?;
    tx.commit()
        .await
        .map_err(|error| format!("commit create password transaction failed: {error}"))?;

    Ok(())
}

/// Synchronous password hashing for contexts where async is unavailable (e.g., bootstrap).
pub(crate) fn hash_password_sync(password: &str) -> Option<String> {
    hash_password(password)
}

pub(crate) fn hash_password(password: &str) -> Option<String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .ok()
}

async fn hash_password_async(password: String) -> Option<String> {
    run_password_cpu_task(move || hash_password(&password))
        .await
        .flatten()
}

async fn verify_password_async(password_hash: String, password: String) -> bool {
    run_password_cpu_task(move || verify_password(&password_hash, &password))
        .await
        .unwrap_or(false)
}

pub(crate) fn verify_password(password_hash: &str, password: &str) -> bool {
    PasswordHash::new(password_hash)
        .ok()
        .is_some_and(|parsed_hash| {
            Argon2::default()
                .verify_password(password.as_bytes(), &parsed_hash)
                .is_ok()
        })
}

pub(crate) fn resolve_registration_username(body: &Value) -> Option<String> {
    optional_string(body.get("username"))
        .or_else(|| optional_string(body.get("email")))
        .or_else(|| optional_string(body.get("phone")))
        .map(|username| canonical_identity(&username))
}

pub(crate) fn resolve_password_reset_account(body: &Value) -> Option<String> {
    optional_string(body.get("account"))
        .or_else(|| optional_string(body.get("username")))
        .or_else(|| optional_string(body.get("email")))
        .or_else(|| optional_string(body.get("phone")))
        .map(|account| canonical_identity(&account))
}

pub(crate) async fn replace_user_password(
    pg: &PgPool,
    config: &LocalIamConfig,
    user_id: &str,
    password: &str,
) -> Result<(), String> {
    let tenant_id: String = sqlx::query_scalar(
        "SELECT tenant_id FROM iam_user WHERE id = $1 AND status = 'active' AND is_deleted = 0",
    )
    .bind(user_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load user tenant for password reset failed: {error}"))?
    .ok_or_else(|| "user not found for password reset".to_string())?;

    if password_reused_in_history(
        pg,
        &tenant_id,
        user_id,
        password,
        config.password_history_count,
    )
    .await?
    {
        return Err("password was used recently — choose a different password".to_string());
    }
    let password_hash = hash_password_async(password.to_owned())
        .await
        .ok_or_else(|| "hash password failed".to_string())?;
    let now = current_timestamp_utc();
    let mut tx = pg
        .begin()
        .await
        .map_err(|error| format!("begin replace password transaction failed: {error}"))?;
    let credential_result = sqlx::query(
        "UPDATE iam_credential \
         SET credential_hash = $3, failed_attempts = 0, locked_until = NULL, status = 'active', updated_at = $4 \
         WHERE tenant_id = $1 AND user_id = $2 AND credential_type = 'password'",
    )
    .bind(&tenant_id)
    .bind(user_id)
    .bind(&password_hash)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|error| format!("update credential failed: {error}"))?;
    if credential_result.rows_affected() != 1 {
        return Err("active password credential not found".to_owned());
    }
    sqlx::query(
        "UPDATE iam_user SET password_changed_at = $3, updated_at = $4 WHERE tenant_id = $1 AND id = $2",
    )
    .bind(&tenant_id)
    .bind(user_id)
    .bind(&now)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|error| format!("update user password timestamp failed: {error}"))?;
    record_password_history(&mut *tx, &tenant_id, user_id, &password_hash).await?;
    tx.commit()
        .await
        .map_err(|error| format!("commit replace password transaction failed: {error}"))?;
    Ok(())
}

pub(crate) fn read_password(value: Option<&Value>) -> Option<String> {
    value
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

pub(crate) fn password_reset_channel_for_account(
    account: &str,
    user: &LocalIamUser,
) -> (&'static str, String) {
    let normalized = canonical_identity(account);
    if user
        .email
        .as_ref()
        .is_some_and(|email| canonical_identity(email) == normalized)
    {
        return ("email", normalized);
    }
    if user
        .phone
        .as_ref()
        .is_some_and(|phone| canonical_identity(phone) == normalized)
    {
        return ("sms", normalized);
    }
    if normalized.contains('@') {
        ("email", normalized)
    } else {
        ("sms", normalized)
    }
}

pub(crate) async fn validate_password_reset_verification(
    pg: &PgPool,
    config: &LocalIamConfig,
    user: &LocalIamUser,
    account: &str,
    code: &str,
) -> Result<(), String> {
    if fixed_verification_code_allowed(config) {
        if let Some(expected) = &config.dev_fixed_verify_code {
            if code == expected {
                return Ok(());
            }
        }
    }

    if messaging_verification_enabled() {
        let (channel, target) = password_reset_channel_for_account(account, user);
        return verify_and_consume_messaging_challenge(
            pg,
            &MessagingVerificationRequest {
                tenant_id: &user.tenant_id,
                organization_id: "0",
                scene_code: MESSAGING_VERIFICATION_SCENE_RESET_PASSWORD,
                channel,
                target: &target,
                code,
            },
        )
        .await;
    }

    if fixed_verification_code_allowed(config) {
        let reset_key = canonical_identity(&user.username);
        let reset_request =
            crate::ephemeral::get_password_reset_request(pg, &user.tenant_id, &reset_key).await?;
        let Some(reset_request) = reset_request else {
            return Err("verification code is invalid".to_string());
        };
        if reset_request.expire_time < current_millis()
            || reset_request.username != user.username
            || reset_request.code != code
        {
            return Err("verification code is invalid".to_string());
        }
        crate::ephemeral::delete_password_reset_request(pg, &user.tenant_id, &reset_key).await?;
        return Ok(());
    }

    Err("password reset verification is not configured for this environment".to_string())
}
