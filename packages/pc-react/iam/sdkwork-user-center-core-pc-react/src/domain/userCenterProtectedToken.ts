import type {
  UserCenterTokenBundle,
} from "../types/userCenterTypes.ts";

export interface UserCenterProtectedTokenResolutionOptions {
  providedToken?: string | null;
  tokenBundle: UserCenterTokenBundle;
}

export interface UserCenterProtectedTokenRequirementOptions
  extends UserCenterProtectedTokenResolutionOptions {
  createError?: () => Error;
}

function normalizeProtectedTokenValue(value: string | null | undefined): string | null {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  return normalizedValue || null;
}

export function resolveUserCenterProtectedToken(
  options: UserCenterProtectedTokenResolutionOptions,
): string | null {
  const normalizedProvidedToken = normalizeProtectedTokenValue(options.providedToken);
  const sessionToken = normalizeProtectedTokenValue(options.tokenBundle.sessionToken);

  if (normalizedProvidedToken && normalizedProvidedToken !== sessionToken) {
    return normalizedProvidedToken;
  }

  return normalizeProtectedTokenValue(options.tokenBundle.authToken)
    ?? sessionToken
    ?? null;
}

export function requireUserCenterProtectedToken(
  options: UserCenterProtectedTokenRequirementOptions,
): string {
  const protectedToken = resolveUserCenterProtectedToken(options);
  if (protectedToken) {
    return protectedToken;
  }

  throw (options.createError?.() ?? new TypeError("User center protected token not found."));
}
