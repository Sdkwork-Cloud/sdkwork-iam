import { SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY } from './constants.ts';

export interface CredentialEntryBootstrapVitePluginOptions {
  accessToken?: string;
  allowTestInjection?: boolean;
  environment: string;
}

export interface CredentialEntryBootstrapVitePlugin {
  name: string;
  apply: 'serve';
  transformIndexHtml: {
    order: 'pre';
    handler: (html: string) => {
      html: string;
      tags: Array<{
        tag: 'script';
        children: string;
        injectTo: 'head-prepend';
      }>;
    };
  };
}

function normalizeToken(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function serializeInlineScriptValue(value: string): string {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

export function createSdkworkCredentialEntryBootstrapVitePlugin({
  accessToken,
  allowTestInjection = false,
  environment,
}: CredentialEntryBootstrapVitePluginOptions): CredentialEntryBootstrapVitePlugin | undefined {
  const canInject = environment === 'development'
    || (environment === 'test' && allowTestInjection);
  const token = normalizeToken(accessToken);
  if (!canInject || !token) {
    return undefined;
  }

  return {
    name: 'sdkwork-iam-credential-entry-bootstrap',
    apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => ({
        html,
        tags: [{
          tag: 'script',
          children:
            `globalThis.${SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY} = `
            + `${serializeInlineScriptValue(token)};`,
          injectTo: 'head-prepend',
        }],
      }),
    },
  };
}
