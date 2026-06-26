use sqlx::{PgPool, Row};

use crate::{
    ephemeral,
    passwords::{password_is_within_policy, replace_user_password, verify_password},
    state::*,
    utils::*,
};

const CONTACT_BIND_TTL_MILLIS: u128 = 600_000;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum ContactBindingKind {
    Email,
    Phone,
}

impl ContactBindingKind {
    fn scene(self) -> &'static str {
        match self {
            Self::Email => "BIND_EMAIL",
            Self::Phone => "BIND_PHONE",
        }
    }

    fn rate_limit_bucket(self, user_id: &str) -> String {
        match self {
            Self::Email => format!("iam:contact_bind:email:{user_id}"),
            Self::Phone => format!("iam:contact_bind:phone:{user_id}"),
        }
    }
}

pub(crate) struct LocalContactBindVerification {
    pub(crate) code: String,
    pub(crate) expire_time: u128,
    pub(crate) target: String,
}

#[allow(dead_code)]
pub(crate) async fn upsert_contact_bind_verification(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    kind: ContactBindingKind,
    target: &str,
    code: &str,
) -> Result<(), String> {
    let verification = LocalContactBindVerification {
        code: code.to_string(),
        expire_time: current_millis() + CONTACT_BIND_TTL_MILLIS,
        target: canonical_identity(target),
    };
    ephemeral::upsert_contact_bind_verification(pg, tenant_id, user_id, kind.scene(), &verification)
        .await
}

pub(crate) async fn bind_contact_for_user(
    pg: &PgPool,
    config: &LocalIamConfig,
    user: &LocalIamUser,
    kind: ContactBindingKind,
    target: &str,
    verification_code: &str,
) -> Result<LocalIamUser, String> {
    let normalized_target = normalize_contact_target(kind, target)?;
    validate_bind_verification_code(
        pg,
        config,
        &user.tenant_id,
        &user.id,
        kind,
        &normalized_target,
        verification_code,
    )
    .await?;

    if contact_identity_taken(
        pg,
        &user.tenant_id,
        kind,
        &normalized_target,
        Some(&user.id),
    )
    .await?
    {
        return Err("contact already bound to another account".to_string());
    }

    let now = current_timestamp_utc();
    let (email, phone, email_verified, phone_verified) = match kind {
        ContactBindingKind::Email => (
            Some(normalized_target.clone()),
            user.phone.clone(),
            1,
            user.phone_verified as i32,
        ),
        ContactBindingKind::Phone => (
            user.email.clone(),
            Some(normalized_target.clone()),
            user.email_verified as i32,
            1,
        ),
    };

    sqlx::query(
        "UPDATE iam_user \
         SET email = $3, phone = $4, email_verified = $5, phone_verified = $6, updated_at = $7 \
         WHERE tenant_id = $1 AND id = $2 AND status = 'active' AND is_deleted = 0",
    )
    .bind(&user.tenant_id)
    .bind(&user.id)
    .bind(&email)
    .bind(&phone)
    .bind(email_verified)
    .bind(phone_verified)
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("update contact binding failed: {error}"))?;

    ephemeral::delete_contact_bind_verification(pg, &user.tenant_id, &user.id, kind.scene())
        .await?;

    load_user_by_id(pg, &user.tenant_id, &user.id)
        .await?
        .ok_or_else(|| "user not found after contact binding".to_string())
}

pub(crate) async fn unbind_contact_for_user(
    pg: &PgPool,
    user: &LocalIamUser,
    kind: ContactBindingKind,
    password: &str,
) -> Result<LocalIamUser, String> {
    if !verify_current_user_password(pg, user, password).await? {
        return Err("current password is invalid".to_string());
    }

    ensure_contact_can_be_removed(pg, user, kind).await?;

    let now = current_timestamp_utc();
    match kind {
        ContactBindingKind::Email => {
            sqlx::query(
                "UPDATE iam_user SET email = NULL, email_verified = 0, updated_at = $3 \
                 WHERE tenant_id = $1 AND id = $2 AND status = 'active' AND is_deleted = 0",
            )
            .bind(&user.tenant_id)
            .bind(&user.id)
            .bind(&now)
            .execute(pg)
            .await
            .map_err(|error| format!("unbind email failed: {error}"))?;
        }
        ContactBindingKind::Phone => {
            sqlx::query(
                "UPDATE iam_user SET phone = NULL, phone_verified = 0, updated_at = $3 \
                 WHERE tenant_id = $1 AND id = $2 AND status = 'active' AND is_deleted = 0",
            )
            .bind(&user.tenant_id)
            .bind(&user.id)
            .bind(&now)
            .execute(pg)
            .await
            .map_err(|error| format!("unbind phone failed: {error}"))?;
        }
    }

    load_user_by_id(pg, &user.tenant_id, &user.id)
        .await?
        .ok_or_else(|| "user not found after contact unbind".to_string())
}

pub(crate) async fn update_current_user_profile(
    pg: &PgPool,
    user: &LocalIamUser,
    display_name: Option<String>,
) -> Result<LocalIamUser, String> {
    let Some(display_name) = display_name.filter(|value| !crate::is_blank(Some(value))) else {
        return Ok(user.clone());
    };

    let now = current_timestamp_utc();
    sqlx::query(
        "UPDATE iam_user SET display_name = $3, updated_at = $4 \
         WHERE tenant_id = $1 AND id = $2 AND status = 'active' AND is_deleted = 0",
    )
    .bind(&user.tenant_id)
    .bind(&user.id)
    .bind(display_name.trim())
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("update current user profile failed: {error}"))?;

    load_user_by_id(pg, &user.tenant_id, &user.id)
        .await?
        .ok_or_else(|| "user not found after profile update".to_string())
}

pub(crate) async fn change_current_user_password(
    pg: &PgPool,
    config: &LocalIamConfig,
    user: &LocalIamUser,
    current_password: &str,
    new_password: &str,
) -> Result<(), String> {
    if !verify_current_user_password(pg, user, current_password).await? {
        return Err("current password is invalid".to_string());
    }
    if !password_is_within_policy(new_password, config) {
        return Err("new password does not meet policy requirements".to_string());
    }
    if current_password == new_password {
        return Err("new password must differ from current password".to_string());
    }

    replace_user_password(pg, config, &user.id, new_password).await
}

async fn validate_bind_verification_code(
    pg: &PgPool,
    config: &LocalIamConfig,
    tenant_id: &str,
    user_id: &str,
    kind: ContactBindingKind,
    target: &str,
    verification_code: &str,
) -> Result<(), String> {
    if fixed_verification_code_allowed(config) {
        if let Some(expected) = &config.dev_fixed_verify_code {
            if verification_code == expected {
                return Ok(());
            }
        }
    }

    if let Some(stored) =
        ephemeral::get_contact_bind_verification(pg, tenant_id, user_id, kind.scene()).await?
    {
        if stored.expire_time >= current_millis()
            && canonical_identity(&stored.target) == canonical_identity(target)
            && stored.code == verification_code
        {
            return Ok(());
        }
    }

    if fixed_verification_code_allowed(config) {
        return Err("verification code is invalid".to_string());
    }

    Err("contact verification is not configured for this environment".to_string())
}

async fn contact_identity_taken(
    pg: &PgPool,
    tenant_id: &str,
    kind: ContactBindingKind,
    target: &str,
    exclude_user_id: Option<&str>,
) -> Result<bool, String> {
    let normalized = canonical_identity(target);
    let row = sqlx::query(
        "SELECT EXISTS( \
            SELECT 1 FROM iam_user \
            WHERE tenant_id = $1 \
              AND status = 'active' \
              AND is_deleted = 0 \
              AND ($2::text IS NULL OR id <> $2) \
              AND ( \
                ($3 = 'email' AND LOWER(email) = $4) \
                OR ($3 = 'phone' AND phone = $4) \
              ) \
         ) AS exists_flag",
    )
    .bind(tenant_id)
    .bind(exclude_user_id)
    .bind(match kind {
        ContactBindingKind::Email => "email",
        ContactBindingKind::Phone => "phone",
    })
    .bind(&normalized)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("check contact identity failed: {error}"))?;
    Ok(row.map(|value| value.get::<bool, _>(0)).unwrap_or(false))
}

async fn ensure_contact_can_be_removed(
    pg: &PgPool,
    user: &LocalIamUser,
    kind: ContactBindingKind,
) -> Result<(), String> {
    let has_password = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM iam_credential \
         WHERE tenant_id = $1 AND user_id = $2 AND credential_type = 'password' AND status = 'active'",
    )
    .bind(&user.tenant_id)
    .bind(&user.id)
    .fetch_one(pg)
    .await
    .map_err(|error| format!("check password credential failed: {error}"))?
        > 0;

    let remaining_email = kind != ContactBindingKind::Email && user.email.is_some();
    let remaining_phone = kind != ContactBindingKind::Phone && user.phone.is_some();

    if !has_password && !remaining_email && !remaining_phone {
        return Err(
            "cannot remove the last login contact without a password credential".to_string(),
        );
    }

    Ok(())
}

async fn verify_current_user_password(
    pg: &PgPool,
    user: &LocalIamUser,
    password: &str,
) -> Result<bool, String> {
    let row = sqlx::query(
        "SELECT credential_hash FROM iam_credential \
         WHERE tenant_id = $1 AND user_id = $2 AND credential_type = 'password' AND status = 'active' \
         LIMIT 1",
    )
    .bind(&user.tenant_id)
    .bind(&user.id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load password credential failed: {error}"))?;

    let Some(row) = row else {
        return Ok(false);
    };

    Ok(verify_password(&row.get::<String, _>(0), password))
}

pub(crate) async fn load_user_by_id(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
) -> Result<Option<LocalIamUser>, String> {
    let row = sqlx::query(
        "SELECT id, tenant_id, username, display_name, email, phone, email_verified, phone_verified, \
                last_login_at, password_changed_at \
         FROM iam_user \
         WHERE tenant_id = $1 AND id = $2 AND status = 'active' AND is_deleted = 0 \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(user_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load user by id failed: {error}"))?;

    Ok(row.map(|row| LocalIamUser {
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
    }))
}

fn normalize_contact_target(kind: ContactBindingKind, target: &str) -> Result<String, String> {
    let normalized = canonical_identity(target);
    if normalized.is_empty() {
        return Err("contact target is required".to_string());
    }

    match kind {
        ContactBindingKind::Email if normalized.contains('@') => Ok(normalized),
        ContactBindingKind::Email => Err("email address is invalid".to_string()),
        ContactBindingKind::Phone if normalized.chars().count() >= 6 => Ok(normalized),
        ContactBindingKind::Phone => Err("phone number is invalid".to_string()),
    }
}

#[allow(dead_code)]
pub(crate) fn contact_binding_kind_from_scene(scene: &str) -> Option<ContactBindingKind> {
    match scene {
        "BIND_EMAIL" | "bind_email" => Some(ContactBindingKind::Email),
        "BIND_PHONE" | "bind_phone" => Some(ContactBindingKind::Phone),
        _ => None,
    }
}

pub(crate) fn contact_rate_limit_bucket(kind: ContactBindingKind, user_id: &str) -> String {
    kind.rate_limit_bucket(user_id)
}

#[allow(dead_code)]
pub(crate) async fn contact_target_available(
    pg: &PgPool,
    tenant_id: &str,
    kind: ContactBindingKind,
    target: &str,
    exclude_user_id: Option<&str>,
) -> Result<bool, String> {
    let normalized = normalize_contact_target(kind, target)?;
    Ok(!contact_identity_taken(pg, tenant_id, kind, &normalized, exclude_user_id).await?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_email_binding_targets() {
        assert_eq!(
            normalize_contact_target(ContactBindingKind::Email, " Alice@Example.com ").unwrap(),
            "alice@example.com"
        );
    }

    #[test]
    fn rejects_invalid_phone_binding_targets() {
        assert!(normalize_contact_target(ContactBindingKind::Phone, "123").is_err());
    }
}
