import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  APPBASE_OPENAPI_CORE_FILES,
  APPBASE_SDK_FAMILY_ROOTS,
} from "./appbase-sdk-family-surfaces.mjs";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');
const currentFile = fileURLToPath(import.meta.url);

const removedSearchRoots = [
  "packages/common/search",
  "packages/native-rust/search",
  "packages/pc-react/foundation/sdkwork-search-pc-react",
  "packages/mobile-react/foundation/sdkwork-search-mobile-react",
  "packages/mobile-flutter/foundation/sdkwork-search-mobile-flutter",
];

const allowedSearchConsumerFiles = new Set([
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/tests/catalog.test.ts",
  "packages/mobile-react/foundation/sdkwork-command-mobile-react/package.json",
  "packages/mobile-react/foundation/sdkwork-command-mobile-react/src/command.ts",
  "packages/mobile-react/foundation/sdkwork-command-mobile-react/tests/command.test.ts",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/tests/catalog.test.ts",
  "packages/pc-react/foundation/sdkwork-command-pc-react/package.json",
  "packages/pc-react/foundation/sdkwork-command-pc-react/src/commandRegistry.ts",
  "packages/pc-react/foundation/sdkwork-command-pc-react/tests/commandRegistry.test.ts",
  "packages/pc-react/iam/sdkwork-user-pc-react/package.json",
  "packages/pc-react/iam/sdkwork-user-pc-react/src/user.ts",
  "packages/pc-react/system/sdkwork-settings-pc-react/package.json",
  "packages/pc-react/system/sdkwork-settings-pc-react/src/settingsRegistry.ts",
]);

const appbaseOpenApiFiles = APPBASE_OPENAPI_CORE_FILES;

const appbaseSdkFamilyRoots = APPBASE_SDK_FAMILY_ROOTS;

function toRelative(filePath) {
  return path.relative(appbaseRoot, filePath).replaceAll("\\", "/");
}

function readWorkspaceFile(relativePath) {
  return fs.readFileSync(path.join(appbaseRoot, relativePath), "utf8");
}

function collectTextFiles(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return [];
  }

  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return [targetPath];
  }

  return fs.readdirSync(targetPath, { withFileTypes: true }).flatMap((entry) => {
    if (
      entry.name === "node_modules" ||
      entry.name === "target" ||
      entry.name === ".git" ||
      entry.name === "dist" ||
      entry.name === "build"
    ) {
      return [];
    }

    return collectTextFiles(path.join(targetPath, entry.name));
  });
}

function collectOperations(document) {
  const operations = [];
  for (const [routePath, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!["get", "post", "patch", "put", "delete"].includes(method)) {
        continue;
      }
      operations.push({ routePath, method, operation });
    }
  }
  return operations;
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

test("appbase no longer owns local search source, Rust storage, or Flutter package roots", () => {
  const existingRoots = removedSearchRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata only links external search packages required by active consumers", () => {
  const workspace = readWorkspaceFile("pnpm-workspace.yaml");
  const tsconfig = readWorkspaceFile("tsconfig.base.json");

  assert.match(workspace, /sdkwork-search\/packages\/common\/search\/sdkwork-search-contracts/u);
  assert.match(workspace, /sdkwork-search\/packages\/pc-react\/foundation\/sdkwork-search-pc-react/u);
  assert.match(workspace, /sdkwork-search\/packages\/mobile-react\/foundation\/sdkwork-search-mobile-react/u);
  assert.doesNotMatch(workspace, /sdkwork-search-service/u);

  assert.match(tsconfig, /"@sdkwork\/search-contracts"/u);
  assert.match(tsconfig, /"@sdkwork\/search-pc-react"/u);
  assert.match(tsconfig, /"@sdkwork\/search-mobile-react"/u);
  assert.doesNotMatch(tsconfig, /"@sdkwork\/search-service"/u);
});

test("appbase package manifests do not declare search ownership or unused search-service dependencies", () => {
  const packageJsonFiles = collectTextFiles(path.join(appbaseRoot, "packages"))
    .filter((filePath) => path.basename(filePath) === "package.json");

  const violations = packageJsonFiles.flatMap((filePath) => {
    const relativePath = toRelative(filePath);
    const pkg = readJsonFile(filePath);
    const text = fs.readFileSync(filePath, "utf8");
    const result = [];

    if (pkg.sdkwork?.workspace === "sdkwork-appbase" && pkg.sdkwork?.capability === "search") {
      result.push(`${relativePath}: sdkwork-appbase search capability ownership`);
    }

    if (/@sdkwork\/search-(?:contracts|service)/u.test(text)) {
      result.push(`${relativePath}: appbase package depends on common search package`);
    }

    if (/@sdkwork\/search-(?:pc-react|mobile-react)/u.test(text) && !allowedSearchConsumerFiles.has(relativePath)) {
      result.push(`${relativePath}: unexpected search UI package dependency`);
    }

    return result;
  });

  assert.deepEqual(violations, []);
});

test("appbase source references external search UI packages only from active consumers", () => {
  const files = collectTextFiles(appbaseRoot)
    .filter((filePath) => filePath !== currentFile)
    .filter((filePath) => /\.(ts|tsx|js|mjs|json|md|yaml|yml)$/u.test(filePath));

  const violations = files.flatMap((filePath) => {
    const relativePath = toRelative(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    const result = [];

    if (/@sdkwork\/search-service|sdkwork-search-service/u.test(content)) {
      result.push(`${relativePath}: search-service is not consumed by appbase`);
    }

    if (/@sdkwork\/search-(?:pc-react|mobile-react)/u.test(content) && !allowedSearchConsumerFiles.has(relativePath)) {
      const isWorkspaceMapping =
        relativePath === "pnpm-workspace.yaml" ||
        relativePath === "pnpm-lock.yaml" ||
        relativePath === "tsconfig.base.json";
      if (!isWorkspaceMapping) {
        result.push(`${relativePath}: unexpected search UI package reference`);
      }
    }

    return result;
  });

  assert.deepEqual(violations, []);
});

test("appbase OpenAPI and generated SDK outputs do not expose search-owned API resources", () => {
  const openApiViolations = appbaseOpenApiFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const document = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    return collectOperations(document).flatMap(({ routePath, method, operation }) => {
      const operationText = [
        routePath,
        operation?.operationId,
        operation?.["x-sdkwork-domain"],
        operation?.["x-sdkwork-owner"],
        operation?.["x-sdkwork-resource"],
      ].join(" ");

      if (!/(?:\/search(?:\/|$)|\bsearch(?:\.|_|$)|sdkwork-search)/iu.test(operationText)) {
        return [];
      }

      return [`${relativePath}: ${method.toUpperCase()} ${routePath} ${operation?.operationId ?? ""}`];
    });
  });

  const generatedFiles = appbaseSdkFamilyRoots.flatMap((familyRoot) =>
    collectTextFiles(path.join(appbaseRoot, familyRoot)).filter((filePath) =>
      filePath.includes(`${path.sep}generated${path.sep}server-openapi${path.sep}`) ||
      filePath.includes(`${path.sep}src${path.sep}`),
    ),
  );

  const generatedViolations = generatedFiles.flatMap((filePath) => {
    const relativePath = toRelative(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    return [
      /\bSearch[A-Za-z]*Api\b/u,
      /\bclient\.search\b/u,
      /\/(?:app|backend)\/v3\/api\/search\b/u,
      /sdkwork-search/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0]}`] : [];
    });
  });

  assert.deepEqual([...openApiViolations, ...generatedViolations], []);
});
