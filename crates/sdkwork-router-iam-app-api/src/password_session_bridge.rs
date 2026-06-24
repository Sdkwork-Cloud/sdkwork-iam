use async_trait::async_trait;
use serde_json::Value;

/// Product-local password authentication for OAuth device password-completion flows
/// when the IAM app-api pool is not PostgreSQL (for example Claw Router SQLite desktop).
#[async_trait]
pub trait PasswordSessionBridge: Send + Sync {
    async fn authenticate_password_and_issue_session(
        &self,
        account: &str,
        password: &str,
    ) -> PasswordSessionBridgeResult;
}

pub enum PasswordSessionBridgeResult {
    Authenticated(Value),
    InvalidCredentials,
    AccountLocked,
    OrganizationSelectionRequired(Value),
    Failed(String),
}
