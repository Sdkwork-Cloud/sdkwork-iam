import type { SdkworkDeploymentMode, SdkworkRuntimeEnvironment } from "@sdkwork/runtime-bootstrap";

export interface IamApplicationBootstrapAuth {
  authToken?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export interface IamApplicationBootstrapProfile {
  account?: string;
  email?: string;
  password?: string;
  username?: string;
}

export interface IamApplicationBootstrapEnvironment {
  backendApiBaseUrl: string;
  deploymentMode?: SdkworkDeploymentMode;
  environment: SdkworkRuntimeEnvironment | string;
  instanceKey?: string;
  organizationId?: string;
  primaryDomain?: string;
  tenantId?: string;
}

export interface RegisteredApplicationTemplateResult {
  templateId?: string;
  appKey?: string;
  name?: string;
  version?: string;
  defaultAccessPermissions?: string[];
  [key: string]: unknown;
}

export interface ProvisionedTenantApplicationResult {
  tenantApplicationId?: string;
  appId?: string;
  tenantId?: string;
  organizationId?: string;
  status?: string;
  [key: string]: unknown;
}

export interface EnabledTenantApplicationResult {
  tenantApplicationId?: string;
  appId?: string;
  status?: string;
  [key: string]: unknown;
}

export interface IssuedAccessCredentialResult {
  accessCredential?: string;
  accessToken?: string;
  authToken?: string;
  tenantId?: string;
  organizationId?: string;
  tenantApplicationId?: string;
  appId?: string;
  sessionId?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export interface IamApplicationBootstrapClient {
  createAccessCredential(body: Record<string, unknown>): Promise<IssuedAccessCredentialResult>;
  enableTenantApplication(
    tenantApplicationId: string,
    body?: Record<string, unknown>,
  ): Promise<EnabledTenantApplicationResult>;
  provisionTenantApplication(body: Record<string, unknown>): Promise<ProvisionedTenantApplicationResult>;
  registerApplication(body: Record<string, unknown>): Promise<RegisteredApplicationTemplateResult>;
  updateTenantApplication?(
    tenantApplicationId: string,
    body?: Record<string, unknown>,
  ): Promise<ProvisionedTenantApplicationResult>;
}

export interface SdkworkAppManifest {
  app?: {
    appType?: string;
    displayName?: string;
    identifiers?: {
      bundleId?: string;
      packageName?: string;
    };
    key?: string;
    name?: string;
  };
  artifacts?: {
    installConfig?: {
      packages?: Array<Record<string, unknown>>;
    };
  };
  backend?: {
    accessTokenPermissionScope?: string[];
    domain?: string;
    organizationId?: string;
    permissionScope?: string[];
    primaryDomain?: string;
    tenantId?: string;
  };
  publish?: Record<string, unknown>;
  release?: {
    notes?: Array<{
      channel?: string;
      current?: boolean;
      version?: string;
    }>;
  };
  runtime?: Record<string, unknown>;
  security?: Record<string, unknown>;
}

export interface ApplicationBootstrapFromManifestInput {
  auth: IamApplicationBootstrapAuth;
  client: IamApplicationBootstrapClient;
  environment: IamApplicationBootstrapEnvironment;
  manifest: SdkworkAppManifest;
  manifestHash?: string;
}

export interface ApplicationBootstrapResult {
  appId?: string;
  authToken?: string;
  accessCredential?: string;
  enabled: EnabledTenantApplicationResult;
  env: Record<string, string>;
  issued: IssuedAccessCredentialResult;
  provisioned: ProvisionedTenantApplicationResult;
  registered: RegisteredApplicationTemplateResult;
  templateId?: string;
  tenantApplicationId?: string;
  version?: string;
}

export interface ApplicationBootstrapEnvWriterInput {
  env?: Record<string, string>;
  primaryDomain?: string;
  result: ApplicationBootstrapResult;
}

export interface CreateIamApplicationBootstrapInput {
  client: IamApplicationBootstrapClient;
}

export interface IamApplicationBootstrapModule {
  bootstrapFromManifest(input: ApplicationBootstrapFromManifestInput): Promise<ApplicationBootstrapResult>;
  createAccessCredential(body: Record<string, unknown>): Promise<IssuedAccessCredentialResult>;
  enableTenantApplication(
    tenantApplicationId: string,
    body?: Record<string, unknown>,
  ): Promise<EnabledTenantApplicationResult>;
  name: "@sdkwork/iam-application-bootstrap";
  provisionTenantApplication(body: Record<string, unknown>): Promise<ProvisionedTenantApplicationResult>;
  registerApplication(body: Record<string, unknown>): Promise<RegisteredApplicationTemplateResult>;
  updateTenantApplication?(
    tenantApplicationId: string,
    body?: Record<string, unknown>,
  ): Promise<ProvisionedTenantApplicationResult>;
  version: "0.1.0";
}
