import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  assertUserCenterValidationInteropContract,
  assertUserCenterValidationPreflightCompatibility,
  createUserCenterValidationPluginDefinition,
  createUserCenterValidationInteropContract,
  createUserCenterValidationPreflightReport,
  diffUserCenterValidationInteropContract,
  requireUserCenterProtectedToken,
  resolveUserCenterProtectedToken,
  userCenterValidationPackageMeta,
} from "../src/index.ts";
import { createUserCenterPluginDefinition } from "../../sdkwork-user-center-core-pc-react/src/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const indexPath = path.join(packageRoot, "src", "index.ts");
const validationPath = path.join(packageRoot, "src", "validation.ts");
const readmePath = path.join(packageRoot, "README.md");
const packageJsonPath = path.join(packageRoot, "package.json");

test("user-center validation node contract exports canonical package identity and dependency-aware plugin metadata", () => {
  assert.deepEqual(userCenterValidationPackageMeta, {
    architecture: "pc-react",
    capability: "user-center-validation",
    domain: "iam",
    package: "@sdkwork/user-center-validation-pc-react",
    status: "ready",
  });

  const plugin = createUserCenterValidationPluginDefinition({
    host: "browser",
    mode: "app-api-hub",
    namespace: "sdkwork-router-portal",
    packageNames: ["sdkwork-router-portal-validation"],
    provider: {
      kind: "sdkwork-cloud-app-api",
      providerKey: "router-remote",
    },
    title: "SDKWORK Router Portal Validation",
  });

  assert.equal(plugin.capability, "user-center-validation");
  assert.equal(plugin.dependency.capability, "user-center");
  assert.equal(plugin.dependency.namespace, "sdkwork-router-portal");
  assert.equal(plugin.dependency.providerKey, "router-remote");
  assert.equal(plugin.dependency.activeIntegrationKind, "sdkwork-cloud-app-api");
  assert.equal(plugin.validation.authMode, "upstream-app-api-token-bridge");
  assert.equal(plugin.validation.validationStrategy, "dual-token");
  assert.deepEqual(plugin.validation.secretResolution, {
    organizationClaimKey: "organizationId",
    resolverKind: "upstream-secret-bridge",
    scope: "organization-preferred",
    tenantClaimKey: "tenantId",
  });
  assert.equal(plugin.validation.handshake.enabled, true);
  assert.equal(plugin.validation.handshake.mode, "provider-shared-secret");
  assert.equal(plugin.validation.handshake.freshnessWindowMs, 30000);
  assert.equal(plugin.validation.cachePolicy.unverifiedClaimsTtlMs, 30000);
  assert.deepEqual(plugin.validation.governedHeaderNames, [
    "Authorization",
    "Access-Token",
    "Refresh-Token",
    "x-sdkwork-user-center-session-id",
    "x-sdkwork-app-id",
    "x-sdkwork-user-center-handshake-mode",
    "x-sdkwork-user-center-provider-key",
    "x-sdkwork-user-center-secret-id",
    "x-sdkwork-user-center-signature",
    "x-sdkwork-user-center-signed-at",
  ]);
  assert.equal(plugin.manifests.validation?.capability, "validation");
  assert.equal(plugin.manifests.validation?.dependencyCapability, "user-center");
  assert.equal(plugin.manifests.validation?.host, "browser");
  assert.deepEqual(plugin.manifests.validation?.packageNames, [
    "sdkwork-router-portal-validation",
  ]);
});

test("user-center validation node contract accepts a canonical user-center plugin without repeating namespace in validation options", () => {
  const userCenterPlugin = createUserCenterPluginDefinition({
    host: "browser",
    mode: "app-api-hub",
    namespace: "example-app",
    packageNames: ["@example/app-auth", "@example/app-user"],
    provider: {
      kind: "sdkwork-cloud-app-api",
      providerKey: "example-app-remote",
    },
    title: "Example App User Center",
  });

  const validation = createUserCenterValidationPluginDefinition({
    host: "browser",
    packageNames: ["@example/appbase-validation"],
    title: "Example App User Center",
    userCenterPlugin,
  });

  assert.equal(validation.dependency.namespace, "example-app");
  assert.equal(validation.userCenterPlugin.bridgeConfig.namespace, "example-app");
  assert.equal(validation.manifests.validation?.id, "example-app-validation");
  assert.deepEqual(validation.validation.secretResolution, {
    organizationClaimKey: "organizationId",
    resolverKind: "upstream-secret-bridge",
    scope: "organization-preferred",
    tenantClaimKey: "tenantId",
  });
});

test("user-center validation node contract resolves and requires protected tokens through the canonical precedence", () => {
  assert.equal(
    resolveUserCenterProtectedToken({
      providedToken: "  external-token  ",
      tokenBundle: {
        sessionToken: "session-token",
      },
    }),
    "external-token",
  );

  assert.equal(
    resolveUserCenterProtectedToken({
      providedToken: "session-token",
      tokenBundle: {
        accessToken: "Access-Token",
        authToken: "auth-token",
        sessionToken: "session-token",
      },
    }),
    "auth-token",
  );

  assert.equal(
    resolveUserCenterProtectedToken({
      tokenBundle: {
        accessToken: "Access-Token",
      },
    }),
    null,
  );

  assert.equal(
    resolveUserCenterProtectedToken({
      tokenBundle: {},
    }),
    null,
  );

  assert.equal(
    requireUserCenterProtectedToken({
      tokenBundle: {
        sessionToken: "session-token",
      },
    }),
    "session-token",
  );

  assert.throws(
    () => requireUserCenterProtectedToken({
      createError: () => new TypeError("Portal session token not found"),
      tokenBundle: {},
    }),
    /Portal session token not found/u,
  );
});

test("user-center validation node contract creates provider-agnostic interop contracts and detects governed auth mismatches", () => {
  const routerValidation = createUserCenterValidationPluginDefinition({
    host: "browser",
    mode: "app-api-hub",
    namespace: "sdkwork-router-portal",
    provider: {
      kind: "sdkwork-cloud-app-api",
      providerKey: "router-remote",
    },
  });
  const exampleAppValidation = createUserCenterValidationPluginDefinition({
    host: "browser",
    mode: "app-api-hub",
    namespace: "example-app",
    provider: {
      kind: "sdkwork-cloud-app-api",
      providerKey: "example-app-remote",
    },
  });

  const routerInterop = createUserCenterValidationInteropContract(routerValidation.validation);
  const exampleAppInterop = createUserCenterValidationInteropContract(
    exampleAppValidation.validation,
  );

  assert.deepEqual(routerInterop, exampleAppInterop);
  assert.equal(
    diffUserCenterValidationInteropContract(routerInterop, exampleAppInterop).compatible,
    true,
  );
  assert.doesNotThrow(() =>
    assertUserCenterValidationInteropContract(routerInterop, exampleAppInterop)
  );

  const mismatchedInterop = {
    ...exampleAppInterop,
    secretResolution: {
      ...exampleAppInterop.secretResolution,
      tenantClaimKey: "tenant_code",
    },
    tokenHeaders: {
      ...exampleAppInterop.tokenHeaders,
      authorizationHeaderName: "Auth-Token",
    },
  };

  assert.deepEqual(
    diffUserCenterValidationInteropContract(routerInterop, mismatchedInterop),
    {
      compatible: false,
      mismatches: [
        {
          actual: "tenant_code",
          expected: "tenantId",
          fieldPath: "secretResolution.tenantClaimKey",
        },
        {
          actual: "Auth-Token",
          expected: "Authorization",
          fieldPath: "tokenHeaders.authorizationHeaderName",
        },
      ],
    },
  );
  assert.throws(
    () => assertUserCenterValidationInteropContract(routerInterop, mismatchedInterop),
    /tokenHeaders\.authorizationHeaderName|secretResolution\.tenantClaimKey/u,
  );
});

test("user-center validation node contract creates preflight reports from local snapshots and fails closed when peer auth semantics drift", () => {
  const routerValidation = createUserCenterValidationPluginDefinition({
    host: "browser",
    mode: "app-api-hub",
    namespace: "sdkwork-router-portal",
    provider: {
      kind: "sdkwork-cloud-app-api",
      providerKey: "router-remote",
    },
  });
  const exampleAppValidation = createUserCenterValidationPluginDefinition({
    host: "browser",
    mode: "app-api-hub",
    namespace: "example-app",
    provider: {
      kind: "sdkwork-cloud-app-api",
      providerKey: "example-app-remote",
    },
  });

  const peerContract = createUserCenterValidationInteropContract(
    exampleAppValidation.validation,
  );
  const preflight = createUserCenterValidationPreflightReport({
    peerContract,
    snapshot: routerValidation.validation,
  });

  assert.deepEqual(preflight, {
    compatible: true,
    diff: {
      compatible: true,
      mismatches: [],
    },
    localContract: peerContract,
    peerContract,
  });
  assert.deepEqual(
    assertUserCenterValidationPreflightCompatibility({
      peerContract,
      snapshot: routerValidation.validation,
    }),
    preflight,
  );

  const mismatchedPeerContract = {
    ...peerContract,
    handshake: {
      ...peerContract.handshake,
      headerNames: {
        ...peerContract.handshake.headerNames,
        signedAtHeaderName: "x-peer-signed-at",
      },
    },
  };

  assert.deepEqual(
    createUserCenterValidationPreflightReport({
      peerContract: mismatchedPeerContract,
      snapshot: routerValidation.validation,
    }),
    {
      compatible: false,
      diff: {
        compatible: false,
        mismatches: [
          {
            actual: "x-sdkwork-user-center-signed-at",
            expected: "x-peer-signed-at",
            fieldPath: "handshake.headerNames.signedAtHeaderName",
          },
        ],
      },
      localContract: peerContract,
      peerContract: mismatchedPeerContract,
    },
  );
  assert.throws(
    () => assertUserCenterValidationPreflightCompatibility({
      peerContract: mismatchedPeerContract,
      snapshot: routerValidation.validation,
    }),
    /handshake\.headerNames\.signedAtHeaderName/u,
  );
});

test("user-center validation node contract documents and exports the independent validation package", () => {
  const indexSource = fs.readFileSync(indexPath, "utf8");
  const validationSource = fs.readFileSync(validationPath, "utf8");
  const readme = fs.readFileSync(readmePath, "utf8");
  const packageJson = fs.readFileSync(packageJsonPath, "utf8");

  assert.match(indexSource, /@sdkwork\/user-center-validation-pc-react/u);
  assert.match(indexSource, /createUserCenterValidationPluginDefinition/u);
  assert.match(indexSource, /createUserCenterValidationInteropContract/u);
  assert.match(indexSource, /diffUserCenterValidationInteropContract/u);
  assert.match(indexSource, /assertUserCenterValidationInteropContract/u);
  assert.match(indexSource, /createUserCenterValidationPreflightReport/u);
  assert.match(indexSource, /assertUserCenterValidationPreflightCompatibility/u);
  assert.match(indexSource, /resolveUserCenterProtectedToken/u);
  assert.match(indexSource, /requireUserCenterProtectedToken/u);

  assert.match(validationSource, /createUserCenterPluginDefinition/u);
  assert.match(
    validationSource,
    /from ["']@sdkwork\/user-center-core-pc-react["']/u,
  );
  assert.match(validationSource, /dependencyCapability/u);
  assert.match(validationSource, /UserCenterValidationInteropContract/u);
  assert.match(validationSource, /createUserCenterValidationInteropContract/u);
  assert.match(validationSource, /diffUserCenterValidationInteropContract/u);
  assert.match(validationSource, /assertUserCenterValidationInteropContract/u);
  assert.match(validationSource, /createUserCenterValidationPreflightReport/u);
  assert.match(validationSource, /assertUserCenterValidationPreflightCompatibility/u);
  assert.match(validationSource, /createUserCenterAuthInteropContract/u);
  assert.match(validationSource, /diffUserCenterAuthInteropContract/u);
  assert.match(validationSource, /createUserCenterAuthPreflightReport/u);
  assert.match(validationSource, /assertUserCenterAuthPreflightCompatibility/u);
  assert.match(validationSource, /governedHeaderNames/u);
  assert.match(validationSource, /secretResolution/u);
  assert.doesNotMatch(validationSource, /allowAuthorizationFallbackToAccessToken/u);
  assert.match(validationSource, /provider-shared-secret/u);
  assert.doesNotMatch(validationSource, /function pushInteropMismatch/u);
  assert.doesNotMatch(validationSource, /cloneUserCenterValidationInteropContract/u);
  assert.doesNotMatch(validationSource, /function cloneInteropHandshake/u);

  assert.match(readme, /independent validation plugin/iu);
  assert.match(readme, /depends on `@sdkwork\/user-center-core-pc-react`/iu);
  assert.match(readme, /governed header names/iu);
  assert.match(readme, /interop contract/iu);
  assert.match(readme, /preflight/iu);
  assert.match(readme, /provider-agnostic/iu);
  assert.match(readme, /secret-resolution policy/iu);

  assert.match(packageJson, /"@sdkwork\/user-center-validation-pc-react"/u);
  assert.match(packageJson, /"capability": "user-center-validation"/u);
});
