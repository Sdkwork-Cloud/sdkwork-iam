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

const removedDeviceRoots = [
  "packages/common/device",
  "packages/native-rust/device",
  "packages/pc-react/device",
  "packages/mobile-react/device",
  "packages/mobile-flutter/device",
  "packages/pc-react/device/sdkwork-install-pc-react",
  "packages/pc-react/device/sdkwork-distribution-pc-react",
];

const ownershipFiles = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  "README.md",
  "specs/appbase-capabilities.yaml",
  "tools/catalog/package-catalog.mjs",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/catalog.ts",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/domain.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/catalog.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/domain.ts",
];

const trackedDeviceOwnershipAllowPaths = [
  /^tests\/static\/governance\/appbase-device-extraction-boundary\.test\.mjs$/u,
  /^tests\/static\/governance\/appbase-aiot-device-contract\.test\.mjs$/u,
  /^packages\/pc-react\/foundation\/sdkwork-appbase-pc-react\/tests\/catalog\.test\.ts$/u,
  /^packages\/mobile-react\/foundation\/sdkwork-appbase-mobile-react\/tests\/catalog\.test\.ts$/u,
];

const trackedDeviceOwnershipRules = [
  [
    "device-package-import",
    /@sdkwork\/(?:install|distribution)-pc-react\b/iu,
  ],
  [
    "device-local-package-name",
    /sdkwork-(?:install|distribution)-pc-react\b/iu,
  ],
  [
    "device-domain-path",
    /packages\/(?:pc-react|mobile-react|mobile-flutter)\/device\b/iu,
  ],
  [
    "device-catalog-capability",
    /^\s*capability:\s*"(?:install|distribution)"\s*,?\s*$/imu,
  ],
];

function collectTrackedDeviceOwnershipViolations() {
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
      trackedDeviceOwnershipAllowPaths.some((pattern) => pattern.test(normalizedPath))
    ) {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(path.join(appbaseRoot, normalizedPath), "utf8");
    } catch {
      continue;
    }

    for (const [ruleName, pattern] of trackedDeviceOwnershipRules) {
      const match = content.match(pattern);
      if (match) {
        violations.push(`${ruleName}: ${normalizedPath}: ${match[0].slice(0, 120)}`);
      }
    }
  }

  return violations;
}

test("appbase no longer owns local device install or distribution UI package roots", () => {
  const existingRoots = removedDeviceRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata has no device install/distribution package ownership wiring", () => {
  const violations = ownershipFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /packages\/(?:pc-react|mobile-react|mobile-flutter)\/device\b/iu,
      /@sdkwork\/(?:install|distribution)-pc-react\b/iu,
      /sdkwork-(?:install|distribution)-pc-react\b/iu,
      /packageName:\s*"@sdkwork\/(?:install|distribution)-pc-react"/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase tracked files do not keep hidden device install/distribution ownership markers", () => {
  assert.deepEqual(collectTrackedDeviceOwnershipViolations(), []);
});

test("device extraction boundary test remains registered in the governance catalog", () => {
  assert.match(currentFile, /appbase-device-extraction-boundary\.test\.mjs$/u);
  assert.ok(sdkFamilyRoots.length > 0);
});
