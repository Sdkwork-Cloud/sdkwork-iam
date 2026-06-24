#!/usr/bin/env node

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iamRoot = path.resolve(__dirname, '../..');
const appOpenApiPath = path.join(iamRoot, 'apis/app-api/iam/sdkwork-iam-app-api.openapi.yaml');
const typescriptApiDir = path.join(
  iamRoot,
  'sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-typescript/generated/server-openapi/src/api',
);

const CREDENTIAL_ENTRY_BOOTSTRAP_AUTH_MODE = 'credential-entry-bootstrap';
const REFRESH_TOKEN_AUTH_MODE = 'refresh-token';
const ANONYMOUS_AUTH_MODE = 'anonymous';

export function patchIamAppSdkTypescriptCredentialEntryTransport() {
  const bootstrapOperations = readOperationsByAuthMode(
    appOpenApiPath,
    CREDENTIAL_ENTRY_BOOTSTRAP_AUTH_MODE,
  );
  const refreshTokenOperations = readOperationsByAuthMode(appOpenApiPath, REFRESH_TOKEN_AUTH_MODE);
  const anonymousOperations = readOperationsByAuthMode(appOpenApiPath, ANONYMOUS_AUTH_MODE);
  patchHttpClient(path.join(
    iamRoot,
    'sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-typescript/generated/server-openapi/src/http/client.ts',
  ));
  const apiFiles = readdirSync(typescriptApiDir)
    .filter((fileName) => fileName.endsWith('.ts'))
    .map((fileName) => path.join(typescriptApiDir, fileName));
  for (const apiPath of apiFiles) {
    patchApiFile(apiPath, bootstrapOperations, CREDENTIAL_ENTRY_BOOTSTRAP_AUTH_MODE);
    patchApiFile(apiPath, refreshTokenOperations, REFRESH_TOKEN_AUTH_MODE);
    patchApiFile(apiPath, anonymousOperations, ANONYMOUS_AUTH_MODE);
  }
}

export function readCredentialEntryBootstrapOperationsForTest(openApiPath = appOpenApiPath) {
  return readOperationsByAuthMode(openApiPath, CREDENTIAL_ENTRY_BOOTSTRAP_AUTH_MODE);
}

function readOperationsByAuthMode(openApiPath, authMode) {
  const source = readFileSync(openApiPath, 'utf8');
  const chunks = source.split('\n');
  const operations = [];
  let currentPath = null;
  let currentMethod = null;
  const authModePattern = new RegExp(
    `x-sdkwork-auth-mode["']?\\s*:\\s*["']?${escapeRegExp(authMode)}["']?`,
    'u',
  );

  for (let index = 0; index < chunks.length; index += 1) {
    const pathMatch = chunks[index].match(/^\s*"(\/app\/v3\/api[^"]+)":\s*\{/u);
    if (pathMatch) {
      currentPath = pathMatch[1];
      currentMethod = null;
      continue;
    }

    const methodMatch = chunks[index].match(/^\s*"(get|post|put|patch|delete)":\s*\{/u);
    if (methodMatch) {
      currentMethod = methodMatch[1].toUpperCase();
      continue;
    }

    if (!authModePattern.test(chunks[index])) {
      continue;
    }

    let operationId = null;
    let tag = null;
    for (let back = index; back >= Math.max(0, index - 160); back -= 1) {
      if (!operationId) {
        const operationIdMatch = chunks[back].match(/^\s*"operationId"\s*:\s*"([^"]+)"/u);
        if (operationIdMatch) {
          operationId = operationIdMatch[1];
        }
      }
      if (!tag) {
        const tagMatch = chunks[back].match(/^\s*"([^"]+)"\s*,?\s*$/u);
        if (tagMatch && back > 0 && /^\s*"tags"\s*:\s*\[/u.test(chunks[back - 1])) {
          tag = tagMatch[1];
        }
      }
      if (operationId && tag) {
        break;
      }
    }

    if (!currentPath || !currentMethod || !operationId || !tag) {
      throw new Error(`Unable to resolve ${authMode} operation near line ${index + 1} in ${openApiPath}`);
    }

    operations.push({
      apiPath: currentPath,
      method: currentMethod,
      operationId,
      tag,
    });
  }

  return operations;
}

function readCredentialEntryBootstrapOperations(openApiPath) {
  const operations = readOperationsByAuthMode(openApiPath, CREDENTIAL_ENTRY_BOOTSTRAP_AUTH_MODE);
  if (operations.length === 0) {
    throw new Error(`No ${CREDENTIAL_ENTRY_BOOTSTRAP_AUTH_MODE} operations found in ${openApiPath}`);
  }
  return operations;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function generatedPathPattern(openApiPath) {
  const appPath = openApiPath.replace(/^\/app\/v3\/api/u, '');
  return appPath
    .split(/(\{[^}]+\})/u)
    .map((part) => {
      if (/^\{([^}]+)\}$/u.test(part)) {
        const name = part.slice(1, -1);
        return String.raw`\$\{serializePathParameter\([^)]*name:\s*'${name}'[^)]*\)\}`;
      }
      return escapeRegExp(part);
    })
    .join('');
}

function appApiPathCallRegExp(openApiPath) {
  const appPath = openApiPath.replace(/^\/app\/v3\/api/u, '');
  let pattern = 'appApiPath\\(`';
  for (const part of appPath.split(/(\{[^}]+\})/u)) {
    const paramMatch = part.match(/^\{([^}]+)\}$/u);
    if (paramMatch) {
      const paramName = paramMatch[1];
      pattern += String.raw`\$\{serializePathParameter\(${escapeRegExp(paramName)}, \{ name: '${paramName}'[\s\S]*?\}\)\}`;
      continue;
    }
    pattern += escapeRegExp(part);
  }
  pattern += '`\\)';
  return new RegExp(`${pattern}(?=/|\`|,|\\)|;|$)`, 'u');
}

function patchHttpClient(clientPath) {
  let source = readFileSync(clientPath, 'utf8');
  if (source.includes('credentialEntryBootstrap')) {
    return;
  }

  source = source.replace(
    'type HttpRequestOptions = RequestOptions & {\n  method?: string;\n  body?: unknown;\n  headers?: Record<string, string>;\n  contentType?: string;\n};',
    'type HttpRequestOptions = RequestOptions & {\n  method?: string;\n  body?: unknown;\n  headers?: Record<string, string>;\n  contentType?: string;\n  credentialEntryBootstrap?: boolean;\n};',
  );

  source = source.replace(
    `  protected buildHeaders(config: any, skipAuth = false): Record<string, string> {
    const headers = super.buildHeaders(config, skipAuth);
    if (!skipAuth && !config?.skipAuth) {
      return headers;
    }

    [
      HttpClient.ACCESS_TOKEN_HEADER,
      'Authorization',
      'Access-Token',
      ['X', 'API', 'Key'].join('-'),
      'X-Tenant-Id',
      'X-Organization-Id',
      'X-Platform',
      'X-User-Id',
      'X-Sdkwork-Tenant-Id',
      'X-Sdkwork-Organization-Id',
      'X-Sdkwork-User-Id',
    ].forEach((key) => {
      delete headers[key];
    });
    return headers;
  }`,
    `  protected buildHeaders(config: any, skipAuth = false): Record<string, string> {
    const headers = super.buildHeaders(config, skipAuth);
    if (config?.credentialEntryBootstrap) {
      this.stripForbiddenCredentialEntryHeaders(headers);
      return headers;
    }
    if (!skipAuth && !config?.skipAuth) {
      return headers;
    }

    this.stripAllAuthHeaders(headers);
    return headers;
  }

  private stripForbiddenCredentialEntryHeaders(headers: Record<string, string>): void {
    [
      'Authorization',
      ['X', 'API', 'Key'].join('-'),
      'X-Tenant-Id',
      'X-Organization-Id',
      'X-Platform',
      'X-User-Id',
      'X-Sdkwork-Tenant-Id',
      'X-Sdkwork-Organization-Id',
      'X-Sdkwork-User-Id',
    ].forEach((key) => {
      delete headers[key];
    });
  }

  private stripAllAuthHeaders(headers: Record<string, string>): void {
    [
      HttpClient.ACCESS_TOKEN_HEADER,
      'Authorization',
      'Access-Token',
      ['X', 'API', 'Key'].join('-'),
      'X-Tenant-Id',
      'X-Organization-Id',
      'X-Platform',
      'X-User-Id',
      'X-Sdkwork-Tenant-Id',
      'X-Sdkwork-Organization-Id',
      'X-Sdkwork-User-Id',
    ].forEach((key) => {
      delete headers[key];
    });
  }`,
  );

  source = source.replace(
    `  private applySdkworkAuthHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    const authConfig = this.getInternalAuthConfig();
    const tokenManager = authConfig.tokenManager;
    const accessToken = tokenManager?.getAccessToken?.();
    if (!accessToken) {
      return headers;
    }

    return {
      ...(headers ?? {}),
      [HttpClient.ACCESS_TOKEN_HEADER]: accessToken,
    };
  }`,
    `  private applySdkworkAuthHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    const authConfig = this.getInternalAuthConfig();
    const tokenManager = authConfig.tokenManager;
    const accessToken = tokenManager?.getAccessToken?.();
    const authToken = tokenManager?.getAuthToken?.();
    if (!accessToken && !authToken) {
      return headers;
    }

    return {
      ...(headers ?? {}),
      ...(accessToken ? { [HttpClient.ACCESS_TOKEN_HEADER]: accessToken } : {}),
      ...(authToken ? { Authorization: \`Bearer \${authToken}\` } : {}),
    };
  }

  private applyCredentialEntryBootstrapHeaders(
    headers?: Record<string, string>,
  ): Record<string, string> | undefined {
    const authConfig = this.getInternalAuthConfig();
    const tokenManager = authConfig.tokenManager;
    const accessToken = tokenManager?.getAccessToken?.();
    if (!accessToken) {
      return headers;
    }

    return {
      ...(headers ?? {}),
      [HttpClient.ACCESS_TOKEN_HEADER]: accessToken,
    };
  }`,
  );

  source = source.replace(
    `    const { body, headers, contentType, method = 'GET', skipAuth, ...rest } = options;
    const requestHeaders = skipAuth ? headers : this.applySdkworkAuthHeaders(headers);
    return withRetry(
      () => execute.call(this, {
        url: path,
        method,
        ...rest,
        skipAuth,
        body: this.buildRequestBody(body, contentType),
        headers: this.buildRequestHeaders(requestHeaders, body == null ? undefined : contentType),
      }),`,
    `    const {
      body,
      headers,
      contentType,
      method = 'GET',
      skipAuth,
      credentialEntryBootstrap,
      ...rest
    } = options;
    const requestHeaders = credentialEntryBootstrap
      ? this.applyCredentialEntryBootstrapHeaders(headers)
      : skipAuth
        ? headers
        : this.applySdkworkAuthHeaders(headers);
    return withRetry(
      () => execute.call(this, {
        url: path,
        method,
        ...rest,
        skipAuth,
        credentialEntryBootstrap,
        body: this.buildRequestBody(body, contentType),
        headers: this.buildRequestHeaders(requestHeaders, body == null ? undefined : contentType),
      }),`,
  );

  source = source.replace(
    `    const { body, headers, contentType, method = 'GET', skipAuth, ...rest } = options;
    const authHeaders = skipAuth ? headers : this.applySdkworkAuthHeaders(headers);`,
    `    const {
      body,
      headers,
      contentType,
      method = 'GET',
      skipAuth,
      credentialEntryBootstrap,
      ...rest
    } = options;
    const authHeaders = credentialEntryBootstrap
      ? this.applyCredentialEntryBootstrapHeaders(headers)
      : skipAuth
        ? headers
        : this.applySdkworkAuthHeaders(headers);`,
  );

  source = source.replace(
    `      skipAuth,
      body: this.buildRequestBody(body, contentType),
      headers: requestHeaders,
    })) {
      if (data === '[DONE]') {`,
    `      skipAuth,
      credentialEntryBootstrap,
      body: this.buildRequestBody(body, contentType),
      headers: requestHeaders,
    })) {
      if (data === '[DONE]') {`,
  );

  writeFileSync(clientPath, source, 'utf8');
}

function patchApiFile(apiPath, operations, authMode) {
  let source = readFileSync(apiPath, 'utf8');
  const fileTag = path.basename(apiPath, '.ts');
  const suppressionFlag = authMode === CREDENTIAL_ENTRY_BOOTSTRAP_AUTH_MODE
    ? 'credentialEntryBootstrap: true'
    : 'skipAuth: true';

  for (const operation of operations) {
    if (operation.tag !== fileTag) {
      continue;
    }

    const pathPattern = generatedPathPattern(operation.apiPath);
    const appApiPathCall = `appApiPath(\`${pathPattern}\`)`;
    const escapedAppApiPathCall = escapeRegExp(appApiPathCall);
    const appApiPathMatcher = appApiPathCallRegExp(operation.apiPath);

    if (operation.method === 'POST') {
      source = source.replace(
        new RegExp(
          `return this\\.client\\.post<([^>]+)>\\((${appApiPathMatcher.source}), body, undefined, undefined, 'application/json'\\);`,
          'u',
        ),
        `return this.client.request<$1>($2, { method: 'POST' as any, body, contentType: 'application/json', ${suppressionFlag} });`,
      );
      source = source.replace(
        new RegExp(
          `return this\\.client\\.post<([^>]+)>\\(${escapedAppApiPathCall}, body, undefined, undefined, 'application/json'\\);`,
          'u',
        ),
        `return this.client.request<$1>(${appApiPathCall}, { method: 'POST' as any, body, contentType: 'application/json', ${suppressionFlag} });`,
      );
      source = source.replace(
        new RegExp(
          `(return this\\.client\\.request<[^>]+>\\((${appApiPathMatcher.source}), \\{ method: 'POST' as any,[\\s\\S]*?)(credentialEntryBootstrap: true|skipAuth: true)`,
          'u',
        ),
        `$1${suppressionFlag}`,
      );
      source = source.replace(
        new RegExp(
          `(return this\\.client\\.request<[^>]+>\\(${escapedAppApiPathCall}, \\{ method: 'POST' as any,[\\s\\S]*?)(credentialEntryBootstrap: true|skipAuth: true)`,
          'u',
        ),
        `$1${suppressionFlag}`,
      );
      continue;
    }

    if (operation.method === 'GET') {
      source = source.replace(
        new RegExp(
          `return this\\.client\\.get<([^>]+)>\\((${appApiPathMatcher.source})\\);`,
          'u',
        ),
        `return this.client.request<$1>($2, { method: 'GET' as any, ${suppressionFlag} });`,
      );
      source = source.replace(
        new RegExp(
          `return this\\.client\\.get<([^>]+)>\\(${escapedAppApiPathCall}\\);`,
          'u',
        ),
        `return this.client.request<$1>(${appApiPathCall}, { method: 'GET' as any, ${suppressionFlag} });`,
      );
      source = source.replace(
        new RegExp(
          `(return this\\.client\\.request<[^>]+>\\((${appApiPathMatcher.source}), \\{ method: 'GET' as any,[\\s\\S]*?)(credentialEntryBootstrap: true|skipAuth: true)`,
          'u',
        ),
        `$1${suppressionFlag}`,
      );
      source = source.replace(
        new RegExp(
          `(return this\\.client\\.request<[^>]+>\\(${escapedAppApiPathCall}, \\{ method: 'GET' as any,[\\s\\S]*?)(credentialEntryBootstrap: true|skipAuth: true)`,
          'u',
        ),
        `$1${suppressionFlag}`,
      );
    }
  }

  writeFileSync(apiPath, source, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('patch-iam-app-sdk-typescript-credential-entry-transport.mjs')) {
  patchIamAppSdkTypescriptCredentialEntryTransport();
  console.log('Patched IAM app SDK TypeScript credential-entry transport.');
}
