//! Shared PostgreSQL helpers for backend IAM handlers.

use std::collections::HashMap;

use sdkwork_utils_rust::{
    offset_list_page_data, offset_list_page_params_from_map, sdkwork_tree_resource_json,
    OffsetListPageParams, LIST_TOTAL_SQL_COLUMN,
};
use serde_json::{json, Value};
use sqlx::{postgres::PgRow, PgPool, Row};

pub(crate) use sdkwork_utils_rust::LIST_TOTAL_SQL_COLUMN as LIST_TOTAL_COLUMN;

pub(crate) type ListPageParams = OffsetListPageParams;

pub(crate) fn list_page_params(query: &HashMap<String, String>) -> ListPageParams {
    offset_list_page_params_from_map(query)
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

pub(crate) async fn delete_tenant_row(
    pg: &PgPool,
    tenant_id: &str,
    table: &str,
    id: &str,
) -> Result<bool, sqlx::Error> {
    let sql = format!("DELETE FROM {table} WHERE tenant_id = $1 AND id = $2");
    let result = sqlx::query(&sql)
        .bind(tenant_id)
        .bind(id)
        .execute(pg)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub(crate) async fn patch_tenant_row(
    pg: &PgPool,
    tenant_id: &str,
    table: &str,
    id: &str,
    assignments: &[(String, String)],
) -> Result<bool, sqlx::Error> {
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

    let result = query.execute(pg).await?;
    Ok(result.rows_affected() > 0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn list_page_params_default_matches_spec() {
        let params = list_page_params(&HashMap::new());
        assert_eq!(1, params.page);
        assert_eq!(20, params.page_size);
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
