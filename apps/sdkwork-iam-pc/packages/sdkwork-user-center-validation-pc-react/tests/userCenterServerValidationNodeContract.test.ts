import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createUserCenterServerValidationPluginDefinition,
} from "../src/index.ts";
import {
  createUserCenterServerPluginDefinition,
} from "../../sdkwork-user-center-core-pc-react/src/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const indexPath = path.join(packageRoot, "src", "index.ts");
const validationPath = path.join(packageRoot, "src", "serverValidation.ts");
const typesPath = path.join(
  packageRoot,
  "..",
  "sdkwork-user-center-core-pc-react",
  "src",
  "types",
  "userCenterTypes.ts",
);

test("user-center server validation node contract builds an independent middleware plugin that depends on the user-center server plugin", () => {
  const userCenterServerPlugin = createUserCenterServerPluginDefinition({
    mode: "app-api-hub",
    namespace: "sdkwork-routes-portal",
    provider: {
      baseUrl: "https://app-api.sdkwork.local/router",
      kind: "sdkwork-cloud-app-api",
      providerKey: "router-app-api",
    },
  });
  const validation = createUserCenterServerValidationPluginDefinition({
    title: "Router Portal Validation",
    userCenterServerPlugin,
  });

  assert.equal(validation.capability, "user-center-server-validation");
  assert.equal(validation.dependency.capability, "user-center-server");
  assert.equal(validation.dependency.namespace, "sdkwork-routes-portal");
  assert.equal(validation.dependency.providerKey, "router-app-api");
  assert.equal(validation.dependency.activeIntegrationKind, "sdkwork-cloud-app-api");
  assert.equal(validation.manifests.serverValidation.host, "server");
  assert.equal(validation.middleware.handshake.required, true);
  assert.deepEqual(validation.middleware.protectedTokenPreference, [
    "auth-token",
    "Access-Token",
    "session-token",
  ]);
  assert.deepEqual(validation.middleware.governedHeaderNames, [
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
});

test("user-center server validation node contract supports third-party upstream authorities with the same protected token contract", () => {
  const userCenterServerPlugin = createUserCenterServerPluginDefinition({
    mode: "external-hub",
    namespace: "sdkwork-studio",
    provider: {
      baseUrl: "https://identity.vendor.local/open",
      kind: "external-user-center",
      providerKey: "vendor-sso",
    },
  });
  const validation = createUserCenterServerValidationPluginDefinition({
    title: "Sdkwork Studio Validation",
    userCenterServerPlugin,
  });

  assert.equal(validation.dependency.activeIntegrationKind, "external-user-center");
  assert.equal(validation.middleware.handshake.required, true);
  assert.equal(validation.middleware.interop.authMode, "upstream-external-token-bridge");
  assert.equal(
    validation.middleware.interop.secretResolution.resolverKind,
    "external-secret-bridge",
  );
});

test("user-center server validation node contract is exported as a standalone server plugin surface", () => {
  const indexSource = fs.readFileSync(indexPath, "utf8");
  const validationSource = fs.readFileSync(validationPath, "utf8");
  const typesSource = fs.readFileSync(typesPath, "utf8");

  assert.match(indexSource, /createUserCenterServerValidationPluginDefinition/u);
  assert.match(validationSource, /createUserCenterServerValidationPluginDefinition/u);
  assert.match(validationSource, /user-center-server-validation/u);
  assert.match(validationSource, /protectedTokenPreference/u);
  assert.match(validationSource, /userCenterServerPlugin/u);
  assert.match(typesSource, /UserCenterServerValidationPluginDefinition/u);
  assert.match(typesSource, /UserCenterServerValidationMiddlewareContract/u);
});
