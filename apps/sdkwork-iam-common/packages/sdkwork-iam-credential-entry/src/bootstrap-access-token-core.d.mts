export type SdkworkEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface CredentialEntryBootstrapManifest {
  app?: { id?: string; key?: string };
  backend?: {
    accessTokenPermissionScope?: string[];
    organizationId?: string;
    tenantId?: string;
  };
}

export interface CreateDevBootstrapAccessTokenOptions {
  allowTestTokenGeneration?: boolean;
  appId?: string;
  deploymentMode?: string;
  environment?: SdkworkEnvironment | 'dev' | 'prod';
  manifest?: CredentialEntryBootstrapManifest;
  organizationId?: string;
  permissionScope?: string[];
  runtimeTarget?: string;
  sessionId?: string;
  tenantId?: string;
  userId?: string;
}

export const SDKWORK_ACCESS_TOKEN_ENV_KEY: 'SDKWORK_ACCESS_TOKEN';
export function normalizeBootstrapEnvironment(value: unknown): SdkworkEnvironment;
export function createDevBootstrapAccessTokenJwt(
  options?: CreateDevBootstrapAccessTokenOptions,
): string;
export function buildBootstrapAccessTokenEnvRecord(
  existingAccessToken?: string,
  options?: CreateDevBootstrapAccessTokenOptions,
): Record<string, string>;
export function mergeBootstrapAccessTokenEnv(
  env?: Record<string, string | undefined>,
  options?: CreateDevBootstrapAccessTokenOptions,
): Record<string, string | undefined>;
