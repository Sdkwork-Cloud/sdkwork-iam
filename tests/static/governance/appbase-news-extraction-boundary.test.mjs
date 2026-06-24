import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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

const removedNewsRoots = [
  "packages/common/news",
  "packages/native-rust/news",
  "packages/pc-react/news",
  "packages/mobile-react/news",
  "packages/mobile-flutter/news",
  "apps/sdkwork-news-pc",
  "crates/sdkwork-news-core-rust",
  "crates/sdkwork-news-http-rust",
  "crates/sdkwork-news-storage-sqlx-rust",
];

const ownershipFiles = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  "README.md",
  "specs/appbase-capabilities.yaml",
  "tools/catalog/package-catalog.mjs",
  "scripts/run-appbase-test-suite.mjs",
  "tools/generators/materialize-appbase-v3-openapi-boundaries.mjs",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/catalog.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/catalog.ts",
];

const appbaseOpenApiFiles = APPBASE_OPENAPI_CORE_FILES;

const appbaseSdkFamilyRoots = APPBASE_SDK_FAMILY_ROOTS;

const trackedNewsOwnershipAllowPaths = [
  /^tests\/static\/governance\/appbase-news-extraction-boundary\.test\.mjs$/u,
];

const trackedNewsOwnershipRules = [
  [
    "news-package-import",
    /@sdkwork\/(?:news|news-contracts|news-service|news-runtime|news-sdk-ports|news-app-sdk|news-backend-sdk)(?:\b|-)/iu,
  ],
  [
    "news-package-name",
    /sdkwork-news(?:\b|-)/iu,
  ],
  [
    "news-api-path",
    /\/(?:app|backend|open)\/v3\/api\/(?:news|items|channels|topics|trending|breaking-alerts|live-events|fact-checks|corrections|digests|recommendations)\b/iu,
  ],
  [
    "news-table",
    /\bnews_(?:item|category|channel|topic|source|author|media|comment|reaction|favorite|follow|feed|alert|digest|fact|correction|live|search|trend|recommendation|moderation|experiment|notification|metric|trust|version)\b/iu,
  ],
  [
    "news-domain-label",
    /\b(?:NewsApi|News(?:Item|Category|Channel|Topic|Source|Author|Feed|Alert|Digest|Live|Fact|Correction|Recommendation|Moderation|Notification)[A-Za-z]*(?:Service|Repository|Controller|Route|Client)?|newsroom|breaking news|news feed|live event|fact check|correction notice|source trust)\b/iu,
  ],
  [
    "news-chinese-label",
    /新闻|资讯|头条|快讯|热榜|专题|事实核查|更正声明/u,
  ],
];

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
      entry.name === "build" ||
      entry.name === "coverage"
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

function collectTrackedNewsOwnershipViolations() {
  const trackedFiles = execFileSync("git", ["ls-files"], {
    cwd: appbaseRoot,
    encoding: "utf8",
  })
    .split(/\r?\n/u)
    .filter(Boolean);
  const textFilePattern = /\.(?:ts|tsx|js|mjs|json|yaml|yml|md|rs|toml|sql|proto|java|py|php|cs|go|kt|swift|dart)$/iu;
  const skippedPathPattern = /(?:^|\/)(?:node_modules|target|dist|coverage|\.git)\//u;
  const violations = [];

  for (const relativePath of trackedFiles) {
    const normalizedPath = relativePath.replaceAll("\\", "/");
    if (
      !textFilePattern.test(normalizedPath) ||
      skippedPathPattern.test(normalizedPath) ||
      trackedNewsOwnershipAllowPaths.some((pattern) => pattern.test(normalizedPath))
    ) {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(path.join(appbaseRoot, normalizedPath), "utf8");
    } catch {
      continue;
    }

    for (const [ruleName, pattern] of trackedNewsOwnershipRules) {
      const match = content.match(pattern);
      if (match) {
        violations.push(`${ruleName}: ${normalizedPath}: ${match[0].slice(0, 120)}`);
      }
    }
  }

  return violations;
}

test("appbase no longer owns local news source, Rust storage, or UI package roots", () => {
  const existingRoots = removedNewsRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata has no news package ownership wiring", () => {
  const violations = ownershipFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /packages\/(?:common|native-rust|pc-react|mobile-react|mobile-flutter)\/news/iu,
      /apps\/sdkwork-news/iu,
      /crates\/sdkwork-news/iu,
      /@sdkwork\/news(?:\b|-)/iu,
      /sdkwork-news(?:\b|-)/iu,
      /^\s*-\s*id:\s*news\s*$/imu,
      /^\s*domain:\s*["']?news["']?,?\s*$/imu,
      /owner:\s*sdkwork-appbase[\s\S]{0,500}news/iu,
      /\/news\b/iu,
      /新闻|资讯|头条/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase OpenAPI authority specs do not expose news operations", () => {
  const violations = appbaseOpenApiFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const document = JSON.parse(readWorkspaceFile(relativePath));
    return collectOperations(document).flatMap(({ routePath, method, operation }) => {
      const operationText = [
        routePath,
        operation?.operationId,
        operation?.["x-sdkwork-domain"],
        operation?.["x-sdkwork-owner"],
        operation?.["x-sdkwork-resource"],
      ].join(" ");

      if (!/(?:\/news(?:\/|$)|\bnews(?:\.|_|$)|sdkwork-news|新闻|资讯|头条)/iu.test(operationText)) {
        return [];
      }

      return [`${relativePath}: ${method.toUpperCase()} ${routePath} ${operation?.operationId ?? ""}`];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase generated SDK outputs do not expose news resource clients or DTOs", () => {
  const files = appbaseSdkFamilyRoots.flatMap((familyRoot) =>
    collectTextFiles(path.join(appbaseRoot, familyRoot)).filter((filePath) =>
      filePath.includes(`${path.sep}generated${path.sep}server-openapi${path.sep}`) ||
      filePath.includes(`${path.sep}src${path.sep}`),
    ),
  );

  const violations = files.flatMap((filePath) => {
    const relativePath = toRelative(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    return [
      /\bNews[A-Za-z]*Api\b/u,
      /\bclient\.news\b/u,
      /\bNews(?:Item|Category|Channel|Topic|Source|Author|Feed|Alert|Digest|Live|Fact|Correction|Recommendation|Moderation|Notification)[A-Za-z]*\b/u,
      /\/(?:app|backend|open)\/v3\/api\/news\b/iu,
      /sdkwork-news/iu,
      /新闻|资讯|头条/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase Rust storage and migrations do not retain news database schema", () => {
  const rustFiles = collectTextFiles(path.join(appbaseRoot, "packages/native-rust")).filter((filePath) =>
    /\.(?:rs|toml|sql|md|json)$/iu.test(filePath),
  );

  const violations = rustFiles.flatMap((filePath) => {
    const relativePath = toRelative(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    return [
      /\bnews\.(?:repository|storage|migration)\b/iu,
      /\bnews_(?:item|category|channel|topic|source|author|media|comment|reaction|favorite|follow|feed|alert|digest|fact|correction|live|search|trend|recommendation|moderation|experiment|notification|metric|trust|version)\b/iu,
      /\bsdkwork_news[A-Za-z_]*\b/iu,
      /\bNews(?:Item|Category|Channel|Topic|Source|Author|Feed|Alert|Digest|Live|Fact|Correction|Recommendation|Moderation|Notification)[A-Za-z]*\b/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase tracked files do not keep hidden news ownership markers", () => {
  assert.deepEqual(collectTrackedNewsOwnershipViolations(), []);
});
