import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  discoverViteAppRoots,
  forbiddenEnvKeyPattern,
  isForbiddenCredentialEnvAssignment,
  listForbiddenEnvOffenders,
  listRepoRootsWithManifest,
  listTrackedEnvTemplateOffenders,
  listViteConfigsMissingPrivateEnvDefine,
  viteConfigInjectsPrivateAccessToken,
} from "../../../scripts/governance/discover-vite-app-roots.mjs";
import {
  listRuntimeScopedCredentialEnvOffenders,
  listTrackedPrivateSecretPlaceholderOffenders,
} from "../../../scripts/governance/scan-runtime-credential-env.mjs";
import { findViteConfigEnvScopeIssues } from "../../../scripts/governance/find-vite-config-env-scope-issues.mjs";
import { findViteConfigsWithBrokenReturnClose } from "../../../scripts/governance/repair-vite-credential-patches.mjs";

const workspaceRoot = path.resolve(import.meta.dirname, "../../../..");

test("forbidden credential env key pattern rejects scoped and browser token keys", () => {
  assert.match("VITE_ACCESS_TOKEN=", forbiddenEnvKeyPattern);
  assert.match("VITE_GEMINI_API_KEY=", forbiddenEnvKeyPattern);
  assert.match("SDKWORK_FORUM_SEARCH_ACCESS_TOKEN=", forbiddenEnvKeyPattern);
  assert.match("SDKWORK_OPS_DATABASE_AUTH_TOKEN=", forbiddenEnvKeyPattern);
  assert.doesNotMatch("SDKWORK_ACCESS_TOKEN=", forbiddenEnvKeyPattern);
  assert.doesNotMatch("VITE_DRIVE_PC_TOKEN_MANAGER_MODE=appbase-global", forbiddenEnvKeyPattern);
  assert.doesNotMatch("VITE_DRIVE_PC_TOKEN_STORAGE=browser-local", forbiddenEnvKeyPattern);
});

test("documented claw-router server env keys stay outside credential-env enforcement", () => {
  assert.equal(
    isForbiddenCredentialEnvAssignment('SDKWORK_CLAW_TOOL_API_SDK_GENERATOR_API_KEY=""'),
    false,
  );
  assert.equal(
    isForbiddenCredentialEnvAssignment("SDKWORK_CLAW_EDGE_CSP_CONNECT_SRC="),
    false,
  );
  assert.equal(
    isForbiddenCredentialEnvAssignment("VITE_SDKWORK_AUTH_TOKEN="),
    true,
  );
});

test("first-party vite app env templates do not declare forbidden credential keys", () => {
  const offenders = listForbiddenEnvOffenders(workspaceRoot);
  assert.deepEqual(
    offenders,
    [],
    `Forbidden credential env keys remain in tracked env files:\n${offenders.join("\n")}`,
  );
});

test("first-party application env templates stay credential-clean across repository roots", () => {
  const offenders = listTrackedEnvTemplateOffenders(workspaceRoot);
  assert.deepEqual(
    offenders,
    [],
    `Forbidden credential env keys remain in application env templates:\n${offenders.join("\n")}`,
  );
});

test("first-party vite app configs inject SDKWORK_ACCESS_TOKEN through vite define", () => {
  const appRoots = discoverViteAppRoots(workspaceRoot);
  assert.ok(appRoots.length >= 40, "expected to discover first-party vite application roots");

  const offenders = listViteConfigsMissingPrivateEnvDefine(workspaceRoot, appRoots);
  assert.deepEqual(
    offenders,
    [],
    `Vite configs missing process.env.SDKWORK_ACCESS_TOKEN define:\n${offenders.join("\n")}`,
  );
});

test("browser vite apps may satisfy credential define through filtered runtime bootstrap", () => {
  const birdcoderPcConfig = path.join(
    workspaceRoot,
    "sdkwork-birdcoder/apps/sdkwork-birdcoder-pc/vite.config.ts",
  );
  assert.ok(
    viteConfigInjectsPrivateAccessToken(fs.readFileSync(birdcoderPcConfig, "utf8")),
    "birdcoder browser apps must use createBirdcoderVitePlugins filtered runtime bootstrap",
  );
});

test("first-party runtime code does not read scoped credential env variables", () => {
  const offenders = listRuntimeScopedCredentialEnvOffenders(workspaceRoot);
  assert.deepEqual(
    offenders,
    [],
    `Runtime code still reads scoped credential env variables:\n${offenders.join("\n")}`,
  );
});

test("first-party vite app configs reference env only after loadEnv in defineConfig scope", () => {
  const issues = findViteConfigEnvScopeIssues(workspaceRoot);
  assert.deepEqual(
    issues,
    [],
    `Vite configs reference env.SDKWORK_ACCESS_TOKEN outside loadEnv scope:\n${issues.map((issue) => `${issue.path}: ${issue.reason}`).join("\n")}`,
  );
});

test("first-party vite defineConfig callbacks close return objects before defineConfig", () => {
  const issues = findViteConfigsWithBrokenReturnClose(workspaceRoot);
  assert.deepEqual(
    issues,
    [],
    `Vite configs still need defineConfig return-close repair:\n${issues.join("\n")}`,
  );
});

test("tracked env templates keep private API key placeholders blank", () => {
  const offenders = listTrackedPrivateSecretPlaceholderOffenders(
    workspaceRoot,
    listRepoRootsWithManifest(workspaceRoot),
  );
  assert.deepEqual(
    offenders,
    [],
    `Tracked env files still contain non-empty private API key placeholders:\n${offenders.join("\n")}`,
  );
});
