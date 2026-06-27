use std::path::Path;

use sdkwork_iam_bootstrap::{DEFAULT_IAM_ORGANIZATION_ID, DEFAULT_IAM_TENANT_ID};
use sdkwork_iam_web_adapter::{tenant_application_instance_key, EnsureTenantApplicationCommand};
use serde::Deserialize;

use crate::EmbeddedApplicationBootstrapOptions;
use crate::EmbeddedApplicationRuntimeBinding;

const DEFAULT_OWNER_TENANT_ID: &str = "0";
const DEFAULT_PRIMARY_DOMAIN: &str = "localhost";
const DEFAULT_CHANNEL: &str = "stable";

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SdkworkAppManifest {
    pub app: ManifestAppSection,
    #[serde(default)]
    pub backend: ManifestBackendSection,
    #[serde(default)]
    pub release: ManifestReleaseSection,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestAppSection {
    pub key: String,
    pub name: String,
    #[serde(default)]
    pub display_name: Option<String>,
    #[serde(default)]
    pub app_type: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestBackendSection {
    #[serde(default)]
    pub app_id: Option<String>,
    #[serde(default)]
    pub tenant_id: Option<String>,
    #[serde(default)]
    pub organization_id: Option<String>,
    #[serde(default)]
    pub primary_domain: Option<String>,
    #[serde(default)]
    pub domain: Option<String>,
    #[serde(default)]
    pub access_token_permission_scope: Option<Vec<String>>,
    #[serde(default)]
    pub permission_scope: Option<Vec<String>>,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct ManifestReleaseSection {
    #[serde(default)]
    pub notes: Vec<ManifestReleaseNote>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestReleaseNote {
    #[serde(default)]
    pub current: bool,
    #[serde(default)]
    pub version: Option<String>,
    #[serde(default)]
    pub channel: Option<String>,
}

pub fn load_manifest_from_app_root(app_root: &Path) -> Result<SdkworkAppManifest, String> {
    let manifest_path = app_root.join("sdkwork.app.config.json");
    load_manifest_from_path(&manifest_path)
}

pub fn load_manifest_from_path(manifest_path: &Path) -> Result<SdkworkAppManifest, String> {
    let raw = std::fs::read_to_string(manifest_path).map_err(|error| {
        format!(
            "read application manifest {} failed: {error}",
            manifest_path.display()
        )
    })?;
    serde_json::from_str(&raw).map_err(|error| {
        format!(
            "parse application manifest {} failed: {error}",
            manifest_path.display()
        )
    })
}

pub fn validate_manifest_for_embedded_bootstrap(
    manifest: &SdkworkAppManifest,
) -> Result<(), String> {
    if manifest.app.key.trim().is_empty() {
        return Err("app.key must be configured in sdkwork.app.config.json".to_string());
    }
    if manifest.app.name.trim().is_empty() {
        return Err("app.name must be configured in sdkwork.app.config.json".to_string());
    }
    let app_type = manifest
        .app
        .app_type
        .as_deref()
        .unwrap_or("")
        .trim()
        .to_owned();
    if app_type.is_empty() {
        return Err("app.appType must be configured in sdkwork.app.config.json".to_string());
    }
    let permissions = default_access_permissions(manifest);
    if permissions.is_empty() {
        return Err(
            "backend.accessTokenPermissionScope must be configured in sdkwork.app.config.json"
                .to_string(),
        );
    }
    Ok(())
}

pub fn manifest_to_ensure_commands(
    manifest: &SdkworkAppManifest,
    options: &EmbeddedApplicationBootstrapOptions,
    primary_runtime: Option<&EmbeddedApplicationRuntimeBinding>,
    additional_runtimes: &[EmbeddedApplicationRuntimeBinding],
) -> Result<Vec<EnsureTenantApplicationCommand>, String> {
    validate_manifest_for_embedded_bootstrap(manifest)?;

    if primary_runtime.is_some() || !additional_runtimes.is_empty() {
        let mut commands = Vec::new();
        if let Some(binding) = primary_runtime {
            commands.push(manifest_to_ensure_command(
                manifest,
                options,
                Some(binding),
            )?);
        }
        for binding in additional_runtimes {
            commands.push(manifest_to_ensure_command(
                manifest,
                options,
                Some(binding),
            )?);
        }
        return Ok(commands);
    }

    Ok(vec![manifest_to_ensure_command(manifest, options, None)?])
}

pub fn manifest_to_ensure_command(
    manifest: &SdkworkAppManifest,
    options: &EmbeddedApplicationBootstrapOptions,
    binding: Option<&EmbeddedApplicationRuntimeBinding>,
) -> Result<EnsureTenantApplicationCommand, String> {
    validate_manifest_for_embedded_bootstrap(manifest)?;

    let app_key = binding
        .and_then(|value| value.app_key_override.as_deref())
        .unwrap_or(manifest.app.key.as_str())
        .trim()
        .to_owned();
    let runtime_app_id = binding
        .map(|value| value.runtime_app_id.as_str())
        .or_else(|| backend_runtime_app_id(manifest))
        .unwrap_or(app_key.as_str())
        .trim()
        .to_owned();
    if runtime_app_id.is_empty() {
        return Err("runtime appId must be resolved from manifest or runtime binding".to_string());
    }

    let display_name = binding
        .and_then(|value| value.display_name.as_deref())
        .or(manifest.app.display_name.as_deref())
        .unwrap_or(manifest.app.name.as_str())
        .trim()
        .to_owned();
    let app_type = manifest
        .app
        .app_type
        .as_deref()
        .unwrap_or("APP_HTML")
        .trim()
        .to_owned();
    let (version, channel) = manifest_release_identity(manifest, options);
    let environment = normalize_bootstrap_environment(&options.environment);
    let instance_key = binding
        .and_then(|value| value.instance_key_override.as_deref())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
        .unwrap_or_else(|| tenant_application_instance_key(&runtime_app_id, &options.environment));
    let primary_domain = options
        .primary_domain_override
        .as_deref()
        .or(manifest.backend.primary_domain.as_deref())
        .or(manifest.backend.domain.as_deref())
        .unwrap_or(DEFAULT_PRIMARY_DOMAIN)
        .trim()
        .to_owned();

    Ok(EnsureTenantApplicationCommand {
        owner_tenant_id: DEFAULT_OWNER_TENANT_ID.to_owned(),
        app_key,
        name: manifest.app.name.trim().to_owned(),
        display_name,
        app_type,
        version,
        channel,
        default_access_permissions: default_access_permissions(manifest),
        tenant_id: manifest
            .backend
            .tenant_id
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or(DEFAULT_IAM_TENANT_ID)
            .to_owned(),
        organization_id: manifest
            .backend
            .organization_id
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or(DEFAULT_IAM_ORGANIZATION_ID)
            .to_owned(),
        instance_key,
        environment,
        primary_domain,
        runtime_app_id,
    })
}

fn backend_runtime_app_id(manifest: &SdkworkAppManifest) -> Option<&str> {
    manifest
        .backend
        .app_id
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
}

fn default_access_permissions(manifest: &SdkworkAppManifest) -> Vec<String> {
    manifest
        .backend
        .access_token_permission_scope
        .clone()
        .or_else(|| manifest.backend.permission_scope.clone())
        .unwrap_or_default()
        .into_iter()
        .map(|permission| permission.trim().to_owned())
        .filter(|permission| !permission.is_empty())
        .collect()
}

fn manifest_release_identity(
    manifest: &SdkworkAppManifest,
    options: &EmbeddedApplicationBootstrapOptions,
) -> (String, String) {
    if let Some(version) = options.version_override.as_deref().map(str::trim) {
        if !version.is_empty() {
            return (version.to_owned(), DEFAULT_CHANNEL.to_owned());
        }
    }

    let note = manifest
        .release
        .notes
        .iter()
        .find(|note| note.current)
        .or_else(|| manifest.release.notes.first());

    let version = note
        .and_then(|value| value.version.as_deref())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("0.0.0")
        .to_owned();
    let channel = note
        .and_then(|value| value.channel.as_deref())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(DEFAULT_CHANNEL)
        .to_owned();
    (version, channel)
}

pub fn normalize_bootstrap_environment(environment: &str) -> String {
    if environment.eq_ignore_ascii_case("development") || environment.eq_ignore_ascii_case("dev") {
        "dev".to_owned()
    } else if environment.eq_ignore_ascii_case("production")
        || environment.eq_ignore_ascii_case("prod")
    {
        "prod".to_owned()
    } else {
        environment.trim().to_owned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn manifest_mapping_uses_runtime_app_id_for_instance_key() {
        let manifest = SdkworkAppManifest {
            app: ManifestAppSection {
                key: "chat".to_owned(),
                name: "chat".to_owned(),
                display_name: Some("Sdkwork IM".to_owned()),
                app_type: Some("APP_HTML".to_owned()),
            },
            backend: ManifestBackendSection {
                tenant_id: Some("100001".to_owned()),
                organization_id: Some("0".to_owned()),
                access_token_permission_scope: Some(vec!["iam.self".to_owned()]),
                ..ManifestBackendSection::default()
            },
            release: ManifestReleaseSection::default(),
        };
        let command = manifest_to_ensure_command(
            &manifest,
            &EmbeddedApplicationBootstrapOptions {
                environment: "development".to_owned(),
                ..EmbeddedApplicationBootstrapOptions::default()
            },
            Some(&EmbeddedApplicationRuntimeBinding {
                runtime_app_id: "sdkwork-im-pc".to_owned(),
                display_name: None,
                app_key_override: None,
                instance_key_override: None,
            }),
        )
        .expect("command");

        assert_eq!("chat", command.app_key);
        assert_eq!("sdkwork-im-pc", command.runtime_app_id);
        assert_eq!("sdkwork_im_pc_dev", command.instance_key);
    }

    #[test]
    fn manifest_mapping_defaults_runtime_app_id_to_app_key() {
        let manifest = SdkworkAppManifest {
            app: ManifestAppSection {
                key: "sdkwork-clawrouter".to_owned(),
                name: "SDKWork Claw Router".to_owned(),
                display_name: None,
                app_type: Some("APP_HTML".to_owned()),
            },
            backend: ManifestBackendSection {
                access_token_permission_scope: Some(vec!["iam.self".to_owned()]),
                ..ManifestBackendSection::default()
            },
            release: ManifestReleaseSection::default(),
        };
        let command = manifest_to_ensure_command(
            &manifest,
            &EmbeddedApplicationBootstrapOptions {
                environment: "production".to_owned(),
                ..EmbeddedApplicationBootstrapOptions::default()
            },
            None,
        )
        .expect("command");

        assert_eq!("sdkwork-clawrouter", command.runtime_app_id);
        assert_eq!("sdkwork_clawrouter_prod", command.instance_key);
    }
}
