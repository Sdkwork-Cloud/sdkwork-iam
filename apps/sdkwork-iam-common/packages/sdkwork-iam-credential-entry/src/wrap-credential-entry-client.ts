import type { SdkworkAppClient } from '@sdkwork/iam-app-sdk';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

import { prepareCredentialEntryTokens, readBootstrapAccessTokenFromProcessEnv } from './bootstrap-token.ts';

type CredentialEntryMethod = (...args: unknown[]) => Promise<unknown>;

export interface WrapCredentialEntryClientOptions {
  prepareTokens?: () => void;
  readBootstrapToken?: () => string | undefined;
  tokenManager?: AuthTokenManager;
}

export function wrapCredentialEntryClient(
  client: SdkworkAppClient,
  options: WrapCredentialEntryClientOptions = {},
): SdkworkAppClient {
  const prepareTokens =
    options.prepareTokens
    ?? (() => {
      if (!options.tokenManager) {
        throw new Error('wrapCredentialEntryClient requires tokenManager or prepareTokens');
      }
      prepareCredentialEntryTokens(
        options.tokenManager,
        options.readBootstrapToken ?? readBootstrapAccessTokenFromProcessEnv,
      );
    });

  const auth = client.auth;
  if (auth) {
    wrapCredentialEntryMethod(auth.passwordResetRequests, 'create', prepareTokens);
    wrapCredentialEntryMethod(auth.passwordResets, 'create', prepareTokens);
    wrapCredentialEntryMethod(auth.registrations, 'create', prepareTokens);
    wrapCredentialEntryMethod(auth.sessions, 'create', prepareTokens);
    wrapCredentialEntryMethod(auth.sessions?.loginContextSelection, 'create', prepareTokens);
    wrapCredentialEntryMethod(auth.sessions?.organizationSelection, 'create', prepareTokens);
  }

  const oauth = client.oauth;
  if (oauth) {
    wrapCredentialEntryMethod(oauth.authorizationUrls, 'create', prepareTokens);
    wrapCredentialEntryMethod(oauth.deviceAuthorizations, 'create', prepareTokens);
    wrapCredentialEntryMethod(oauth.deviceAuthorizations?.passwordCompletions, 'create', prepareTokens);
    wrapCredentialEntryMethod(oauth.miniProgramSessions, 'create', prepareTokens);
    wrapCredentialEntryMethod(oauth.sessions, 'create', prepareTokens);
    const oauthCallbacks = (oauth as unknown as { callbacks?: Record<string, CredentialEntryMethod> })
      .callbacks;
    wrapCredentialEntryMethod(oauthCallbacks, 'handleGet', prepareTokens);
    wrapCredentialEntryMethod(oauthCallbacks, 'handlePost', prepareTokens);
  }

  return client;
}

function wrapCredentialEntryMethod(
  resource: object | undefined,
  methodName: string,
  prepareTokens: () => void,
): void {
  if (!resource) {
    return;
  }

  const mutableResource = resource as Record<string, CredentialEntryMethod | undefined>;
  const original = mutableResource[methodName];
  if (typeof original !== 'function') {
    return;
  }

  mutableResource[methodName] = async (...args: unknown[]) => {
    prepareTokens();
    return original.apply(resource, args);
  };
}
