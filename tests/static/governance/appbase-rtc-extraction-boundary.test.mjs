import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');
const currentFile = fileURLToPath(import.meta.url);

const removedRtcRoots = [
  "packages/pc-react/rtc/sdkwork-rtc-pc-react",
  "packages/mobile-react/rtc/sdkwork-rtc-mobile-react",
  "packages/mobile-flutter/rtc/sdkwork-rtc-mobile-flutter",
  "packages/native-rust/rtc/sdkwork-rtc",
];

const allowedBoundaryFiles = new Set([
  "tests/static/governance/appbase-rtc-extraction-boundary.test.mjs",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/tests/catalog.test.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/tests/catalog.test.ts",
]);

const forbiddenRtcPatterns = [
  /@sdkwork\/rtc-sdk/u,
  /@sdkwork\/rtc-(?:pc|mobile)-react/u,
  /sdkwork-rtc-sdk/u,
  /sdkwork-rtc-(?:pc|mobile)-react/u,
  /sdkwork-react-backend-rtc/u,
  /sdkwork-space[\\/]sdkwork-rtc/u,
  /sdkwork-im[\\/]sdks[\\/]sdkwork-rtc-sdk/u,
];

function toRelative(filePath) {
  return path.relative(appbaseRoot, filePath).replaceAll("\\", "/");
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
      entry.name === ".git" ||
      entry.name === "node_modules" ||
      entry.name === ".pnpm-store" ||
      entry.name === "target" ||
      entry.name === "dist" ||
      entry.name === "build"
    ) {
      return [];
    }

    return collectTextFiles(path.join(targetPath, entry.name));
  });
}

function readWorkspaceFile(relativePath) {
  return fs.readFileSync(path.join(appbaseRoot, relativePath), "utf8");
}

test("appbase no longer owns local RTC source packages", () => {
  const existingRoots = removedRtcRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata and lockfile do not wire RTC SDKs", () => {
  const files = [
    "package.json",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "tsconfig.base.json",
    ".npmrc",
  ];
  const violations = files.flatMap((relativePath) => {
    const content = readWorkspaceFile(relativePath);
    return forbiddenRtcPatterns.flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0]}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase source files do not consume RTC packages or local RTC paths", () => {
  const files = collectTextFiles(appbaseRoot)
    .filter((filePath) => filePath !== currentFile)
    .filter((filePath) => path.basename(filePath) !== "pnpm-lock.yaml")
    .filter((filePath) => /\.(?:ts|tsx|js|mjs|json|md|yaml|yml|rs|toml|dart)$/u.test(filePath));

  const violations = files.flatMap((filePath) => {
    const relativePath = toRelative(filePath);
    if (allowedBoundaryFiles.has(relativePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, "utf8");
    return forbiddenRtcPatterns.flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0]}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});
