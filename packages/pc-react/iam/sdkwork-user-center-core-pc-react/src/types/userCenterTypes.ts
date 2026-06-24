export type UserCenterMode = "local-native" | "app-api-hub" | "external-hub";
export type UserCenterProviderKind =
  | "header"
  | "builtin-local"
  | "sdkwork-cloud-app-api"
  | "external-user-center";

export type UserCenterIntegrationKind =
  | "builtin-local"
  | "sdkwork-cloud-app-api"
  | "external-user-center";
export type UserCenterSessionTransport = "header";
export type UserCenterUserSystemScope = "application";
export type UserCenterAuthMode =
  | "dual-token"
  | "upstream-app-api-token-bridge"
  | "upstream-external-token-bridge";
export type UserCenterAuthValidationStrategy = "dual-token";
export type UserCenterHandshakeMode = "disabled" | "provider-shared-secret";
export type UserCenterSecretResolverKind =
  | "local-static"
  | "upstream-secret-bridge"
  | "external-secret-bridge";
export type UserCenterSecretResolutionScope = "organization-preferred";
export type UserCenterStandardEntityName =
  | "IamUser"
  | "IamTenant"
  | "IamOrganizationMembership"
  | "IamDepartmentAssignment"
  | "IamPositionAssignment"
  | "IamRoleBinding";

export interface UserCenterProviderConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  kind: UserCenterProviderKind;
  providerKey: string;
}

export interface UserCenterRoutes {
  authBasePath: string;
  userRoutePath: string;
}

export interface UserCenterStoragePlan {
  accessTokenKey: string;
  authTokenKey: string;
  preferencesKey: string;
  profileKey: string;
  refreshTokenKey: string;
  runtimeStateKey: string;
  sessionHeaderName: string;
  sessionTokenKey: string;
  storageScope: string;
  tokenTypeKey: string;
}

export interface UserCenterLocalApiRoutes {
  authConfig: string;
  authEmailLogin: string;
  authLogin: string;
  authLogout: string;
  authLoginContextSelection: string;
  authOrganizationSelection: string;
  authOAuthLogin: string;
  authOAuthUrl: string;
  authPasswordReset: string;
  authPasswordResetRequest: string;
  authPhoneLogin: string;
  authQrCallbackPattern: string;
  authQrConfirm: string;
  authQrEntryPattern: string;
  authQrGenerate: string;
  authQrStatusPattern: string;
  authRefresh: string;
  authRegister: string;
  authSession: string;
  authSessionExchange: string;
  health: string;
  preferences: string;
  profile: string;
  sessionBootstrap: string;
  sessionLogin: string;
  sessionLoginContextSelection: string;
  sessionLogout: string;
  sessionOrganizationSelection: string;
  sessionRefresh: string;
  tenant: string;
  tenantRoot: string;
  userProfile: string;
  userSettings: string;
}

export interface UserCenterSqliteStorageConfig {
  dialect: "sqlite";
  sqlitePath: string;
}

export interface UserCenterPostgresqlStorageConfig {
  dialect: "postgresql";
  postgresUrl: string;
  schema?: string;
}

export type UserCenterStorageConfig =
  | UserCenterPostgresqlStorageConfig
  | UserCenterSqliteStorageConfig;

export interface UserCenterStorageEntityBindingInput {
  primaryKeyColumnName?: string;
  standardEntityName: UserCenterStandardEntityName;
  tableName?: string;
}

export interface UserCenterStorageEntityBinding {
  primaryKeyColumnName: string;
  standardEntityName: UserCenterStandardEntityName;
  tableName: string;
}

export interface UserCenterStorageTopologyInput {
  databaseKey?: string;
  entityBindings?: UserCenterStorageEntityBindingInput[];
  migrationNamespace?: string;
  schemaName?: string;
  tablePrefix?: string;
}

export interface UserCenterStorageTopology {
  databaseKey: string;
  entityBindings: UserCenterStorageEntityBinding[];
  migrationNamespace: string;
  schemaName?: string;
  tablePrefix: string;
}

export interface UserCenterTokenHeaders {
  accessTokenHeaderName: string;
  authorizationHeaderName: string;
  authorizationScheme: string;
  refreshTokenHeaderName: string;
  sessionHeaderName: string;
}

export interface UserCenterHandshakeSignature {
  secretId: string;
  signature: string;
  signedAt: string;
}

export interface UserCenterHandshakeRequestHeaders {
  appId: string;
  handshakeMode: UserCenterHandshakeMode;
  providerKey: string;
  secretId: string;
  signature: string;
  signedAt: string;
}

export type UserCenterHeaderValue =
  | boolean
  | number
  | string
  | null
  | undefined
  | readonly string[];

export type UserCenterHeaderSource =
  | Record<string, UserCenterHeaderValue>
  | {
      get(name: string): string | null | undefined;
    };

export type UserCenterClockInput = Date | number | string;

export interface UserCenterHandshakeVerificationContextInput {
  config: Pick<UserCenterRuntimeConfig | UserCenterBridgeConfig, "auth">;
  headers: UserCenterHeaderSource;
  maxSignedAtAgeMs?: number;
  method: UserCenterRuntimeRequestMethod;
  now?: UserCenterClockInput;
  path: string;
}

export interface UserCenterHandshakeVerificationContext {
  ageMs: number;
  handshake: UserCenterHandshakeRequestHeaders;
  signedAtEpochMs: number;
  signingMessage: string;
}

export interface UserCenterHandshakeHeaderNames {
  appIdHeaderName: string;
  providerKeyHeaderName: string;
  secretIdHeaderName: string;
  signatureHeaderName: string;
  signedAtHeaderName: string;
}

export interface UserCenterAuthCachePolicyInput {
  bundleMemoryCache?: boolean;
  secretResolutionTtlMs?: number;
  unverifiedClaimsTtlMs?: number;
  verifiedTokenTtlMs?: number;
}

export interface UserCenterAuthCachePolicy {
  bundleMemoryCache: boolean;
  secretResolutionTtlMs: number;
  unverifiedClaimsTtlMs: number;
  verifiedTokenTtlMs: number;
}

export interface UserCenterSecretResolutionInput {
  organizationClaimKey?: string;
  resolverKind?: UserCenterSecretResolverKind;
  scope?: UserCenterSecretResolutionScope;
  tenantClaimKey?: string;
}

export interface UserCenterSecretResolution {
  organizationClaimKey: string;
  resolverKind: UserCenterSecretResolverKind;
  scope: UserCenterSecretResolutionScope;
  tenantClaimKey: string;
}

export interface UserCenterAuthHandshakeInput {
  enabled?: boolean;
  freshnessWindowMs?: number;
  headerNames?: Partial<UserCenterHandshakeHeaderNames>;
  mode?: UserCenterHandshakeMode;
  staticHeaders?: Record<string, string>;
}

export interface UserCenterAuthHandshake {
  enabled: boolean;
  freshnessWindowMs: number;
  headerNames: UserCenterHandshakeHeaderNames;
  mode: UserCenterHandshakeMode;
  staticHeaders: Record<string, string>;
}

export interface UserCenterAuthProfileInput {
  cachePolicy?: UserCenterAuthCachePolicyInput;
  handshake?: UserCenterAuthHandshakeInput;
  mode?: UserCenterAuthMode;
  secretResolution?: UserCenterSecretResolutionInput;
  tokenHeaders?: Partial<UserCenterTokenHeaders>;
  validationStrategy?: UserCenterAuthValidationStrategy;
}

export interface UserCenterAuthProfile {
  cachePolicy: UserCenterAuthCachePolicy;
  handshake: UserCenterAuthHandshake;
  mode: UserCenterAuthMode;
  secretResolution: UserCenterSecretResolution;
  tokenHeaders: UserCenterTokenHeaders;
  validationStrategy: UserCenterAuthValidationStrategy;
}

export interface UserCenterAuthInteropContract {
  authMode: UserCenterAuthMode;
  handshake: Pick<
    UserCenterAuthHandshake,
    "enabled" | "freshnessWindowMs" | "headerNames" | "mode"
  >;
  secretResolution: UserCenterSecretResolution;
  tokenHeaders: UserCenterTokenHeaders;
  validationStrategy: UserCenterAuthValidationStrategy;
}

export interface UserCenterAuthInteropMismatch {
  actual: string | boolean | number;
  expected: string | boolean | number;
  fieldPath: string;
}

export interface UserCenterAuthInteropDiff {
  compatible: boolean;
  mismatches: UserCenterAuthInteropMismatch[];
}

export interface UserCenterAuthPreflightReport {
  compatible: boolean;
  diff: UserCenterAuthInteropDiff;
  localContract: UserCenterAuthInteropContract;
  peerContract: UserCenterAuthInteropContract;
}

export interface UserCenterBuiltinLocalIntegrationProfile {
  authMode: UserCenterAuthMode;
  enabled: boolean;
  handshakeEnabled: boolean;
  kind: "builtin-local";
  localApiBasePath: string;
  secretResolverKind: UserCenterSecretResolverKind;
  sessionTransport: UserCenterSessionTransport;
  userSystemScope: UserCenterUserSystemScope;
  validationStrategy: UserCenterAuthValidationStrategy;
}

export interface UserCenterExternalAppApiIntegrationProfile {
  authMode: UserCenterAuthMode;
  enabled: boolean;
  handshakeEnabled: boolean;
  kind: "sdkwork-cloud-app-api";
  providerKey: string;
  secretResolverKind: UserCenterSecretResolverKind;
  sessionTransport: UserCenterSessionTransport;
  upstreamBaseUrl?: string;
  validationStrategy: UserCenterAuthValidationStrategy;
}

export interface UserCenterExternalUserCenterIntegrationProfile {
  authMode: UserCenterAuthMode;
  enabled: boolean;
  handshakeEnabled: boolean;
  kind: "external-user-center";
  providerKey: string;
  secretResolverKind: UserCenterSecretResolverKind;
  sessionTransport: UserCenterSessionTransport;
  upstreamBaseUrl?: string;
  validationStrategy: UserCenterAuthValidationStrategy;
}

export interface UserCenterIntegrationProfileSet {
  activeKind: UserCenterIntegrationKind;
  builtinLocal: UserCenterBuiltinLocalIntegrationProfile;
  externalAppApi: UserCenterExternalAppApiIntegrationProfile;
  externalUserCenter?: UserCenterExternalUserCenterIntegrationProfile;
}

export interface UserCenterRuntimeConfigInput {
  auth?: UserCenterAuthProfileInput;
  localApiBasePath?: string;
  mode?: UserCenterMode;
  namespace: string;
  provider?: Partial<UserCenterProviderConfig> & Pick<UserCenterProviderConfig, "kind">;
  routes?: Partial<UserCenterRoutes>;
  storage: UserCenterStorageConfig;
  storageTopology?: UserCenterStorageTopologyInput;
}

export interface UserCenterBridgeConfigInput {
  auth?: UserCenterAuthProfileInput;
  localApiBasePath?: string;
  mode?: UserCenterMode;
  namespace: string;
  provider?: Partial<UserCenterProviderConfig> & Pick<UserCenterProviderConfig, "kind">;
  routes?: Partial<UserCenterRoutes>;
  storageTopology?: UserCenterStorageTopologyInput;
}

export interface UserCenterRuntimeConfig {
  auth: UserCenterAuthProfile;
  capability: "user-center";
  integration: UserCenterIntegrationProfileSet;
  localApi: UserCenterLocalApiRoutes;
  mode: UserCenterMode;
  namespace: string;
  provider: UserCenterProviderConfig;
  routes: UserCenterRoutes;
  schemaVersion: number;
  storage: UserCenterStorageConfig;
  storageTopology: UserCenterStorageTopology;
  storagePlan: UserCenterStoragePlan;
}

export interface UserCenterBridgeConfig {
  auth: UserCenterAuthProfile;
  capability: "user-center";
  integration: UserCenterIntegrationProfileSet;
  localApi: UserCenterLocalApiRoutes;
  mode: UserCenterMode;
  namespace: string;
  provider: UserCenterProviderConfig;
  routes: UserCenterRoutes;
  schemaVersion: number;
  sourcePackageName: "@sdkwork/user-center-core-pc-react";
  standardEntities: readonly UserCenterStandardEntityName[];
  storagePlan: UserCenterStoragePlan;
  storageTopology: UserCenterStorageTopology;
}

export interface StandardUserCenterUserRecord {
  bio?: string;
  displayName?: string;
  email?: string;
  metadata?: Record<string, unknown>;
  nickname?: string;
  roles?: string[];
  status?: string;
  type?: string;
  userId?: string;
  username?: string;
}

export interface StandardUserCenterTenantRecord {
  bizType?: string;
  code?: string;
  name?: string;
  status?: string;
  type?: string;
}

export interface StandardUserCenterOrganizationRelationRecord {
  isActive?: boolean;
  isPrimary?: boolean;
  targetId?: string;
  type?: "DEPARTMENT" | "POSITION" | "ROLE";
}

export interface StandardUserCenterOrganizationMembershipRecord {
  isActive?: boolean;
  membershipRelations?: StandardUserCenterOrganizationRelationRecord[];
  owner?: string;
  ownerId?: string;
  userId?: string;
}

export interface StandardUserCenterSnapshotInput {
  organizationMembership?: StandardUserCenterOrganizationMembershipRecord;
  tenant?: StandardUserCenterTenantRecord;
  user?: StandardUserCenterUserRecord;
}

export interface CanonicalUserCenterUserSnapshot {
  bio?: string;
  displayName: string;
  email?: string;
  id: string;
  metadata: Record<string, unknown>;
  roleIds: string[];
  status?: string;
  type?: string;
  username?: string;
}

export interface CanonicalUserCenterTenantSnapshot {
  bizType?: string;
  code?: string;
  name?: string;
  status?: string;
  type?: string;
}

export interface CanonicalUserCenterOrganizationSnapshot {
  departmentIds: string[];
  isActive: boolean;
  owner?: string;
  ownerId?: string;
  positionIds: string[];
  roleIds: string[];
  userId?: string;
}

export interface CanonicalUserCenterSnapshot {
  organization: CanonicalUserCenterOrganizationSnapshot;
  tenant: CanonicalUserCenterTenantSnapshot;
  user: CanonicalUserCenterUserSnapshot;
}

export type UserCenterPluginCapabilityName = "auth" | "user";
export type UserCenterDeploymentProfileKind =
  | "builtin-local"
  | "sdkwork-cloud-app-api"
  | "external-user-center";
export type UserCenterDeploymentVariableTarget =
  | "application-runtime"
  | "local-authority"
  | "upstream-bridge"
  | "external-authority-bridge";

export interface UserCenterDeploymentVariable {
  canonicalName: string;
  defaultValue?: string;
  description: string;
  exampleValue?: string;
  required: boolean;
  secret?: boolean;
  targets: UserCenterDeploymentVariableTarget[];
}

export interface UserCenterDeploymentEnvironmentVariable {
  canonicalName?: string;
  defaultValue?: string;
  description: string;
  envName: string;
  exampleValue?: string;
  required: boolean;
  secret?: boolean;
}

export interface UserCenterDeploymentEnvTemplateOptions {
  headerComment?: string;
  optionalPlaceholder?: string;
  optionalSecretPlaceholder?: string;
  requiredPlaceholder?: string;
  requiredSecretPlaceholder?: string;
}

export type UserCenterDeploymentArtifactAudience =
  | "application-runtime"
  | "gateway-runtime"
  | "service-runtime";

export type UserCenterDeploymentArtifactFormat = "dotenv";

export interface UserCenterDeploymentArtifact {
  audience: UserCenterDeploymentArtifactAudience;
  content: string;
  fileName: string;
  format: UserCenterDeploymentArtifactFormat;
  purpose: string;
  variables: UserCenterDeploymentEnvironmentVariable[];
}

export interface UserCenterDeploymentEnvArtifactOptions
  extends UserCenterDeploymentEnvTemplateOptions {
  audience: UserCenterDeploymentArtifactAudience;
  fileName: string;
  purpose: string;
  variables: readonly UserCenterDeploymentEnvironmentVariable[];
}

export interface UserCenterRuntimeBindingOptions {
  env?: Record<string, unknown>;
  envPrefix: string;
  window?: Record<string, unknown>;
  windowPrefix?: string;
}

export interface UserCenterDeploymentHandshakeContract {
  appId?: string;
  enabled: boolean;
  freshnessWindowMs: number;
  headerNames: UserCenterHandshakeHeaderNames & {
    handshakeModeHeaderName: string;
  };
  mode: UserCenterHandshakeMode;
  providerKey: string;
}

export interface UserCenterDeploymentProfile {
  authMode: UserCenterAuthMode;
  enabled: boolean;
  handshake: UserCenterDeploymentHandshakeContract;
  kind: UserCenterDeploymentProfileKind;
  localApiBasePath: string;
  providerKey: string;
  providerKind: UserCenterProviderKind;
  secretResolverKind: UserCenterSecretResolverKind;
  sessionTransport: UserCenterSessionTransport;
  storageTopology: UserCenterStorageTopology;
  validationStrategy: UserCenterAuthValidationStrategy;
  variables: UserCenterDeploymentVariable[];
}

export interface UserCenterDeploymentProfileSet {
  activeKind: UserCenterIntegrationKind;
  builtinLocal: UserCenterDeploymentProfile;
  externalAppApi: UserCenterDeploymentProfile;
  externalUserCenter?: UserCenterDeploymentProfile;
}

export type IdentityDeploymentSurface = "desktop" | "server" | "web";
export type IdentityDeploymentMode = "desktop-local" | "server-private" | "cloud-saas";
export type IdentityAuthorityKind = "embedded" | "dedicated-server" | "upstream";
export type IdentityTransportKind = "local-api" | "same-origin-http" | "remote-http";
export type IdentityStorageKind = "sqlite" | "postgresql" | "upstream-managed";

export interface IdentityDeploymentProfile {
  authorityKind: IdentityAuthorityKind;
  bootstrapEnabled: boolean;
  developmentPrefillEnabled: boolean;
  identityMode: IdentityDeploymentMode;
  providerKind: UserCenterDeploymentProfileKind;
  storageKind: IdentityStorageKind;
  surface: IdentityDeploymentSurface;
  transportKind: IdentityTransportKind;
}

export interface CreateIdentityDeploymentProfileOptions {
  profile: UserCenterDeploymentProfile;
  surface: IdentityDeploymentSurface;
}

export interface UserCenterDeploymentEnvArtifactForProfileOptions
  extends UserCenterDeploymentEnvTemplateOptions {
  audience: UserCenterDeploymentArtifactAudience;
  envPrefix: string;
  fileName: string;
  profile: UserCenterDeploymentProfile;
  purpose: string;
  targets:
    | UserCenterDeploymentVariableTarget
    | readonly UserCenterDeploymentVariableTarget[];
}

export type UserCenterCommandSurface = IdentityDeploymentSurface;
export type UserCenterCommandMode = "cloud" | "external" | "local" | "private";
export type UserCenterCommandLifecycle =
  | "build"
  | "dev"
  | "doctor"
  | "env"
  | "package"
  | "smoke";

export interface UserCenterCommandMatrixEntry {
  command: string;
  iamMode: IdentityDeploymentMode;
  lifecycle: UserCenterCommandLifecycle;
  mode: UserCenterCommandMode;
  providerKind: UserCenterDeploymentProfileKind;
  surface: UserCenterCommandSurface;
}

export type UserCenterSeedStorageDomain = "postgresql" | "sqlite" | "upstream-bridge";

export interface UserCenterSeedContractField {
  name: string;
  required: boolean;
  secret?: boolean;
}

export interface UserCenterSeedContract {
  description: string;
  domains: UserCenterSeedStorageDomain[];
  exportable: boolean;
  fields: UserCenterSeedContractField[];
  idempotent: boolean;
  inspectable: boolean;
  replaySafe: boolean;
}

export interface UserCenterSeedContractCatalog {
  authority: UserCenterSeedContract;
  authDevelopment: UserCenterSeedContract;
  catalog: UserCenterSeedContract;
  workspace: UserCenterSeedContract;
}

export interface UserCenterPluginDefinitionOptions extends UserCenterBridgeConfigInput {
  capabilities?: readonly UserCenterPluginCapabilityName[];
  host?: "browser" | "server" | "tauri";
  packageNames?: string[];
  theme?: string;
  title?: string;
}

export interface UserCenterWorkspaceManifestBase {
  description?: string;
  host?: "browser" | "server" | "tauri";
  id: string;
  packageNames: string[];
  theme?: string;
  title: string;
}

export interface UserCenterAuthWorkspaceManifest extends UserCenterWorkspaceManifestBase {
  capability: "auth";
  forgotPasswordRoutePath?: string;
  loginRoutePath: string;
  oauthCallbackRoutePattern?: string;
  qrRoutePath?: string;
  registerRoutePath?: string;
}

export interface UserCenterUserWorkspaceManifest extends UserCenterWorkspaceManifestBase {
  capability: "user";
  routePath: string;
  sectionRoutePattern: string;
}

export interface UserCenterPluginDefinition {
  auth: UserCenterBridgeConfig["auth"];
  capability: "user-center";
  capabilities: UserCenterPluginCapabilityName[];
  bridgeConfig: UserCenterBridgeConfig;
  deployment: UserCenterDeploymentProfileSet;
  integration: UserCenterBridgeConfig["integration"];
  manifests: Partial<{
    auth: UserCenterAuthWorkspaceManifest;
    user: UserCenterUserWorkspaceManifest;
  }>;
  storageTopology: UserCenterBridgeConfig["storageTopology"];
  storagePlan: UserCenterBridgeConfig["storagePlan"];
}

export type UserCenterProtectedTokenName =
  | "auth-token"
  | "Access-Token"
  | "session-token";

export type UserCenterLocalAuthorityColumnRole =
  | "id"
  | "tenant-id"
  | "user-id"
  | "owner-id"
  | "status"
  | "metadata"
  | "timestamp"
  | "amount"
  | "flag"
  | "relation";

export interface UserCenterLocalAuthorityColumn {
  dataType: string;
  indexed?: boolean;
  name: string;
  nullable: boolean;
  role: UserCenterLocalAuthorityColumnRole;
}

export interface UserCenterLocalAuthorityEntityTable {
  columns: UserCenterLocalAuthorityColumn[];
  primaryKeyColumnName: string;
  standardEntityName: UserCenterStandardEntityName;
  tableName: string;
}

export interface UserCenterLocalAuthoritySchemaContract {
  databaseKey: string;
  migrationNamespace: string;
  schemaName?: string;
  tablePrefix: string;
  tables: UserCenterLocalAuthorityEntityTable[];
}

export interface UserCenterServerRepositoryContract {
  entityNames: UserCenterStandardEntityName[];
  id: string;
  purpose: string;
}

export interface UserCenterServerServiceContract {
  id: string;
  operationIds: string[];
  purpose: string;
}

export interface UserCenterServerOperationAuthContract {
  handshakeRequired: boolean;
  protectedTokenPreference: UserCenterProtectedTokenName[];
  requiresPrincipal: boolean;
}

export interface UserCenterServerOperationContract {
  auth: UserCenterServerOperationAuthContract;
  method: UserCenterRuntimeRequestMethod;
  operationId: string;
  path: string;
  routeKey: UserCenterServerRouteKey;
  summary: string;
}

export type UserCenterServerRouteKey =
  | "authConfig"
  | "authEmailLogin"
  | "authLogin"
  | "authLogout"
  | "authLoginContextSelection"
  | "authOrganizationSelection"
  | "authPasswordReset"
  | "authPasswordResetRequest"
  | "authPhoneLogin"
  | "authRefresh"
  | "authRegister"
  | "authSession"
  | "authSessionExchange"
  | "healthGet"
  | "tenantRootGet"
  | "userProfileGet"
  | "userProfileUpdate"
  | "userSettingsGet"
  | "userSettingsUpdate";

export interface UserCenterServerApiContract {
  basePath: string;
  operations: UserCenterServerOperationContract[];
}

export interface UserCenterServerUpstreamBridgeContract {
  baseUrl?: string;
  enabled: boolean;
  handshake: UserCenterDeploymentHandshakeContract;
  providerKey: string;
}

export interface UserCenterServerUpstreamAuthoritySet {
  appApi?: UserCenterServerUpstreamBridgeContract;
  thirdParty?: UserCenterServerUpstreamBridgeContract;
}

export interface UserCenterServerLocalAuthorityContract {
  enabled: boolean;
  schema: UserCenterLocalAuthoritySchemaContract;
  storageTopology: UserCenterStorageTopology;
}

export interface UserCenterServerAuthInteropContract {
  authMode: UserCenterAuthMode;
  handshake: {
    freshnessWindowMs: number;
    mode: UserCenterHandshakeMode;
    required: boolean;
  };
  protectedTokenPreference: UserCenterProtectedTokenName[];
  tokenHeaders: UserCenterTokenHeaders;
}

export interface UserCenterServerAuthorityContract {
  activeIntegrationKind: UserCenterIntegrationKind;
  activeProvider: UserCenterProviderConfig;
  api: UserCenterServerApiContract;
  authInterop: UserCenterServerAuthInteropContract;
  localAuthority: UserCenterServerLocalAuthorityContract;
  repositories: UserCenterServerRepositoryContract[];
  services: UserCenterServerServiceContract[];
  upstream: UserCenterServerUpstreamAuthoritySet;
}

export interface UserCenterServerManifest extends UserCenterWorkspaceManifestBase {
  activeIntegrationKind: UserCenterIntegrationKind;
  capability: "server";
  integrationKinds: UserCenterIntegrationKind[];
}

export interface UserCenterServerPluginDefinitionOptions extends UserCenterBridgeConfigInput {
  description?: string;
  packageNames?: string[];
  theme?: string;
  title?: string;
}

export interface UserCenterServerPluginDefinition {
  bridgeConfig: UserCenterBridgeConfig;
  capability: "user-center-server";
  deployment: UserCenterDeploymentProfileSet;
  server: {
    authority: UserCenterServerAuthorityContract;
    deployment: UserCenterDeploymentProfileSet;
    manifests: {
      server: UserCenterServerManifest;
    };
  };
}

export interface UserCenterServerValidationDependency {
  activeIntegrationKind: UserCenterIntegrationKind;
  capability: "user-center-server";
  namespace: string;
  providerKey: string;
}

export interface UserCenterServerValidationManifest extends UserCenterWorkspaceManifestBase {
  capability: "server-validation";
  dependencyCapability: "user-center-server";
  governedHeaderNames: string[];
}

export interface UserCenterServerValidationMiddlewareContract {
  governedHeaderNames: string[];
  handshake: {
    freshnessWindowMs: number;
    mode: UserCenterHandshakeMode;
    required: boolean;
  };
  interop: UserCenterAuthInteropContract;
  protectedTokenPreference: UserCenterProtectedTokenName[];
}

export interface UserCenterServerValidationPluginDefinitionOptions {
  description?: string;
  packageNames?: string[];
  title?: string;
  userCenterServerPlugin: UserCenterServerPluginDefinition;
}

export interface UserCenterServerValidationPluginDefinition {
  capability: "user-center-server-validation";
  dependency: UserCenterServerValidationDependency;
  manifests: {
    serverValidation: UserCenterServerValidationManifest;
  };
  middleware: UserCenterServerValidationMiddlewareContract;
  userCenterServerPlugin: UserCenterServerPluginDefinition;
}

export interface UserCenterStorageLike {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface UserCenterSessionStoreOptions {
  bundleMemoryCache?: boolean;
  legacySessionTokenKeys?: string[];
  localStorage?: UserCenterStorageLike | null;
  sessionStorage?: UserCenterStorageLike | null;
}

export interface UserCenterTokenBundle {
  accessToken?: string;
  authToken?: string;
  refreshToken?: string;
  sessionToken?: string;
  tokenType?: string;
}

export interface UserCenterTokenStoreOptions extends UserCenterSessionStoreOptions {}

export interface UserCenterSessionStore {
  clearSessionToken(): void;
  persistSessionToken(token: string): boolean;
  readSessionToken(): string | null;
}

export interface UserCenterTokenStore {
  clearTokenBundle(): void;
  persistTokenBundle(bundle: UserCenterTokenBundle): boolean;
  readTokenBundle(): UserCenterTokenBundle;
}

export type UserCenterRuntimeRequestMethod = "GET" | "PATCH" | "POST";
export type UserCenterRuntimeHeaders = Record<string, string>;

export interface UserCenterRuntimeResponseHeaders {
  get(name: string): string | null;
}

export interface UserCenterRuntimeResponse {
  headers?: UserCenterRuntimeResponseHeaders;
  json(): Promise<unknown>;
  ok: boolean;
  status: number;
}

export type UserCenterRuntimeFetch = (
  input: string | URL,
  init?: {
    body?: string;
    headers?: UserCenterRuntimeHeaders;
    method?: UserCenterRuntimeRequestMethod;
  },
) => Promise<UserCenterRuntimeResponse>;

export interface UserCenterSessionTokenContext {
  data: unknown;
  payload: unknown;
  response: UserCenterRuntimeResponse;
  runtimeConfig: UserCenterRuntimeConfig;
}

export interface UserCenterRuntimeAuthContext {
  method: UserCenterRuntimeRequestMethod;
  path: string;
  runtimeConfig: UserCenterRuntimeConfig;
  tokenBundle: UserCenterTokenBundle;
}

export interface UserCenterRuntimeHandshakeSignatureContext
  extends UserCenterRuntimeAuthContext {
  createSigningMessage: (signedAt: string) => string;
}

export interface UserCenterRuntimeValidationPreflightContext {
  runtimeConfig: UserCenterRuntimeConfig;
}

export interface UserCenterAppSdkLikeClient {
  auth?: {
    sessions?: {
      create?: (body?: unknown) => Promise<unknown>;
      refresh?: (body?: unknown) => Promise<unknown>;
      current?: {
        delete?: (body?: unknown) => Promise<unknown>;
        retrieve?: () => Promise<unknown>;
        update?: (body: unknown) => Promise<unknown>;
      };
    };
  };
  iam?: {
    users?: {
      current?: {
        retrieve?: () => Promise<unknown>;
        update?: (body: unknown) => Promise<unknown>;
      };
    };
  };
}

export interface UserCenterRuntimeClientOptions {
  appSdkClient?: UserCenterAppSdkLikeClient | (() => UserCenterAppSdkLikeClient);
  fetch?: UserCenterRuntimeFetch;
  resolveValidationInteropContract?:
    | ((context: UserCenterRuntimeValidationPreflightContext) =>
      Promise<UserCenterAuthInteropContract | null | undefined>)
    | ((context: UserCenterRuntimeValidationPreflightContext) =>
      UserCenterAuthInteropContract | null | undefined);
  resolveAuthHeaders?:
    | ((context: UserCenterRuntimeAuthContext) => Promise<UserCenterRuntimeHeaders>)
    | ((context: UserCenterRuntimeAuthContext) => UserCenterRuntimeHeaders);
  resolveHandshakeSignature?:
    | ((context: UserCenterRuntimeHandshakeSignatureContext) =>
      Promise<UserCenterHandshakeSignature | null | undefined>)
    | ((context: UserCenterRuntimeHandshakeSignatureContext) =>
      UserCenterHandshakeSignature | null | undefined);
  resolveSessionToken?: (context: UserCenterSessionTokenContext) => string | null;
  resolveTokenBundle?: (context: UserCenterSessionTokenContext) => UserCenterTokenBundle | null;
  sessionStore?: UserCenterSessionStore;
  tokenStore?: UserCenterTokenStore;
  validationInteropContract?: UserCenterAuthInteropContract;
}

export interface UserCenterRuntimeClient {
  bootstrapSession<TResult = unknown, TPayload = Record<string, unknown> | undefined>(
    payload?: TPayload,
  ): Promise<TResult>;
  getHealth<TResult = unknown>(): Promise<TResult>;
  getPreferences<TResult = unknown>(): Promise<TResult>;
  getProfile<TResult = unknown>(): Promise<TResult>;
  getTenant<TResult = unknown>(): Promise<TResult>;
  loginSession<TResult = unknown, TPayload = Record<string, unknown>>(
    payload: TPayload,
  ): Promise<TResult>;
  logoutSession<TResult = unknown, TPayload = Record<string, unknown> | undefined>(
    payload?: TPayload,
  ): Promise<TResult>;
  refreshSession<TResult = unknown, TPayload = Record<string, unknown> | undefined>(
    payload?: TPayload,
  ): Promise<TResult>;
  updatePreferences<TResult = unknown, TPayload = Record<string, unknown>>(
    payload: TPayload,
  ): Promise<TResult>;
  updateProfile<TResult = unknown, TPayload = Record<string, unknown>>(
    payload: TPayload,
  ): Promise<TResult>;
}
