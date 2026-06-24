#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createIamApplicationBootstrapClientFromAppbaseBackendSdk,
  createIamApplicationBootstrap,
  formatBootstrapEnvFile,
  hashManifestContent,
  loadBootstrapProfileFromHome,
  resolveBootstrapAuthFromEnv,
  resolveBootstrapEnvironmentFromEnv,
} from "@sdkwork/iam-application-bootstrap";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../..");

function parseArgs(argv) {
  const options = {
    configPath: "",
    backendBaseUrl: "",
    tenantId: "",
    organizationId: "",
    instanceKey: "",
    environment: "",
    primaryDomain: "",
    envOutPath: "",
    authToken: "",
    username: "",
    password: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--config" && argv[index + 1]) {
      options.configPath = argv[++index];
    } else if (arg === "--backend-base-url" && argv[index + 1]) {
      options.backendBaseUrl = argv[++index];
    } else if (arg === "--tenant-id" && argv[index + 1]) {
      options.tenantId = argv[++index];
    } else if (arg === "--organization-id" && argv[index + 1]) {
      options.organizationId = argv[++index];
    } else if (arg === "--instance-key" && argv[index + 1]) {
      options.instanceKey = argv[++index];
    } else if (arg === "--environment" && argv[index + 1]) {
      options.environment = argv[++index];
    } else if (arg === "--domain" && argv[index + 1]) {
      options.primaryDomain = argv[++index];
    } else if (arg === "--env-out" && argv[index + 1]) {
      options.envOutPath = argv[++index];
    } else if (arg === "--auth-token" && argv[index + 1]) {
      options.authToken = argv[++index];
    } else if (arg === "--username" && argv[index + 1]) {
      options.username = argv[++index];
    } else if (arg === "--password" && argv[index + 1]) {
      options.password = argv[++index];
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.configPath) {
    throw new Error("--config <path-to-sdkwork.app.config.json> is required");
  }

  const configPath = resolve(options.configPath);
  const manifestRaw = await readFile(configPath, "utf8");
  const manifest = JSON.parse(manifestRaw);
  const manifestHash = hashManifestContent(manifestRaw);
  const profile = await loadBootstrapProfileFromHome();

  const environment = resolveBootstrapEnvironmentFromEnv(process.env, {
    backendApiBaseUrl: options.backendBaseUrl || undefined,
    tenantId: options.tenantId || undefined,
    organizationId: options.organizationId || undefined,
    instanceKey: options.instanceKey || undefined,
    environment: options.environment || undefined,
    primaryDomain: options.primaryDomain || undefined,
  });

  const auth = {
    ...resolveBootstrapAuthFromEnv(process.env),
    ...(options.authToken ? { authToken: options.authToken } : {}),
    ...(options.username ? { username: options.username } : {}),
    ...(options.password ? { password: options.password } : {}),
  };

  const client = createIamApplicationBootstrapClientFromAppbaseBackendSdk({
    baseUrl: environment.backendApiBaseUrl,
  });
  const bootstrap = createIamApplicationBootstrap({ client });
  const result = await bootstrap.bootstrapFromManifest({
    client,
    manifest,
    manifestHash,
    auth,
    profile,
    environment,
  });

  const envOutPath = options.envOutPath || join(dirname(configPath), ".sdkwork.local.env");
  await writeFile(
    envOutPath,
    formatBootstrapEnvFile({
      result,
      primaryDomain: environment.primaryDomain,
    }),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        templateId: result.templateId,
        tenantApplicationId: result.tenantApplicationId,
        appId: result.appId,
        version: result.version,
        envOutPath,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
