import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  APPBASE_OPENAPI_MATERIALIZED_FILES,
  APPBASE_SDK_FAMILY_ROOTS,
} from "./appbase-sdk-family-surfaces.mjs";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');

const removedCourseRoots = [
  "packages/common/course",
  "packages/native-rust/course",
  "packages/pc-react/course",
  "packages/mobile-react/course",
  "packages/mobile-flutter/course",
];

const ownershipFiles = [
  "package.json",
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

const sdkFamilies = APPBASE_SDK_FAMILY_ROOTS;

const openApiFiles = APPBASE_OPENAPI_MATERIALIZED_FILES;

function readWorkspaceFile(relativePath) {
  return fs.readFileSync(path.join(appbaseRoot, relativePath), "utf8");
}

function parseJsonLikeOpenApi(relativePath) {
  return JSON.parse(readWorkspaceFile(relativePath));
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
      entry.name === "build"
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

test("appbase no longer owns course source packages or placeholder architecture domains", () => {
  const existingRoots = removedCourseRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata has no course package ownership wiring", () => {
  const violations = ownershipFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /packages\/(?:common|native-rust|pc-react|mobile-react|mobile-flutter)\/course/u,
      /@sdkwork\/course-[a-z-]*/u,
      /run-course-standard-contracts/u,
      /test:course-standard-contracts/u,
      /^\s*-\s*id:\s*course\s*$/mu,
      /^\s*domain:\s*["']?course["']?,?\s*$/mu,
      /owner:\s*sdkwork-appbase[\s\S]{0,500}course/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase OpenAPI authority specs do not expose course operations", () => {
  const violations = openApiFiles.flatMap((relativePath) => {
    const document = parseJsonLikeOpenApi(relativePath);
    return collectOperations(document).flatMap(({ routePath, method, operation }) => {
      const operationText = `${routePath} ${operation?.operationId ?? ""} ${operation?.["x-sdkwork-domain"] ?? ""}`;
      if (!/\bcourse(?:s|_|\.|\/|$)/iu.test(operationText)) {
        return [];
      }

      return [`${relativePath}: ${method.toUpperCase()} ${routePath} ${operation.operationId}`];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase generated SDK outputs do not expose course resource clients", () => {
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
      /\bCourse[A-Za-z]*Api\b/u,
      /\bcourse(?:Applications|Categories|Lessons|Relations|Sections|Comments|Engagement)\b/u,
      /\bclient\.course\b/u,
      /\/(?:app|backend)\/v3\/api\/(?:course|courses|course_applications|course_categories|course_lessons|course_relations|course_sections|course_comments|course_engagement)\b/u,
    ];

    return patterns.flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0]}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});
