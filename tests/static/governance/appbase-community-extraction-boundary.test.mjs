import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  APPBASE_OPENAPI_MATERIALIZED_FILES,
  APPBASE_SDK_FAMILY_ROOTS,
} from "./appbase-sdk-family-surfaces.mjs";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');

const removedCommunityRoots = [
  "packages/pc-react/community/sdkwork-community-pc-react",
];

const ownershipFiles = [
  "tsconfig.base.json",
  "pnpm-lock.yaml",
  "tools/catalog/package-catalog.mjs",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/catalog.ts",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/tests/catalog.test.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/catalog.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/tests/catalog.test.ts",
];

const sdkFamilies = APPBASE_SDK_FAMILY_ROOTS;

const openApiFiles = APPBASE_OPENAPI_MATERIALIZED_FILES;

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

function parseJsonLikeOpenApi(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(appbaseRoot, relativePath), "utf8"));
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

test("appbase no longer owns the community PC React source package", () => {
  const existingRoots = removedCommunityRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata has no community package ownership wiring", () => {
  const violations = ownershipFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /@sdkwork\/community-pc-react/u,
      /@sdkwork\/community-mobile-react/u,
      /sdkwork-community-pc-react/u,
      /sdkwork-community-mobile-react/u,
      /capability:\s*["']community["']/u,
      /packageName:\s*["']@sdkwork\/community-pc-react["']/u,
      /packageName:\s*["']@sdkwork\/community-mobile-react["']/u,
      /Community posts, public discussions, and recommendations/u,
      /Public discussions, recommendation rails, and moderation-aware post routing/u,
      /Public discussions, recommendation rails, and moderation-aware routing/u,
      /\bkind:\s*["']community["']/u,
      /\bid:\s*["']community["']/u,
      /\/support\/community\b/u,
      /Community Support/u,
      /Discord Community/u,
      /discord-community/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase OpenAPI authority specs do not expose community operations", () => {
  const violations = openApiFiles.flatMap((relativePath) => {
    const document = parseJsonLikeOpenApi(relativePath);
    return collectOperations(document).flatMap(({ routePath, method, operation }) => {
      const operationText = `${routePath} ${operation?.operationId ?? ""} ${operation?.["x-sdkwork-domain"] ?? ""}`;
      if (!/(?:\/(?:app|backend)\/v3\/api\/community\b|\/community\/v3\/api\b|\bcommunity(?:\.|_|$))/iu.test(operationText)) {
        return [];
      }

      return [`${relativePath}: ${method.toUpperCase()} ${routePath} ${operation.operationId}`];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase generated SDK outputs do not expose community resource clients", () => {
  const files = sdkFamilies.flatMap((familyRoot) =>
    collectTextFiles(path.join(appbaseRoot, familyRoot)).filter((filePath) =>
      filePath.includes(`${path.sep}generated${path.sep}server-openapi${path.sep}`) ||
      filePath.includes(`${path.sep}src${path.sep}`),
    ),
  );

  const violations = files.flatMap((filePath) => {
    const relativePath = path.relative(appbaseRoot, filePath).replaceAll("\\", "/");
    const content = fs.readFileSync(filePath, "utf8");
    const patterns = [
      /\bCommunity[A-Za-z]*Api\b/u,
      /\bclient\.community\b/u,
      /\/(?:app|backend)\/v3\/api\/community\b/u,
      /\/community\/v3\/api\b/u,
      /@sdkwork\/community-pc-react/u,
      /sdkwork-community-pc-react/u,
    ];

    return patterns.flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0]}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});
