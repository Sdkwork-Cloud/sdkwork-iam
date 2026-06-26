//! Parse IAM / web-framework string subject ids into SQL BIGINT scopes.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IamSqlSubjectParseError {
    InvalidTenantId,
    InvalidOrganizationId,
    InvalidUserId,
}

/// Returns true when the id uses a legacy opaque prefix or UUID shape that cannot map to SQL BIGINT.
pub fn is_legacy_opaque_iam_subject_id(value: &str) -> bool {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return false;
    }
    if trimmed.starts_with("iamu_")
        || trimmed.starts_with("iamt_")
        || trimmed.starts_with("org_")
        || trimmed.starts_with("tenant_")
    {
        return true;
    }
    trimmed.contains('-') && trimmed.parse::<i64>().is_err()
}

pub fn parse_iam_sql_tenant_id(value: &str) -> Result<i64, IamSqlSubjectParseError> {
    parse_positive_iam_sql_subject_id(value, IamSqlSubjectParseError::InvalidTenantId)
}

pub fn parse_iam_sql_user_id(value: &str) -> Result<i64, IamSqlSubjectParseError> {
    parse_positive_iam_sql_subject_id(value, IamSqlSubjectParseError::InvalidUserId)
}

pub fn parse_iam_sql_organization_id(value: &str) -> Result<i64, IamSqlSubjectParseError> {
    value
        .trim()
        .parse::<i64>()
        .map_err(|_| IamSqlSubjectParseError::InvalidOrganizationId)
        .and_then(|parsed| {
            if parsed < 0 {
                Err(IamSqlSubjectParseError::InvalidOrganizationId)
            } else {
                Ok(parsed)
            }
        })
}

fn parse_positive_iam_sql_subject_id(
    value: &str,
    error: IamSqlSubjectParseError,
) -> Result<i64, IamSqlSubjectParseError> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(error);
    }
    let parsed = trimmed
        .parse::<i64>()
        .map_err(|_| error)?;
    if parsed <= 0 {
        return Err(error);
    }
    Ok(parsed)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_numeric_snowflake_ids() {
        assert_eq!(100_001, parse_iam_sql_tenant_id("100001").expect("tenant"));
        assert_eq!(30, parse_iam_sql_user_id("30").expect("user"));
        assert_eq!(0, parse_iam_sql_organization_id("0").expect("org"));
    }

    #[test]
    fn rejects_legacy_opaque_ids() {
        assert!(is_legacy_opaque_iam_subject_id("iamu_0192ab3c-4d5e-7890-abcd-ef1234567890"));
        assert!(is_legacy_opaque_iam_subject_id(
            "550e8400-e29b-41d4-a716-446655440000"
        ));
        assert!(!is_legacy_opaque_iam_subject_id("40003"));
    }
}
