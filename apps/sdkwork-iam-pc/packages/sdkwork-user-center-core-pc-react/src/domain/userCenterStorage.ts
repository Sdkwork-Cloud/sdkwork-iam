import type { UserCenterStoragePlan } from "../types/userCenterTypes.ts";

export const USER_CENTER_SESSION_HEADER_NAME = "x-sdkwork-user-center-session-id";

function normalizeNamespaceSegment(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "");

  return normalized || "sdkwork-app";
}

export function normalizeUserCenterNamespace(namespace: string): string {
  return normalizeNamespaceSegment(namespace);
}

export function createUserCenterStoragePlan(namespace: string): UserCenterStoragePlan {
  const normalizedNamespace = normalizeUserCenterNamespace(namespace);
  const storageScope = `${normalizedNamespace}.user-center`;

  return {
    accessTokenKey: `${storageScope}.access-token`,
    authTokenKey: `${storageScope}.auth-token`,
    preferencesKey: `${storageScope}.preferences.v1`,
    profileKey: `${storageScope}.profile.v1`,
    refreshTokenKey: `${storageScope}.refresh-token`,
    runtimeStateKey: `${storageScope}.runtime-state.v1`,
    sessionHeaderName: USER_CENTER_SESSION_HEADER_NAME,
    sessionTokenKey: `${storageScope}.session-token`,
    storageScope,
    tokenTypeKey: `${storageScope}.token-type`,
  };
}
