use std::path::{Path, PathBuf};
use std::sync::Arc;

use async_trait::async_trait;
use sdkwork_database_config::DatabaseEngine;
use sdkwork_database_spi::traits::DatabaseModuleDescriptorProvider;
use sdkwork_database_spi::{
    DatabaseAssetProvider, DatabaseContractProvider, DatabaseModule, DefaultDatabaseModule,
    DriftPolicyProvider, MigrationProvider, SeedProvider, SpiError,
};
use sdkwork_database_spi::{
    DatabaseModuleDescriptor, DriftPolicy, LocaleTag, MigrationContext, MigrationSpec, SeedContext,
    SeedPlan, SeedProfile,
};
use sdkwork_database_sqlx::create_pool_from_env;

#[derive(Debug, Clone)]
pub struct IamDatabaseModule {
    inner: Arc<DefaultDatabaseModule>,
    app_root: PathBuf,
}

impl IamDatabaseModule {
    pub fn from_app_root(app_root: impl AsRef<Path>) -> Result<Self, SpiError> {
        let app_root = app_root.as_ref().to_path_buf();
        let inner = Arc::new(DefaultDatabaseModule::from_app_root(&app_root)?);
        Ok(Self { inner, app_root })
    }

    pub fn inner(&self) -> &DefaultDatabaseModule {
        &self.inner
    }

    pub fn manifest(&self) -> &sdkwork_database_spi::manifest::DatabaseManifest {
        self.inner.manifest()
    }

    pub fn module_root(&self) -> &Path {
        self.inner.module_root()
    }

    fn should_materialize_iam_catalog(profile: &SeedProfile) -> bool {
        !matches!(profile.0.as_str(), "minimal")
    }
}

impl DatabaseModuleDescriptorProvider for IamDatabaseModule {
    fn descriptor(&self) -> DatabaseModuleDescriptor {
        self.inner.descriptor()
    }
}

#[async_trait]
impl DatabaseAssetProvider for IamDatabaseModule {
    fn module_root(&self) -> &Path {
        self.inner.module_root()
    }

    fn manifest_path(&self) -> PathBuf {
        self.inner.manifest_path()
    }

    fn contract_path(&self) -> PathBuf {
        self.inner.contract_path()
    }

    fn migrations_dir(&self, engine: DatabaseEngine) -> PathBuf {
        self.inner.migrations_dir(engine)
    }

    fn seeds_dir(&self) -> PathBuf {
        self.inner.seeds_dir()
    }

    fn drift_policy_path(&self) -> PathBuf {
        self.inner.drift_policy_path()
    }
}

#[async_trait]
impl DatabaseContractProvider for IamDatabaseModule {
    async fn contract_version(&self) -> Result<String, SpiError> {
        self.inner.contract_version().await
    }
}

#[async_trait]
impl MigrationProvider for IamDatabaseModule {
    async fn list_migrations(
        &self,
        engine: DatabaseEngine,
    ) -> Result<Vec<MigrationSpec>, SpiError> {
        self.inner.list_migrations(engine).await
    }

    async fn before_migration(&self, ctx: &MigrationContext) -> Result<(), SpiError> {
        self.inner.before_migration(ctx).await
    }

    async fn after_migration(&self, ctx: &MigrationContext) -> Result<(), SpiError> {
        self.inner.after_migration(ctx).await
    }
}

#[async_trait]
impl SeedProvider for IamDatabaseModule {
    async fn resolve_seed_plan(
        &self,
        locale: &LocaleTag,
        profile: &SeedProfile,
    ) -> Result<SeedPlan, SpiError> {
        self.inner.resolve_seed_plan(locale, profile).await
    }

    async fn before_seed(&self, ctx: &SeedContext) -> Result<(), SpiError> {
        self.inner.before_seed(ctx).await
    }

    async fn after_seed(&self, ctx: &SeedContext) -> Result<(), SpiError> {
        self.inner.after_seed(ctx).await?;
        if !Self::should_materialize_iam_catalog(&ctx.plan.profile) {
            return Ok(());
        }

        let service_code = self.inner.manifest().service_code.clone();
        let pool = create_pool_from_env(&service_code)
            .await
            .map_err(|error| SpiError::Seed(format!("create database pool failed: {error}")))?
            .ok_or_else(|| {
                SpiError::Seed(format!(
                    "database URL not configured; set SDKWORK_{service_code}_DATABASE_URL"
                ))
            })?;
        let pg = pool.as_postgres().ok_or_else(|| {
            SpiError::Seed("IAM IMF materialization requires a PostgreSQL pool".to_string())
        })?;

        let profile = ctx.plan.profile.0.as_str();
        sdkwork_iam_module_registry::materialize_postgres_catalog(
            pg,
            Some(&self.app_root),
            profile,
        )
        .await
        .map_err(|error| {
            SpiError::Seed(format!("materialize iam module catalog failed: {error}"))
        })?;
        apply_locale_seed_overlays(pg, &self.app_root, &ctx.plan.locale.0, profile).await?;
        match sdkwork_iam_bootstrap::ensure_postgres_bootstrap_admin_user(pg).await {
            Ok(outcome) => tracing::info!(?outcome, "IAM bootstrap admin user seed finished"),
            Err(error) => {
                return Err(SpiError::Seed(format!(
                    "ensure bootstrap admin user failed: {error}"
                )));
            }
        }
        Ok(())
    }
}

async fn apply_locale_seed_overlays(
    pg: &sqlx::PgPool,
    app_root: &Path,
    locale: &str,
    profile: &str,
) -> Result<(), SpiError> {
    let manifest_path = app_root.join("database/seeds/seed.manifest.json");
    let manifest_source = std::fs::read_to_string(&manifest_path).map_err(|error| {
        SpiError::Seed(format!(
            "read seed manifest {:?} failed: {error}",
            manifest_path
        ))
    })?;
    let manifest: serde_json::Value = serde_json::from_str(&manifest_source)
        .map_err(|error| SpiError::Seed(format!("parse seed manifest failed: {error}")))?;
    let Some(scripts) = manifest
        .pointer(&format!("/profiles/{profile}/locales/{locale}"))
        .and_then(|value| value.as_array())
    else {
        return Ok(());
    };

    for script in scripts {
        let Some(relative_path) = script.as_str() else {
            continue;
        };
        let script_path = if relative_path.contains('/') || relative_path.contains('\\') {
            app_root.join("database/seeds").join(relative_path)
        } else {
            app_root
                .join("database/seeds/locales")
                .join(locale)
                .join(relative_path)
        };
        if !script_path.is_file() {
            continue;
        }
        let sql = std::fs::read_to_string(&script_path).map_err(|error| {
            SpiError::Seed(format!(
                "read locale seed {:?} failed: {error}",
                script_path
            ))
        })?;
        for statement in split_sql_statements(&sql) {
            sqlx::query(&statement).execute(pg).await.map_err(|error| {
                SpiError::Seed(format!(
                    "apply locale seed overlay {:?} failed: {error}",
                    script_path
                ))
            })?;
        }
    }
    Ok(())
}

#[async_trait]
impl DriftPolicyProvider for IamDatabaseModule {
    async fn load_policy(&self) -> Result<DriftPolicy, SpiError> {
        self.inner.load_policy().await
    }
}

#[async_trait]
impl DatabaseModule for IamDatabaseModule {}

fn split_sql_statements(script: &str) -> Vec<String> {
    let without_line_comments = script
        .lines()
        .map(|line| line.split("--").next().unwrap_or(line))
        .collect::<Vec<_>>()
        .join("\n");
    without_line_comments
        .split(';')
        .map(str::trim)
        .filter(|part| !part.is_empty())
        .map(|part| format!("{part};"))
        .collect()
}
