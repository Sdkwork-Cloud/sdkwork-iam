import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { APPBASE_SDK_FAMILY_ROOTS } from "./appbase-sdk-family-surfaces.mjs";

const appbaseRoot = path.resolve(import.meta.dirname, "../../..");
const currentFile = fileURLToPath(import.meta.url);
const sdkFamilyRoots = APPBASE_SDK_FAMILY_ROOTS;

const removedEcosystemRoots = [
  "packages/common/ecosystem",
  "packages/native-rust/ecosystem",
  "packages/pc-react/ecosystem",
  "packages/mobile-react/ecosystem",
  "packages/mobile-flutter/ecosystem",
  "packages/pc-react/ecosystem/sdkwork-plugin-pc-react",
  "packages/pc-react/ecosystem/sdkwork-market-pc-react",
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

const trackedEcosystemOwnershipAllowPaths = [
  /^tests\/static\/governance\/appbase-ecosystem-extraction-boundary\.test\.mjs$/u,
  /^packages\/pc-react\/foundation\/sdkwork-appbase-pc-react\/tests\/catalog\.test\.ts$/u,
  /^packages\/mobile-react\/foundation\/sdkwork-appbase-mobile-react\/tests\/catalog\.test\.ts$/u,
];

const trackedEcosystemOwnershipRules = [
  [
    "ecosystem-package-import",
    /@sdkwork\/(?:plugin|market)-pc-react\b/iu,
  ],
  [
    "ecosystem-local-package-name",
    /sdkwork-(?:plugin|market)-pc-react\b/iu,
  ],
  [
    "ecosystem-domain-path",
    /packages\/(?:pc-react|mobile-react|mobile-flutter)\/ecosystem\b/iu,
  ],
];

function collectTrackedEcosystemOwnershipViolations() {
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
      trackedEcosystemOwnershipAllowPaths.some((pattern) => pattern.test(normalizedPath))
    ) {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(path.join(appbaseRoot, normalizedPath), "utf8");
    } catch {
      continue;
    }

    for (const [ruleName, pattern] of trackedEcosystemOwnershipRules) {
      const match = content.match(pattern);
      if (match) {
        violations.push(`${ruleName}: ${normalizedPath}: ${match[0].slice(0, 120)}`);
      }
    }
  }

  return violations;
}

test("appbase no longer owns local ecosystem market or plugin UI package roots", () => {
  const existingRoots = removedEcosystemRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata has no ecosystem package ownership wiring", () => {
  const violations = ownershipFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /packages\/(?:pc-react|mobile-react|mobile-flutter)\/ecosystem\b/iu,
      /@sdkwork\/(?:plugin|market)-pc-react\b/iu,
      /sdkwork-(?:plugin|market)-pc-react\b/iu,
      /packages\/pc-react\/ecosystem\/sdkwork-(?:plugin|market)-pc-react/iu,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase tracked files do not keep hidden ecosystem ownership markers", () => {
  assert.deepEqual(collectTrackedEcosystemOwnershipViolations(), []);
});

test("ecosystem extraction boundary test remains registered in the governance catalog", () => {
  assert.match(currentFile, /appbase-ecosystem-extraction-boundary\.test\.mjs$/u);
  assert.ok(sdkFamilyRoots.length > 0);
});
