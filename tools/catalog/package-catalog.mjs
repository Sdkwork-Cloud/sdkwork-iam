const makePackage = (directory, description, derivedFrom = []) => ({
  directory,
  description,
  derivedFrom,
});

const pcReactIamAppDomain = {
  domain: "iam",
  summary: "App/user IAM login, session, user-center, and shared PC runtime packages.",
  packages: [
    makePackage("sdkwork-iam-pc-core", "PC dependency composition entry and reusable IAM module registry."),
    makePackage("sdkwork-iam-react", "React provider and hooks over the common IAM runtime."),
    makePackage("sdkwork-iam-core-pc-react", "Compatibility aggregation package for common IAM contracts and runtime."),
    makePackage("sdkwork-user-center-core-pc-react", "Server-safe user-center deployment and parity contracts."),
    makePackage("sdkwork-auth-runtime-pc-react", "Canonical auth-runtime composition and governed prefill resolution."),
    makePackage("sdkwork-auth-pc-react", "Authentication flows, OAuth entry points, and token-aware guards."),
    makePackage("sdkwork-user-center-pc-react", "Composable user-center UI surfaces over auth and user packages."),
    makePackage("sdkwork-user-center-validation-pc-react", "Validation, protected-token precedence, and verification contracts."),
    makePackage("sdkwork-user-pc-react", "User center, profile editing, and account preferences."),
  ],
};

const pcReactIamConsoleDomain = {
  domain: "iam-console",
  summary: "PC user-console IAM packages (app-api / app SDK only).",
  packages: [
    makePackage("sdkwork-iam-pc-console-core", "User-console runtime: app SDK inventory and console module registry."),
    makePackage("sdkwork-iam-pc-console-shell", "User-console shell: module menu and route metadata."),
    makePackage("sdkwork-iam-pc-console-tenant", "Tenant-owner self-service console surfaces."),
    makePackage("sdkwork-iam-pc-console-organization", "Tenant-owner organization directory console surfaces."),
    makePackage("sdkwork-iam-pc-console-account-binding", "Tenant-owner account binding self-service console."),
    makePackage("sdkwork-iam-pc-console-user", "Tenant-owner profile and password self-service console."),
  ],
};

const pcReactIamAdminDomain = {
  domain: "iam-admin",
  summary: "PC backend-admin IAM operator packages (backend-api / backend SDK only).",
  packages: [
    makePackage("sdkwork-iam-pc-admin-core", "Backend-admin runtime: backend SDK inventory and admin module registry."),
    makePackage("sdkwork-iam-pc-admin-shell", "Backend-admin shell: module menu and route metadata."),
    makePackage("sdkwork-iam-pc-admin-oauth", "OAuth integration, provider catalog, and authorization-server admin."),
    makePackage("sdkwork-iam-pc-admin-tenant", "Tenant administration surfaces."),
    makePackage("sdkwork-iam-pc-admin-organization", "Organization tree and membership administration."),
    makePackage("sdkwork-iam-pc-admin-permission", "Roles, permissions, policies, and authorization admin."),
    makePackage("sdkwork-iam-pc-admin-account-binding", "Account binding policy admin configuration."),
    makePackage("sdkwork-iam-pc-admin-user", "User directory administration surfaces."),
  ],
};

const commonIamDomain = {
  domain: "iam",
  summary: "Framework-independent IAM contracts, SDK ports, service facade, and runtime bootstrap.",
  packages: [
    makePackage("sdkwork-iam-contracts", "Canonical API, database, SDK, security, and context contracts."),
    makePackage("sdkwork-iam-sdk-ports", "Generated app/backend SDK client ports for IAM calls."),
    makePackage("sdkwork-iam-sdk-adapter", "Adapter boundary for generated app/backend SDK clients."),
    makePackage("sdkwork-iam-service", "Framework-independent IAM service over injected SDK clients."),
    makePackage("sdkwork-iam-application-bootstrap", "IAM application registration and tenant provisioning bootstrap."),
    makePackage("sdkwork-iam-runtime", "Deployment mode, token store, and context propagation runtime."),
    makePackage("sdkwork-iam-rpc-contracts", "Canonical IAM app and backend RPC protobuf contracts."),
  ],
};

const nativeRustIamDomains = [
  {
    domain: "iam",
    summary: "Rust IAM HTTP routes, context, persistence, IMF registry, and host adapters.",
    packages: [
      makePackage("sdkwork-iam-web-adapter", "IAM adapters for sdkwork-web-framework request context pipeline."),
      makePackage("sdkwork-iam-context-service", "Rust IAM domain, AppContext, and dual-token contracts."),
      makePackage("sdkwork-router-iam-app-api", "Rust IAM app-api route contracts and executable router."),
      makePackage("sdkwork-router-iam-backend-api", "Rust IAM backend-api route metadata and router."),
      makePackage("sdkwork-router-iam-open-api", "Rust IAM open-api route metadata and router."),
      makePackage("sdkwork-iam-rpc-rust", "Rust IAM RPC service manifest and adapter foundation."),
      makePackage("sdkwork-iam-directory-repository-sqlx", "Rust IAM SQL directory repository and migration catalog."),
      makePackage("sdkwork-iam-module-registry", "IMF discovery, validation, and materialization."),
      makePackage("sdkwork-iam-bootstrap", "IAM kernel catalog seed bootstrap."),
      makePackage("sdkwork-iam-database-host", "IAM database lifecycle CLI host."),
      makePackage("sdkwork-iam-tauri-host", "Tauri host adapter for IAM local/private deployments."),
      makePackage("sdkwork-user-center-tauri-host", "Tauri host adapter for user-center local/private behavior."),
    ],
  },
];

export const appbaseArchitectureCatalog = [
  {
    architecture: "common",
    packageKind: "typescript",
    appRoot: "apps/sdkwork-iam-common",
    packageLayout: "flat",
    summary: "Framework-independent IAM TypeScript packages.",
    scaffoldPackages: true,
    domains: [commonIamDomain],
  },
  {
    architecture: "native-rust",
    packageKind: "rust",
    summary: "Rust IAM implementation packages with SaaS contract parity.",
    scaffoldPackages: true,
    domains: nativeRustIamDomains,
  },
  {
    architecture: "pc-react",
    packageKind: "typescript",
    appRoot: "apps/sdkwork-iam-pc",
    packageLayout: "flat",
    summary: "PC React IAM UI and user-center packages.",
    scaffoldPackages: true,
    domains: [pcReactIamAppDomain, pcReactIamConsoleDomain, pcReactIamAdminDomain],
  },
];

export const rootPackageDirectoriesToRemove = ["packages/pc-react", "packages/common"];

export function toWorkspacePackageName(directory) {
  return `@sdkwork/${directory.replace(/^sdkwork-/, "")}`;
}

export function toCapabilityName(directory) {
  return directory
    .replace(/^sdkwork-/, "")
    .replace(/-(pc-react|mobile-react|mobile-flutter)$/, "");
}
