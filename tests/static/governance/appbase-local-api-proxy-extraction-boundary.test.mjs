import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const appbaseRoot = path.resolve(import.meta.dirname, "../../..");
const removedIntelligenceDomain = "intelligence";
const removedLocalApiProxyPackage = "sdkwork-local-api-proxy";
const removedLocalApiProxyRoot = path.join(
  "packages",
  "pc-react",
  removedIntelligenceDomain,
  removedLocalApiProxyPackage,
);

const ownershipFiles = [
  "pnpm-lock.yaml",
  "tsconfig.base.json",
  "tools/catalog/package-catalog.mjs",
  "tests/static/governance/appbase-image-extraction-boundary.test.mjs",
  "tests/static/governance/appbase-search-extraction-boundary.test.mjs",
];

const retiredLocalApiProxyDocs = [
  "docs/superpowers/specs/2026-04-18-sdkwork-appbase-local-api-proxy-design.md",
  "docs/superpowers/plans/2026-04-18-sdkwork-appbase-local-api-proxy.md",
];

test("appbase no longer owns the local API proxy package root", () => {
  const existingRoots = [removedLocalApiProxyRoot].filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata has no local API proxy package wiring", () => {
  const violations = ownershipFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /@sdkwork\/local-api-proxy/u,
      /sdkwork-local-api-proxy/u,
      new RegExp(String.raw`packages\/pc-react\/${removedIntelligenceDomain}\/${removedLocalApiProxyPackage}`, "u"),
      /localApiProxy/u,
      /local-api-proxy\.db/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase retired local API proxy implementation documents are removed", () => {
  const existingDocs = retiredLocalApiProxyDocs.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingDocs, []);
});
