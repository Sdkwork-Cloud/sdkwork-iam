//! Snowflake numeric identifiers for IAM entities that must map into SQL BIGINT scopes.

use std::sync::{OnceLock, RwLock};
use std::time::Duration;

use sdkwork_database_id::{NodeLease, SnowflakeIdError, SnowflakeIdGenerator};

const DEFAULT_IAM_SNOWFLAKE_NODE_ID: u16 = 2;

struct IamSnowflakeState {
    generator: SnowflakeIdGenerator,
    _lease: Option<NodeLease>,
}

static IAM_SNOWFLAKE_STATE: OnceLock<RwLock<IamSnowflakeState>> = OnceLock::new();

/// Initialize the IAM ID generator from a database-allocated node_id.
///
/// Call this during application bootstrap after the database pool is available.
/// The `lease` keeps the database heartbeat alive.
pub fn init_iam_id_generator(generator: SnowflakeIdGenerator, lease: Option<NodeLease>) {
    let state = IAM_SNOWFLAKE_STATE.get_or_init(|| {
        RwLock::new(IamSnowflakeState {
            generator: generator.clone(),
            _lease: None,
        })
    });
    *state
        .write()
        .unwrap_or_else(|poisoned| poisoned.into_inner()) = IamSnowflakeState {
        generator,
        _lease: lease,
    };
}

fn iam_snowflake_generator() -> SnowflakeIdGenerator {
    IAM_SNOWFLAKE_STATE
        .get_or_init(|| {
            RwLock::new(IamSnowflakeState {
                generator: SnowflakeIdGenerator::new(resolve_iam_snowflake_node_id())
                    .expect("IAM snowflake node id must be valid"),
                _lease: None,
            })
        })
        .read()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .generator
        .clone()
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
    let generator = iam_snowflake_generator();
    loop {
        match generator.generate() {
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
