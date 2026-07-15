import { coalesce } from '@sdkwork/utils';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

import {
  SDKWORK_ACCESS_TOKEN_ENV_KEY,
  SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY,
} from './constants.ts';

type ProcessEnvHost = typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

type CredentialEntryBootstrapHost = typeof globalThis & {
  [SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY]?: unknown;
};

function readInjectedCredentialEntryBootstrapAccessToken(): string | undefined {
  const value = (globalThis as CredentialEntryBootstrapHost)[
    SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY
  ];
  return typeof value === 'string' ? coalesce(value) : undefined;
}

export function readBootstrapAccessTokenFromProcessEnv(
  env: Record<string, string | undefined> | undefined = (globalThis as ProcessEnvHost).process?.env,
): string | undefined {
  return readInjectedCredentialEntryBootstrapAccessToken()
    ?? coalesce(env?.[SDKWORK_ACCESS_TOKEN_ENV_KEY]);
}

export function prepareCredentialEntryTokens(
  tokenManager: AuthTokenManager,
  readBootstrapToken: () => string | undefined = readBootstrapAccessTokenFromProcessEnv,
): void {
  tokenManager.clearTokens?.();
  const bootstrapAccessToken = readBootstrapToken();
  if (bootstrapAccessToken) {
    tokenManager.setTokens?.({ accessToken: bootstrapAccessToken });
  }
}
