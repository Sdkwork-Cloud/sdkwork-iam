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
  const appPath = openApiPath.replace(/^\/app\/v3\/api/u, "");
  return appPath
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
  return `sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-typescript/generated/server-openapi/src/api/${tag}.ts`;
}

function listStoredCredentialSuppressedOperations(openApi) {
  return Object.entries(openApi.paths).flatMap(([apiPath, pathItem]) => (
    Object.entries(pathItem)
      .filter(([, operation]) => {
        const authMode = operation["x-sdkwork-auth-mode"];
        return authMode === "anonymous" || authMode === "refresh-token";
      })
      .map(([method, operation]) => ({
        apiPath,
        method: method.toUpperCase(),
        operationId: operation.operationId,
        tag: operation.tags?.[0],
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
    "packages/pc-react/foundation/sdkwork-shell-pc-react/tests/shell.runtime.test.tsx",
  ]) {
    assertNoRetiredGenericSdkDebt(relativePath);
  }
});

test("appbase app SDK generated auth entry operations suppress stored credentials end to end", () => {
  const openApi = JSON.parse(read("sdks/sdkwork-appbase-app-sdk/openapi/sdkwork-appbase-app-api.sdkgen.yaml"));
  const authApi = read(
    "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-typescript/generated/server-openapi/src/api/auth.ts",
  );
  const httpClient = read(
    "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-typescript/generated/server-openapi/src/http/client.ts",
  );

  const suppressedOperations = listStoredCredentialSuppressedOperations(openApi);
  assert.ok(
    suppressedOperations.some((operation) => operation.operationId === "sessions.create"),
    "session creation must stay anonymous and suppress stored credentials",
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
    assert.match(
      generatedApi,
      new RegExp(
        `appApiPath\\(\`${generatedPathPattern(operation.apiPath)}\`\\)[\\s\\S]{0,360}skipAuth: true`,
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
    /protected buildHeaders\(config: any, skipAuth = false\): Record<string, string> \{[\s\S]*config\?\.skipAuth[\s\S]*'Authorization'[\s\S]*'Access-Token'[\s\S]*'X-Sdkwork-Tenant-Id'[\s\S]*'X-Sdkwork-Organization-Id'[\s\S]*'X-Sdkwork-User-Id'/u,
    "generated HTTP client must strip stored credential and SDKWork context headers when skipAuth is set",
  );
  assert.match(
    httpClient,
    /execute\.call\(this, \{[\s\S]*skipAuth,[\s\S]*headers: this\.buildRequestHeaders/u,
    "generated request transport must pass skipAuth into BaseHttpClient.execute",
  );
  assert.match(
    httpClient,
    /stream\.call\(this, path, \{[\s\S]*skipAuth,[\s\S]*headers: requestHeaders/u,
    "generated stream transport must pass skipAuth into BaseHttpClient.stream",
  );
});

test("appbase app SDK OpenAPI declares real session creation context fields", () => {
  const openApi = JSON.parse(read("sdks/sdkwork-appbase-app-sdk/openapi/sdkwork-appbase-app-api.sdkgen.yaml"));
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
  const checks = [
    {
      language: "dart",
      api: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-dart/generated/server-openapi/lib/src/api/auth.dart",
      http: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-dart/generated/server-openapi/lib/src/http/client.dart",
      apiPatterns: [
        /ApiPaths\.appPath\('\/auth\/sessions'\)[\s\S]*skipAuth: true/u,
        /ApiPaths\.appPath\('\/auth\/sessions\/refresh'\)[\s\S]*skipAuth: true/u,
      ],
      httpPatterns: [
        /_buildHeaders\(headers,[\s\S]*skipAuth: skipAuth\)/u,
        /if \(!skipAuth\)[\s\S]*_authToken[\s\S]*Access-Token/u,
      ],
    },
    {
      language: "flutter",
      api: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-flutter/generated/server-openapi/lib/src/api/auth.dart",
      http: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-flutter/generated/server-openapi/lib/src/http/client.dart",
      apiPatterns: [
        /ApiPaths\.appPath\('\/auth\/sessions'\)[\s\S]*skipAuth: true/u,
        /ApiPaths\.appPath\('\/auth\/sessions\/refresh'\)[\s\S]*skipAuth: true/u,
      ],
      httpPatterns: [
        /bool skipAuth = false[\s\S]*if \(!skipAuth\) \.\.\.headers/u,
        /bool skipAuth = false[\s\S]*if \(!skipAuth\) \.\.\.this\.headers/u,
      ],
    },
    {
      language: "python",
      api: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-python/generated/server-openapi/sdkwork_appbase_app_sdk/api/auth.py",
      http: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-python/generated/server-openapi/sdkwork_appbase_app_sdk/http_client.py",
      apiPatterns: [
        /\/app\/v3\/api\/auth\/sessions", json=body, skip_auth=True/u,
        /\/app\/v3\/api\/auth\/sessions\/refresh", json=body, skip_auth=True/u,
      ],
      httpPatterns: [
        /def _request_session\(self, skip_auth: bool = False\):[\s\S]*if not skip_auth:[\s\S]*return self\._get_session\(\)[\s\S]*session\.headers\.clear\(\)/u,
        /headers=self\._request_headers\(\{'Accept': 'text\/event-stream'[\s\S]*skip_auth\)/u,
      ],
    },
    {
      language: "go",
      api: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-go/generated/server-openapi/api/auth.go",
      http: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-go/generated/server-openapi/http/client.go",
      apiPatterns: [
        /AppApiPath\("\/auth\/sessions"\)[\s\S]*"application\/json", true\)/u,
        /AppApiPath\("\/auth\/sessions\/refresh"\)[\s\S]*"application\/json", true\)/u,
      ],
      httpPatterns: [
        /func \(c \*Client\) mergeHeaders\(requestHeaders map\[string\]string, skipAuth bool\)[\s\S]*if !skipAuth/u,
        /mergedHeaders := c\.mergeHeaders\(requestHeaders, skipAuth\)/u,
      ],
    },
    {
      language: "java",
      api: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-java/generated/server-openapi/src/main/java/com/sdkwork/appbase/app/sdk/api/AuthApi.java",
      http: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-java/generated/server-openapi/src/main/java/com/sdkwork/appbase/app/sdk/http/HttpClient.java",
      apiPatterns: [
        /ApiPaths\.appPath\("\/auth\/sessions"\)[\s\S]*"application\/json", true\)/u,
        /ApiPaths\.appPath\("\/auth\/sessions\/refresh"\)[\s\S]*"application\/json", true\)/u,
      ],
      httpPatterns: [
        /applyHeaders\(Request\.Builder builder, Map<String, String> requestHeaders, boolean skipAuth\)[\s\S]*skipAuth \? new HashMap<>\(\) : new HashMap<>\(headers\)/u,
        /applyHeaders\(new Request\.Builder\(\), requestHeaders, skipAuth\)/u,
      ],
    },
    {
      language: "kotlin",
      api: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-kotlin/generated/server-openapi/src/main/kotlin/com/sdkwork/appbase/app/sdk/api/AuthApi.kt",
      http: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-kotlin/generated/server-openapi/src/main/kotlin/com/sdkwork/appbase/app/sdk/http/HttpClient.kt",
      apiPatterns: [
        /ApiPaths\.appPath\("\/auth\/sessions"\)[\s\S]*"application\/json", true\)/u,
        /ApiPaths\.appPath\("\/auth\/sessions\/refresh"\)[\s\S]*"application\/json", true\)/u,
      ],
      httpPatterns: [
        /mergeHeaders\(requestHeaders: Map<String, String>\? = null, skipAuth: Boolean = false\)[\s\S]*if \(!skipAuth\) headers\.toMutableMap\(\) else mutableMapOf\(\)/u,
        /\.headers\(mergeHeaders\(requestHeaders, skipAuth\)\)/u,
      ],
    },
    {
      language: "csharp",
      api: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-csharp/generated/server-openapi/Api/AuthApi.cs",
      http: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-csharp/generated/server-openapi/Http/HttpClient.cs",
      apiPatterns: [
        /ApiPaths\.AppPath\("\/auth\/sessions"\)[\s\S]*"application\/json", true\)/u,
        /ApiPaths\.AppPath\("\/auth\/sessions\/refresh"\)[\s\S]*"application\/json", true\)/u,
      ],
      httpPatterns: [
        /private async Task<HttpResponseMessage> SendAsync\(HttpRequestMessage request, bool skipAuth = false\)[\s\S]*if \(!skipAuth\)[\s\S]*anonymousClient/u,
        /SendAsync\(request, skipAuth\)/u,
      ],
    },
    {
      language: "swift",
      api: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-swift/generated/server-openapi/Sources/API/AuthApi.swift",
      http: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-swift/generated/server-openapi/Sources/HTTP/HttpClient.swift",
      apiPatterns: [
        /ApiPaths\.appPath\("\/auth\/sessions"\)[\s\S]*skipAuth: true/u,
        /ApiPaths\.appPath\("\/auth\/sessions\/refresh"\)[\s\S]*skipAuth: true/u,
      ],
      httpPatterns: [
        /skipAuth: Bool = false[\s\S]*if !skipAuth[\s\S]*for \(key, value\) in headers/u,
        /applyHeaders\(&request, requestHeaders: requestHeaders[\s\S]*skipAuth: skipAuth\)/u,
      ],
    },
    {
      language: "rust",
      api: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-rust/generated/server-openapi/src/api/auth.rs",
      http: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-rust/generated/server-openapi/src/http/client.rs",
      apiPatterns: [
        /app_path\(&"\/auth\/sessions"\.to_string\(\)\)[\s\S]*Some\("application\/json"\), true\)\.await/u,
        /app_path\(&"\/auth\/sessions\/refresh"\.to_string\(\)\)[\s\S]*Some\("application\/json"\), true\)\.await/u,
      ],
      httpPatterns: [
        /fn merge_headers\(&self, headers: Option<&RequestHeaders>, skip_auth: bool\)[\s\S]*if !skip_auth/u,
        /self\.merge_headers\(headers, skip_auth\)\?/u,
      ],
    },
    {
      language: "php",
      api: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-php/generated/server-openapi/src/Api/Auth.php",
      http: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-php/generated/server-openapi/src/Http/HttpClient.php",
      apiPatterns: [
        /\/auth\/sessions'[\s\S]*'skipAuth' => true/u,
        /\/auth\/sessions\/refresh'[\s\S]*'skipAuth' => true/u,
      ],
      httpPatterns: [
        /\$clientHeaders = empty\(\$options\['skipAuth'\]\)[\s\S]*array_merge\(\$this->buildAuthHeaders\(\), \$this->headers\)/u,
        /\$clientHeaders,/u,
      ],
    },
    {
      language: "ruby",
      api: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-ruby/generated/server-openapi/lib/sdkwork/app_sdk/api/auth.rb",
      http: "sdks/sdkwork-appbase-app-sdk/sdkwork-appbase-app-sdk-ruby/generated/server-openapi/lib/sdkwork/app_sdk/http/client.rb",
      apiPatterns: [
        /\/auth\/sessions'[\s\S]*options\[:skip_auth\] = true/u,
        /\/auth\/sessions\/refresh'[\s\S]*options\[:skip_auth\] = true/u,
      ],
      httpPatterns: [
        /def build_headers\(request_headers, skip_auth: false\)[\s\S]*client_headers = skip_auth \? \{\} : auth_headers\.merge\(@headers\)/u,
        /build_headers\(headers, skip_auth: skip_auth\)/u,
      ],
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

test("open-api generated ingress operations stay anonymous and suppress stored credentials", () => {
  const openApi = JSON.parse(read("sdks/sdkwork-appbase-open-sdk/openapi/sdkwork-appbase-open-api.sdkgen.yaml"));
  const oauthApi = read(
    "sdks/sdkwork-appbase-open-sdk/sdkwork-appbase-open-sdk-typescript/generated/server-openapi/src/api/iam-oauth.ts",
  );

  const anonymousOperations = Object.entries(openApi.paths).flatMap(([apiPath, pathItem]) => (
    Object.entries(pathItem)
      .filter(([, operation]) => operation["x-sdkwork-auth-mode"] === "anonymous")
      .map(([method, operation]) => ({
        apiPath,
        method: method.toUpperCase(),
        operationId: operation.operationId,
      }))
  ));

  assert.equal(anonymousOperations.length, 2, "open-api must expose two anonymous OAuth provider callback operations");
  assert.ok(
    anonymousOperations.every((operation) => operation.apiPath.includes("/oauth/provider_callbacks/")),
    "anonymous open-api operations must remain OAuth provider callback ingress only",
  );
  assert.match(
    oauthApi,
    /async handleGet\([\s\S]*skipAuth:\s*true/u,
    "open-api GET provider callback must suppress stored credentials",
  );
  assert.match(
    oauthApi,
    /async handlePost\([\s\S]*skipAuth:\s*true/u,
    "open-api POST provider callback must suppress stored credentials",
  );
});
