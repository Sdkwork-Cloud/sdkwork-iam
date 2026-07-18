export * from './bootstrap-access-token-core.mjs';

import type {
  CreateDevBootstrapAccessTokenOptions,
  SdkworkEnvironment,
} from './bootstrap-access-token-core.mjs';

export function readApplicationManifest(manifestPath: string): unknown;
export function readBootstrapAccessTokenEnvFile(filePath: string): string | undefined;
export function mergeBootstrapAccessTokenEnvFromManifest(options: {
  env?: Record<string, string | undefined>;
  manifestPath: string;
} & CreateDevBootstrapAccessTokenOptions): Record<string, string | undefined>;
export function resolveRepoApplicationManifestPath(repoRoot: string, manifestPath?: string): string;
export function mergeRepoBootstrapAccessTokenEnv(options: {
  repoRoot: string;
  env?: Record<string, string | undefined>;
  environment: SdkworkEnvironment | 'dev' | 'prod';
  manifestPath?: string;
} & CreateDevBootstrapAccessTokenOptions): Record<string, string | undefined>;
export function mergeRepoDevBootstrapAccessTokenEnv(options: {
  repoRoot: string;
  env?: Record<string, string | undefined>;
  manifestPath?: string;
} & CreateDevBootstrapAccessTokenOptions): Record<string, string | undefined>;
