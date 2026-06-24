use std::{collections::BTreeMap, time::Duration};

use crate::{
    create_user_center_auth_profile,
    create_user_center_handshake_signing_message as create_sdkwork_user_center_handshake_signing_message,
    create_user_center_storage_plan, UserCenterProviderConfig,
};
pub use crate::{
    USER_CENTER_ACCESS_TOKEN_HEADER_NAME, USER_CENTER_APP_ID_HEADER_NAME,
    USER_CENTER_AUTHORIZATION_HEADER_NAME, USER_CENTER_AUTHORIZATION_SCHEME,
    USER_CENTER_HANDSHAKE_MODE_HEADER_NAME, USER_CENTER_PROVIDER_KEY_HEADER_NAME,
    USER_CENTER_REFRESH_TOKEN_HEADER_NAME, USER_CENTER_SECRET_ID_HEADER_NAME,
    USER_CENTER_SESSION_HEADER_NAME, USER_CENTER_SIGNATURE_HEADER_NAME,
    USER_CENTER_SIGNED_AT_HEADER_NAME, USER_CENTER_STANDARD_HANDSHAKE_MODE,
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use time::{format_description::well_known::Rfc3339, OffsetDateTime};

#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct ExternalAppApiHandshakeConfig {
    pub(crate) app_id: String,
    pub(crate) secret_id: String,
    pub(crate) shared_secret: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct ExternalAppApiConfig {
    pub(crate) app_id: String,
    pub(crate) base_url: String,
    pub(crate) handshake: Option<ExternalAppApiHandshakeConfig>,
    pub(crate) timeout: Duration,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct PersistedUpstreamSessionState {
    pub(crate) access_token: Option<String>,
    pub(crate) auth_token: Option<String>,
    pub(crate) payload_json: Option<String>,
    pub(crate) refresh_token: Option<String>,
    pub(crate) token_type: Option<String>,
    pub(crate) user_id: Option<String>,
}

pub(crate) struct ExternalAppApiRequestContext<'a> {
    pub(crate) method: &'a str,
    pub(crate) path: &'a str,
    pub(crate) provider_key: &'a str,
    pub(crate) session_id: Option<&'a str>,
    pub(crate) signed_at: Option<&'a str>,
    pub(crate) upstream_state: Option<&'a PersistedUpstreamSessionState>,
}

pub(crate) struct ExternalAppApiHandshakeSigningInput<'a> {
    pub(crate) app_id: &'a str,
    pub(crate) method: &'a str,
    pub(crate) path: &'a str,
    pub(crate) provider_key: &'a str,
    pub(crate) signed_at: &'a str,
}

fn normalize_optional_text(value: Option<&str>) -> Option<String> {
    value
        .map(|entry| entry.trim().to_owned())
        .filter(|entry| !entry.is_empty())
}

fn require_non_empty_text(value: &str, field_name: &str) -> Result<String, String> {
    let normalized = value.trim();
    if normalized.is_empty() {
        return Err(format!("The {field_name} must be a non-empty string."));
    }
    Ok(normalized.to_owned())
}

fn normalize_external_app_api_path(path: &str) -> Result<String, String> {
    let normalized = require_non_empty_text(path, "upstream path")?;
    let prefixed = if normalized.starts_with('/') {
        normalized
    } else {
        format!("/{normalized}")
    };

    if prefixed == "/" {
        return Ok(prefixed);
    }

    Ok(prefixed.trim_end_matches('/').to_owned())
}

fn should_attach_refresh_token_to_upstream_request(path: &str) -> Result<bool, String> {
    let normalized_path = normalize_external_app_api_path(path)?;
    Ok(matches!(
        normalized_path.as_str(),
        "/auth/refresh" | "/auth/logout"
    ))
}

fn resolve_external_app_api_signed_at(signed_at: Option<&str>) -> Result<String, String> {
    if let Some(explicit_signed_at) = signed_at {
        return require_non_empty_text(explicit_signed_at, "handshake signed-at");
    }

    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .map_err(|error| format!("format upstream handshake signed-at failed: {error}"))
}

fn build_upstream_authorization_header(
    upstream_state: &PersistedUpstreamSessionState,
) -> Option<String> {
    let token = upstream_state
        .auth_token
        .as_deref()
        .or(upstream_state.access_token.as_deref())?;
    let normalized_token = token.trim();
    if normalized_token.is_empty() {
        return None;
    }
    if normalized_token.contains(' ') {
        return Some(normalized_token.to_owned());
    }
    let token_type = upstream_state
        .token_type
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(USER_CENTER_AUTHORIZATION_SCHEME);
    Some(format!("{token_type} {normalized_token}"))
}

pub(crate) fn resolve_external_app_api_handshake_config(
    app_id: Option<&str>,
    secret_id: Option<&str>,
    shared_secret: Option<&str>,
    default_app_id: &str,
    secret_id_env_name: &str,
    shared_secret_env_name: &str,
) -> Result<Option<ExternalAppApiHandshakeConfig>, String> {
    let normalized_secret_id = normalize_optional_text(secret_id);
    let normalized_shared_secret = normalize_optional_text(shared_secret);
    if normalized_secret_id.is_none() && normalized_shared_secret.is_none() {
        return Ok(None);
    }

    let resolved_secret_id = normalized_secret_id.ok_or_else(|| {
        format!(
            "{} is required when {} is configured.",
            secret_id_env_name, shared_secret_env_name
        )
    })?;
    let resolved_shared_secret = normalized_shared_secret.ok_or_else(|| {
        format!(
            "{} is required when {} is configured.",
            shared_secret_env_name, secret_id_env_name
        )
    })?;
    let resolved_app_id =
        normalize_optional_text(app_id).unwrap_or_else(|| default_app_id.to_owned());

    Ok(Some(ExternalAppApiHandshakeConfig {
        app_id: resolved_app_id,
        secret_id: resolved_secret_id,
        shared_secret: resolved_shared_secret,
    }))
}

pub(crate) fn create_external_app_api_handshake_signing_message(
    input: &ExternalAppApiHandshakeSigningInput<'_>,
) -> Result<String, String> {
    let app_id = require_non_empty_text(input.app_id, "handshake app id")?;
    let provider_key = require_non_empty_text(input.provider_key, "handshake provider key")?;
    let signed_at = require_non_empty_text(input.signed_at, "handshake signed-at")?;
    let provider = UserCenterProviderConfig {
        base_url: None,
        headers: Vec::new(),
        kind: "sdkwork-cloud-app-api".to_owned(),
        provider_key,
    };
    let storage_plan = create_user_center_storage_plan(&app_id);
    let auth = create_user_center_auth_profile(&app_id, &provider, "app-api-hub", &storage_plan);

    create_sdkwork_user_center_handshake_signing_message(
        &auth,
        input.method,
        input.path,
        &signed_at,
    )
}

pub(crate) fn sign_external_app_api_handshake(
    shared_secret: &str,
    signing_message: &str,
) -> Result<String, String> {
    type HmacSha256 = Hmac<Sha256>;

    let resolved_shared_secret =
        require_non_empty_text(shared_secret, "upstream handshake shared secret")?;
    let resolved_signing_message =
        require_non_empty_text(signing_message, "upstream handshake signing message")?;
    let mut mac = HmacSha256::new_from_slice(resolved_shared_secret.as_bytes())
        .map_err(|error| format!("initialize upstream handshake signer failed: {error}"))?;
    mac.update(resolved_signing_message.as_bytes());
    Ok(URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes()))
}

pub(crate) fn build_external_app_api_request_headers(
    config: &ExternalAppApiConfig,
    context: &ExternalAppApiRequestContext<'_>,
) -> Result<BTreeMap<String, String>, String> {
    let mut headers = BTreeMap::new();
    let provider_key = require_non_empty_text(context.provider_key, "upstream provider key")?;
    let should_attach_refresh_token =
        should_attach_refresh_token_to_upstream_request(context.path)?;

    if let Some(upstream_state) = context.upstream_state {
        if let Some(authorization_header) = build_upstream_authorization_header(upstream_state) {
            headers.insert(
                USER_CENTER_AUTHORIZATION_HEADER_NAME.to_owned(),
                authorization_header,
            );
        }

        if let Some(access_token) = normalize_optional_text(upstream_state.access_token.as_deref())
        {
            headers.insert(
                USER_CENTER_ACCESS_TOKEN_HEADER_NAME.to_owned(),
                access_token,
            );
        }

        if should_attach_refresh_token {
            if let Some(refresh_token) =
                normalize_optional_text(upstream_state.refresh_token.as_deref())
            {
                headers.insert(
                    USER_CENTER_REFRESH_TOKEN_HEADER_NAME.to_owned(),
                    refresh_token,
                );
            }
        }
    }

    if let Some(session_id) = normalize_optional_text(context.session_id) {
        headers.insert(USER_CENTER_SESSION_HEADER_NAME.to_owned(), session_id);
    }

    if let Some(handshake) = &config.handshake {
        let signed_at = resolve_external_app_api_signed_at(context.signed_at)?;
        let signing_message = create_external_app_api_handshake_signing_message(
            &ExternalAppApiHandshakeSigningInput {
                app_id: handshake.app_id.as_str(),
                method: context.method,
                path: context.path,
                provider_key: provider_key.as_str(),
                signed_at: signed_at.as_str(),
            },
        )?;
        let signature =
            sign_external_app_api_handshake(handshake.shared_secret.as_str(), &signing_message)?;

        headers.insert(
            USER_CENTER_APP_ID_HEADER_NAME.to_owned(),
            handshake.app_id.clone(),
        );
        headers.insert(
            USER_CENTER_PROVIDER_KEY_HEADER_NAME.to_owned(),
            provider_key,
        );
        headers.insert(
            USER_CENTER_HANDSHAKE_MODE_HEADER_NAME.to_owned(),
            USER_CENTER_STANDARD_HANDSHAKE_MODE.to_owned(),
        );
        headers.insert(
            USER_CENTER_SECRET_ID_HEADER_NAME.to_owned(),
            handshake.secret_id.clone(),
        );
        headers.insert(USER_CENTER_SIGNATURE_HEADER_NAME.to_owned(), signature);
        headers.insert(USER_CENTER_SIGNED_AT_HEADER_NAME.to_owned(), signed_at);
    }

    Ok(headers)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn build_handshake_config() -> ExternalAppApiHandshakeConfig {
        ExternalAppApiHandshakeConfig {
            app_id: "sdkwork-user-center".to_owned(),
            secret_id: "user-center-secret-id".to_owned(),
            shared_secret: "user-center-shared-secret".to_owned(),
        }
    }

    fn build_app_api_config() -> ExternalAppApiConfig {
        ExternalAppApiConfig {
            app_id: "sdkwork-user-center".to_owned(),
            base_url: "https://example.test".to_owned(),
            handshake: Some(build_handshake_config()),
            timeout: Duration::from_millis(8_000),
        }
    }

    fn build_upstream_state(
        auth_token: Option<&str>,
        access_token: Option<&str>,
        refresh_token: Option<&str>,
    ) -> PersistedUpstreamSessionState {
        PersistedUpstreamSessionState {
            access_token: access_token.map(str::to_owned),
            auth_token: auth_token.map(str::to_owned),
            payload_json: None,
            refresh_token: refresh_token.map(str::to_owned),
            token_type: Some("Bearer".to_owned()),
            user_id: Some("upstream-user-1".to_owned()),
        }
    }

    #[test]
    fn build_external_app_api_request_headers_include_auth_access_session_and_handshake_for_profile_request(
    ) {
        let upstream_state = build_upstream_state(
            Some("auth-token-123"),
            Some("access-token-456"),
            Some("refresh-token-789"),
        );

        let headers = build_external_app_api_request_headers(
            &build_app_api_config(),
            &ExternalAppApiRequestContext {
                method: "GET",
                path: "/user/profile",
                provider_key: "sdkwork-user-center-remote",
                session_id: Some("session-123"),
                signed_at: Some("2026-04-21T12:00:00Z"),
                upstream_state: Some(&upstream_state),
            },
        )
        .expect("build profile headers");

        assert_eq!(
            headers.get("Authorization").map(String::as_str),
            Some("Bearer auth-token-123")
        );
        assert_eq!(
            headers
                .get(USER_CENTER_ACCESS_TOKEN_HEADER_NAME)
                .map(String::as_str),
            Some("access-token-456")
        );
        assert!(!headers.contains_key("Refresh-Token"));
        assert_eq!(
            headers
                .get(USER_CENTER_SESSION_HEADER_NAME)
                .map(String::as_str),
            Some("session-123")
        );
        assert_eq!(
            headers.get("x-sdkwork-app-id").map(String::as_str),
            Some("sdkwork-user-center")
        );
        assert_eq!(
            headers
                .get("x-sdkwork-user-center-provider-key")
                .map(String::as_str),
            Some("sdkwork-user-center-remote")
        );
        assert_eq!(
            headers
                .get("x-sdkwork-user-center-handshake-mode")
                .map(String::as_str),
            Some("provider-shared-secret")
        );
        assert_eq!(
            headers
                .get("x-sdkwork-user-center-secret-id")
                .map(String::as_str),
            Some("user-center-secret-id")
        );
        assert_eq!(
            headers
                .get("x-sdkwork-user-center-signed-at")
                .map(String::as_str),
            Some("2026-04-21T12:00:00Z")
        );
        assert_eq!(
            headers
                .get("x-sdkwork-user-center-signature")
                .map(String::as_str),
            Some("FPtw7SjEL54qHEKxg5YO7HhGYhhRYDoSr6rbThlqdcE")
        );
    }

    #[test]
    fn build_external_app_api_request_headers_support_refresh_token_transport_without_authorization(
    ) {
        let upstream_state = build_upstream_state(None, None, Some("refresh-token-789"));

        let headers = build_external_app_api_request_headers(
            &build_app_api_config(),
            &ExternalAppApiRequestContext {
                method: "POST",
                path: "/auth/refresh",
                provider_key: "sdkwork-user-center-remote",
                session_id: Some("session-456"),
                signed_at: Some("2026-04-21T12:00:00Z"),
                upstream_state: Some(&upstream_state),
            },
        )
        .expect("build refresh headers");

        assert!(!headers.contains_key("Authorization"));
        assert!(!headers.contains_key(USER_CENTER_ACCESS_TOKEN_HEADER_NAME));
        assert_eq!(
            headers.get("Refresh-Token").map(String::as_str),
            Some("refresh-token-789")
        );
        assert_eq!(
            headers
                .get(USER_CENTER_SESSION_HEADER_NAME)
                .map(String::as_str),
            Some("session-456")
        );
        assert_eq!(
            headers
                .get("x-sdkwork-user-center-signature")
                .map(String::as_str),
            Some("CjyezPdfyMV4ebnREl2khSo0TVqIf1dlZjQXbpnEN64")
        );
    }

    #[test]
    fn create_external_app_api_handshake_signing_message_matches_shared_standard() {
        let signing_message = create_external_app_api_handshake_signing_message(
            &ExternalAppApiHandshakeSigningInput {
                app_id: "sdkwork-user-center",
                method: "get",
                path: "user/profile",
                provider_key: "sdkwork-cloud-app-api",
                signed_at: "2026-04-21T12:00:00Z",
            },
        )
        .expect("create handshake signing message");

        assert_eq!(
            signing_message,
            concat!(
                "sdkwork-user-center\n",
                "sdkwork-cloud-app-api\n",
                "provider-shared-secret\n",
                "GET\n",
                "/user/profile\n",
                "2026-04-21T12:00:00Z"
            )
        );
    }

    #[test]
    fn sign_external_app_api_handshake_uses_hmac_sha256_base64url_without_padding() {
        let signature = sign_external_app_api_handshake(
            "user-center-shared-secret",
            concat!(
                "sdkwork-user-center\n",
                "sdkwork-cloud-app-api\n",
                "provider-shared-secret\n",
                "GET\n",
                "/user/profile\n",
                "2026-04-21T12:00:00Z"
            ),
        )
        .expect("sign handshake");

        assert_eq!(signature, "1z0szCuqb2mt5UetQ_pSBpco58_LNmyyhOr7-VILKUU");
    }

    #[test]
    fn resolve_external_app_api_handshake_config_rejects_partial_secret_bridge_configuration() {
        let error = resolve_external_app_api_handshake_config(
            Some("sdkwork-user-center"),
            Some("user-center-secret-id"),
            None,
            "sdkwork-user-center",
            "SDKWORK_USER_CENTER_SECRET_ID",
            "SDKWORK_USER_CENTER_SHARED_SECRET",
        )
        .expect_err("partial handshake configuration must be rejected");

        assert!(error.contains("SDKWORK_USER_CENTER_SHARED_SECRET"));
    }
}
