import { describe, expect, it, vi } from 'vitest';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

import {
  prepareCredentialEntryTokens,
  readBootstrapAccessTokenFromProcessEnv,
  resolveAppIdFromManifest,
  resolveOrganizationIdFromManifest,
  resolveTenantIdFromManifest,
  createDevBootstrapAccessTokenJwt,
  mergeBootstrapAccessTokenEnv,
  wrapCredentialEntryClient,
  SDKWORK_ACCESS_TOKEN_ENV_KEY,
} from '../src/index.ts';

describe('@sdkwork/iam-credential-entry', () => {
  it('reads bootstrap access token from process env', () => {
    expect(
      readBootstrapAccessTokenFromProcessEnv({
        [SDKWORK_ACCESS_TOKEN_ENV_KEY]: ' bootstrap-token ',
      }),
    ).toBe('bootstrap-token');
  });

  it('prepares credential-entry tokens from bootstrap access token only', () => {
    const tokenManager = {
      clearTokens: vi.fn(),
      setTokens: vi.fn(),
    } as unknown as AuthTokenManager;

    prepareCredentialEntryTokens(tokenManager, () => 'bootstrap-token');

    expect(tokenManager.clearTokens).toHaveBeenCalledTimes(1);
    expect(tokenManager.setTokens).toHaveBeenCalledWith({ accessToken: 'bootstrap-token' });
  });

  it('wraps credential-entry methods and prepares bootstrap tokens before invocation', async () => {
    const prepareTokens = vi.fn();
    const create = vi.fn(async (_input: unknown) => ({ code: '2000' }));
    const client = {
      auth: {
        sessions: { create },
      },
    };

    wrapCredentialEntryClient(client as never, { prepareTokens });
    await client.auth.sessions.create({ grantType: 'password' });

    expect(prepareTokens).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('resolves manifest identity for IAM runtime bootstrap', () => {
    const manifest = {
      app: { key: 'sdkwork-iam-demo', name: 'SDKWork IAM Demo', appType: 'APP_HTML' },
      backend: { tenantId: '100001', organizationId: '0', accessTokenPermissionScope: ['iam.users.read'] },
    };

    expect(resolveAppIdFromManifest(manifest)).toBe('sdkwork-iam-demo');
    expect(resolveTenantIdFromManifest(manifest)).toBe('100001');
    expect(resolveOrganizationIdFromManifest(manifest)).toBe('0');
  });

  it('creates dev bootstrap access token JWT from manifest identity', () => {
    const token = createDevBootstrapAccessTokenJwt({
      manifest: {
        app: { key: 'sdkwork-im-pc' },
        backend: { tenantId: '100001', organizationId: '0' },
      },
    });

    expect(token.split('.')).toHaveLength(3);
    expect(mergeBootstrapAccessTokenEnv({}, {
      manifest: {
        app: { key: 'sdkwork-im-pc' },
        backend: { tenantId: '100001', organizationId: '0' },
      },
    }).SDKWORK_ACCESS_TOKEN).toBe(token);
  });
});
