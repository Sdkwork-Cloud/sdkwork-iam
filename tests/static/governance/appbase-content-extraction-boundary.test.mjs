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

const appbaseRoot = path.resolve(import.meta.dirname, "../../..");
const currentFile = fileURLToPath(import.meta.url);

const removedContentRoots = [
  "packages/common/content",
  "packages/native-rust/content",
  "packages/pc-react/content",
  "packages/mobile-react/content",
  "packages/mobile-flutter/content",
  "packages/pc-react/content/sdkwork-drive-pc-react",
  "packages/pc-react/content/sdkwork-notes-pc-react",
  "packages/pc-react/content/sdkwork-editor-pc-react",
  "packages/pc-react/content/sdkwork-browser-pc-react",
  "packages/pc-react/content/sdkwork-canvas-pc-react",
  "packages/pc-react/content/sdkwork-terminal-pc-react",
  "packages/pc-react/content/sdkwork-assets-pc-react",
  "packages/mobile-react/content/sdkwork-drive-mobile-react",
  "packages/mobile-react/content/sdkwork-notes-mobile-react",
  "packages/mobile-react/content/sdkwork-editor-mobile-react",
  "packages/mobile-react/content/sdkwork-assets-mobile-react",
  "packages/mobile-flutter/content/sdkwork-drive-mobile-flutter",
  "packages/mobile-flutter/content/sdkwork-notes-mobile-flutter",
  "packages/mobile-flutter/content/sdkwork-editor-mobile-flutter",
  "packages/mobile-flutter/content/sdkwork-assets-mobile-flutter",
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
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/domain.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/catalog.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/domain.ts",
];

const appbaseOpenApiFiles = APPBASE_OPENAPI_CORE_FILES;
const appbaseSdkFamilyRoots = APPBASE_SDK_FAMILY_ROOTS;

const trackedContentOwnershipAllowPaths = [
  /^tests\/static\/governance\/appbase-content-extraction-boundary\.test\.mjs$/u,
  /^tests\/static\/governance\/appbase-image-extraction-boundary\.test\.mjs$/u,
  /^packages\/pc-react\/foundation\/sdkwork-appbase-pc-react\/tests\/catalog\.test\.ts$/u,
  /^packages\/mobile-react\/foundation\/sdkwork-appbase-mobile-react\/tests\/catalog\.test\.ts$/u,
  /^scripts\/governance\/discover-vite-app-roots\.mjs$/u,
];

const trackedContentOwnershipRules = [
  [
    "content-package-import",
    /@sdkwork\/(?:drive|notes|editor|browser|canvas|terminal|assets)-(?:pc-react|mobile-react|mobile-flutter)\b/iu,
  ],
  [
    "content-package-name",
    /sdkwork-(?:drive|notes|editor|browser|canvas|terminal|assets)-(?:pc-react|mobile-react|mobile-flutter)\b/iu,
  ],
  [
    "content-domain-path",
    /packages\/(?:pc-react|mobile-react|mobile-flutter)\/content\b/iu,
  ],
  [
    "content-capability-id",
    /^\s*-\s*id:\s*content-assets\s*$/imu,
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

function collectTrackedContentOwnershipViolations() {
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
      trackedContentOwnershipAllowPaths.some((pattern) => pattern.test(normalizedPath))
    ) {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(path.join(appbaseRoot, normalizedPath), "utf8");
    } catch {
      continue;
    }

    for (const [ruleName, pattern] of trackedContentOwnershipRules) {
      const match = content.match(pattern);
      if (match) {
        violations.push(`${ruleName}: ${normalizedPath}: ${match[0].slice(0, 120)}`);
      }
    }
  }

  return violations;
}

test("appbase no longer owns local content UI package roots", () => {
  const existingRoots = removedContentRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata has no content package ownership wiring", () => {
  const violations = ownershipFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /packages\/(?:pc-react|mobile-react|mobile-flutter)\/content\b/iu,
      /@sdkwork\/(?:drive|notes|editor|browser|canvas|terminal|assets)-(?:pc-react|mobile-react|mobile-flutter)\b/iu,
      /sdkwork-(?:drive|notes|editor|browser|canvas|terminal|assets)-(?:pc-react|mobile-react|mobile-flutter)\b/iu,
      /^\s*-\s*id:\s*content-assets\s*$/imu,
      /domain:\s*["']?content["']?,?\s*$/imu,
      /sdkwork-drive-app-sdk/iu,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase OpenAPI authority specs do not expose drive or notes owned operations", () => {
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

      if (
        !/(?:\/(?:drive|notes|assets|editor|browser|canvas|terminal)(?:\/|$)|\b(?:drive|notes|assets)\.(?:spaces|nodes|notebooks)|sdkwork-(?:drive|notes)-)/iu.test(
          operationText,
        )
      ) {
        return [];
      }

      return [`${relativePath}: ${method.toUpperCase()} ${routePath} ${operation?.operationId ?? ""}`];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase generated SDK outputs do not expose content resource clients or DTOs", () => {
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
      /\b(?:Drive|Notes|Assets|Editor|Browser|Canvas|Terminal)(?:Space|Node|Notebook|Asset|Workspace)[A-Za-z]*\b/u,
      /\bclient\.(?:drive|notes|assets)\b/u,
      /\/(?:app|backend|open)\/v3\/api\/(?:drive|notes|assets)\b/iu,
      /sdkwork-(?:drive|notes)-app-sdk/iu,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase tracked files do not keep hidden content ownership markers", () => {
  assert.deepEqual(collectTrackedContentOwnershipViolations(), []);
});

test("content extraction boundary test remains registered in the governance catalog", () => {
  assert.match(currentFile, /appbase-content-extraction-boundary\.test\.mjs$/u);
});
