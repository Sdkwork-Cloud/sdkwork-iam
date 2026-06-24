import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { APPBASE_SDK_FAMILY_ROOTS } from "./appbase-sdk-family-surfaces.mjs";

const appbaseRoot = path.resolve(import.meta.dirname, "../../..");
const currentFile = fileURLToPath(import.meta.url);
void APPBASE_SDK_FAMILY_ROOTS;

const removedPortalRoots = [
  "packages/pc-react/system/sdkwork-home-pc-react",
  "packages/pc-react/system/sdkwork-dashboard-pc-react",
  "packages/pc-react/system/sdkwork-apps-pc-react",
  "packages/pc-react/system/sdkwork-docs-pc-react",
  "packages/pc-react/system/sdkwork-support-pc-react",
  "packages/pc-react/system/sdkwork-about-pc-react",
];

const ownershipFiles = [
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.base.json",
  "README.md",
  "specs/appbase-capabilities.yaml",
  "tools/catalog/package-catalog.mjs",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/catalog.ts",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/domain.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/catalog.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/domain.ts",
];

const trackedPortalOwnershipAllowPaths = [
  /^tests\/static\/governance\/appbase-portal-extraction-boundary\.test\.mjs$/u,
  /^tests\/static\/governance\/appbase-community-extraction-boundary\.test\.mjs$/u,
  /^packages\/pc-react\/foundation\/sdkwork-appbase-pc-react\/tests\/catalog\.test\.ts$/u,
  /^packages\/mobile-react\/foundation\/sdkwork-appbase-mobile-react\/tests\/catalog\.test\.ts$/u,
  /^packages\/pc-react\/foundation\/sdkwork-router-pc-react\/tests\/routes\.test\.ts$/u,
  /^packages\/mobile-react\/foundation\/sdkwork-router-mobile-react\/tests\/router\.test\.ts$/u,
];

const trackedPortalOwnershipRules = [
  [
    "portal-package-import",
    /@sdkwork\/(?:home|dashboard|apps|docs|support|about)-(?:pc-react|mobile-react)\b/iu,
  ],
  [
    "portal-local-package-name",
    /sdkwork-(?:home|dashboard|apps|docs|support|about)-(?:pc-react|mobile-react)\b/iu,
  ],
  [
    "portal-catalog-package-name",
    /packageName:\s*"@sdkwork\/(?:home|dashboard|apps|docs|support|about)-(?:pc-react|mobile-react)"/iu,
  ],
  [
    "mobile-scaffold-package-name",
    /packageName:\s*"@sdkwork\/(?:shell|host|host-native|runtime|settings|permission|notification|auth|user)-mobile-react"/iu,
  ],
];

function collectTrackedPortalOwnershipViolations() {
  const trackedFiles = execFileSync("git", ["ls-files"], {
    cwd: appbaseRoot,
    encoding: "utf8",
  })
    .split(/\r?\n/u)
    .filter(Boolean);
  const textFilePattern = /\.(?:ts|tsx|js|mjs|json|yaml|yml|md)$/iu;
  const skippedPathPattern = /(?:^|\/)(?:node_modules|target|dist|coverage|\.git)\//u;
  const violations = [];

  for (const relativePath of trackedFiles) {
    const normalizedPath = relativePath.replaceAll("\\", "/");
    if (
      !textFilePattern.test(normalizedPath) ||
      skippedPathPattern.test(normalizedPath) ||
      trackedPortalOwnershipAllowPaths.some((pattern) => pattern.test(normalizedPath))
    ) {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(path.join(appbaseRoot, normalizedPath), "utf8");
    } catch {
      continue;
    }

    for (const [ruleName, pattern] of trackedPortalOwnershipRules) {
      const match = content.match(pattern);
      if (match) {
        violations.push(`${ruleName}: ${normalizedPath}: ${match[0].slice(0, 120)}`);
      }
    }
  }

  return violations;
}

test("appbase no longer owns local portal shell UI package roots", () => {
  const existingRoots = removedPortalRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata has no portal shell package ownership wiring", () => {
  const violations = ownershipFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /packages\/pc-react\/system\/sdkwork-(?:home|dashboard|apps|docs|support|about)-pc-react\b/iu,
      /@sdkwork\/(?:home|dashboard|apps|docs|support|about)-(?:pc-react|mobile-react)\b/iu,
      /sdkwork-(?:home|dashboard|apps|docs|support|about)-(?:pc-react|mobile-react)\b/iu,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("tracked appbase files do not reintroduce portal shell package ownership", () => {
  const violations = collectTrackedPortalOwnershipViolations();
  assert.deepEqual(violations, []);
});

test("browser-portal preset mounts sdkwork-cloud-portal shell package names", () => {
  const catalogPath = path.join(
    appbaseRoot,
    "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/catalog.ts",
  );
  const catalog = fs.readFileSync(catalogPath, "utf8");
  assert.match(catalog, /export const SDKWORK_CLOUD_PORTAL_SHELL_PACKAGE_NAMES/u);
  assert.match(catalog, /sdkwork-pc-portal-home/u);
  assert.match(catalog, /includePackageNames: \[\.\.\.SDKWORK_CLOUD_PORTAL_SHELL_PACKAGE_NAMES\]/u);
});

test("portal extraction boundary test stays registered in the governed surface", () => {
  assert.match(currentFile, /appbase-portal-extraction-boundary\.test\.mjs$/u);
});
