import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');

function read(relativePath) {
  return readFileSync(path.join(appbaseRoot, relativePath), "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function generatedPathPattern(openApiPath) {
  const relativePath = openApiPath.replace(/^\/(?:app|backend)\/v3\/api/u, "");
  return relativePath
    .split(/(\{[^}]+\})/u)
    .map((part) => {
      if (/^\{[^}]+\}$/u.test(part)) {
        return String.raw`\$\{serializePathParameter\([\s\S]*?\)\}`;
      }
      return escapeRegExp(part);
    })
    .join("");
}

function generatedApiFileForTag(tag) {
  return `sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-typescript/generated/server-openapi/src/api/${tag}.ts`;
}

function listStoredCredentialSuppressedOperations(openApi) {
  return Object.entries(openApi.paths).flatMap(([apiPath, pathItem]) => (
    Object.entries(pathItem)
      .filter(([, operation]) => {
        const authMode = operation["x-sdkwork-auth-mode"];
        return authMode === "anonymous"
          || authMode === "refresh-token"
          || authMode === "credential-entry-bootstrap";
      })
      .map(([method, operation]) => ({
        apiPath,
        method: method.toUpperCase(),
        operationId: operation.operationId,
        tag: operation.tags?.[0],
        authMode: operation["x-sdkwork-auth-mode"],
      }))
  ));
}

function assertNoRetiredGenericSdkDebt(relativePath) {
  const retiredFragments = [
    ["@sdkwork/", "app-sdk"].join(""),
    ["@sdkwork/", "backend-sdk"].join(""),
    ["sdkwork-", "app-sdk"].join(""),
    ["sdkwork-", "backend-sdk"].join(""),
    ["sdkwork-sdk-", "app"].join(""),
    ["sdkwork-sdk-", "backend"].join(""),
    ["magic-studio-v2/packages/", "sdkwork-", "app-sdk"].join(""),
  ];
  assert.doesNotMatch(
    read(relativePath),
    new RegExp(retiredFragments.join("|"), "u"),
    `${relativePath} must not reference the retired generic SDK packages.`,
  );
}

test("appbase workspace does not depend on retired generic app or backend SDK packages", () => {
  for (const relativePath of [
    "tsconfig.base.json",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
  ]) {
    assertNoRetiredGenericSdkDebt(relativePath);
  }
});

test("appbase app SDK generated auth entry operations suppress stored credentials end to end", () => {
  const openApi = JSON.parse(read("sdks/sdkwork-iam-app-sdk/openapi/sdkwork-iam-app-api.sdkgen.yaml"));
  const authApi = read(
    "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-typescript/generated/server-openapi/src/api/auth.ts",
  );
  const httpClient = read(
    "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-typescript/generated/server-openapi/src/http/client.ts",
  );

  const suppressedOperations = listStoredCredentialSuppressedOperations(openApi);
  assert.ok(
    suppressedOperations.some((operation) => operation.operationId === "sessions.create"),
    "session creation must stay credential-entry-bootstrap and suppress stored credentials",
  );
  assert.ok(
    suppressedOperations.some((operation) => operation.operationId === "sessions.refresh"),
    "session refresh must suppress stored credentials",
  );
  assert.ok(
    Object.values(openApi.paths).some((pathItem) => Object.values(pathItem).some((operation) => (
      operation["x-sdkwork-forbid-credential-headers"] === true
    ))),
    "OpenAPI must mark credential-entry operations that forbid inbound credential headers",
  );

  for (const operation of suppressedOperations) {
    assert.ok(operation.tag, `${operation.operationId} must declare a generated API tag`);
    const generatedApi = read(generatedApiFileForTag(operation.tag));
    const suppressionFlag = operation.authMode === "anonymous" || operation.authMode === "refresh-token"
      ? "skipAuth: true"
      : "accessTokenOnly: true";
    assert.match(
      generatedApi,
      new RegExp(
        `appApiPath\\(\`${generatedPathPattern(operation.apiPath)}\`\\)[\\s\\S]{0,360}${escapeRegExp(suppressionFlag)}`,
        "u",
      ),
      `${operation.method} ${operation.apiPath} (${operation.operationId}) must suppress stored credentials in generated TypeScript SDK`,
    );
  }

  assert.doesNotMatch(
    authApi,
    /appApiPath\(`\/auth\/sessions\/current`\)[\s\S]{0,160}skipAuth: true/u,
    "current-session operations must stay protected and must not suppress auth",
  );

  assert.match(
    httpClient,
    /protected buildHeaders\(config: any, skipAuth = false\): Record<string, string> \{[\s\S]*config\?\.accessTokenOnly[\s\S]*stripCredentialHeaders\(headers, true\)/u,
    "generated HTTP client must strip forbidden credential-entry headers while preserving bootstrap Access-Token",
  );
  assert.match(
    httpClient,
    /protected buildHeaders\(config: any, skipAuth = false\): Record<string, string> \{[\s\S]*!skipAuth && !config\?\.skipAuth[\s\S]*stripCredentialHeaders\(headers, false\)/u,
    "generated HTTP client must strip stored credential and SDKWork context headers when skipAuth is set",
  );
  assert.match(
    httpClient,
    /stripCredentialHeaders\([\s\S]*preserveAccessToken[\s\S]*'Access-Token'[\s\S]*'Authorization'[\s\S]*'X-Sdkwork-Tenant-Id'[\s\S]*'X-Sdkwork-Organization-Id'[\s\S]*'X-Sdkwork-User-Id'/u,
    "generated HTTP client must centrally remove every SDKWork credential and context header",
  );
  assert.match(
    httpClient,
    /execute\.call\(this, \{[\s\S]*skipAuth,[\s\S]*accessTokenOnly,[\s\S]*headers: preparedHeaders/u,
    "generated request transport must pass skipAuth and accessTokenOnly into BaseHttpClient.execute",
  );
  assert.match(
    httpClient,
    /stream\.call\(this, path, \{[\s\S]*skipAuth,[\s\S]*accessTokenOnly,[\s\S]*headers: requestHeaders/u,
    "generated stream transport must pass skipAuth and accessTokenOnly into BaseHttpClient.stream",
  );
});

test("appbase backend SDK bootstrap-body operations suppress stored credentials end to end", () => {
  const openApi = JSON.parse(read(
    "sdks/sdkwork-iam-backend-sdk/openapi/sdkwork-iam-backend-api.sdkgen.yaml",
  ));
  const iamApi = read(
    "sdks/sdkwork-iam-backend-sdk/sdkwork-iam-backend-sdk-typescript/generated/server-openapi/src/api/iam.ts",
  );
  const operations = Object.entries(openApi.paths).flatMap(([apiPath, pathItem]) => (
    Object.entries(pathItem)
      .filter(([, operation]) => operation["x-sdkwork-auth-mode"] === "bootstrap-body")
      .map(([method, operation]) => ({ apiPath, method, operation }))
  ));

  assert.deepEqual(
    operations.map(({ operation }) => operation.operationId).sort(),
    [
      "accessCredentials.create",
      "applications.register",
      "serviceAccountTokens.create",
      "tenantApplications.create",
      "tenantApplications.enable",
      "tenantApplications.update",
    ],
  );
  for (const { apiPath, method, operation } of operations) {
    assert.deepEqual(
      operation.security,
      [],
      `${method.toUpperCase()} ${apiPath} must not declare header authentication`,
    );
    assert.equal(
      operation["x-sdkwork-forbid-credential-headers"],
      true,
      `${method.toUpperCase()} ${apiPath} must reject stored credential contamination`,
    );
    assert.match(
      iamApi,
      new RegExp(
        `backendApiPath\\(\`${generatedPathPattern(apiPath)}\`\\)[\\s\\S]{0,360}skipAuth: true`,
        "u",
      ),
      `${operation.operationId} must suppress stored credentials in generated TypeScript SDK`,
    );
  }
});

test("appbase app SDK OpenAPI declares real session creation context fields", () => {
  const openApi = JSON.parse(read("sdks/sdkwork-iam-app-sdk/openapi/sdkwork-iam-app-api.sdkgen.yaml"));
  const sessionCreateOperation = openApi.paths["/app/v3/api/auth/sessions"].post;
  const requestSchema =
    sessionCreateOperation.requestBody.content["application/json"].schema;
  const sessionCreateSchema =
    openApi.components.schemas.AppbaseSessionCreateCommand;

  assert.deepEqual(requestSchema, {
    $ref: "#/components/schemas/AppbaseSessionCreateCommand",
  });
  assert.equal(sessionCreateSchema.type, "object");
  assert.equal(sessionCreateSchema.additionalProperties, true);
  assert.equal(sessionCreateSchema.properties.tenantId.type, "string");
  assert.equal(sessionCreateSchema.properties.organizationId.type, "string");
  assert.equal(
    sessionCreateSchema.properties.tenantId.description,
    "Verified tenant id supplied by an external user-center session exchange after upstream identity validation.",
  );
  assert.equal(
    sessionCreateSchema.properties.organizationId.description,
    "Verified organization id supplied by an external user-center session exchange when the upstream identity resolved an organization scope.",
  );
  assert.ok(
    !sessionCreateSchema.required?.includes("tenantId"),
    "normal credential login must still derive tenant from IAM data instead of request input",
  );
});

test("appbase app SDK generated credential suppression stays aligned across language SDKs", () => {
  const transportCredentialPolicy = /(?=[\s\S]*(?:access-token-only request requires Access-Token before request dispatch|URLError\(\.userAuthenticationRequired\)))(?=[\s\S]*x-sdkwork-organization-id)[\s\S]*/iu;
  const checks = [
    {
      language: "dart",
      api: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-dart/generated/server-openapi/lib/src/api/auth.dart",
      http: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-dart/generated/server-openapi/lib/src/http/client.dart",
      apiPatterns: [
        /ApiPaths\.appPath\('\/auth\/sessions'\)[\s\S]*accessTokenOnly: true/u,
        /ApiPaths\.appPath\('\/auth\/sessions\/refresh'\)[\s\S]*skipAuth: true/u,
      ],
      httpPatterns: [transportCredentialPolicy],
    },
    {
      language: "flutter",
      api: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-flutter/generated/server-openapi/lib/src/api/auth.dart",
      http: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-flutter/generated/server-openapi/lib/src/http/client.dart",
      apiPatterns: [
        /ApiPaths\.appPath\('\/auth\/sessions'\)[\s\S]*accessTokenOnly: true/u,
        /ApiPaths\.appPath\('\/auth\/sessions\/refresh'\)[\s\S]*skipAuth: true/u,
      ],
      httpPatterns: [transportCredentialPolicy],
    },
    {
      language: "python",
      api: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-python/generated/server-openapi/sdkwork_iam_app_sdk/api/auth.py",
      http: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-python/generated/server-openapi/sdkwork_iam_app_sdk/http_client.py",
      apiPatterns: [
        /\/app\/v3\/api\/auth\/sessions", json=body, access_token_only=True/u,
        /\/app\/v3\/api\/auth\/sessions\/refresh", json=body, skip_auth=True/u,
      ],
      httpPatterns: [transportCredentialPolicy],
    },
    {
      language: "go",
      api: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-go/generated/server-openapi/api/auth.go",
      http: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-go/generated/server-openapi/http/client.go",
      apiPatterns: [
        /AppApiPath\("\/auth\/sessions"\)[\s\S]*"application\/json", false, true\)/u,
        /AppApiPath\("\/auth\/sessions\/refresh"\)[\s\S]*"application\/json", true, false\)/u,
      ],
      httpPatterns: [transportCredentialPolicy],
    },
    {
      language: "java",
      api: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-java/generated/server-openapi/src/main/java/com/sdkwork/iam/app/sdk/api/AuthApi.java",
      http: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-java/generated/server-openapi/src/main/java/com/sdkwork/iam/app/sdk/http/HttpClient.java",
      apiPatterns: [
        /ApiPaths\.appPath\("\/auth\/sessions"\)[\s\S]*"application\/json", false, true\)/u,
        /ApiPaths\.appPath\("\/auth\/sessions\/refresh"\)[\s\S]*"application\/json", true, false\)/u,
      ],
      httpPatterns: [transportCredentialPolicy],
    },
    {
      language: "kotlin",
      api: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-kotlin/generated/server-openapi/src/main/kotlin/com/sdkwork/iam/app/sdk/api/AuthApi.kt",
      http: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-kotlin/generated/server-openapi/src/main/kotlin/com/sdkwork/iam/app/sdk/http/HttpClient.kt",
      apiPatterns: [
        /ApiPaths\.appPath\("\/auth\/sessions"\)[\s\S]*"application\/json", false, true\)/u,
        /ApiPaths\.appPath\("\/auth\/sessions\/refresh"\)[\s\S]*"application\/json", true, false\)/u,
      ],
      httpPatterns: [transportCredentialPolicy],
    },
    {
      language: "csharp",
      api: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-csharp/generated/server-openapi/Api/AuthApi.cs",
      http: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-csharp/generated/server-openapi/Http/HttpClient.cs",
      apiPatterns: [
        /ApiPaths\.AppPath\("\/auth\/sessions"\)[\s\S]*"application\/json", false, true\)/u,
        /ApiPaths\.AppPath\("\/auth\/sessions\/refresh"\)[\s\S]*"application\/json", true, false\)/u,
      ],
      httpPatterns: [transportCredentialPolicy],
    },
    {
      language: "swift",
      api: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-swift/generated/server-openapi/Sources/API/AuthApi.swift",
      http: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-swift/generated/server-openapi/Sources/HTTP/HttpClient.swift",
      apiPatterns: [
        /ApiPaths\.appPath\("\/auth\/sessions"\)[\s\S]*accessTokenOnly: true/u,
        /ApiPaths\.appPath\("\/auth\/sessions\/refresh"\)[\s\S]*skipAuth: true/u,
      ],
      httpPatterns: [transportCredentialPolicy],
    },
    {
      language: "rust",
      api: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-rust/generated/server-openapi/src/api/auth.rs",
      http: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-rust/generated/server-openapi/src/http/client.rs",
      apiPatterns: [
        /app_path\(&"\/auth\/sessions"\.to_string\(\)\)[\s\S]*Some\("application\/json"\), false, true\)\.await/u,
        /app_path\(&"\/auth\/sessions\/refresh"\.to_string\(\)\)[\s\S]*Some\("application\/json"\), true, false\)\.await/u,
      ],
      httpPatterns: [transportCredentialPolicy],
    },
    {
      language: "php",
      api: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-php/generated/server-openapi/src/Api/Auth.php",
      http: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-php/generated/server-openapi/src/Http/HttpClient.php",
      apiPatterns: [
        /\/auth\/sessions'[\s\S]*'accessTokenOnly' => true/u,
        /\/auth\/sessions\/refresh'[\s\S]*'skipAuth' => true/u,
      ],
      httpPatterns: [transportCredentialPolicy],
    },
    {
      language: "ruby",
      api: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-ruby/generated/server-openapi/lib/sdkwork/app_sdk/api/auth.rb",
      http: "sdks/sdkwork-iam-app-sdk/sdkwork-iam-app-sdk-ruby/generated/server-openapi/lib/sdkwork/app_sdk/http/client.rb",
      apiPatterns: [
        /\/auth\/sessions'[\s\S]*options\[:access_token_only\] = true/u,
        /\/auth\/sessions\/refresh'[\s\S]*options\[:skip_auth\] = true/u,
      ],
      httpPatterns: [transportCredentialPolicy],
    },
  ];

  for (const check of checks) {
    const api = read(check.api);
    const http = read(check.http);
    for (const pattern of check.apiPatterns) {
      assert.match(api, pattern, `${check.language} generated API must pass credential suppression for auth entry routes`);
    }
    for (const pattern of check.httpPatterns) {
      assert.match(http, pattern, `${check.language} generated transport must enforce credential suppression`);
    }
  }
});

test("open-api generated ingress operations preserve auth classification and suppress stored credentials", () => {
  const openApiAuthority = JSON.parse(read("apis/open-api/iam/sdkwork-iam-open-api.openapi.yaml"));
  const openApi = JSON.parse(read("sdks/sdkwork-iam-open-sdk/openapi/sdkwork-iam-open-api.sdkgen.yaml"));
  const oauthApi = read(
    "sdks/sdkwork-iam-open-sdk/sdkwork-iam-open-sdk-typescript/generated/server-openapi/src/api/iam-oauth.ts",
  );

  const authorityAnonymousOperations = Object.entries(openApiAuthority.paths).flatMap(([apiPath, pathItem]) => (
    Object.entries(pathItem)
      .filter(([, operation]) => operation["x-sdkwork-auth-mode"] === "anonymous")
      .map(([method, operation]) => ({
        apiPath,
        method: method.toUpperCase(),
        operationId: operation.operationId,
      }))
  ));

  const anonymousOperations = Object.entries(openApi.paths).flatMap(([apiPath, pathItem]) => (
    Object.entries(pathItem)
      .filter(([, operation]) => operation["x-sdkwork-auth-mode"] === "anonymous")
      .map(([method, operation]) => ({
        apiPath,
        method: method.toUpperCase(),
        operationId: operation.operationId,
      }))
  ));

  const providerCallbackOperations = Object.entries(openApi.paths).flatMap(([apiPath, pathItem]) => (
    Object.entries(pathItem)
      .filter(([, operation]) => (
        apiPath.includes("/oauth/provider_callbacks/")
        && operation["x-sdkwork-wire-protocol"] === "external"
      ))
      .map(([method, operation]) => ({
        apiPath,
        method: method.toUpperCase(),
        operationId: operation.operationId,
        authMode: operation["x-sdkwork-auth-mode"],
        externalProtocolId: operation["x-sdkwork-external-protocol-id"],
        security: operation.security,
      }))
  ));
  const authorityWellKnownOperations = Object.entries(openApiAuthority.paths)
    .filter(([apiPath]) => apiPath.startsWith("/.well-known/"))
    .flatMap(([apiPath, pathItem]) => (
      Object.entries(pathItem).map(([method, operation]) => ({
        apiPath,
        method: method.toUpperCase(),
        operationId: operation.operationId,
      }))
    ));

  assert.deepEqual(
    providerCallbackOperations.map((operation) => operation.externalProtocolId).sort(),
    ["wechat-provider-callback", "wechat-provider-callback-verification"],
    "open-api must expose the two external WeChat provider callback protocols",
  );
  assert.ok(
    providerCallbackOperations.every((operation) => (
      operation.authMode === "open-api-flexible"
      && JSON.stringify(operation.security) === JSON.stringify([{ ApiKey: [] }, { OAuthBearer: [] }])
    )),
    "external provider callbacks must preserve open-api-flexible authentication",
  );
  assert.equal(
    anonymousOperations.length,
    7,
    "open-api SDK input must expose seven anonymous SDKWork OAuth authorization-server operations under /iam/v3/api",
  );
  assert.deepEqual(
    anonymousOperations,
    authorityAnonymousOperations,
    "anonymous auth classification must stay identical between authority and SDK input",
  );
  assert.equal(
    authorityWellKnownOperations.length,
    2,
    "open-api authority must retain well-known OAuth discovery routes for runtime ingress",
  );
  assert.ok(
    authorityWellKnownOperations.every((operation) => (
      openApiAuthority.paths?.[operation.apiPath]?.get?.["x-sdkwork-wire-protocol"] === "external"
    )),
    "well-known discovery routes must declare x-sdkwork-wire-protocol: external on the API authority",
  );
  assert.ok(
    anonymousOperations.every((operation) => operation.apiPath.startsWith("/iam/v3/api/")),
    "anonymous authorization-server SDK operations must stay under /iam/v3/api",
  );
  assert.ok(
    anonymousOperations.every((operation) => operation.apiPath.startsWith("/iam/v3/api/")),
    "anonymous open-api SDK operations must stay under the IAM open-api prefix",
  );
  assert.match(
    oauthApi,
    /customApiPath\(`\/oauth\/provider_callbacks\/\$\{serializePathParameter\(callbackPublicId,[\s\S]{0,420}method: 'GET' as any, skipAuth: true/u,
    "open-api GET provider callback must suppress stored credentials",
  );
  assert.match(
    oauthApi,
    /customApiPath\(`\/oauth\/provider_callbacks\/\$\{serializePathParameter\(callbackPublicId,[\s\S]{0,520}method: 'POST' as any,[\s\S]{0,100}skipAuth: true/u,
    "open-api POST provider callback must suppress stored credentials",
  );
  assert.match(
    oauthApi,
    /customApiPath\(`\/oauth\/token`\)[\s\S]*skipAuth:\s*true/u,
    "open-api token endpoint must suppress stored credentials",
  );
  assert.match(
    oauthApi,
    /customApiPath\(`\/system\/oauth\/openid_configuration`\)[\s\S]*skipAuth:\s*true/u,
    "open-api OIDC discovery endpoint must suppress stored credentials",
  );
});
