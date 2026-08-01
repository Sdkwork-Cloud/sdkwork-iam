//! Web Framework audit and security-event adapters backed by IAM event tables.

use async_trait::async_trait;
use sdkwork_web_core::{
    AuditEmitter, AuditFact, SecurityEvent, SecurityEventEmitter, SecurityEventKind,
    WebFrameworkError,
};
use serde_json::json;
use sqlx::PgPool;

#[derive(Clone)]
pub struct IamAuditEmitter {
    pool: PgPool,
    app_id: String,
    environment: String,
}

impl IamAuditEmitter {
    pub fn new(pool: PgPool, app_id: impl Into<String>, environment: impl Into<String>) -> Self {
        Self {
            pool,
            app_id: app_id.into(),
            environment: environment.into(),
        }
    }
}

#[async_trait]
impl AuditEmitter for IamAuditEmitter {
    async fn emit(&self, fact: AuditFact) -> Result<(), WebFrameworkError> {
        let tenant_id = fact.tenant_id.as_deref().unwrap_or("0");
        crate::iam_audit::record_audit_event_with_app_id(
            &self.pool,
            tenant_id,
            None,
            fact.user_id.as_deref(),
            "web.request.completed",
            "http_operation",
            fact.operation_id.as_deref(),
            Some(&fact.request_id),
            &self.app_id,
            &self.environment,
            json!({
                "apiSurface": fact.api_surface,
                "path": fact.path,
                "method": fact.method,
                "statusCode": fact.status_code,
                "durationMs": fact.duration_ms,
            }),
        )
        .await
        .map_err(WebFrameworkError::dependency_unavailable)
    }
}

#[derive(Clone)]
pub struct IamSecurityEventEmitter {
    pool: PgPool,
    environment: String,
}

impl IamSecurityEventEmitter {
    pub fn new(pool: PgPool, environment: impl Into<String>) -> Self {
        Self {
            pool,
            environment: environment.into(),
        }
    }
}

#[async_trait]
impl SecurityEventEmitter for IamSecurityEventEmitter {
    async fn emit(&self, event: SecurityEvent) -> Result<(), WebFrameworkError> {
        let tenant_id = event.tenant_id.as_deref().unwrap_or("0");
        let event_type = security_event_type(&event.kind);
        let severity = security_event_severity(&event.kind);
        let result = crate::record_security_event(
            &self.pool,
            tenant_id,
            None,
            None,
            event_type,
            severity,
            &self.environment,
            json!({
                "requestId": event.request_id,
                "apiSurface": event.api_surface,
                "path": event.path,
                "method": event.method,
                "origin": event.origin,
                "detail": event.detail,
            }),
        )
        .await;
        if let Err(error) = result {
            tracing::warn!(
                error = %error,
                tenant_id,
                event_type,
                "IAM security event write failed (fail-open)"
            );
        }
        Ok(())
    }
}

fn security_event_type(kind: &SecurityEventKind) -> &'static str {
    match kind {
        SecurityEventKind::CorsDenied => "web.cors.denied",
        SecurityEventKind::RateLimitExceeded => "web.rate_limit.exceeded",
        SecurityEventKind::AuthenticationFailed => "web.authentication.failed",
        SecurityEventKind::AuthorizationDenied => "web.authorization.denied",
        SecurityEventKind::TenantIsolationDenied => "web.tenant_isolation.denied",
    }
}

fn security_event_severity(kind: &SecurityEventKind) -> &'static str {
    match kind {
        SecurityEventKind::AuthenticationFailed | SecurityEventKind::TenantIsolationDenied => {
            "high"
        }
        SecurityEventKind::CorsDenied
        | SecurityEventKind::RateLimitExceeded
        | SecurityEventKind::AuthorizationDenied => "medium",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn security_event_mapping_is_stable() {
        assert_eq!(
            "web.authentication.failed",
            security_event_type(&SecurityEventKind::AuthenticationFailed),
        );
        assert_eq!(
            "high",
            security_event_severity(&SecurityEventKind::TenantIsolationDenied),
        );
        assert_eq!(
            "medium",
            security_event_severity(&SecurityEventKind::RateLimitExceeded),
        );
    }
}
