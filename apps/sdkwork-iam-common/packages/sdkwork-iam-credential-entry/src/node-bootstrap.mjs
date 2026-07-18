import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import {
  SDKWORK_ACCESS_TOKEN_ENV_KEY,
  mergeBootstrapAccessTokenEnv,
  normalizeBootstrapEnvironment,
} from './bootstrap-access-token-core.mjs';

export * from './bootstrap-access-token-core.mjs';

function normalizeText(value) {
  const normalized = String(value ?? '').trim();
  return normalized || undefined;
}

export function readApplicationManifest(manifestPath) {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

export function readBootstrapAccessTokenEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return undefined;
  }
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/u)) {
    const normalized = line.trim();
    if (!normalized || normalized.startsWith('#')) {
      continue;
    }
    const separatorIndex = normalized.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }
    if (normalized.slice(0, separatorIndex).trim() !== SDKWORK_ACCESS_TOKEN_ENV_KEY) {
      continue;
    }
    const rawValue = normalized.slice(separatorIndex + 1).trim();
    const unquoted = (
      (rawValue.startsWith('"') && rawValue.endsWith('"'))
      || (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) ? rawValue.slice(1, -1) : rawValue;
    return normalizeText(unquoted);
  }
  return undefined;
}

export function mergeBootstrapAccessTokenEnvFromManifest({
  env = {},
  manifestPath,
  ...options
} = {}) {
  const manifest = readApplicationManifest(manifestPath);
  return mergeBootstrapAccessTokenEnv(env, { ...options, manifest });
}

export function resolveRepoApplicationManifestPath(repoRoot, manifestPath) {
  const normalizedRepoRoot = normalizeText(repoRoot);
  if (!normalizedRepoRoot) {
    throw new Error('resolveRepoApplicationManifestPath requires repoRoot');
  }

  const explicitManifestPath = normalizeText(manifestPath);
  if (explicitManifestPath) {
    return path.isAbsolute(explicitManifestPath)
      ? explicitManifestPath
      : path.join(normalizedRepoRoot, explicitManifestPath);
  }

  const defaultManifestPath = path.join(normalizedRepoRoot, 'sdkwork.app.config.json');
  if (existsSync(defaultManifestPath)) {
    return defaultManifestPath;
  }

  throw new Error(
    `sdkwork.app.config.json not found under ${normalizedRepoRoot}; pass manifestPath explicitly`,
  );
}

export function mergeRepoBootstrapAccessTokenEnv({
  repoRoot,
  env = {},
  environment,
  manifestPath,
  ...options
} = {}) {
  const resolvedManifestPath = resolveRepoApplicationManifestPath(repoRoot, manifestPath);
  return mergeBootstrapAccessTokenEnvFromManifest({
    env,
    environment: normalizeBootstrapEnvironment(environment),
    manifestPath: resolvedManifestPath,
    ...options,
  });
}

export function mergeRepoDevBootstrapAccessTokenEnv(options = {}) {
  return mergeRepoBootstrapAccessTokenEnv({ ...options, environment: 'development' });
}
