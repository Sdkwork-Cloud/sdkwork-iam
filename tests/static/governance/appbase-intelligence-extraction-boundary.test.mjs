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

const removedIntelligenceRoots = [
  "packages/pc-react/intelligence",
  "packages/mobile-react/intelligence",
  "packages/mobile-flutter/intelligence",
  "packages/pc-react/intelligence/sdkwork-chat-pc-react",
  "packages/pc-react/intelligence/sdkwork-llm-pc-react",
  "packages/pc-react/intelligence/sdkwork-models-pc-react",
  "packages/pc-react/intelligence/sdkwork-agent-pc-react",
  "packages/pc-react/intelligence/sdkwork-prompt-pc-react",
  "packages/pc-react/intelligence/sdkwork-memory-pc-react",
  "packages/pc-react/intelligence/sdkwork-knowledge-pc-react",
  "packages/pc-react/intelligence/sdkwork-mcp-pc-react",
  "packages/pc-react/intelligence/sdkwork-tools-pc-react",
  "packages/pc-react/intelligence/sdkwork-skills-pc-react",
  "packages/pc-react/intelligence/sdkwork-workflow-pc-react",
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

const trackedIntelligenceOwnershipAllowPaths = [
  /^tests\/static\/governance\/appbase-intelligence-extraction-boundary\.test\.mjs$/u,
  /^packages\/pc-react\/foundation\/sdkwork-appbase-pc-react\/tests\/catalog\.test\.ts$/u,
  /^packages\/mobile-react\/foundation\/sdkwork-appbase-mobile-react\/tests\/catalog\.test\.ts$/u,
  /^packages\/common\/intelligence\//u,
  /^tests\/static\/governance\/appbase-local-api-proxy-extraction-boundary\.test\.mjs$/u,
];

const trackedIntelligenceOwnershipRules = [
  [
    "intelligence-package-import",
    /@sdkwork\/(?:chat|llm|models|agent|workflow|knowledge|memory|skills|prompt|tools|mcp)-pc-react\b/iu,
  ],
  [
    "intelligence-local-package-name",
    /sdkwork-(?:chat|llm|models|agent|workflow|knowledge|memory|skills|prompt|tools|mcp)-pc-react\b/iu,
  ],
  [
    "intelligence-domain-path",
    /packages\/(?:pc-react|mobile-react|mobile-flutter)\/intelligence\b/iu,
  ],
  [
    "intelligence-catalog-capability",
    /^\s*capability:\s*"(?:chat|llm|models|agent|workflow|knowledge|memory|skills|prompt|tools|mcp)"\s*,?\s*$/imu,
  ],
];

function collectTrackedIntelligenceOwnershipViolations() {
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
      trackedIntelligenceOwnershipAllowPaths.some((pattern) => pattern.test(normalizedPath))
    ) {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(path.join(appbaseRoot, normalizedPath), "utf8");
    } catch {
      continue;
    }

    for (const [ruleName, pattern] of trackedIntelligenceOwnershipRules) {
      const match = content.match(pattern);
      if (match) {
        violations.push(`${ruleName}: ${normalizedPath}: ${match[0].slice(0, 120)}`);
      }
    }
  }

  return violations;
}

test("appbase no longer owns local intelligence UI package roots", () => {
  const existingRoots = removedIntelligenceRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata has no intelligence UI package ownership wiring", () => {
  const violations = ownershipFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /packages\/(?:pc-react|mobile-react|mobile-flutter)\/intelligence\b/iu,
      /@sdkwork\/(?:chat|llm|models|agent|workflow|knowledge|memory|skills|prompt|tools|mcp)-pc-react\b/iu,
      /sdkwork-(?:chat|llm|models|agent|workflow|knowledge|memory|skills|prompt|tools|mcp)-pc-react\b/iu,
      /packages\/pc-react\/intelligence\/sdkwork-chat-pc-react/iu,
      /pnpm --filter @sdkwork\/chat-pc-react typecheck/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase tracked files do not keep hidden intelligence UI ownership markers", () => {
  assert.deepEqual(collectTrackedIntelligenceOwnershipViolations(), []);
});

test("intelligence extraction boundary test remains registered in the governance catalog", () => {
  assert.match(currentFile, /appbase-intelligence-extraction-boundary\.test\.mjs$/u);
  assert.ok(sdkFamilyRoots.length > 0);
});
