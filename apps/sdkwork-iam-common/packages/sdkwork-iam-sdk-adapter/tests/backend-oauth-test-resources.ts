import { vi } from "vitest";

import { BACKEND_OAUTH_RESOURCE_TREE } from "../src/backend-oauth-resource-tree";

export function createBackendOauthResourceMocks(
  tree: Record<string, unknown> = BACKEND_OAUTH_RESOURCE_TREE,
): Record<string, unknown> {
  const mocks: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(tree)) {
    if (Array.isArray(spec)) {
      mocks[key] = vi.fn().mockResolvedValue({ data: null });
      continue;
    }
    mocks[key] = createBackendOauthResourceMocks(spec as Record<string, unknown>);
  }
  return mocks;
}

export function createGeneratedBackendOauthClient(): Record<string, unknown> {
  return createBackendOauthResourceMocks();
}
