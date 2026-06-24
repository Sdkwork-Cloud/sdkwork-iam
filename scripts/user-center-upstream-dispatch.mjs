#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  listUserCenterUpstreamDispatchTargets,
} from "./user-center-upstream-dispatch-target-catalog.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appbaseRoot = path.resolve(__dirname, "..");

export const USER_CENTER_UPSTREAM_DISPATCH_EVENT_TYPE =
  "sdkwork-appbase-user-center-standard-updated";
export const USER_CENTER_UPSTREAM_SOURCE_REPOSITORY = "Sdkwork-Cloud/sdkwork-appbase";
export const USER_CENTER_UPSTREAM_DISPATCH_TOKEN_ENV_KEY =
  "SDKWORK_USER_CENTER_UPSTREAM_DISPATCH_TOKEN";

function resolveRequiredToken(token) {
  const normalizedToken = String(token ?? "").trim();
  if (!normalizedToken) {
    throw new Error(
      `user-center upstream dispatch token is required via ${USER_CENTER_UPSTREAM_DISPATCH_TOKEN_ENV_KEY}`,
    );
  }

  return normalizedToken;
}

function resolveRequiredText(value, fieldName) {
  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) {
    throw new Error(`user-center upstream dispatch ${fieldName} is required`);
  }

  return normalizedValue;
}

function truncateText(value, maxLength = 4000) {
  const text = String(value ?? "").trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 12))}...[truncated]`;
}

function createDispatchBody({
  sourceRef,
  sourceRepository,
  sourceSha,
  workflow,
} = {}) {
  return JSON.stringify({
    client_payload: {
      source_ref: sourceRef,
      source_repository: sourceRepository,
      source_sha: sourceSha,
      workflow,
    },
    event_type: USER_CENTER_UPSTREAM_DISPATCH_EVENT_TYPE,
  });
}

export function createUserCenterUpstreamDispatchPlan({
  token = process.env[USER_CENTER_UPSTREAM_DISPATCH_TOKEN_ENV_KEY],
  baseEnv = process.env,
  githubRef = process.env.SDKWORK_USER_CENTER_SOURCE_REF ?? process.env.GITHUB_REF,
  githubSha = process.env.SDKWORK_USER_CENTER_SOURCE_SHA ?? process.env.GITHUB_SHA,
  sourceRepository =
    process.env.SDKWORK_USER_CENTER_SOURCE_REPOSITORY ?? USER_CENTER_UPSTREAM_SOURCE_REPOSITORY,
  targets = listUserCenterUpstreamDispatchTargets(),
} = {}) {
  const resolvedToken = resolveRequiredToken(token);
  const resolvedGithubRef = resolveRequiredText(githubRef, "source ref");
  const resolvedGithubSha = resolveRequiredText(githubSha, "source sha");
  const resolvedSourceRepository = resolveRequiredText(
    sourceRepository,
    "source repository",
  );

  return targets.map((target) => ({
    body: createDispatchBody({
      sourceRef: resolvedGithubRef,
      sourceRepository: resolvedSourceRepository,
      sourceSha: resolvedGithubSha,
      workflow: target.workflow,
    }),
    command: "gh",
    args: [
      "api",
      `repos/${target.repository}/dispatches`,
      "--method",
      "POST",
      "--input",
      "-",
    ],
    env: {
      ...baseEnv,
      GH_TOKEN: resolvedToken,
    },
    id: target.id,
  }));
}

function buildCommandFailure(plan, result) {
  const fragments = [];
  if (result?.error) {
    fragments.push(`error: ${result.error.message}`);
  }
  if (String(result?.stdout ?? "").trim()) {
    fragments.push(`stdout: ${truncateText(result.stdout)}`);
  }
  if (String(result?.stderr ?? "").trim()) {
    fragments.push(`stderr: ${truncateText(result.stderr)}`);
  }

  return new Error(
    `user-center upstream dispatch failed for ${plan.id} with exit code ${result?.status ?? "unknown"} while executing ${plan.command} ${plan.args.join(" ")}${fragments.length > 0 ? `\n${fragments.join("\n")}` : ""}`,
  );
}

export function runUserCenterUpstreamDispatch({
  spawnSyncImpl = spawnSync,
  ...options
} = {}) {
  const plan = createUserCenterUpstreamDispatchPlan(options);

  for (const commandPlan of plan) {
    const result = spawnSyncImpl(commandPlan.command, commandPlan.args, {
      cwd: appbaseRoot,
      env: commandPlan.env,
      input: commandPlan.body,
      shell: false,
      stdio: ["pipe", "inherit", "inherit"],
      windowsHide: process.platform === "win32",
    });

    if (result?.error || result?.status !== 0) {
      throw buildCommandFailure(commandPlan, result);
    }
  }

  return plan;
}

function isDirectExecution({
  argv1 = process.argv[1] ?? "",
  moduleFile = __filename,
  platform = process.platform,
} = {}) {
  if (!argv1) {
    return false;
  }

  const resolvedArgv1 = path.resolve(argv1);
  const resolvedModuleFile = path.resolve(moduleFile);
  if (platform === "win32") {
    return resolvedArgv1.toLowerCase() === resolvedModuleFile.toLowerCase();
  }

  return resolvedArgv1 === resolvedModuleFile;
}

if (isDirectExecution()) {
  runUserCenterUpstreamDispatch();
}
