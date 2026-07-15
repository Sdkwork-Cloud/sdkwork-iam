//! Shared PostgreSQL helpers for backend IAM handlers.

use std::collections::HashMap;

use axum::http::StatusCode;
use axum::response::Response;
use sdkwork_iam_web_adapter::iam_api_error;
use sdkwork_utils_rust::{
    cursor_list_page_data, offset_list_page_data, sdkwork_tree_resource_json,
    validated_list_page_params_from_map, CursorListPageParams, OffsetListPageParams,
    ResolvedListPageParams, SdkWorkResultCode, LIST_TOTAL_SQL_COLUMN,
};
use serde_json::{json, Value};
use sqlx::{postgres::PgRow, PgPool, Row};

pub(crate) use sdkwork_utils_rust::LIST_TOTAL_SQL_COLUMN as LIST_TOTAL_COLUMN;

pub(crate) type ListPageParams = OffsetListPageParams;

pub(crate) fn list_page_params_or_error(
    query: &HashMap<String, String>,
) -> Result<ListPageParams, Response> {
    match validated_list_page_params_from_map(query) {
        Ok(ResolvedListPageParams::Offset(params)) => Ok(params),
        Ok(ResolvedListPageParams::Cursor(_)) => Err(list_page_invalid_parameter_error()),
        Err(SdkWorkResultCode::InvalidParameter) => Err(list_page_invalid_parameter_error()),
        Err(_) => Err(list_page_invalid_parameter_error()),
    }
}

pub(crate) fn list_page_invalid_parameter_error() -> Response {
    iam_api_error(
        StatusCode::BAD_REQUEST,
        "iam_invalid_list_query",
        "invalid list pagination parameters",
    )
}

pub(crate) fn internal_handler_error(wire_code: &str, error: impl std::fmt::Display) -> Response {
    tracing::error!(%error, wire_code, "backend IAM handler failed");
    iam_api_error(
        StatusCode::INTERNAL_SERVER_ERROR,
        wire_code,
        "internal server error",
    )
}

/// Keyset cursor for timeline feeds ordered by `(created_at DESC, id DESC)`.
#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct TimelineKeysetCursor {
    pub created_at: String,
    pub id: String,
}

pub(crate) fn encode_timeline_keyset_cursor(created_at: &str, id: &str) -> String {
    format!("k:{created_at}|{id}")
}

pub(crate) fn parse_timeline_keyset_cursor(
    cursor: Option<&str>,
) -> Result<Option<TimelineKeysetCursor>, SdkWorkResultCode> {
    let Some(cursor) = cursor.map(str::trim).filter(|value| !value.is_empty()) else {
        return Ok(None);
    };
    let Some(rest) = cursor.strip_prefix("k:") else {
        return Err(SdkWorkResultCode::InvalidParameter);
    };
    let Some((created_at, id)) = rest.split_once('|') else {
        return Err(SdkWorkResultCode::InvalidParameter);
    };
    if created_at.is_empty() || id.is_empty() {
        return Err(SdkWorkResultCode::InvalidParameter);
    }
    Ok(Some(TimelineKeysetCursor {
        created_at: created_at.to_owned(),
        id: id.to_owned(),
    }))
}

pub(crate) fn cursor_page_json(
    items: Vec<Value>,
    page_size: usize,
    next_cursor: Option<String>,
    has_more: bool,
) -> Value {
    let page = cursor_list_page_data(items, page_size, next_cursor, has_more);
    serde_json::to_value(page).unwrap_or_else(|_| json!({ "items": [], "pageInfo": {} }))
}

/// Timeline feed pagination for audit/security event lists.
#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) enum TimelineListParams {
    Offset(OffsetListPageParams),
    CursorOffset(CursorListPageParams),
    CursorKeyset {
        page_size: usize,
        cursor: TimelineKeysetCursor,
    },
}

pub(crate) fn resolve_timeline_list_params(
    query: &HashMap<String, String>,
) -> Result<TimelineListParams, SdkWorkResultCode> {
    let has_page = query
        .get("page")
        .or_else(|| query.get("pageNo"))
        .or_else(|| query.get("page_no"))
        .map(|value| !value.trim().is_empty())
        .unwrap_or(false);
    let has_cursor = query
        .get("cursor")
        .map(|value| !value.trim().is_empty())
        .unwrap_or(false);
    if has_page && has_cursor {
        return Err(SdkWorkResultCode::InvalidParameter);
    }

    let page_size_i32 = query
        .get("page_size")
        .or_else(|| query.get("pageSize"))
        .and_then(|value| value.parse::<i32>().ok());

    if has_cursor {
        let cursor = query.get("cursor").map(String::as_str);
        if let Ok(Some(keyset)) = parse_timeline_keyset_cursor(cursor) {
            let page_size = page_size_i32.unwrap_or(sdkwork_utils_rust::DEFAULT_LIST_PAGE_SIZE);
            if page_size < 1 || page_size > sdkwork_utils_rust::MAX_LIST_PAGE_SIZE {
                return Err(SdkWorkResultCode::InvalidParameter);
            }
            return Ok(TimelineListParams::CursorKeyset {
                page_size: page_size as usize,
                cursor: keyset,
            });
        }
        return Ok(TimelineListParams::CursorOffset(
            sdkwork_utils_rust::validated_cursor_list_params(page_size_i32, cursor)?,
        ));
    }

    let page = query
        .get("page")
        .or_else(|| query.get("pageNo"))
        .or_else(|| query.get("page_no"))
        .and_then(|value| value.parse::<i64>().ok());
    Ok(TimelineListParams::Offset(
        sdkwork_utils_rust::validated_offset_list_params(page, page_size_i32.map(i64::from))?,
    ))
}

pub(crate) fn timeline_list_params_or_error(
    query: &HashMap<String, String>,
) -> Result<TimelineListParams, Response> {
    resolve_timeline_list_params(query).map_err(|_| list_page_invalid_parameter_error())
}

pub(crate) fn timeline_cursor_page_from_rows<F, C>(
    rows: Vec<PgRow>,
    page_size: usize,
    mut map_row: F,
    encode_cursor: C,
) -> Value
where
    F: FnMut(&PgRow) -> Value,
    C: Fn(&PgRow) -> String,
{
    let has_more = rows.len() > page_size;
    let page_rows = if has_more {
        &rows[..page_size]
    } else {
        rows.as_slice()
    };
    let items = page_rows.iter().map(&mut map_row).collect::<Vec<_>>();
    let next_cursor = if has_more {
        page_rows.last().map(encode_cursor)
    } else {
        None
    };
    cursor_page_json(items, page_size, next_cursor, has_more)
}

pub(crate) fn total_from_rows(rows: &[PgRow]) -> i64 {
    rows.first()
        .and_then(|row| row.try_get::<i64, _>(LIST_TOTAL_SQL_COLUMN).ok())
        .unwrap_or(0)
}

pub(crate) fn page_json(items: Vec<Value>, total_items: i64, params: &ListPageParams) -> Value {
    let page = offset_list_page_data(items, total_items, *params);
    serde_json::to_value(page).unwrap_or_else(|_| json!({ "items": [], "pageInfo": {} }))
}

pub(crate) fn page_json_from_rows<F>(rows: Vec<PgRow>, params: &ListPageParams, map_row: F) -> Value
where
    F: FnMut(&PgRow) -> Value,
{
    let total_items = total_from_rows(&rows);
    let items = rows.iter().map(map_row).collect();
    page_json(items, total_items, params)
}

pub(crate) fn list_search_pattern(query: &HashMap<String, String>) -> Option<String> {
    query
        .get("q")
        .map(String::as_str)
        .filter(|value| !value.trim().is_empty())
        .map(|value| format!("%{}%", value.trim().to_ascii_lowercase()))
}

/// SQL fragment: `AND ($N::text IS NULL OR LOWER(col) LIKE $N OR ...)`.
pub(crate) fn list_search_sql_clause(columns: &[&str], bind: &str) -> String {
    if columns.is_empty() {
        return String::new();
    }
    let conditions = columns
        .iter()
        .map(|column| format!("LOWER({column}) LIKE {bind}"))
        .collect::<Vec<_>>()
        .join(" OR ");
    format!("AND ({bind}::text IS NULL OR {conditions})")
}

pub(crate) fn read_string_field(body: &Value, keys: &[&str]) -> Option<String> {
    keys.iter().find_map(|key| {
        body.get(*key)
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_owned)
    })
}

pub(crate) fn read_i32_field(body: &Value, keys: &[&str]) -> Option<i32> {
    keys.iter().find_map(|key| {
        body.get(*key).and_then(|value| match value {
            Value::Number(number) => number.as_i64().map(|parsed| parsed as i32),
            Value::Bool(enabled) => Some(i32::from(*enabled)),
            Value::String(text) => text.parse::<i32>().ok(),
            _ => None,
        })
    })
}

pub(crate) fn snake_to_lower_camel(value: &str) -> String {
    let mut parts = value.split('_');
    let Some(first) = parts.next() else {
        return String::new();
    };

    let mut out = first.to_string();
    for part in parts {
        if part.is_empty() {
            continue;
        }
        let mut chars = part.chars();
        if let Some(ch) = chars.next() {
            out.push(ch.to_ascii_uppercase());
            out.extend(chars);
        }
    }
    out
}

pub(crate) fn row_to_json(row: &PgRow, columns: &[&str]) -> Value {
    let mut map = serde_json::Map::new();

    for column in columns {
        let key = snake_to_lower_camel(column);
        if let Ok(value) = row.try_get::<String, _>(*column) {
            map.insert(key, json!(value));
        } else if let Ok(value) = row.try_get::<Option<String>, _>(*column) {
            if let Some(text) = value {
                map.insert(key, json!(text));
            }
        } else if let Ok(value) = row.try_get::<i32, _>(*column) {
            map.insert(key, json!(value));
        } else if let Ok(value) = row.try_get::<i64, _>(*column) {
            map.insert(key, json!(value));
        }
    }

    if let Some(id) = map.get("id").cloned() {
        map.entry("id".to_owned()).or_insert_with(|| id.clone());
    }

    Value::Object(map)
}

pub(crate) fn row_to_json_with_aliases(
    row: &PgRow,
    columns: &[&str],
    aliases: &[(&str, &str)],
) -> Value {
    let mut value = row_to_json(row, columns);
    let Value::Object(ref mut map) = value else {
        return value;
    };

    for (alias, column) in aliases {
        if let Some(existing) = map.get(snake_to_lower_camel(column).as_str()).cloned() {
            map.insert((*alias).to_owned(), existing);
        } else if let Some(existing) = map.get(*column).cloned() {
            map.insert((*alias).to_owned(), existing);
        }
    }

    value
}

pub(crate) async fn list_tenant_rows(
    pg: &PgPool,
    tenant_id: &str,
    table: &str,
    select: &str,
    order_by: &str,
    params: &ListPageParams,
    search_pattern: Option<String>,
    search_columns: &[&str],
) -> Result<Vec<PgRow>, sqlx::Error> {
    if search_columns.is_empty() {
        let sql = format!(
            "SELECT {select}, COUNT(*) OVER() AS {LIST_TOTAL_SQL_COLUMN} \
             FROM {table} WHERE tenant_id = $1 ORDER BY {order_by} LIMIT $2 OFFSET $3"
        );
        return sqlx::query(&sql)
            .bind(tenant_id)
            .bind(params.page_size)
            .bind(params.offset)
            .fetch_all(pg)
            .await;
    }

    let search_clause = list_search_sql_clause(search_columns, "$2");
    let sql = format!(
        "SELECT {select}, COUNT(*) OVER() AS {LIST_TOTAL_SQL_COLUMN} \
         FROM {table} WHERE tenant_id = $1 {search_clause} ORDER BY {order_by} LIMIT $3 OFFSET $4"
    );
    sqlx::query(&sql)
        .bind(tenant_id)
        .bind(search_pattern)
        .bind(params.page_size)
        .bind(params.offset)
        .fetch_all(pg)
        .await
}

pub(crate) fn tree_resource_json(nodes: Vec<Value>) -> Value {
    sdkwork_tree_resource_json(nodes)
}

pub(crate) async fn retrieve_tenant_row(
    pg: &PgPool,
    tenant_id: &str,
    table: &str,
    select: &str,
    id: &str,
) -> Result<Option<PgRow>, sqlx::Error> {
    let sql = format!("SELECT {select} FROM {table} WHERE tenant_id = $1 AND id = $2 LIMIT 1");
    sqlx::query(&sql)
        .bind(tenant_id)
        .bind(id)
        .fetch_optional(pg)
        .await
}

pub(crate) async fn patch_tenant_row_tx<'e, E>(
    executor: E,
    tenant_id: &str,
    table: &str,
    id: &str,
    assignments: &[(String, String)],
) -> Result<bool, sqlx::Error>
where
    E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
    if assignments.is_empty() {
        return Ok(false);
    }

    let mut set_clause = String::new();
    for (index, (column, _)) in assignments.iter().enumerate() {
        if index > 0 {
            set_clause.push_str(", ");
        }
        set_clause.push_str(column);
        set_clause.push_str(" = $");
        set_clause.push_str(&(index + 3).to_string());
    }

    let sql = format!("UPDATE {table} SET {set_clause} WHERE tenant_id = $1 AND id = $2");
    let mut query = sqlx::query(&sql).bind(tenant_id).bind(id);
    for (_, value) in assignments {
        query = query.bind(value);
    }

    let result = query.execute(executor).await?;
    Ok(result.rows_affected() > 0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn list_page_params_or_error_defaults_match_spec() {
        let params = list_page_params_or_error(&HashMap::new()).expect("defaults");
        assert_eq!(1, params.page);
        assert_eq!(20, params.page_size);
    }

    #[test]
    fn list_page_params_or_error_rejects_invalid_page_size() {
        let mut query = HashMap::new();
        query.insert("page_size".to_owned(), "201".to_owned());
        assert!(list_page_params_or_error(&query).is_err());
    }

    #[test]
    fn list_page_invalid_parameter_error_returns_40003() {
        use sdkwork_iam_web_adapter::iam_wire_result_code;

        let response = list_page_invalid_parameter_error();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        assert_eq!(
            iam_wire_result_code(StatusCode::BAD_REQUEST, "iam_invalid_list_query").as_i32(),
            40_003
        );
    }

    #[test]
    fn parse_timeline_keyset_cursor_round_trips() {
        let encoded = encode_timeline_keyset_cursor("2026-01-01T00:00:00Z", "audit-1");
        let parsed = parse_timeline_keyset_cursor(Some(&encoded))
            .expect("parsed")
            .expect("cursor");
        assert_eq!(parsed.created_at, "2026-01-01T00:00:00Z");
        assert_eq!(parsed.id, "audit-1");
    }

    #[test]
    fn page_json_uses_standard_page_info_fields() {
        let params = ListPageParams::parse(Some(2), Some(10));
        let payload = page_json(vec![json!({"id": "1"})], 25, &params);
        assert_eq!(
            payload["items"].as_array().map(|items| items.len()),
            Some(1)
        );
        assert_eq!(payload["pageInfo"]["mode"], "offset");
        assert_eq!(payload["pageInfo"]["page"], 2);
        assert_eq!(payload["pageInfo"]["pageSize"], 10);
        assert_eq!(payload["pageInfo"]["totalItems"], "25");
        assert_eq!(payload["pageInfo"]["hasMore"], true);
    }

    #[test]
    fn tree_resource_json_uses_standard_item_nodes_shape() {
        let payload = tree_resource_json(vec![json!({"organizationId": "org-1"})]);
        assert!(payload["item"]["nodes"].is_array());
        assert_eq!(payload["item"]["nodes"][0]["organizationId"], "org-1");
        assert!(payload.get("items").is_none());
    }
}
