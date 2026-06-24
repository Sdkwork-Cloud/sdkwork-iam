import type {
  UserCenterAuthProfileInput,
  UserCenterBridgeConfigInput,
  UserCenterProviderConfig,
  UserCenterRuntimeBindingOptions,
  UserCenterRuntimeConfigInput,
  UserCenterTokenHeaders,
} from "../types/userCenterTypes.ts";
import { USER_CENTER_DEPLOYMENT_VARIABLE_NAMES } from "./userCenterDeployment.ts";
import { normalizeUserCenterPath } from "./userCenterStandard.ts";
import { normalizeUserCenterNamespace } from "./userCenterStorage.ts";
import { coalesce, defaultIfBlank, isBlank, trim } from "@sdkwork/utils";

type UserCenterRuntimeConfigInputLike = {
  auth?: UserCenterAuthProfileInput;
  localApiBasePath?: string;
  mode?: UserCenterBridgeConfigInput["mode"] | UserCenterRuntimeConfigInput["mode"];
  provider?:
    | UserCenterBridgeConfigInput["provider"]
    | UserCenterRuntimeConfigInput["provider"];
};

function normalizeRuntimeText(value: unknown): string | undefined {
  return typeof value === "string" ? coalesce(value) : undefined;
}

function normalizeRuntimeUrl(value: unknown): string | undefined {
  return normalizeRuntimeText(value)?.replace(/\/+$/u, "");
}

function parseRuntimeBoolean(value: unknown): boolean | undefined {
  const normalized = normalizeRuntimeText(value)?.toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}

function parseRuntimeInteger(value: unknown): number | undefined {
  const normalized = normalizeRuntimeText(value);
  if (!normalized) {
    return undefined;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveWindowPrefix(options: UserCenterRuntimeBindingOptions): string {
  const windowPrefix = coalesce(options.windowPrefix);
  if (windowPrefix) {
    return windowPrefix;
  }

  return options.envPrefix.replace(/^VITE_/u, "");
}

function createWindowGlobalName(prefix: string, canonicalName: string): string {
  const suffix = canonicalName.replace(/^SDKWORK_USER_CENTER_/u, "");
  return `__${prefix}${suffix}__`;
}

function createEnvName(prefix: string, canonicalName: string): string {
  const suffix = canonicalName.replace(/^SDKWORK_USER_CENTER_/u, "");
  return `${prefix}${suffix}`;
}

function readRuntimeValue(
  canonicalName: string,
  options: UserCenterRuntimeBindingOptions,
): unknown {
  const windowPrefix = resolveWindowPrefix(options);
  const windowValue = options.window?.[createWindowGlobalName(windowPrefix, canonicalName)];
  if (windowValue !== undefined && windowValue !== null) {
    return windowValue;
  }

  return options.env?.[createEnvName(options.envPrefix, canonicalName)];
}

function resolveRuntimeMode(
  value: unknown,
  runtimeAppApiBaseUrl?: string,
  runtimeExternalBaseUrl?: string,
): UserCenterRuntimeConfigInputLike["mode"] | undefined {
  const normalized = normalizeRuntimeText(value)?.toLowerCase();
  if (normalized) {
    if (normalized === "builtin-local") {
      return "local-native";
    }

    if (normalized === "sdkwork-cloud-app-api") {
      return "app-api-hub";
    }

    if (normalized === "external-user-center") {
      return "external-hub";
    }
  }

  if (runtimeExternalBaseUrl && !runtimeAppApiBaseUrl) {
    return "external-hub";
  }

  if (runtimeAppApiBaseUrl && !runtimeExternalBaseUrl) {
    return "app-api-hub";
  }

  return undefined;
}

function resolveRuntimeProviderKind(
  mode: UserCenterRuntimeConfigInputLike["mode"] | undefined,
  runtimeAppApiBaseUrl?: string,
  runtimeExternalBaseUrl?: string,
): NonNullable<UserCenterRuntimeConfigInputLike["provider"]>["kind"] {
  if (mode === "external-hub" || Boolean(runtimeExternalBaseUrl)) {
    return "external-user-center";
  }

  if (mode === "app-api-hub" || Boolean(runtimeAppApiBaseUrl)) {
    return "sdkwork-cloud-app-api";
  }

  return "builtin-local";
}

function resolveRuntimeProviderBaseUrl(
  mode: UserCenterRuntimeConfigInputLike["mode"] | undefined,
  runtimeAppApiBaseUrl?: string,
  runtimeExternalBaseUrl?: string,
): string | undefined {
  if (mode === "external-hub") {
    return runtimeExternalBaseUrl ?? runtimeAppApiBaseUrl;
  }

  if (mode === "app-api-hub") {
    return runtimeAppApiBaseUrl ?? runtimeExternalBaseUrl;
  }

  if (runtimeExternalBaseUrl && !runtimeAppApiBaseUrl) {
    return runtimeExternalBaseUrl;
  }

  if (runtimeAppApiBaseUrl && !runtimeExternalBaseUrl) {
    return runtimeAppApiBaseUrl;
  }

  return undefined;
}

function resolveRuntimeTokenHeaders(
  options: UserCenterRuntimeBindingOptions,
): Partial<UserCenterTokenHeaders> {
  const tokenHeaders: Partial<UserCenterTokenHeaders> = {};
  const authorizationHeaderName = normalizeRuntimeText(
    readRuntimeValue(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.authorizationHeaderName, options),
  );
  const accessTokenHeaderName = normalizeRuntimeText(
    readRuntimeValue(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.accessTokenHeaderName, options),
  );
  const refreshTokenHeaderName = normalizeRuntimeText(
    readRuntimeValue(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.refreshTokenHeaderName, options),
  );
  const sessionHeaderName = normalizeRuntimeText(
    readRuntimeValue(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.sessionHeaderName, options),
  );
  const authorizationScheme = normalizeRuntimeText(
    readRuntimeValue(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.authorizationScheme, options),
  );

  if (authorizationHeaderName) {
    tokenHeaders.authorizationHeaderName = authorizationHeaderName;
  }
  if (accessTokenHeaderName) {
    tokenHeaders.accessTokenHeaderName = accessTokenHeaderName;
  }
  if (refreshTokenHeaderName) {
    tokenHeaders.refreshTokenHeaderName = refreshTokenHeaderName;
  }
  if (sessionHeaderName) {
    tokenHeaders.sessionHeaderName = sessionHeaderName;
  }
  if (authorizationScheme) {
    tokenHeaders.authorizationScheme = authorizationScheme;
  }

  return tokenHeaders;
}

function mergeRuntimeAuthInput(
  explicitAuth: UserCenterAuthProfileInput | undefined,
  runtimeAuth: UserCenterAuthProfileInput | undefined,
): UserCenterAuthProfileInput | undefined {
  if (!explicitAuth && !runtimeAuth) {
    return undefined;
  }

  const explicitTokenHeaders = explicitAuth?.tokenHeaders ?? {};
  const runtimeTokenHeaders = runtimeAuth?.tokenHeaders ?? {};
  const mergedTokenHeaders = {
    ...runtimeTokenHeaders,
    ...explicitTokenHeaders,
  };
  const explicitHandshake = explicitAuth?.handshake ?? {};
  const runtimeHandshake = runtimeAuth?.handshake ?? {};
  const mergedHandshake = {
    ...runtimeHandshake,
    ...explicitHandshake,
  };

  return {
    ...(runtimeAuth ?? {}),
    ...(explicitAuth ?? {}),
    ...(Object.keys(mergedTokenHeaders).length > 0 ? { tokenHeaders: mergedTokenHeaders } : {}),
    ...(Object.keys(mergedHandshake).length > 0 ? { handshake: mergedHandshake } : {}),
  };
}

export function resolveUserCenterRuntimeConfigInput<T extends UserCenterRuntimeConfigInputLike>(
  options: T,
  bindings: UserCenterRuntimeBindingOptions,
): T {
  const runtimeAppApiBaseUrl = normalizeRuntimeUrl(
    readRuntimeValue(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.appApiBaseUrl, bindings),
  );
  const runtimeExternalBaseUrl = normalizeRuntimeUrl(
    readRuntimeValue(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.externalBaseUrl, bindings),
  );
  const runtimeMode = resolveRuntimeMode(
    readRuntimeValue(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.mode, bindings),
    runtimeAppApiBaseUrl,
    runtimeExternalBaseUrl,
  );
  const runtimeProviderKey = normalizeRuntimeText(
    readRuntimeValue(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.providerKey, bindings),
  );
  const runtimeLocalApiBasePath = normalizeRuntimeText(
    readRuntimeValue(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.localApiBasePath, bindings),
  );
  const runtimeHandshakeFreshnessWindowMs = parseRuntimeInteger(
    readRuntimeValue(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.handshakeFreshnessWindowMs, bindings),
  );

  const mode = options.mode ?? runtimeMode;
  const providerBaseUrl = options.provider?.baseUrl
    ?? resolveRuntimeProviderBaseUrl(mode, runtimeAppApiBaseUrl, runtimeExternalBaseUrl);
  const providerKey = options.provider?.providerKey
    ?? (runtimeProviderKey ? normalizeUserCenterNamespace(runtimeProviderKey) : undefined);
  const providerKind = options.provider?.kind
    ?? resolveRuntimeProviderKind(
      mode,
      providerBaseUrl === runtimeAppApiBaseUrl ? runtimeAppApiBaseUrl : undefined,
      providerBaseUrl === runtimeExternalBaseUrl ? runtimeExternalBaseUrl : undefined,
    );
  const runtimeTokenHeaders = resolveRuntimeTokenHeaders(bindings);
  const runtimeAuthOverrides: UserCenterAuthProfileInput = {
    ...(runtimeHandshakeFreshnessWindowMs === undefined
      ? {}
      : {
          handshake: {
            freshnessWindowMs: runtimeHandshakeFreshnessWindowMs,
          },
        }),
    ...(Object.keys(runtimeTokenHeaders).length > 0
      ? {
          tokenHeaders: runtimeTokenHeaders,
        }
      : {}),
  };
  const runtimeAuth = Object.keys(runtimeAuthOverrides).length > 0
    ? mergeRuntimeAuthInput(undefined, runtimeAuthOverrides)
    : undefined;
  const auth = mergeRuntimeAuthInput(options.auth, runtimeAuth);

  return {
    ...options,
    ...(auth ? { auth } : {}),
    ...(mode ? { mode } : {}),
    ...(options.localApiBasePath ?? runtimeLocalApiBasePath
      ? {
          localApiBasePath: normalizeUserCenterPath(
            options.localApiBasePath ?? runtimeLocalApiBasePath,
            options.localApiBasePath ?? runtimeLocalApiBasePath ?? "/",
          ),
        }
      : {}),
    ...(options.provider || providerBaseUrl || providerKey || runtimeMode
      ? {
          provider: {
            ...(providerBaseUrl ? { baseUrl: providerBaseUrl } : {}),
            ...(options.provider?.headers ? { headers: options.provider.headers } : {}),
            kind: providerKind,
            ...(providerKey ? { providerKey } : {}),
          } satisfies Partial<UserCenterProviderConfig> & Pick<UserCenterProviderConfig, "kind">,
        }
      : {}),
  };
}
