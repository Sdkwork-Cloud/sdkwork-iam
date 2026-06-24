import {
  isSdkworkAuthLoginMethod,
  type SdkworkAuthDevelopmentPrefillConfig,
} from "../../sdkwork-auth-pc-react/src/auth-runtime-config.ts";
import type { IdentityDeploymentProfile } from "../../sdkwork-user-center-core-pc-react/src/index.ts";

function normalizeOptionalText(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

function normalizeDevelopmentPrefill(
  value: SdkworkAuthDevelopmentPrefillConfig | undefined,
): SdkworkAuthDevelopmentPrefillConfig | undefined {
  if (!value) {
    return undefined;
  }

  const loginMethod = isSdkworkAuthLoginMethod(value.loginMethod)
    ? value.loginMethod
    : undefined;

  return {
    ...(normalizeOptionalText(value.account) ? { account: normalizeOptionalText(value.account) } : {}),
    ...(normalizeOptionalText(value.email) ? { email: normalizeOptionalText(value.email) } : {}),
    ...(typeof value.enabled === "boolean" ? { enabled: value.enabled } : {}),
    ...(loginMethod ? { loginMethod } : {}),
    ...(normalizeOptionalText(value.password)
      ? { password: normalizeOptionalText(value.password) }
      : {}),
    ...(normalizeOptionalText(value.phone) ? { phone: normalizeOptionalText(value.phone) } : {}),
  };
}

function hasPrefillValues(value: SdkworkAuthDevelopmentPrefillConfig | undefined): boolean {
  return Boolean(
    value?.account
      || value?.email
      || value?.loginMethod
      || value?.password
      || value?.phone,
  );
}

export interface ResolveCanonicalAuthDevelopmentPrefillOptions {
  developmentPrefill?: SdkworkAuthDevelopmentPrefillConfig;
  identityDeploymentProfile: Pick<
    IdentityDeploymentProfile,
    "developmentPrefillEnabled" | "providerKind"
  >;
  namespace: string;
}

export function resolveCanonicalAuthDevelopmentPrefill(
  options: ResolveCanonicalAuthDevelopmentPrefillOptions,
): SdkworkAuthDevelopmentPrefillConfig | undefined {
  const normalizedPrefill = normalizeDevelopmentPrefill(options.developmentPrefill);
  void options.identityDeploymentProfile;
  void options.namespace;

  if (normalizedPrefill?.enabled === false) {
    return undefined;
  }

  if (!hasPrefillValues(normalizedPrefill)) {
    return undefined;
  }

  return {
    ...(normalizedPrefill?.account ? { account: normalizedPrefill.account } : {}),
    ...(normalizedPrefill?.email ? { email: normalizedPrefill.email } : {}),
    enabled: normalizedPrefill?.enabled ?? true,
    ...(normalizedPrefill?.loginMethod ? { loginMethod: normalizedPrefill.loginMethod } : {}),
    ...(normalizedPrefill?.password ? { password: normalizedPrefill.password } : {}),
    ...(normalizedPrefill?.phone ? { phone: normalizedPrefill.phone } : {}),
  };
}
