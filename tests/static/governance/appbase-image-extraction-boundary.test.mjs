import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { APPBASE_OPENAPI_MATERIALIZED_FILES } from "./appbase-sdk-family-surfaces.mjs";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');

const removedImageRoots = [
  "packages/pc-react/content/sdkwork-image-pc-react",
  "packages/pc-react/content/sdkwork-generation-pc-react",
  "packages/mobile-react/content/sdkwork-image-mobile-react",
  "packages/mobile-react/content/sdkwork-generation-mobile-react",
  "packages/mobile-flutter/content/sdkwork-image-mobile-flutter",
  "packages/mobile-flutter/content/sdkwork-generation-mobile-flutter",
];

const ownershipFiles = [
  "pnpm-lock.yaml",
  "tsconfig.base.json",
  "tools/catalog/package-catalog.mjs",
  "packages/pc-react/README.md",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/catalog.ts",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/tests/catalog.test.ts",
  "packages/common/foundation/sdkwork-runtime-bootstrap/src/media.ts",
  "packages/common/foundation/sdkwork-runtime-bootstrap/tests/runtime-bootstrap.standard.test.ts",
  "packages/mobile-react/README.md",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/catalog.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/tests/catalog.test.ts",
  "packages/mobile-flutter/README.md",
  "specs/appbase-capabilities.yaml",
  "packages/mobile-react/foundation/sdkwork-command-mobile-react/tests/command.test.ts",
];

const retiredPlanningDocs = [
  "docs/superpowers/specs/2026-04-04-sdkwork-appbase-image-claw-visual-i18n-alignment-pc-react-design.md",
  "docs/superpowers/plans/2026-04-04-sdkwork-appbase-image-claw-visual-i18n-alignment-pc-react.md",
  "docs/superpowers/plans/2026-04-04-sdkwork-appbase-generation-claw-visual-i18n-alignment-pc-react.md",
];

const openApiFiles = APPBASE_OPENAPI_MATERIALIZED_FILES;

function readWorkspaceFile(relativePath) {
  return fs.readFileSync(path.join(appbaseRoot, relativePath), "utf8");
}

function parseJsonLikeOpenApi(relativePath) {
  return JSON.parse(readWorkspaceFile(relativePath));
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

test("appbase no longer owns the image PC React source package", () => {
  const existingRoots = removedImageRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata has no image package ownership wiring", () => {
  const violations = ownershipFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /@sdkwork\/image-(?:pc-react|mobile-react|flutter|mobile-flutter)/u,
      /@sdkwork\/generation-(?:pc-react|mobile-react|flutter|mobile-flutter)/u,
      /sdkwork-image-(?:pc-react|mobile-react|flutter|mobile-flutter)/u,
      /sdkwork-generation-(?:pc-react|mobile-react|flutter|mobile-flutter)/u,
      /packages\/(?:pc-react|mobile-react|mobile-flutter)\/content\/sdkwork-image-(?:pc-react|mobile-react|flutter|mobile-flutter)/u,
      /packages\/(?:pc-react|mobile-react|mobile-flutter)\/content\/sdkwork-generation-(?:pc-react|mobile-react|flutter|mobile-flutter)/u,
      /Image generation jobs, style packs, and gallery-ready output tracking/u,
      /AI generation workspaces across text, image, and reusable result history/u,
      /Unified generation queues, result provenance, and task history routing/u,
      /generated asset workspaces/u,
      /create-image|new-image|Create Image|image creation flow/u,
      /image-generation|image-edit|openai\.v1\.images|\/v1\/images|generation-history|generation-workspace|generationTaskId/u,
      /SdkworkMediaAiProvenance|sourceMediaIds|provider_asset/u,
      /"generated"\s*\|\s*"object_storage"|"external_url"\s*\|\s*"generated"/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase retired image implementation planning documents are removed", () => {
  const existingDocs = retiredPlanningDocs.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingDocs, []);
});

test("appbase OpenAPI authority specs do not expose image-owned operations", () => {
  const violations = openApiFiles.flatMap((relativePath) => {
    const document = parseJsonLikeOpenApi(relativePath);
    return collectOperations(document).flatMap(({ routePath, method, operation }) => {
      if (operation?.["x-sdkwork-domain"] !== "image") {
        return [];
      }

      return [`${relativePath}: ${method.toUpperCase()} ${routePath} ${operation.operationId}`];
    });
  });

  assert.deepEqual(violations, []);
});
