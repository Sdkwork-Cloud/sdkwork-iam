//! Shared PostgreSQL-backed rate limiting for IAM ephemeral artifacts.

use chrono::{DateTime, Utc};
use serde_json::json;
use sqlx::{types::Json, PgPool, Row, SqlitePool};
use std::time::{SystemTime, UNIX_EPOCH};

const KIND_RATE_LIMIT: &str = "rate_limit";

fn artifact_key(tenant_id: &str, kind: &str, key: &str) -> String {
    format!("{tenant_id}:{kind}:{key}")
}

fn current_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

fn current_timestamp_utc() -> DateTime<Utc> {
    DateTime::from_timestamp(
        (current_millis() / 1000) as i64,
        ((current_millis() % 1000) * 1_000_000) as u32,
    )
    .unwrap_or_else(Utc::now)
}

fn millis_to_timestamp(millis: u128) -> DateTime<Utc> {
    let seconds = (millis / 1000) as i64;
    let nanos = ((millis % 1000) * 1_000_000) as u32;
    DateTime::from_timestamp(seconds, nanos).unwrap_or_else(Utc::now)
}

pub async fn check_rate_limit(
    pg: &PgPool,
    tenant_id: &str,
    key: &str,
    max_requests: u32,
    window_seconds: u32,
) -> Result<bool, String> {
    let now = current_millis();
    let window_ms = (window_seconds as u128) * 1000;
    let storage_key = artifact_key(tenant_id, KIND_RATE_LIMIT, key);
    let mut tx = pg
        .begin()
        .await
        .map_err(|error| format!("begin rate limit transaction failed: {error}"))?;

    let row = sqlx::query(
        "SELECT payload_json, expires_at FROM iam_ephemeral_artifact \
         WHERE artifact_key = $1 AND expires_at > $2 \
         FOR UPDATE",
    )
    .bind(&storage_key)
    .bind(current_timestamp_utc())
    .fetch_optional(&mut *tx)
    .await
    .map_err(|error| format!("load rate limit artifact failed: {error}"))?;

    let (count, window_start, expires_at, has_existing_row) = if let Some(row) = row {
        let payload: Json<serde_json::Value> = row.get(0);
        let expires_at: DateTime<Utc> = row.get(1);
        let count = payload.0["count"].as_u64().unwrap_or(0) as u32;
        let window_start = payload.0["windowStartMs"].as_u64().unwrap_or(0) as u128;
        (count, window_start, expires_at, true)
    } else {
        (0, now, millis_to_timestamp(now + window_ms), false)
    };

    let (next_count, next_window_start, next_expires_at) =
        if !has_existing_row || now.saturating_sub(window_start) > window_ms {
            (1u32, now, millis_to_timestamp(now + window_ms))
        } else if count < max_requests {
            (count + 1, window_start, expires_at)
        } else {
            tx.rollback()
                .await
                .map_err(|error| format!("rollback rate limit transaction failed: {error}"))?;
            return Ok(false);
        };

    let payload = json!({
        "count": next_count,
        "windowStartMs": next_window_start,
    });
    let timestamp = current_timestamp_utc();
    sqlx::query(
        "INSERT INTO iam_ephemeral_artifact \
         (artifact_key, tenant_id, artifact_kind, payload_json, expires_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         ON CONFLICT (artifact_key) DO UPDATE SET \
           payload_json = EXCLUDED.payload_json, \
           expires_at = EXCLUDED.expires_at, \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(&storage_key)
    .bind(tenant_id)
    .bind(KIND_RATE_LIMIT)
    .bind(Json(payload))
    .bind(next_expires_at)
    .bind(&timestamp)
    .bind(&timestamp)
    .execute(&mut *tx)
    .await
    .map_err(|error| format!("upsert rate limit artifact failed: {error}"))?;

    tx.commit()
        .await
        .map_err(|error| format!("commit rate limit transaction failed: {error}"))?;
    Ok(true)
}

pub async fn check_rate_limit_sqlite(
    sqlite: &SqlitePool,
    tenant_id: &str,
    key: &str,
    max_requests: u32,
    window_seconds: u32,
) -> Result<bool, String> {
    let now = current_millis();
    let window_ms = (window_seconds as u128) * 1000;
    let storage_key = artifact_key(tenant_id, KIND_RATE_LIMIT, key);
    let mut tx = sqlite
        .begin()
        .await
        .map_err(|error| format!("begin rate limit transaction failed: {error}"))?;

    let row = sqlx::query(
        "SELECT payload_json, expires_at FROM iam_ephemeral_artifact \
         WHERE artifact_key = ? AND expires_at > ?",
    )
    .bind(&storage_key)
    .bind(current_timestamp_utc().to_rfc3339())
    .fetch_optional(&mut *tx)
    .await
    .map_err(|error| format!("load rate limit artifact failed: {error}"))?;

    let (count, window_start, expires_at, has_existing_row) = if let Some(row) = row {
        let payload: String = row.get(0);
        let expires_at: String = row.get(1);
        let payload = serde_json::from_str::<serde_json::Value>(&payload).unwrap_or_default();
        let count = payload["count"].as_u64().unwrap_or(0) as u32;
        let window_start = payload["windowStartMs"].as_u64().unwrap_or(0) as u128;
        let expires_at = DateTime::parse_from_rfc3339(&expires_at)
            .map(|value| value.with_timezone(&Utc))
            .unwrap_or_else(|_| millis_to_timestamp(now + window_ms));
        (count, window_start, expires_at, true)
    } else {
        (0, now, millis_to_timestamp(now + window_ms), false)
    };

    let (next_count, next_window_start, next_expires_at) =
        if !has_existing_row || now.saturating_sub(window_start) > window_ms {
            (1u32, now, millis_to_timestamp(now + window_ms))
        } else if count < max_requests {
            (count + 1, window_start, expires_at)
        } else {
            tx.rollback()
                .await
                .map_err(|error| format!("rollback rate limit transaction failed: {error}"))?;
            return Ok(false);
        };

    let payload = json!({
        "count": next_count,
        "windowStartMs": next_window_start,
    });
    let timestamp = current_timestamp_utc().to_rfc3339();
    let expires_at = next_expires_at.to_rfc3339();
    sqlx::query(
        "INSERT INTO iam_ephemeral_artifact \
         (artifact_key, tenant_id, artifact_kind, payload_json, expires_at, created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, ?, ?) \
         ON CONFLICT (artifact_key) DO UPDATE SET \
           payload_json = excluded.payload_json, \
           expires_at = excluded.expires_at, \
           updated_at = excluded.updated_at",
    )
    .bind(&storage_key)
    .bind(tenant_id)
    .bind(KIND_RATE_LIMIT)
    .bind(payload.to_string())
    .bind(&expires_at)
    .bind(&timestamp)
    .bind(&timestamp)
    .execute(&mut *tx)
    .await
    .map_err(|error| format!("upsert rate limit artifact failed: {error}"))?;

    tx.commit()
        .await
        .map_err(|error| format!("commit rate limit transaction failed: {error}"))?;
    Ok(true)
}
