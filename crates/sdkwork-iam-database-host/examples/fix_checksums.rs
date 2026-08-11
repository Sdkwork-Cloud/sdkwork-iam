#[tokio::main]
async fn main() {
    use sqlx::Row;
    let map: serde_json::Map<String, serde_json::Value> = serde_json::from_str(
        &std::fs::read_to_string("C:/Users/admin/.zcode/tmp/org-id-checksums.json")
            .expect("read checksums json"),
    )
    .expect("parse checksums json");
    let pool = sdkwork_database_sqlx::create_pool_from_env("")
        .await
        .expect("create pool")
        .expect("pool");
    let sdkwork_database_sqlx::DatabasePool::Postgres(pg, _) = &pool else {
        panic!("expected postgres");
    };
    for (key, checksum) in &map {
        let Some((module, version)) = key.split_once('|') else {
            continue;
        };
        let checksum = checksum.as_str().expect("checksum string");
        let before: Option<String> = sqlx::query_scalar(
            "SELECT checksum FROM ops_schema_migration_history \
             WHERE module_id = $1 AND version = $2 AND engine = 'postgres'",
        )
        .bind(module)
        .bind(version)
        .fetch_optional(&*pg)
        .await
        .expect("query checksum");
        let Some(before) = before else {
            println!("{module}/{version}: NOT APPLIED, skipping");
            continue;
        };
        if before == checksum {
            println!("{module}/{version}: already current");
            continue;
        }
        sqlx::query(
            "UPDATE ops_schema_migration_history SET checksum = $3 \
             WHERE module_id = $1 AND version = $2 AND engine = 'postgres'",
        )
        .bind(module)
        .bind(version)
        .bind(checksum)
        .execute(&*pg)
        .await
        .expect("update checksum");
        println!("{module}/{version}: {before:.16}... -> {checksum:.16}...");
    }
}
