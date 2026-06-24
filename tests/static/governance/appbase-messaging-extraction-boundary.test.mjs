import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { APPBASE_OPENAPI_CORE_FILES } from "./appbase-sdk-family-surfaces.mjs";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');
const currentFile = fileURLToPath(import.meta.url);

const removedMessagingRoots = [
  "packages/common/messaging",
  "packages/common/conversation",
  "packages/native-rust/messaging",
  "packages/pc-react/messaging",
  "packages/pc-react/communication",
  "packages/mobile-react/communication",
  "packages/mobile-flutter/communication",
  "packages/native-rust/communication",
];

const forbiddenLocalOwnershipPatterns = [
  /sdkwork-appbase\/packages\/common\/conversation\/sdkwork-conversation/u,
  /sdkwork-appbase\/packages\/common\/messaging/u,
  /sdkwork-appbase\/packages\/native-rust\/messaging/u,
  /sdkwork-appbase\/packages\/pc-react\/messaging/u,
  /sdkwork-appbase\/packages\/(?:pc-react|mobile-react|mobile-flutter|native-rust)\/communication/u,
  /apps[\\/]+sdkwork-appbase[\\/]+packages[\\/]+common[\\/]+conversation[\\/]+sdkwork-conversation/u,
  /apps[\\/]+sdkwork-appbase[\\/]+packages[\\/]+common[\\/]+messaging/u,
  /apps[\\/]+sdkwork-appbase[\\/]+packages[\\/]+native-rust[\\/]+messaging/u,
  /apps[\\/]+sdkwork-appbase[\\/]+packages[\\/]+pc-react[\\/]+messaging/u,
  /apps[\\/]+sdkwork-appbase[\\/]+packages[\\/]+(?:pc-react|mobile-react|mobile-flutter|native-rust)[\\/]+communication/u,
  /@sdkwork\/im-sdk/u,
  /@sdkwork\/im-mobile-react/u,
  /@sdkwork\/(?:channel|contacts|social|im|rtc|comments|community)-(?:pc|mobile)-react/u,
  /sdkwork-im-mobile-react/u,
  /sdkwork-(?:channel|contacts|social|im|rtc|comments|community)-(?:pc|mobile)-react/u,
];

const allowedMessagingBoundaryFiles = new Set([
  "README.md",
  "specs/appbase-capabilities.yaml",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/tests/catalog.test.ts",
  "packages/common/integration/sdkwork-platform/README.md",
  "packages/common/integration/sdkwork-platform/src/index.ts",
  "packages/common/integration/sdkwork-platform/tests/platform.standard.test.ts",
  "docs/superpowers/plans/2026-05-21-sdkwork-open-platform-chat-agent.md",
  "docs/superpowers/specs/2026-05-21-sdkwork-open-platform-chat-agent-design.md",
]);

const appbaseOpenApiFiles = APPBASE_OPENAPI_CORE_FILES;

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

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

test("appbase no longer owns local messaging, conversation, IM, or messaging Rust roots", () => {
  const existingRoots = removedMessagingRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata does not wire sdkwork-messaging packages into appbase", () => {
  const packageJson = readWorkspaceFile("package.json");
  const workspace = readWorkspaceFile("pnpm-workspace.yaml");
  const tsconfig = readWorkspaceFile("tsconfig.base.json");

  assert.doesNotMatch(packageJson, /@sdkwork\/(?:conversation|im-pc-react|messaging-[\w-]+)/u);
  assert.doesNotMatch(workspace, /sdkwork-space\/sdkwork-messaging/u);
  assert.doesNotMatch(tsconfig, /sdkwork-space\/sdkwork-messaging/u);
  assert.doesNotMatch(tsconfig, /"@sdkwork\/(?:conversation|im-pc-react|messaging-[\w-]+)"/u);
  assert.doesNotMatch(workspace, /sdkwork-im\/sdks\/sdkwork-im-sdk/u);
  assert.doesNotMatch(tsconfig, /"@sdkwork\/im-sdk"/u);
});

test("appbase package manifests and catalogs do not declare appbase-owned messaging capabilities", () => {
  const packageJsonFiles = collectTextFiles(path.join(appbaseRoot, "packages"))
    .filter((filePath) => path.basename(filePath) === "package.json");

  const manifestViolations = packageJsonFiles.flatMap((filePath) => {
    const relativePath = toRelative(filePath);
    const pkg = readJsonFile(filePath);
    const sdkwork = pkg.sdkwork ?? {};
    const result = [];

    if (sdkwork.workspace === "sdkwork-appbase" && sdkwork.domain === "messaging") {
      result.push(`${relativePath}: sdkwork-appbase messaging domain ownership`);
    }

    if (sdkwork.workspace === "sdkwork-appbase" && ["im", "messaging", "conversation"].includes(sdkwork.capability)) {
      result.push(`${relativePath}: sdkwork-appbase ${sdkwork.capability} capability ownership`);
    }

    return result;
  });

  const catalogFiles = [
    "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/catalog.ts",
    "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/catalog.ts",
  ];
  const catalogViolations = catalogFiles.flatMap((relativePath) => {
    const content = readWorkspaceFile(relativePath);
    return [
      /capability:\s*"im"/u,
      /@sdkwork\/im-(?:pc|mobile)-react/u,
      /@sdkwork\/(?:channel|contacts|social)-(?:pc|mobile)-react/u,
      /domain:\s*"communication"/u,
      /Instant messaging sessions/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0]}`] : [];
    });
  });

  assert.deepEqual([...manifestViolations, ...catalogViolations], []);
});

test("appbase text files keep only approved external messaging consumer references", () => {
  const files = collectTextFiles(appbaseRoot)
    .filter((filePath) => filePath !== currentFile)
    .filter((filePath) => path.basename(filePath) !== "pnpm-lock.yaml")
    .filter((filePath) => !/^(?:scripts|tests\/static\/governance)\/appbase-[a-z0-9-]+-extraction-boundary\.test\.mjs$/u.test(toRelative(filePath)))
    .filter((filePath) => /\.(ts|tsx|js|mjs|json|md|yaml|yml)$/u.test(filePath));

  const violations = files.flatMap((filePath) => {
    const relativePath = toRelative(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    const result = [];

    if (allowedMessagingBoundaryFiles.has(relativePath)) {
      return result;
    }

    for (const pattern of forbiddenLocalOwnershipPatterns) {
      const match = content.match(pattern);
      if (match) {
        result.push(`${relativePath}: ${match[0].slice(0, 140)}`);
      }
    }

    if (/@sdkwork\/(?:conversation|im-pc-react|channel-pc-react|contacts-pc-react|social-pc-react)\b/u.test(content)) {
      result.push(`${relativePath}: appbase must not depend on messaging workspace packages`);
    }

    if (/@sdkwork\/messaging-(?:contracts|sdk-ports|service|runtime|admin-pc-react)\b/u.test(content)) {
      result.push(`${relativePath}: appbase must not consume messaging implementation packages`);
    }

    return result;
  });

  assert.deepEqual(violations, []);
});

test("appbase OpenAPI authority specs do not expose messaging-owned operations", () => {
  const violations = appbaseOpenApiFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const document = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    return collectOperations(document).flatMap(({ routePath, method, operation }) => {
      const operationText = [
        routePath,
        operation?.operationId,
        operation?.["x-sdkwork-domain"],
        operation?.["x-sdkwork-owner"],
        operation?.["x-sdkwork-resource"],
        operation?.["x-sdkwork-source-route-crate"],
      ].join(" ");

      if (!/(?:sdkwork-messaging|x-sdkwork-messaging|\bmessaging\b|\bconversation\b|\bim\b|\/im\/v3)/iu.test(operationText)) {
        return [];
      }

      return [`${relativePath}: ${method.toUpperCase()} ${routePath} ${operation?.operationId ?? ""}`];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase no longer publishes verification-code delivery APIs in appbase app SDK", () => {
  const files = collectTextFiles(appbaseRoot)
    .filter((filePath) => path.basename(filePath) !== "pnpm-lock.yaml")
    .filter((filePath) => /\.(ts|tsx|js|mjs|json|md|yaml|yml|rs|go|java|kt|swift|cs|php|py|rb|dart)$/u.test(filePath));

  const allowedFragments = new Set([
    "tests/static/governance/appbase-messaging-extraction-boundary.test.mjs",
    "packages/pc-react/iam/sdkwork-auth-pc-react/src/auth-service.ts",
    "packages/pc-react/iam/sdkwork-auth-pc-react/src/auth-iam-runtime.ts",
  "packages/pc-react/iam/sdkwork-auth-pc-react/tests/auth.service.test.ts",
  "packages/pc-react/iam/sdkwork-auth-pc-react/tests/auth.page.test.tsx",
  "packages/pc-react/iam/sdkwork-auth-pc-react/tests/auth.iam-routes-i18n.test.tsx",
  "packages/pc-react/iam/sdkwork-iam-react/tests/iam-react.integration.test.tsx",
  "packages/pc-react/iam/sdkwork-iam-core-pc-react/tests/iam-core.service.test.ts",
  "packages/common/iam/sdkwork-iam-contracts/tests/iam-contracts.standard.test.ts",
  "packages/common/iam/sdkwork-iam-sdk-ports/src/index.ts",
  "packages/common/iam/sdkwork-iam-sdk-ports/tests/iam-sdk-ports.standard.test.ts",
]);

  const violations = files.flatMap((filePath) => {
    const relativePath = toRelative(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    if (allowedFragments.has(relativePath)) {
      return [];
    }

    return [
      /\/app\/v3\/api\/auth\/verification_codes(?:\/verify)?/u,
      /\bauth\.verificationCodes\b/u,
      /\bauthVerificationCodes\b/u,
      /\bUSER_CENTER_AUTH_VERIFY_(?:SEND|CHECK)_PATH\b/u,
      /\bverificationCodes\.(?:create|verify)\b/u,
      /\bIamHttpRoute::new\(\s*HttpMethod::Post,\s*"\/app\/v3\/api\/auth\/verification_codes/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 140)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase native Rust foundation does not hard-code messaging or IM API ownership", () => {
  const rustFoundationRoot = path.join(appbaseRoot, "packages", "native-rust", "foundation");
  const files = collectTextFiles(rustFoundationRoot).filter((filePath) =>
    /\.(?:rs|toml|md|json)$/u.test(filePath),
  );

  const violations = files.flatMap((filePath) => {
    const relativePath = toRelative(filePath);
    const content = fs.readFileSync(filePath, "utf8");

    return [
      /\/im\/v3\/api/u,
      /\bIM_API_PREFIX\b/u,
      /sdkwork-im-open-api/u,
      /im-open-api/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0]}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase does not retain communication domain folders, catalog entries, or lockfile packages", () => {
  const files = [
    "README.md",
    "packages/pc-react/README.md",
    "packages/mobile-react/README.md",
    "packages/mobile-flutter/README.md",
    "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/domain.ts",
    "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/domain.ts",
    "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/catalog.ts",
    "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/catalog.ts",
    "tools/catalog/package-catalog.mjs",
    "pnpm-lock.yaml",
    "tsconfig.base.json",
  ];

  const violations = files.flatMap((relativePath) => {
    const content = readWorkspaceFile(relativePath);
    return [
      /\bcommunication\b/u,
      /packages\/(?:pc-react|mobile-react|mobile-flutter)\/communication/u,
      /@sdkwork\/(?:channel|contacts|social)-(?:pc|mobile)-react/u,
      /sdkwork-(?:channel|contacts|social)-(?:pc|mobile)-react/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 140)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});
