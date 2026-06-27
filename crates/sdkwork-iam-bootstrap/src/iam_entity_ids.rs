//! Snowflake numeric identifiers for IAM entities that must map into SQL BIGINT scopes.

use std::sync::OnceLock;
use std::time::Duration;

use sdkwork_database_id::{NodeLease, SnowflakeIdError, SnowflakeIdGenerator};

const DEFAULT_IAM_SNOWFLAKE_NODE_ID: u16 = 2;

static IAM_SNOWFLAKE_GENERATOR: OnceLock<SnowflakeIdGenerator> = OnceLock::new();
static IAM_SNOWFLAKE_LEASE: OnceLock<Option<NodeLease>> = OnceLock::new();

/// Initialize the IAM ID generator from a database-allocated node_id.
///
/// Call this during application bootstrap after the database pool is available.
/// The `lease` keeps the database heartbeat alive.
pub fn init_iam_id_generator(generator: SnowflakeIdGenerator, lease: Option<NodeLease>) {
    let _ = IAM_SNOWFLAKE_LEASE.set(lease);
    let _ = IAM_SNOWFLAKE_GENERATOR.set(generator);
}

fn iam_snowflake_generator() -> &'static SnowflakeIdGenerator {
    IAM_SNOWFLAKE_GENERATOR.get_or_init(|| {
        SnowflakeIdGenerator::new(resolve_iam_snowflake_node_id())
            .expect("IAM snowflake node id must be valid")
    })
}

fn resolve_iam_snowflake_node_id() -> u16 {
    std::env::var("SDKWORK_IAM_SNOWFLAKE_NODE_ID")
        .ok()
        .and_then(|value| value.trim().parse::<u16>().ok())
        .filter(|value| *value <= sdkwork_database_id::max_snowflake_node_id())
        .unwrap_or(DEFAULT_IAM_SNOWFLAKE_NODE_ID)
}

/// Generates a positive snowflake id string suitable for IAM tenant/user primary keys.
pub fn new_iam_snowflake_id() -> String {
    loop {
        match iam_snowflake_generator().generate() {
            Ok(id) if id > 0 => return id.to_string(),
            Ok(_) => continue,
            Err(SnowflakeIdError::SequenceExhausted { .. }) => {
                std::thread::sleep(Duration::from_millis(1));
            }
            Err(error) => panic!("generate IAM snowflake id failed: {error:?}"),
        }
    }
}

/// Canonical IAM user primary key (numeric snowflake string).
pub fn new_iam_user_id() -> String {
    new_iam_snowflake_id()
}

/// Canonical IAM tenant primary key (numeric snowflake string).
pub fn new_iam_tenant_id() -> String {
    new_iam_snowflake_id()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn iam_user_ids_are_positive_numeric_snowflakes() {
        let id = new_iam_user_id();
        let parsed = id.parse::<i64>().expect("snowflake user id");
        assert!(parsed > 0);
    }

    #[test]
    fn iam_tenant_ids_are_positive_numeric_snowflakes() {
        let id = new_iam_tenant_id();
        let parsed = id.parse::<i64>().expect("snowflake tenant id");
        assert!(parsed > 0);
    }
}
