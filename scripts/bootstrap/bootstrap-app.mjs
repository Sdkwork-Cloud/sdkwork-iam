#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createFetchIamApplicationBootstrapClient,
  createIamApplicationBootstrap,
  formatBootstrapEnvFile,
  hashManifestContent,
  loadBootstrapAuthProfileFromHome,
  resolveBootstrapAuth,
  resolveBootstrapAuthProfileCandidates,
  resolveBootstrapAuthProfileDir,
  resolveBootstrapEnvironmentFromEnv,
  writeRegisteredBootstrapEnvFiles,
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
    bootstrapProfile: "",
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
    } else if (
      (arg === "--bootstrap-profile" || arg === "--operator-profile" || arg === "--super-admin-profile")
      && argv[index + 1]
    ) {
      options.bootstrapProfile = argv[++index];
    }
  }

  return options;
}

function mapLifecycleForProfile(environment) {
  const normalized = `${environment ?? ""}`.trim().toLowerCase();
  if (normalized === "dev" || normalized === "local") return "development";
  if (normalized === "prod") return "production";
  if (normalized === "development" || normalized === "test" || normalized === "staging" || normalized === "production") {
    return normalized;
  }
  return undefined;
}

function hasBootstrapAuthCredentials(auth) {
  if (auth.authToken?.trim()) return true;
  const username = auth.username ?? auth.email;
  return Boolean(username?.trim() && auth.password?.trim());
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
  const envRecord = {
    ...process.env,
    ...(options.authToken ? { SDKWORK_IAM_BOOTSTRAP_OPERATOR_AUTH_TOKEN: options.authToken } : {}),
    ...(options.username ? { SDKWORK_IAM_BOOTSTRAP_OPERATOR_USERNAME: options.username } : {}),
    ...(options.password ? { SDKWORK_IAM_BOOTSTRAP_OPERATOR_PASSWORD: options.password } : {}),
  };
  const lifecycleEnvironment = mapLifecycleForProfile(options.environment ?? envRecord.SDKWORK_ENV);
  const loadedProfile = await loadBootstrapAuthProfileFromHome({
    env: envRecord,
    profileName: options.bootstrapProfile || undefined,
    lifecycleEnvironment,
  });

  const environment = resolveBootstrapEnvironmentFromEnv(envRecord, {
    backendApiBaseUrl: options.backendBaseUrl || undefined,
    tenantId: options.tenantId || undefined,
    organizationId: options.organizationId || undefined,
    instanceKey: options.instanceKey || undefined,
    environment: options.environment || undefined,
    primaryDomain: options.primaryDomain || undefined,
  });

  const auth = resolveBootstrapAuth({
    env: envRecord,
    profile: loadedProfile?.profile ?? null,
  });
  if (!hasBootstrapAuthCredentials(auth)) {
    const candidates = resolveBootstrapAuthProfileCandidates({
      env: envRecord,
      profileName: options.bootstrapProfile || undefined,
      lifecycleEnvironment,
    });
    const profileDir = resolveBootstrapAuthProfileDir(envRecord);
    throw new Error(
      `no IAM bootstrap auth credentials — write ${join(profileDir, `${candidates[0] ?? "development"}.json`)} `
      + `(candidates: ${candidates.join(", ")}) or export SDKWORK_IAM_BOOTSTRAP_OPERATOR_USERNAME/`
      + "SDKWORK_IAM_BOOTSTRAP_OPERATOR_PASSWORD",
    );
  }

  const client = createFetchIamApplicationBootstrapClient({
    baseUrl: environment.backendApiBaseUrl,
  });
  const bootstrap = createIamApplicationBootstrap({ client });
  const result = await bootstrap.bootstrapFromManifest({
    client,
    manifest,
    manifestHash,
    auth,
    profile: loadedProfile?.profile ?? null,
    environment,
  });

  const envOutPath = options.envOutPath || join(dirname(configPath), ".sdkwork.local.env");
  const envFileContents = `# SDKWork IAM application-bootstrap registration output (gitignored).\n${formatBootstrapEnvFile({
    result,
    primaryDomain: environment.primaryDomain,
  })}`;
  const overlayRoot = dirname(configPath);
  const overlayPaths = options.envOutPath
    ? [envOutPath]
    : await writeRegisteredBootstrapEnvFiles(overlayRoot, envFileContents, environment.environment);
  if (options.envOutPath) {
    await writeFile(envOutPath, envFileContents, "utf8");
  }

  console.log(
    JSON.stringify(
      {
        templateId: result.templateId,
        tenantApplicationId: result.tenantApplicationId,
        appId: result.appId,
        version: result.version,
        envOutPath: overlayPaths[0] ?? envOutPath,
        overlayPaths,
        bootstrapAuthProfilePath: loadedProfile?.profilePath,
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
