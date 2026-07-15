import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const appRoot = path.resolve(import.meta.dirname, "../../..");

function patternMatches(permissionCode, pattern) {
  if (pattern === "*") return true;
  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -2);
    return permissionCode === prefix || permissionCode.startsWith(`${prefix}.`);
  }
  return permissionCode === pattern;
}

function collectRequiredRoutePermissions(source) {
  const routePattern = /HttpRoute::[a-z_]+\(\s*HttpMethod::([A-Za-z]+),\s*"([^"]+)",\s*"[^"]+",\s*"([^"]+)",\s*\)\s*\.with_required_permission\("([^"]+)"\)/gu;
  return [...source.matchAll(routePattern)].map((match) => ({
    method: match[1].toUpperCase(),
    path: match[2],
    operationId: match[3],
    permission: match[4],
  }));
}

function collectOpenApiOperations(document) {
  const operations = new Map();
  for (const [routePath, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!operation || typeof operation !== "object" || !operation.operationId) {
        continue;
      }
      operations.set(operation.operationId, {
        method: method.toUpperCase(),
        path: routePath,
        permission: operation["x-sdkwork-permission"],
      });
    }
  }
  return operations;
}

test("IAM app self-service permissions align across routes, OpenAPI, and app_user grants", () => {
  const routeManifest = fs.readFileSync(
    path.join(appRoot, "crates/sdkwork-routes-iam-app-api/src/manifest.rs"),
    "utf8",
  );
  const openApi = JSON.parse(
    fs.readFileSync(
      path.join(appRoot, "apis/app-api/iam/sdkwork-iam-app-api.openapi.yaml"),
      "utf8",
    ),
  );
  const moduleManifest = JSON.parse(
    fs.readFileSync(
      path.join(appRoot, "iam/modules/iam-kernel/iam.module.manifest.json"),
      "utf8",
    ),
  );
  const requiredRoutes = collectRequiredRoutePermissions(routeManifest);
  const openApiOperations = collectOpenApiOperations(openApi);
  const permissionCatalog = new Set(
    (moduleManifest.permissions?.catalog ?? []).map((entry) => entry.code),
  );
  const appUserPatterns =
    moduleManifest.roles?.roleGrantExtensions?.find(
      (entry) => entry.roleCode === "app_user",
    )?.patterns ?? [];

  assert.ok(requiredRoutes.length > 0, "expected permission-protected app routes");
  for (const route of requiredRoutes) {
    const operation = openApiOperations.get(route.operationId);
    assert.ok(operation, `missing OpenAPI operation ${route.operationId}`);
    assert.equal(operation.method, route.method, `${route.operationId} method drift`);
    assert.equal(operation.path, route.path, `${route.operationId} path drift`);
    assert.equal(
      operation.permission,
      route.permission,
      `${route.operationId} permission drift between route manifest and OpenAPI`,
    );
    assert.ok(
      permissionCatalog.has(route.permission),
      `${route.operationId} permission ${route.permission} is absent from the IAM catalog`,
    );
  }

  const currentUserOperations = [...openApiOperations.entries()].filter(
    ([operationId]) => operationId.startsWith("users.current"),
  );
  assert.ok(currentUserOperations.length > 0, "expected current-user operations");
  for (const [operationId, operation] of currentUserOperations) {
    assert.ok(operation.permission, `${operationId} must declare a permission`);
    assert.ok(
      appUserPatterns.some((pattern) => patternMatches(operation.permission, pattern)),
      `${operationId} permission ${operation.permission} must remain available to app_user`,
    );
  }
});
