import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  APPBASE_OPENAPI_CORE_FILES,
  APPBASE_SDK_FAMILY_ROOTS,
} from "./appbase-sdk-family-surfaces.mjs";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');

const removedCommentsRoots = [
  "packages/common/comments",
  "packages/native-rust/comments",
  "packages/pc-react/comments/sdkwork-comments-pc-react",
  "packages/mobile-react/comments/sdkwork-comments-mobile-react",
  "packages/mobile-flutter/comments/sdkwork-comments-mobile-flutter",
  "packages/pc-react/communication/sdkwork-comments-pc-react",
  "packages/mobile-react/communication/sdkwork-comments-mobile-react",
  "packages/mobile-flutter/communication/sdkwork-comments-mobile-flutter",
];

const appbaseOpenApiFiles = APPBASE_OPENAPI_CORE_FILES;

const appbaseSdkFamilyRoots = APPBASE_SDK_FAMILY_ROOTS;

const rootWiringFiles = [
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "tsconfig.base.json",
  "Cargo.toml",
];

const activeSourceRoots = ["packages", "scripts", "specs", "sdks"];
const repositoryScanRoots = [
  "README.md",
  "docs",
  "packages",
  "scripts",
  "specs",
  "sdks",
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "tsconfig.base.json",
  "Cargo.toml",
];

const textFilePattern =
  /\.(?:ts|tsx|js|mjs|cjs|json|yaml|yml|rs|toml|md|ps1|java|kt|go|py|rb|php|cs|swift|dart)$/iu;

const activeCommentsResidualPatterns = [
  /\bcommentCount\b/u,
  /\bcanComment\b/u,
  /\bcommentText\b/u,
  /"empty-comment"/u,
  /@sdkwork\/comments(?:-|\/|\b)/iu,
  /sdkwork-comments/iu,
  /\bcomments_(?:thread|comment|reaction|favorite|visit|engagement|moderation)\b/iu,
  /\bComments[A-Za-z]*(?:Api|Service|Repository|Storage|Controller|Route|Client|Response|Request|Thread|Reaction|Moderation)\b/u,
  /\bcomments\.(?:threads|comments|reactions|engagement|moderation)\b/u,
  /\/(?:app|backend)\/v3\/api\/comments\b/iu,
];

const strongCommentsResidualPatterns = [
  /@sdkwork\/comments(?:-|\/|\b)/iu,
  /sdkwork-comments/iu,
  /\bsdkwork_comments_storage_sqlx\b/u,
  /\bcomments_(?:thread|comment|reaction|favorite|visit|engagement|moderation)\b/iu,
  /\/(?:app|backend)\/v3\/api\/comments\b/iu,
  /packages[\\/](?:common|native-rust)[\\/]comments\b/iu,
  /packages[\\/](?:pc-react|mobile-react|mobile-flutter)[\\/](?:comments|communication)[\\/]sdkwork-comments-[a-z-]+\b/iu,
  /\bcommentCount\b/u,
  /\bcanComment\b/u,
  /\bcommentText\b/u,
  /"empty-comment"/u,
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

function isAllowedActiveResidualFile(relativePath) {
  return (
    relativePath === "tests/static/governance/appbase-comments-extraction-boundary.test.mjs" ||
    relativePath === "specs/appbase-capabilities.yaml" ||
    /^tests\/static\/governance\/appbase-[a-z0-9-]+-extraction-boundary\.test\.mjs$/u.test(relativePath)
  );
}

function isTextRepositoryFile(relativePath) {
  return (
    textFilePattern.test(relativePath) ||
    [
      "README.md",
      "package.json",
      "pnpm-workspace.yaml",
      "pnpm-lock.yaml",
      "tsconfig.base.json",
      "Cargo.toml",
    ].includes(relativePath)
  );
}

test("appbase no longer owns local comments source, Rust storage, or UI package roots", () => {
  const existingRoots = removedCommentsRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase capability catalog externalizes comments to sdkwork-comments", () => {
  const catalog = readWorkspaceFile("specs/appbase-capabilities.yaml");

  assert.match(catalog, /id:\s*comments[\s\S]{0,240}status:\s*externalized[\s\S]{0,240}owner:\s*sdkwork-comments/u);
  assert.match(catalog, /externalRepository:\s*\.\.\/sdkwork-comments/u);
  assert.match(catalog, /id:\s*comments[\s\S]{0,360}scope:[\s\S]{0,240}-\s*engagement/u);
  assert.match(catalog, /id:\s*comments[\s\S]{0,420}scope:[\s\S]{0,300}-\s*visit-history/u);
  assert.doesNotMatch(catalog, /Appbase must own[\s\S]{0,160}\bcomments?\b/iu);
});

test("appbase social package is no longer present for comments engagement logic", () => {
  const files = [
    "packages/pc-react/social/sdkwork-social-pc-react/src/social.ts",
    "packages/pc-react/social/sdkwork-social-pc-react/tests/social.test.ts",
    "packages/pc-react/communication/sdkwork-social-pc-react/src/social.ts",
    "packages/pc-react/communication/sdkwork-social-pc-react/tests/social.test.ts",
  ];

  const violations = files.flatMap((relativePath) => {
    if (!fs.existsSync(path.join(appbaseRoot, relativePath))) {
      return [];
    }

    const content = readWorkspaceFile(relativePath);
    return [
      /\bcommentCount\b/u,
      /\bcanComment\b/u,
      /\bcommentText\b/u,
      /"empty-comment"/u,
      /"comment"/u,
      /\bcomments?\b/iu,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0]}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase root workspace files do not wire comments packages or crates", () => {
  const violations = rootWiringFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = readWorkspaceFile(relativePath);
    return [
      /@sdkwork\/comments(?:-|\/|\b)/iu,
      /sdkwork-comments/iu,
      /packages[\\/](?:common|native-rust)[\\/]comments\b/iu,
      /packages[\\/]pc-react[\\/]comments[\\/]sdkwork-comments-pc-react\b/iu,
      /packages[\\/]mobile-react[\\/]comments[\\/]sdkwork-comments-mobile-react\b/iu,
      /packages[\\/]mobile-flutter[\\/]comments[\\/]sdkwork-comments-mobile-flutter\b/iu,
      /packages[\\/]pc-react[\\/]communication[\\/]sdkwork-comments-pc-react\b/iu,
      /packages[\\/]mobile-react[\\/]communication[\\/]sdkwork-comments-mobile-react\b/iu,
      /packages[\\/]mobile-flutter[\\/]communication[\\/]sdkwork-comments-mobile-flutter\b/iu,
      /\bsdkwork_comments_storage_sqlx\b/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase OpenAPI authority specs do not expose comments operations", () => {
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

      if (!/(?:\/comments(?:\/|$)|\bcomments?(?:\.|_|$)|sdkwork-comments)/iu.test(operationText)) {
        return [];
      }

      return [`${relativePath}: ${method.toUpperCase()} ${routePath} ${operation?.operationId ?? ""}`];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase generated SDK outputs do not expose comments resource clients or DTOs", () => {
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
      /\bComments?[A-Za-z]*Api\b/u,
      /\bclient\.comments?\b/u,
      /\/(?:app|backend)\/v3\/api\/comments\b/iu,
      /sdkwork-comments/iu,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase active source does not retain comments business residuals", () => {
  const files = activeSourceRoots.flatMap((root) => collectTextFiles(path.join(appbaseRoot, root)));

  const violations = files.flatMap((filePath) => {
    const relativePath = toRelative(filePath);
    if (!textFilePattern.test(relativePath)) {
      return [];
    }
    if (relativePath.includes("/generated/server-openapi/")) {
      return [];
    }
    if (isAllowedActiveResidualFile(relativePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, "utf8");
    return activeCommentsResidualPatterns.flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase repository text keeps comments references only in extraction governance and external capability catalog", () => {
  const files = repositoryScanRoots.flatMap((root) => collectTextFiles(path.join(appbaseRoot, root)));

  const violations = files.flatMap((filePath) => {
    const relativePath = toRelative(filePath);
    if (!isTextRepositoryFile(relativePath)) {
      return [];
    }
    if (relativePath.includes("/generated/server-openapi/")) {
      return [];
    }
    if (isAllowedActiveResidualFile(relativePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, "utf8");
    return strongCommentsResidualPatterns.flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});
