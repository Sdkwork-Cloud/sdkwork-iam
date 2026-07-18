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
  SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY,
} from '../src/index.ts';
import { createSdkworkCredentialEntryBootstrapVitePlugin } from '../src/vite.ts';

describe('@sdkwork/iam-credential-entry', () => {
  it('reads bootstrap access token from process env', () => {
    expect(
      readBootstrapAccessTokenFromProcessEnv({
        [SDKWORK_ACCESS_TOKEN_ENV_KEY]: ' bootstrap-token ',
      }),
    ).toBe('bootstrap-token');
  });

  it('prefers the development credential-entry handoff over a process env fallback', () => {
    const host = globalThis as Record<string, unknown>;
    const previousValue = host[SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY];

    host[SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY] = ' injected-bootstrap-token ';
    try {
      expect(
        readBootstrapAccessTokenFromProcessEnv({
          [SDKWORK_ACCESS_TOKEN_ENV_KEY]: 'process-bootstrap-token',
        }),
      ).toBe('injected-bootstrap-token');
    } finally {
      if (previousValue === undefined) {
        delete host[SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY];
      } else {
        host[SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY] = previousValue;
      }
    }
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

  it('injects a safely serialized development token through the canonical Vite handoff', () => {
    const plugin = createSdkworkCredentialEntryBootstrapVitePlugin({
      accessToken: 'token</script>&value',
      environment: 'development',
    });
    const transformed = plugin?.transformIndexHtml.handler('<html></html>');
    const script = transformed?.tags[0]?.children ?? '';

    expect(plugin?.apply).toBe('serve');
    expect(script).toContain(SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY);
    expect(script).toContain('token\\u003c/script\\u003e\\u0026value');
    expect(script).not.toContain('</script>');
  });

  it('does not inject test tokens without explicit test opt-in', () => {
    expect(createSdkworkCredentialEntryBootstrapVitePlugin({
      accessToken: 'test-token',
      environment: 'test',
    })).toBeUndefined();
    expect(createSdkworkCredentialEntryBootstrapVitePlugin({
      accessToken: 'test-token',
      environment: 'test',
      allowTestInjection: true,
    })).toBeDefined();
  });

  for (const environment of ['staging', 'production'] as const) {
    it(`never injects bootstrap credentials into ${environment} HTML`, () => {
      expect(createSdkworkCredentialEntryBootstrapVitePlugin({
        accessToken: `${environment}-secret-token`,
        environment,
      })).toBeUndefined();
    });
  }
});
