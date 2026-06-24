import type {
  SdkworkAuthLoginMethod,
  SdkworkAuthOAuthProviderRegion,
  SdkworkAuthRecoveryMethod,
  SdkworkAuthRegisterMethod,
  SdkworkAuthRuntimeConfig as SdkworkAuthRuntimeConfigBase,
  SdkworkAuthVerificationPolicyConfig,
} from "@sdkwork/iam-contracts";
export type {
  SdkworkAuthLoginMethod,
  SdkworkAuthOAuthProviderRegion,
  SdkworkAuthRecoveryMethod,
  SdkworkAuthRegisterMethod,
  SdkworkAuthVerificationPolicyConfig,
} from "@sdkwork/iam-contracts";
import {
  isSdkworkAuthLoginMethod,
  isSdkworkAuthOAuthProviderRegion,
  isSdkworkAuthRecoveryMethod,
  isSdkworkAuthRegisterMethod,
} from "@sdkwork/iam-contracts";
export {
  isSdkworkAuthLoginMethod,
  isSdkworkAuthOAuthProviderRegion,
  isSdkworkAuthRecoveryMethod,
  isSdkworkAuthRegisterMethod,
} from "@sdkwork/iam-contracts";

export type SdkworkAuthMode = "forgot" | "login" | "register";
export type SdkworkAuthLeftRailMode = "auto" | "highlights-only" | "qr-only";
export type SdkworkAuthQrPanelState =
  | "bindRequired"
  | "confirmed"
  | "error"
  | "expired"
  | "failed"
  | "idle"
  | "loading"
  | "organizationSelectionRequired"
  | "passwordRequired"
  | "pending"
  | "scanned";

export interface SdkworkAuthDevelopmentPrefillConfig {
  account?: string;
  email?: string;
  enabled?: boolean;
  loginMethod?: SdkworkAuthLoginMethod;
  password?: string;
  phone?: string;
  verificationCode?: string;
  verificationCodePrefillEnabled?: boolean;
  /**
   * @deprecated Development verification codes are prefill-only and never
   * bypass SDK verification. Use verificationCodePrefillEnabled instead.
   */
  verificationCodeBypassEnabled?: boolean;
}

export type SdkworkAuthResolvedVerificationPolicy =
  Required<Omit<SdkworkAuthVerificationPolicyConfig, "oauthLoginEnabled">> & {
    oauthLoginEnabled?: boolean;
  };

export interface SdkworkAuthRuntimeConfig extends SdkworkAuthRuntimeConfigBase {
  developmentPrefill?: SdkworkAuthDevelopmentPrefillConfig;
  leftRailMode?: SdkworkAuthLeftRailMode;
}

type SdkworkAuthRuntimeGlobal = typeof globalThis & {
  __SDKWORK_AUTH__?: SdkworkAuthRuntimeConfig;
  __SDKWORK_AUTH_CONFIG__?: SdkworkAuthRuntimeConfig;
};

export const DEFAULT_BASE_PATH = "/auth";
export const DEFAULT_SDKWORK_AUTH_DEVELOPMENT_VERIFICATION_CODE = "666666";
export const DEFAULT_SDKWORK_AUTH_LEFT_RAIL_MODE: SdkworkAuthLeftRailMode = "qr-only";

export const DEFAULT_SDKWORK_AUTH_LOGIN_METHODS: SdkworkAuthLoginMethod[] = [
  "password",
];

export const DEFAULT_SDKWORK_AUTH_REGISTER_METHODS: SdkworkAuthRegisterMethod[] = [
  "email",
  "phone",
];

export const DEFAULT_SDKWORK_AUTH_RECOVERY_METHODS: SdkworkAuthRecoveryMethod[] = [
  "email",
  "phone",
];

export const DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY: SdkworkAuthResolvedVerificationPolicy = {
  emailCodeLoginEnabled: false,
  emailRegistrationVerificationRequired: false,
  phoneCodeLoginEnabled: false,
  phoneRegistrationVerificationRequired: false,
};

export const DEFAULT_SDKWORK_AUTH_OAUTH_PROVIDERS: string[] = [
  "wechat",
  "alipay",
  "douyin",
  "qq",
  "weibo",
];

export const OVERSEAS_SDKWORK_AUTH_OAUTH_PROVIDERS: string[] = [
  "google",
  "github",
  "twitter",
  "facebook",
  "microsoft",
  "apple",
  "linkedin",
  "line",
  "tiktok",
  "discord",
];

function readEnvValue(...keys: string[]): string | undefined {
  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };

  for (const key of keys) {
    const value = meta.env?.[key];
    if ((value || "").trim()) {
      return value;
    }
  }

  return undefined;
}

function isSdkworkAuthDevelopmentEnvironment(): boolean {
  const meta = import.meta as ImportMeta & {
    env?: Record<string, unknown>;
  };
  const env = meta.env as Record<string, unknown> | undefined;
  const devValue: unknown = env?.DEV;
  const modeValue: unknown = env?.MODE;

  return devValue === true || devValue === "true" || modeValue === "development";
}

function normalizeProvider(provider: string | undefined | null): string | null {
  const normalized = (provider || "")
    .trim()
    .toLowerCase()
    .replace(/\.com$/u, "")
    .replace(/(?:_oauth2|_oauth|[-\s]+oauth2|[-\s]+oauth)$/u, "")
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "");
  if (!normalized) {
    return null;
  }

  const compactProvider = normalized.replace(/_/gu, "");
  if (compactProvider === "wechat" || compactProvider === "weixin" || compactProvider === "wx") {
    return "wechat";
  }

  if (compactProvider === "wechatminiprogram" || compactProvider === "wechatmini") {
    return "wechat_mini_program";
  }

  if (compactProvider === "wechatopen" || compactProvider === "wxopen") {
    return "wechat_open";
  }

  if (compactProvider === "alipay" || compactProvider === "zhifubao") {
    return "alipay";
  }

  if (compactProvider === "douyin" || compactProvider === "dy") {
    return "douyin";
  }

  if (compactProvider === "tiktok") {
    return "tiktok";
  }

  if (compactProvider === "google") {
    return "google";
  }

  if (compactProvider === "github") {
    return "github";
  }

  if (compactProvider === "twitter" || compactProvider === "x") {
    return "twitter";
  }

  if (compactProvider === "facebook" || compactProvider === "fb" || compactProvider === "meta") {
    return "facebook";
  }

  if (compactProvider === "microsoft" || compactProvider === "azure" || compactProvider === "azuread") {
    return "microsoft";
  }

  if (compactProvider === "apple") {
    return "apple";
  }

  if (compactProvider === "linkedin") {
    return "linkedin";
  }

  if (compactProvider === "line") {
    return "line";
  }

  if (compactProvider === "qq" || compactProvider === "tencentqq") {
    return "qq";
  }

  if (compactProvider === "weibo" || compactProvider === "sina") {
    return "weibo";
  }

  if (compactProvider === "baidu") {
    return "baidu";
  }

  if (compactProvider === "huawei") {
    return "huawei";
  }

  if (compactProvider === "xiaomi") {
    return "xiaomi";
  }

  if (compactProvider === "amazon") {
    return "amazon";
  }

  if (compactProvider === "discord") {
    return "discord";
  }

  if (compactProvider === "slack") {
    return "slack";
  }

  if (compactProvider === "instagram") {
    return "instagram";
  }

  if (compactProvider === "snapchat") {
    return "snapchat";
  }

  if (compactProvider === "paypal") {
    return "paypal";
  }

  if (compactProvider === "yahoo") {
    return "yahoo";
  }

  if (compactProvider === "reddit") {
    return "reddit";
  }

  return normalized;
}

function parseBoolean(value: string | undefined | null): boolean | undefined {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (["1", "on", "true", "yes"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}

function parseProviderList(value: string | undefined | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[,\s]+/)
    .map((item) => normalizeProvider(item))
    .filter((item): item is string => Boolean(item));
}

function normalizeOptionalText(value: string | undefined | null): string | undefined {
  const normalizedValue = (value || "").trim();
  return normalizedValue || undefined;
}

function normalizeOptionalSecret(value: string | undefined | null): string | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  return value;
}

function parseMethodList<T extends string>(
  value: string | undefined | null,
  isAllowed: (input: string | undefined) => input is T,
): T[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[,\s]+/)
    .map((item) => (item || "").trim())
    .filter((item): item is T => isAllowed(item));
}

function dedupeValues<T extends string>(values: Array<T | null | undefined>): T[] {
  const seen = new Set<T>();
  const resolved: T[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    resolved.push(value);
  }

  return resolved;
}

function resolveBooleanSetting(
  explicitValue: boolean | undefined,
  runtimeValue: boolean | undefined,
  envKeys: string[],
  defaultValue: boolean,
): boolean {
  if (typeof explicitValue === "boolean") {
    return explicitValue;
  }

  if (typeof runtimeValue === "boolean") {
    return runtimeValue;
  }

  return parseBoolean(readEnvValue(...envKeys)) ?? defaultValue;
}

export function isSdkworkAuthLeftRailMode(value: string | undefined): value is SdkworkAuthLeftRailMode {
  return value === "auto"
    || value === "highlights-only"
    || value === "qr-only";
}

export function normalizeBasePath(basePath: string): string {
  const normalized = basePath.trim().replace(/\/+$/, "");
  return normalized || DEFAULT_BASE_PATH;
}

export function getSdkworkAuthRuntimeConfig(): SdkworkAuthRuntimeConfig | undefined {
  const runtime = globalThis as SdkworkAuthRuntimeGlobal;
  return normalizeSdkworkAuthRuntimeConfig(runtime.__SDKWORK_AUTH_CONFIG__ || runtime.__SDKWORK_AUTH__);
}

function normalizeSdkworkAuthRuntimeConfig(
  config: SdkworkAuthRuntimeConfig | undefined,
): SdkworkAuthRuntimeConfig | undefined {
  if (!config) {
    return undefined;
  }

  return {
    ...(config.developmentPrefill ? { developmentPrefill: config.developmentPrefill } : {}),
    ...(config.leftRailMode ? { leftRailMode: config.leftRailMode } : {}),
    ...(config.loginMethods ? { loginMethods: config.loginMethods } : {}),
    ...(typeof config.oauthLoginEnabled === "boolean" ? { oauthLoginEnabled: config.oauthLoginEnabled } : {}),
    ...(config.oauthProviderRegion ? { oauthProviderRegion: config.oauthProviderRegion } : {}),
    ...(config.oauthProviders ? { oauthProviders: config.oauthProviders } : {}),
    ...(typeof config.qrLoginEnabled === "boolean" ? { qrLoginEnabled: config.qrLoginEnabled } : {}),
    ...(config.recoveryMethods ? { recoveryMethods: config.recoveryMethods } : {}),
    ...(config.registerMethods ? { registerMethods: config.registerMethods } : {}),
    ...(config.verificationPolicy ? { verificationPolicy: config.verificationPolicy } : {}),
  };
}

function hasRuntimeConfigField<Key extends keyof SdkworkAuthRuntimeConfig>(key: Key): boolean {
  const runtimeConfig = getSdkworkAuthRuntimeConfig();
  return Boolean(runtimeConfig && Object.prototype.hasOwnProperty.call(runtimeConfig, key));
}

export function setSdkworkAuthRuntimeConfig(
  config: SdkworkAuthRuntimeConfig,
): SdkworkAuthRuntimeConfig {
  const runtime = globalThis as SdkworkAuthRuntimeGlobal;
  runtime.__SDKWORK_AUTH_CONFIG__ = normalizeSdkworkAuthRuntimeConfig(config) ?? {};
  return runtime.__SDKWORK_AUTH_CONFIG__;
}

export function clearSdkworkAuthRuntimeConfig(): void {
  const runtime = globalThis as SdkworkAuthRuntimeGlobal;
  delete runtime.__SDKWORK_AUTH_CONFIG__;
  delete runtime.__SDKWORK_AUTH__;
}

export function resolveSdkworkAuthOAuthProviders(
  explicitProviders?: string[],
  explicitRegion?: SdkworkAuthOAuthProviderRegion,
): string[] {
  const runtimeProviders = getSdkworkAuthRuntimeConfig()?.oauthProviders;
  const envProviders = parseProviderList(
    readEnvValue("VITE_SDKWORK_AUTH_OAUTH_PROVIDERS", "VITE_AUTH_OAUTH_PROVIDERS"),
  );
  const providerRegion = resolveSdkworkAuthOAuthProviderRegion(explicitRegion);
  const configuredProviders = explicitProviders !== undefined
    ? explicitProviders
    : hasRuntimeConfigField("oauthProviders")
      ? (runtimeProviders ?? [])
      : envProviders.length
        ? envProviders
        : providerRegion === "overseas"
          ? OVERSEAS_SDKWORK_AUTH_OAUTH_PROVIDERS
          : DEFAULT_SDKWORK_AUTH_OAUTH_PROVIDERS;

  return dedupeValues(configuredProviders.map((provider) => normalizeProvider(provider)));
}

export function resolveSdkworkAuthOAuthProviderRegion(
  explicitRegion?: SdkworkAuthOAuthProviderRegion,
): SdkworkAuthOAuthProviderRegion {
  if (explicitRegion && isSdkworkAuthOAuthProviderRegion(explicitRegion)) {
    return explicitRegion;
  }

  const runtimeRegion = getSdkworkAuthRuntimeConfig()?.oauthProviderRegion;
  if (runtimeRegion && isSdkworkAuthOAuthProviderRegion(runtimeRegion)) {
    return runtimeRegion;
  }

  const envRegion = readEnvValue(
    "VITE_SDKWORK_AUTH_OAUTH_PROVIDER_REGION",
    "VITE_AUTH_OAUTH_PROVIDER_REGION",
  );
  return isSdkworkAuthOAuthProviderRegion(envRegion) ? envRegion : "mainland";
}

export function resolveSdkworkAuthVerificationPolicy(
  explicitPolicy?: SdkworkAuthVerificationPolicyConfig,
): SdkworkAuthResolvedVerificationPolicy {
  const runtimePolicy = getSdkworkAuthRuntimeConfig()?.verificationPolicy;

  return {
    emailCodeLoginEnabled: resolveBooleanSetting(
      explicitPolicy?.emailCodeLoginEnabled,
      runtimePolicy?.emailCodeLoginEnabled,
      [
        "VITE_SDKWORK_AUTH_EMAIL_CODE_LOGIN_ENABLED",
        "VITE_AUTH_EMAIL_CODE_LOGIN_ENABLED",
        "VITE_SDKWORK_AUTH_EMAIL_VERIFICATION_LOGIN_ENABLED",
        "VITE_AUTH_EMAIL_VERIFICATION_LOGIN_ENABLED",
      ],
      DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY.emailCodeLoginEnabled,
    ),
    emailRegistrationVerificationRequired: resolveBooleanSetting(
      explicitPolicy?.emailRegistrationVerificationRequired,
      runtimePolicy?.emailRegistrationVerificationRequired,
      [
        "VITE_SDKWORK_AUTH_EMAIL_REGISTER_VERIFICATION_REQUIRED",
        "VITE_AUTH_EMAIL_REGISTER_VERIFICATION_REQUIRED",
        "VITE_SDKWORK_AUTH_EMAIL_REGISTRATION_VERIFICATION_REQUIRED",
        "VITE_AUTH_EMAIL_REGISTRATION_VERIFICATION_REQUIRED",
        "VITE_SDKWORK_AUTH_REGISTER_EMAIL_CODE_REQUIRED",
        "VITE_AUTH_REGISTER_EMAIL_CODE_REQUIRED",
        "VITE_SDKWORK_AUTH_EMAIL_REGISTER_CODE_REQUIRED",
        "VITE_AUTH_EMAIL_REGISTER_CODE_REQUIRED",
      ],
      DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY.emailRegistrationVerificationRequired,
    ),
    phoneCodeLoginEnabled: resolveBooleanSetting(
      explicitPolicy?.phoneCodeLoginEnabled,
      runtimePolicy?.phoneCodeLoginEnabled,
      [
        "VITE_SDKWORK_AUTH_PHONE_CODE_LOGIN_ENABLED",
        "VITE_AUTH_PHONE_CODE_LOGIN_ENABLED",
        "VITE_SDKWORK_AUTH_PHONE_VERIFICATION_LOGIN_ENABLED",
        "VITE_AUTH_PHONE_VERIFICATION_LOGIN_ENABLED",
      ],
      DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY.phoneCodeLoginEnabled,
    ),
    phoneRegistrationVerificationRequired: resolveBooleanSetting(
      explicitPolicy?.phoneRegistrationVerificationRequired,
      runtimePolicy?.phoneRegistrationVerificationRequired,
      [
        "VITE_SDKWORK_AUTH_PHONE_REGISTER_VERIFICATION_REQUIRED",
        "VITE_AUTH_PHONE_REGISTER_VERIFICATION_REQUIRED",
        "VITE_SDKWORK_AUTH_PHONE_REGISTRATION_VERIFICATION_REQUIRED",
        "VITE_AUTH_PHONE_REGISTRATION_VERIFICATION_REQUIRED",
        "VITE_SDKWORK_AUTH_REGISTER_PHONE_CODE_REQUIRED",
        "VITE_AUTH_REGISTER_PHONE_CODE_REQUIRED",
        "VITE_SDKWORK_AUTH_PHONE_REGISTER_CODE_REQUIRED",
        "VITE_AUTH_PHONE_REGISTER_CODE_REQUIRED",
      ],
      DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY.phoneRegistrationVerificationRequired,
    ),
  };
}

export function resolveSdkworkAuthLoginMethods(
  explicitMethods?: SdkworkAuthLoginMethod[],
  explicitVerificationPolicy?: SdkworkAuthVerificationPolicyConfig,
): SdkworkAuthLoginMethod[] {
  const runtimeMethods = getSdkworkAuthRuntimeConfig()?.loginMethods;
  const envMethods = parseMethodList(
    readEnvValue("VITE_SDKWORK_AUTH_LOGIN_METHODS", "VITE_AUTH_LOGIN_METHODS"),
    isSdkworkAuthLoginMethod,
  );
  const verificationPolicy = resolveSdkworkAuthVerificationPolicy(explicitVerificationPolicy);
  const configuredMethods = explicitMethods !== undefined
    ? explicitMethods
    : hasRuntimeConfigField("loginMethods")
      ? (runtimeMethods ?? [])
      : envMethods.length
        ? envMethods
        : [
            ...DEFAULT_SDKWORK_AUTH_LOGIN_METHODS,
            verificationPolicy.emailCodeLoginEnabled ? "emailCode" as const : null,
            verificationPolicy.phoneCodeLoginEnabled ? "phoneCode" as const : null,
          ];

  return dedupeValues(configuredMethods);
}

export function resolveSdkworkAuthRegisterMethods(
  explicitMethods?: SdkworkAuthRegisterMethod[],
): SdkworkAuthRegisterMethod[] {
  const runtimeMethods = getSdkworkAuthRuntimeConfig()?.registerMethods;
  const envMethods = parseMethodList(
    readEnvValue("VITE_SDKWORK_AUTH_REGISTER_METHODS", "VITE_AUTH_REGISTER_METHODS"),
    isSdkworkAuthRegisterMethod,
  );
  const configuredMethods = explicitMethods !== undefined
    ? explicitMethods
    : hasRuntimeConfigField("registerMethods")
      ? (runtimeMethods ?? [])
      : envMethods.length
        ? envMethods
        : DEFAULT_SDKWORK_AUTH_REGISTER_METHODS;

  return dedupeValues(configuredMethods);
}

export function resolveSdkworkAuthRecoveryMethods(
  explicitMethods?: SdkworkAuthRecoveryMethod[],
): SdkworkAuthRecoveryMethod[] {
  const runtimeMethods = getSdkworkAuthRuntimeConfig()?.recoveryMethods;
  const envMethods = parseMethodList(
    readEnvValue("VITE_SDKWORK_AUTH_RECOVERY_METHODS", "VITE_AUTH_RECOVERY_METHODS"),
    isSdkworkAuthRecoveryMethod,
  );
  const configuredMethods = explicitMethods !== undefined
    ? explicitMethods
    : hasRuntimeConfigField("recoveryMethods")
      ? (runtimeMethods ?? [])
      : envMethods.length
        ? envMethods
        : DEFAULT_SDKWORK_AUTH_RECOVERY_METHODS;

  return dedupeValues(configuredMethods);
}

function resolveDevelopmentVerificationCodePrefillEnabled(
  explicitValue?: SdkworkAuthDevelopmentPrefillConfig,
  runtimeValue?: SdkworkAuthDevelopmentPrefillConfig,
): boolean | undefined {
  if (typeof explicitValue?.verificationCodePrefillEnabled === "boolean") {
    return explicitValue.verificationCodePrefillEnabled;
  }

  if (typeof runtimeValue?.verificationCodePrefillEnabled === "boolean") {
    return runtimeValue.verificationCodePrefillEnabled;
  }

  if (typeof explicitValue?.verificationCodeBypassEnabled === "boolean") {
    return explicitValue.verificationCodeBypassEnabled;
  }

  if (typeof runtimeValue?.verificationCodeBypassEnabled === "boolean") {
    return runtimeValue.verificationCodeBypassEnabled;
  }

  return parseBoolean(
    readEnvValue(
      "VITE_SDKWORK_AUTH_DEV_VERIFICATION_CODE_PREFILL_ENABLED",
      "VITE_AUTH_DEV_VERIFICATION_CODE_PREFILL_ENABLED",
      "VITE_SDKWORK_AUTH_DEV_VERIFICATION_CODE_ENABLED",
      "VITE_AUTH_DEV_VERIFICATION_CODE_ENABLED",
    ),
  );
}

export function resolveSdkworkAuthDevelopmentPrefill(
  explicitValue?: SdkworkAuthDevelopmentPrefillConfig,
): SdkworkAuthDevelopmentPrefillConfig | undefined {
  if (!isSdkworkAuthDevelopmentEnvironment()) {
    return undefined;
  }

  const runtimeValue = getSdkworkAuthRuntimeConfig()?.developmentPrefill;
  const enabled = typeof explicitValue?.enabled === "boolean"
    ? explicitValue.enabled
    : typeof runtimeValue?.enabled === "boolean"
      ? runtimeValue.enabled
      : parseBoolean(
        readEnvValue(
          "VITE_SDKWORK_AUTH_DEV_PREFILL_ENABLED",
          "VITE_AUTH_DEV_PREFILL_ENABLED",
        ),
      );
  const account =
    normalizeOptionalText(explicitValue?.account)
    ?? normalizeOptionalText(runtimeValue?.account)
    ?? readEnvValue(
      "VITE_SDKWORK_AUTH_DEV_DEFAULT_ACCOUNT",
      "VITE_AUTH_DEV_DEFAULT_ACCOUNT",
    );
  const email =
    normalizeOptionalText(explicitValue?.email)
    ?? normalizeOptionalText(runtimeValue?.email)
    ?? readEnvValue(
      "VITE_SDKWORK_AUTH_DEV_DEFAULT_EMAIL",
      "VITE_AUTH_DEV_DEFAULT_EMAIL",
    );
  const phone =
    normalizeOptionalText(explicitValue?.phone)
    ?? normalizeOptionalText(runtimeValue?.phone)
    ?? readEnvValue(
      "VITE_SDKWORK_AUTH_DEV_DEFAULT_PHONE",
      "VITE_AUTH_DEV_DEFAULT_PHONE",
    );
  const password =
    normalizeOptionalSecret(explicitValue?.password)
    ?? normalizeOptionalSecret(runtimeValue?.password);
  const verificationCode =
    normalizeOptionalText(explicitValue?.verificationCode)
    ?? normalizeOptionalText(runtimeValue?.verificationCode)
    ?? readEnvValue(
      "VITE_SDKWORK_AUTH_DEV_VERIFICATION_CODE",
      "VITE_AUTH_DEV_VERIFICATION_CODE",
    );
  const loginMethodCandidate =
    normalizeOptionalText(explicitValue?.loginMethod)
    ?? normalizeOptionalText(runtimeValue?.loginMethod)
    ?? readEnvValue(
      "VITE_SDKWORK_AUTH_DEV_DEFAULT_LOGIN_METHOD",
      "VITE_AUTH_DEV_DEFAULT_LOGIN_METHOD",
    );
  const loginMethod = isSdkworkAuthLoginMethod(loginMethodCandidate)
    ? loginMethodCandidate
    : undefined;
  const verificationCodePrefillEnabled = resolveDevelopmentVerificationCodePrefillEnabled(
    explicitValue,
    runtimeValue,
  );
  const hasAnyValue = Boolean(
    account
      || email
      || phone
      || password
      || loginMethod
      || verificationCode
      || typeof verificationCodePrefillEnabled === "boolean",
  );

  if (enabled === false || (!hasAnyValue && enabled !== true)) {
    return undefined;
  }

  return {
    ...(account ? { account } : {}),
    ...(email ? { email } : {}),
    ...(typeof enabled === "boolean" ? { enabled } : {}),
    ...(loginMethod ? { loginMethod } : {}),
    ...(password ? { password } : {}),
    ...(phone ? { phone } : {}),
    ...(verificationCode ? { verificationCode } : {}),
    ...(typeof verificationCodePrefillEnabled === "boolean"
      ? { verificationCodePrefillEnabled }
      : {}),
  };
}

export function isSdkworkAuthDevelopmentVerificationCodeEnabled(
  explicitValue?: SdkworkAuthDevelopmentPrefillConfig,
): boolean {
  const runtimeValue = getSdkworkAuthRuntimeConfig()?.developmentPrefill;
  if (explicitValue?.enabled === false || runtimeValue?.enabled === false) {
    return false;
  }

  const explicitPrefill = resolveDevelopmentVerificationCodePrefillEnabled(
    explicitValue,
    runtimeValue,
  );

  if (typeof explicitPrefill === "boolean") {
    return explicitPrefill;
  }

  return explicitValue?.enabled === true
    || runtimeValue?.enabled === true
    || isSdkworkAuthDevelopmentEnvironment();
}

export function resolveSdkworkAuthDevelopmentVerificationCode(
  explicitValue?: SdkworkAuthDevelopmentPrefillConfig,
): string | undefined {
  if (!isSdkworkAuthDevelopmentVerificationCodeEnabled(explicitValue)) {
    return undefined;
  }

  const runtimeValue = getSdkworkAuthRuntimeConfig()?.developmentPrefill;
  return normalizeOptionalText(explicitValue?.verificationCode)
    ?? normalizeOptionalText(runtimeValue?.verificationCode)
    ?? readEnvValue(
      "VITE_SDKWORK_AUTH_DEV_VERIFICATION_CODE",
      "VITE_AUTH_DEV_VERIFICATION_CODE",
    )
    ?? DEFAULT_SDKWORK_AUTH_DEVELOPMENT_VERIFICATION_CODE;
}

export function resolveSdkworkAuthLeftRailMode(
  explicitValue?: SdkworkAuthLeftRailMode,
): SdkworkAuthLeftRailMode {
  if (explicitValue && isSdkworkAuthLeftRailMode(explicitValue)) {
    return explicitValue;
  }

  const runtimeValue = getSdkworkAuthRuntimeConfig()?.leftRailMode;
  if (runtimeValue && isSdkworkAuthLeftRailMode(runtimeValue)) {
    return runtimeValue;
  }

  const envValue = readEnvValue(
    "VITE_SDKWORK_AUTH_LEFT_RAIL_MODE",
    "VITE_AUTH_LEFT_RAIL_MODE",
  );
  return isSdkworkAuthLeftRailMode(envValue) ? envValue : DEFAULT_SDKWORK_AUTH_LEFT_RAIL_MODE;
}

export function isSdkworkAuthQrLoginEnabled(explicitValue?: boolean): boolean {
  if (typeof explicitValue === "boolean") {
    return explicitValue;
  }

  const runtimeValue = getSdkworkAuthRuntimeConfig()?.qrLoginEnabled;
  if (typeof runtimeValue === "boolean") {
    return runtimeValue;
  }

  return parseBoolean(
    readEnvValue("VITE_SDKWORK_AUTH_QR_LOGIN_ENABLED", "VITE_AUTH_QR_LOGIN_ENABLED"),
  ) ?? true;
}

export function isSdkworkAuthOAuthLoginEnabled(
  explicitValue?: boolean,
  verificationPolicy?: SdkworkAuthVerificationPolicyConfig,
): boolean {
  if (typeof explicitValue === "boolean") {
    return explicitValue;
  }

  if (typeof verificationPolicy?.oauthLoginEnabled === "boolean") {
    return verificationPolicy.oauthLoginEnabled;
  }

  const runtimeValue = getSdkworkAuthRuntimeConfig()?.oauthLoginEnabled;
  if (typeof runtimeValue === "boolean") {
    return runtimeValue;
  }

  return parseBoolean(
    readEnvValue("VITE_SDKWORK_AUTH_OAUTH_LOGIN_ENABLED", "VITE_AUTH_OAUTH_LOGIN_ENABLED"),
  ) ?? false;
}

export function normalizeSdkworkAuthOAuthProvider(
  provider: string | undefined,
): string | null {
  return normalizeProvider(provider);
}

export function isConfiguredSdkworkAuthOAuthProvider(
  provider: string | undefined,
  configuredProviders = resolveSdkworkAuthOAuthProviders(),
): boolean {
  const normalized = normalizeProvider(provider);
  return Boolean(normalized && configuredProviders.includes(normalized));
}

export function humanizeSdkworkAuthProvider(provider: string): string {
  return provider
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

export function resolveSdkworkRecoveryChannel(
  method: SdkworkAuthRecoveryMethod,
): "EMAIL" | "SMS" {
  return method === "phone" ? "SMS" : "EMAIL";
}

export function looksLikeEmailAddress(value: string | undefined | null): boolean {
  const normalized = (value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function looksLikePhoneNumber(value: string | undefined | null): boolean {
  const normalized = (value || "").trim().replace(/[\s()-]+/g, "");
  return /^\+?\d{6,20}$/.test(normalized);
}

export function readSdkworkIdentityErrorMessage(
  error: unknown,
  fallback: string,
  errorMessages: {
    accountAlreadyExists?: string;
  } = {},
): string {
  const duplicateAccountMessage = errorMessages.accountAlreadyExists;
  if (duplicateAccountMessage && isSdkworkAccountAlreadyExistsError(error)) {
    return duplicateAccountMessage;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

function isSdkworkAccountAlreadyExistsError(error: unknown): boolean {
  const candidate = error instanceof Error ? error.message : error;
  const record = parseErrorRecord(candidate);
  if (record) {
    const code = typeof record.code === "string" ? record.code.trim() : "";
    const message = typeof record.message === "string"
      ? record.message.trim()
      : typeof record.msg === "string"
        ? record.msg.trim()
        : "";
    return code === "iam_account_already_exists"
      || isAccountAlreadyExistsMessage(message);
  }

  return isAccountAlreadyExistsMessage(
    typeof candidate === "string" ? candidate : "",
  );
}

function parseErrorRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized.startsWith("{")) {
    return null;
  }

  try {
    const parsed = JSON.parse(normalized) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function isAccountAlreadyExistsMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized === "account already exists"
    || normalized === "iam_account_already_exists"
    || normalized.includes("iam_account_already_exists");
}

export function normalizeSdkworkAuthThirdPartyLoginErrorMessage(
  message: string | undefined | null,
  copy: {
    genericProviderError: string;
    invalidProvider: string;
    providerDenied: string;
  },
): string {
  const normalizedMessage = (message || "").trim();
  if (!normalizedMessage) {
    return copy.genericProviderError;
  }

  const normalizedKey = normalizedMessage
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gu, "_")
    .replace(/^_+|_+$/gu, "");

  if (
    normalizedKey === "access_denied"
    || normalizedKey === "authorization_denied"
    || normalizedKey === "user_denied"
    || normalizedKey === "login_denied"
    || normalizedKey === "cancelled"
    || normalizedKey === "canceled"
    || normalizedKey.includes("access_denied")
    || normalizedKey.includes("user_cancel")
    || normalizedKey.includes("\u53d6\u6d88")
    || normalizedKey.includes("\u62d2\u7edd")
    || normalizedKey.includes("\u672a\u6388\u6743")
  ) {
    return copy.providerDenied;
  }

  if (
    normalizedKey.includes("provider_is_not_configured")
    || normalizedKey.includes("provider_not_configured")
    || normalizedKey.includes("oauth_provider_is_not_configured")
    || normalizedKey.includes("oauth_provider_not_configured")
    || normalizedKey.includes("unsupported_provider")
    || normalizedKey.includes("invalid_provider")
    || normalizedKey.includes("\u672a\u914d\u7f6e")
    || normalizedKey.includes("\u672a\u5f00\u542f")
    || normalizedKey.includes("\u4e0d\u652f\u6301")
    || normalizedKey.includes("\u4e0d\u53ef\u7528")
  ) {
    return copy.invalidProvider;
  }

  if (/\boauth\b/iu.test(normalizedMessage) || /\bprovider\b/iu.test(normalizedMessage)) {
    return copy.genericProviderError;
  }

  return normalizedMessage;
}
