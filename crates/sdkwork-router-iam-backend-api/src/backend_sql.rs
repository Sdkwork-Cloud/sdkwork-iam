//! Shared PostgreSQL helpers for backend IAM handlers.

use std::collections::HashMap;

use serde_json::{json, Value};
use sqlx::{postgres::PgRow, PgPool, Row};

pub(crate) fn page_limit(query: &HashMap<String, String>) -> i64 {
    query
        .get("page_size")
        .or_else(|| query.get("pageSize"))
        .and_then(|value| value.parse::<i64>().ok())
        .unwrap_or(50)
        .clamp(1, 200)
}

pub(crate) fn page_json(records: Vec<Value>) -> Value {
    json!({
        "records": records,
        "total": records.len(),
    })
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
    limit: i64,
) -> Result<Vec<PgRow>, sqlx::Error> {
    let sql =
        format!("SELECT {select} FROM {table} WHERE tenant_id = $1 ORDER BY {order_by} LIMIT $2");
    sqlx::query(&sql)
        .bind(tenant_id)
        .bind(limit)
        .fetch_all(pg)
        .await
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
