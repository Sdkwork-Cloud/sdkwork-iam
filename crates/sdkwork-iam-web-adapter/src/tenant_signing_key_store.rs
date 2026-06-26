use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use async_trait::async_trait;
use sdkwork_database_config::{DatabaseConfig, DatabaseEngine};
use sdkwork_database_sqlx::create_pool_from_config;
use sdkwork_iam_bootstrap::{
    ensure_postgres_tenant_signing_key, ensure_sqlite_tenant_signing_key,
    load_postgres_active_tenant_signing_key, load_sqlite_active_tenant_signing_key,
    resolve_postgres_tenant_signing_key_by_kid, resolve_sqlite_tenant_signing_key_by_kid,
    TenantSigningKeyMaterial,
};
use sqlx::{PgPool, SqlitePool};

pub type TenantSigningKeyFuture<'a, T> =
    Pin<Box<dyn Future<Output = Result<T, String>> + Send + 'a>>;

pub trait TenantSigningKeyStore: Send + Sync {
    fn ensure_active_key<'a>(
        &'a self,
        tenant_id: &str,
    ) -> TenantSigningKeyFuture<'a, TenantSigningKeyMaterial>;

    fn resolve_by_kid<'a>(
        &'a self,
        kid: &str,
    ) -> TenantSigningKeyFuture<'a, Option<TenantSigningKeyMaterial>>;
}

pub struct SqliteTenantSigningKeyStore {
    pool: SqlitePool,
}

impl SqliteTenantSigningKeyStore {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

pub struct PostgresTenantSigningKeyStore {
    pool: PgPool,
}

impl PostgresTenantSigningKeyStore {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl TenantSigningKeyStore for SqliteTenantSigningKeyStore {
    fn ensure_active_key<'a>(
        &'a self,
        tenant_id: &str,
    ) -> TenantSigningKeyFuture<'a, TenantSigningKeyMaterial> {
        let pool = self.pool.clone();
        let tenant_id = tenant_id.to_owned();
        Box::pin(async move { ensure_active_key_sqlite(&pool, &tenant_id).await })
    }

    fn resolve_by_kid<'a>(
        &'a self,
        kid: &str,
    ) -> TenantSigningKeyFuture<'a, Option<TenantSigningKeyMaterial>> {
        let pool = self.pool.clone();
        let kid = kid.to_owned();
        Box::pin(async move { resolve_by_kid_sqlite(&pool, &kid).await })
    }
}

impl TenantSigningKeyStore for PostgresTenantSigningKeyStore {
    fn ensure_active_key<'a>(
        &'a self,
        tenant_id: &str,
    ) -> TenantSigningKeyFuture<'a, TenantSigningKeyMaterial> {
        let pool = self.pool.clone();
        let tenant_id = tenant_id.to_owned();
        Box::pin(async move { ensure_active_key_postgres(&pool, &tenant_id).await })
    }

    fn resolve_by_kid<'a>(
        &'a self,
        kid: &str,
    ) -> TenantSigningKeyFuture<'a, Option<TenantSigningKeyMaterial>> {
        let pool = self.pool.clone();
        let kid = kid.to_owned();
        Box::pin(async move { resolve_by_kid_postgres(&pool, &kid).await })
    }
}

/// Development and test fallback when no SQL-backed tenant signing store is wired.
/// Production runtimes must use [`SqliteTenantSigningKeyStore`] or [`PostgresTenantSigningKeyStore`].
pub struct LegacyGlobalTenantSigningKeyStore {
    signing_secret: Vec<u8>,
}

impl LegacyGlobalTenantSigningKeyStore {
    pub fn from_signing_secret(secret: impl AsRef<[u8]>) -> Self {
        Self {
            signing_secret: secret.as_ref().to_vec(),
        }
    }
}

impl TenantSigningKeyStore for LegacyGlobalTenantSigningKeyStore {
    fn ensure_active_key<'a>(
        &'a self,
        tenant_id: &str,
    ) -> TenantSigningKeyFuture<'a, TenantSigningKeyMaterial> {
        let signing_secret = self.signing_secret.clone();
        let tenant_id = tenant_id.to_owned();
        Box::pin(async move {
            Ok(TenantSigningKeyMaterial {
                tenant_id: tenant_id.clone(),
                kid: format!("legacy-global:{tenant_id}"),
                secret: signing_secret,
            })
        })
    }

    fn resolve_by_kid<'a>(
        &'a self,
        kid: &str,
    ) -> TenantSigningKeyFuture<'a, Option<TenantSigningKeyMaterial>> {
        let signing_secret = self.signing_secret.clone();
        let kid = kid.to_owned();
        Box::pin(async move {
            let tenant_id = kid
                .strip_prefix("legacy-global:")
                .map(str::to_owned)
                .filter(|value| !value.is_empty());
            Ok(tenant_id.map(|tenant_id| TenantSigningKeyMaterial {
                tenant_id,
                kid,
                secret: signing_secret,
            }))
        })
    }
}

/// Resolves tenant-bound signing secrets for token verification by JWT `kid`.
#[async_trait]
pub trait TenantSigningKeyResolver: Send + Sync {
    async fn resolve_signing_secret_by_kid(&self, kid: &str) -> Option<Vec<u8>>;
}

pub struct TenantSigningKeyStoreWebResolver {
    store: Arc<dyn TenantSigningKeyStore + Send + Sync>,
}

impl TenantSigningKeyStoreWebResolver {
    pub fn new(store: Arc<dyn TenantSigningKeyStore + Send + Sync>) -> Self {
        Self { store }
    }
}

#[async_trait]
impl TenantSigningKeyResolver for TenantSigningKeyStoreWebResolver {
    async fn resolve_signing_secret_by_kid(&self, kid: &str) -> Option<Vec<u8>> {
        self.store
            .resolve_by_kid(kid)
            .await
            .ok()
            .flatten()
            .map(|signing_key| signing_key.secret)
    }
}

pub async fn tenant_signing_key_store_for_database_config(
    config: &DatabaseConfig,
) -> Result<Arc<dyn TenantSigningKeyStore + Send + Sync>, String> {
    let pool = create_pool_from_config(config.clone())
        .await
        .map_err(|error| error.to_string())?;
    match config.engine {
        DatabaseEngine::Sqlite => {
            let sqlite = pool
                .as_sqlite()
                .cloned()
                .ok_or_else(|| "expected sqlite database pool".to_owned())?;
            Ok(Arc::new(SqliteTenantSigningKeyStore::new(sqlite)))
        }
        DatabaseEngine::Postgres => {
            let postgres = pool
                .as_postgres()
                .cloned()
                .ok_or_else(|| "expected postgres database pool".to_owned())?;
            Ok(Arc::new(PostgresTenantSigningKeyStore::new(postgres)))
        }
    }
}

async fn ensure_active_key_sqlite(
    pool: &SqlitePool,
    tenant_id: &str,
) -> Result<TenantSigningKeyMaterial, String> {
    ensure_sqlite_tenant_signing_key(pool, tenant_id)
        .await
        .map_err(|error| format!("failed to ensure tenant signing key: {error}"))?;
    load_active_key_sqlite(pool, tenant_id)
        .await?
        .ok_or_else(|| "tenant signing key not found after ensure".to_owned())
}

async fn ensure_active_key_postgres(
    pool: &PgPool,
    tenant_id: &str,
) -> Result<TenantSigningKeyMaterial, String> {
    ensure_postgres_tenant_signing_key(pool, tenant_id)
        .await
        .map_err(|error| format!("failed to ensure tenant signing key: {error}"))?;
    load_active_key_postgres(pool, tenant_id)
        .await?
        .ok_or_else(|| "tenant signing key not found after ensure".to_owned())
}

async fn load_active_key_sqlite(
    pool: &SqlitePool,
    tenant_id: &str,
) -> Result<Option<TenantSigningKeyMaterial>, String> {
    load_sqlite_active_tenant_signing_key(pool, tenant_id)
        .await
        .map_err(|error| format!("failed to load tenant signing key: {error}"))
}

async fn load_active_key_postgres(
    pool: &PgPool,
    tenant_id: &str,
) -> Result<Option<TenantSigningKeyMaterial>, String> {
    load_postgres_active_tenant_signing_key(pool, tenant_id)
        .await
        .map_err(|error| format!("failed to load tenant signing key: {error}"))
}

async fn resolve_by_kid_sqlite(
    pool: &SqlitePool,
    kid: &str,
) -> Result<Option<TenantSigningKeyMaterial>, String> {
    resolve_sqlite_tenant_signing_key_by_kid(pool, kid)
        .await
        .map_err(|error| format!("failed to resolve tenant signing key: {error}"))
}

async fn resolve_by_kid_postgres(
    pool: &PgPool,
    kid: &str,
) -> Result<Option<TenantSigningKeyMaterial>, String> {
    resolve_postgres_tenant_signing_key_by_kid(pool, kid)
        .await
        .map_err(|error| format!("failed to resolve tenant signing key: {error}"))
}
