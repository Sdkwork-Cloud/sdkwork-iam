import type {
  UserCenterStoragePlan,
  UserCenterTokenBundle,
  UserCenterTokenStoreOptions,
} from "../types/userCenterTypes.ts";
import {
  resolveUserCenterProtectedToken,
  type UserCenterProtectedTokenResolutionOptions,
} from "./userCenterProtectedToken.ts";
import { createUserCenterTokenStore } from "./userCenterSession.ts";

export interface UserCenterRuntimeSessionBinding {
  clearSessionToken(): void;
  clearTokenBundle(): void;
  getSessionHeaderName(): string;
  readSessionToken(): string | null;
  readTokenBundle(): UserCenterTokenBundle;
  resolveHeaders(
    providedToken?: UserCenterProtectedTokenResolutionOptions["providedToken"],
  ): Record<string, string | undefined>;
  resolveProtectedToken(
    providedToken?: UserCenterProtectedTokenResolutionOptions["providedToken"],
  ): string | null;
  writeSessionToken(token: string): string;
  writeTokenBundle(bundle: UserCenterTokenBundle): UserCenterTokenBundle;
}

export interface CreateUserCenterRuntimeSessionBindingOptions {
  storagePlan: UserCenterStoragePlan;
  tokenStoreOptions?: Omit<UserCenterTokenStoreOptions, "sessionStorage">;
}

function normalizeSessionToken(value: unknown): string | null {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  return normalizedValue || null;
}

export function createUserCenterRuntimeSessionBinding(
  options: CreateUserCenterRuntimeSessionBindingOptions,
): UserCenterRuntimeSessionBinding {
  const tokenStore = createUserCenterTokenStore(
    options.storagePlan,
    {
      ...options.tokenStoreOptions,
      sessionStorage: null,
    },
  );

  return {
    clearSessionToken() {
      tokenStore.clearTokenBundle();
    },

    clearTokenBundle() {
      tokenStore.clearTokenBundle();
    },

    getSessionHeaderName() {
      return options.storagePlan.sessionHeaderName;
    },

    readSessionToken() {
      return tokenStore.readTokenBundle().sessionToken ?? null;
    },

    readTokenBundle() {
      return tokenStore.readTokenBundle();
    },

    resolveHeaders(providedToken) {
      const protectedToken = resolveUserCenterProtectedToken({
        providedToken,
        tokenBundle: tokenStore.readTokenBundle(),
      });

      return {
        [options.storagePlan.sessionHeaderName]: protectedToken ?? undefined,
      };
    },

    resolveProtectedToken(providedToken) {
      return resolveUserCenterProtectedToken({
        providedToken,
        tokenBundle: tokenStore.readTokenBundle(),
      });
    },

    writeSessionToken(token) {
      const normalizedSessionToken = normalizeSessionToken(token);
      if (!normalizedSessionToken) {
        throw new Error("Runtime server session token must not be empty.");
      }

      tokenStore.persistTokenBundle({
        sessionToken: normalizedSessionToken,
      });
      return normalizedSessionToken;
    },

    writeTokenBundle(bundle) {
      tokenStore.persistTokenBundle(bundle);
      return tokenStore.readTokenBundle();
    },
  };
}
