import { coalesce } from '@sdkwork/utils';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

import { SDKWORK_ACCESS_TOKEN_ENV_KEY } from './constants.ts';

type ProcessEnvHost = typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

export function readBootstrapAccessTokenFromProcessEnv(
  env: Record<string, string | undefined> | undefined = (globalThis as ProcessEnvHost).process?.env,
): string | undefined {
  const value = env?.[SDKWORK_ACCESS_TOKEN_ENV_KEY];
  return coalesce(value);
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
