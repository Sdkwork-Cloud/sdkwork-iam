#!/usr/bin/env node

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ensureRepoBootstrapAccessToken,
  isLoopbackBackendUrl,
  isUsableBootstrapAccessToken,
  normalizeBootstrapLifecycle,
} from "@sdkwork/iam-application-bootstrap";

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    environment: process.env.SDKWORK_ENV || process.env.SDKWORK_ENVIRONMENT || "development",
    tryApplicationBootstrap: true,
    allowTestTokenGeneration: false,
    dryRun: false,
    command: "",
    commandArgs: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root" && argv[index + 1]) {
      options.repoRoot = resolve(argv[++index]);
    } else if (arg === "--environment" && argv[index + 1]) {
      options.environment = argv[++index];
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--no-provision") {
      options.tryApplicationBootstrap = false;
    } else if (arg === "--allow-test-token-generation") {
      options.allowTestTokenGeneration = true;
    } else if (arg === "--") {
      options.command = argv[index + 1] ?? "";
      options.commandArgs = argv.slice(index + 2);
      break;
    } else if (!arg.startsWith("-") && !options.command) {
      options.command = arg;
      options.commandArgs = argv.slice(index + 1);
      break;
    }
  }

  return options;
}

async function ensureAccessToken(options) {
  const result = await ensureRepoBootstrapAccessToken({
    repoRoot: options.repoRoot,
    env: process.env,
    environment: options.environment,
    tryApplicationBootstrap: options.tryApplicationBootstrap,
    warn: (line) => console.error(line),
  });
  const backendBaseUrl = process.env.SDKWORK_BACKEND_BASE_URL;
  if (result.token && isUsableBootstrapAccessToken(result.token, backendBaseUrl)) {
    return result;
  }

  const lifecycle = normalizeBootstrapLifecycle(options.environment);
  const canGenerateFixture = isLoopbackBackendUrl(backendBaseUrl)
    && (
      lifecycle === "development"
      || (lifecycle === "test" && options.allowTestTokenGeneration)
    );
  if (!canGenerateFixture) {
    return result;
  }

  try {
    const credentialEntry = await import("@sdkwork/iam-credential-entry/node-bootstrap");
    const merged = credentialEntry.mergeRepoBootstrapAccessTokenEnv({
      repoRoot: options.repoRoot,
      env: process.env,
      environment: lifecycle,
      allowTestTokenGeneration: options.allowTestTokenGeneration,
    });
    const token = merged[credentialEntry.SDKWORK_ACCESS_TOKEN_ENV_KEY]?.trim();
    if (token && isUsableBootstrapAccessToken(token, backendBaseUrl)) {
      console.error(`generated loopback SDKWORK_ACCESS_TOKEN for ${lifecycle}`);
      return { status: "generated", token };
    }
  } catch (error) {
    console.error(
      `loopback bootstrap token generation skipped: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await ensureAccessToken(options);

  if (result.token) {
    process.env.SDKWORK_ACCESS_TOKEN = result.token;
  }

  if (options.dryRun || !options.command) {
    console.log(
      JSON.stringify(
        {
          environment: options.environment,
          repoRoot: options.repoRoot,
          status: result.status,
          hasToken: Boolean(result.token),
          overlayPaths: result.overlayPaths ?? [],
          reason: result.reason,
        },
        null,
        2,
      ),
    );
    if (!options.command) {
      if (result.status === "unavailable" && !result.token) {
        process.exitCode = 2;
      }
      return;
    }
  }

  if (!result.token) {
    console.error(result.reason ?? "SDKWORK_ACCESS_TOKEN is unavailable");
    process.exitCode = 2;
    return;
  }

  await new Promise((resolvePromise, reject) => {
    const child = spawn(options.command, options.commandArgs, {
      cwd: options.repoRoot,
      env: process.env,
      stdio: "inherit",
      shell: process.platform === "win32",
      windowsHide: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("close", (code) => {
      process.exitCode = code ?? 1;
      resolvePromise();
    });
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export { parseArgs, ensureAccessToken };
