import type {
  UserCenterAuthProfileInput,
  UserCenterRuntimeConfig,
  UserCenterRuntimeConfigInput,
  UserCenterStorageConfig,
} from "../types/userCenterTypes.ts";
import {
  createUserCenterStoragePlan,
  normalizeUserCenterNamespace,
} from "./userCenterStorage.ts";
import {
  USER_CENTER_DEFAULT_LOCAL_API_BASE_PATH,
  createUserCenterLocalApiRoutes,
} from "./userCenterLocalApi.ts";
import { coalesce, trim } from "@sdkwork/utils";
import {
  filterUserCenterGovernedHeaders,
  normalizeUserCenterAuthProfile,
  normalizeUserCenterIntegrationProfiles,
  normalizeUserCenterPath,
  normalizeUserCenterProviderConfig,
  normalizeUserCenterRoutes,
  normalizeUserCenterStorageTopology,
} from "./userCenterStandard.ts";

export const USER_CENTER_CONFIG_SCHEMA_VERSION = 1;
export {
  USER_CENTER_DEFAULT_SQLITE_FILENAME,
  USER_CENTER_DEFAULT_TABLE_PREFIX,
  USER_CENTER_STANDARD_ENTITY_NAMES,
} from "./userCenterStandard.ts";

function normalizeModeScopedAuthInput(
  auth: UserCenterAuthProfileInput | undefined,
  mode:
    | "dual-token"
    | "upstream-app-api-token-bridge"
    | "upstream-external-token-bridge",
): UserCenterAuthProfileInput | undefined {
  if (!auth) {
    return undefined;
  }

  return {
    ...auth,
    mode,
  };
}

function normalizeStorageConfig(storage: UserCenterStorageConfig): UserCenterStorageConfig {
  if (storage.dialect === "sqlite") {
    return {
      dialect: "sqlite",
      sqlitePath: storage.sqlitePath.trim(),
    };
  }

  const schema = coalesce(storage.schema);

  return {
    dialect: "postgresql",
    postgresUrl: trim(storage.postgresUrl),
    ...(schema ? { schema } : {}),
  };
}

export function normalizeUserCenterConfig(
  input: UserCenterRuntimeConfigInput,
): UserCenterRuntimeConfig {
  const namespace = normalizeUserCenterNamespace(input.namespace);
  const mode = input.mode ?? "local-native";
  const provider = normalizeUserCenterProviderConfig(namespace, input.provider, mode);
  const localApiBasePath = normalizeUserCenterPath(
    input.localApiBasePath,
    USER_CENTER_DEFAULT_LOCAL_API_BASE_PATH,
  );
  const storage = normalizeStorageConfig(input.storage);
  const routes = normalizeUserCenterRoutes(input.routes);
  const storagePlan = createUserCenterStoragePlan(namespace);
  const auth = normalizeUserCenterAuthProfile({
    auth: input.auth,
    mode,
    namespace,
    provider,
    storagePlan,
  });
  const sanitizedProviderHeaders = filterUserCenterGovernedHeaders({ auth }, provider.headers);
  const sanitizedProvider = {
    ...provider,
    ...(sanitizedProviderHeaders ? { headers: sanitizedProviderHeaders } : {}),
  };
  const externalAppApiBaseUrl =
    provider.kind === "sdkwork-cloud-app-api"
      ? provider.baseUrl
      : undefined;
  const externalUserCenterBaseUrl =
    provider.kind === "external-user-center"
      ? provider.baseUrl
      : undefined;
  const builtinLocalProvider = normalizeUserCenterProviderConfig(
    namespace,
    {
      kind: "builtin-local",
    },
    "local-native",
  );
  const externalAppApiProvider = normalizeUserCenterProviderConfig(
    namespace,
    {
      ...(externalAppApiBaseUrl ? { baseUrl: externalAppApiBaseUrl } : {}),
      kind: "sdkwork-cloud-app-api",
      providerKey:
        provider.kind === "sdkwork-cloud-app-api"
          ? provider.providerKey
          : `${namespace}-app-api`,
    },
    "app-api-hub",
  );
  const externalUserCenterProvider = normalizeUserCenterProviderConfig(
    namespace,
    {
      ...(externalUserCenterBaseUrl ? { baseUrl: externalUserCenterBaseUrl } : {}),
      kind: "external-user-center",
      providerKey:
        provider.kind === "external-user-center"
          ? provider.providerKey
          : `${namespace}-external`,
    },
    "external-hub",
  );
  const builtinLocalAuth = normalizeUserCenterAuthProfile({
    auth: normalizeModeScopedAuthInput(input.auth, "dual-token"),
    mode: "local-native",
    namespace,
    provider: builtinLocalProvider,
    storagePlan,
  });
  const externalAppApiAuth = normalizeUserCenterAuthProfile({
    auth: normalizeModeScopedAuthInput(input.auth, "upstream-app-api-token-bridge"),
    mode: "app-api-hub",
    namespace,
    provider: externalAppApiProvider,
    storagePlan,
  });
  const externalUserCenterAuth = normalizeUserCenterAuthProfile({
    auth: normalizeModeScopedAuthInput(input.auth, "upstream-external-token-bridge"),
    mode: "external-hub",
    namespace,
    provider: externalUserCenterProvider,
    storagePlan,
  });

  return {
    auth,
    capability: "user-center",
    integration: normalizeUserCenterIntegrationProfiles(
      namespace,
      mode,
      localApiBasePath,
      {
        active: sanitizedProvider,
        externalAppApi: externalAppApiProvider,
        externalUserCenter: externalUserCenterProvider,
      },
      {
        builtinLocal: builtinLocalAuth,
        externalAppApi: externalAppApiAuth,
        externalUserCenter: externalUserCenterAuth,
      },
    ),
    localApi: createUserCenterLocalApiRoutes(localApiBasePath),
    mode,
    namespace,
    provider: sanitizedProvider,
    routes,
    schemaVersion: USER_CENTER_CONFIG_SCHEMA_VERSION,
    storage,
    storagePlan,
    storageTopology: normalizeUserCenterStorageTopology(namespace, input.storageTopology, storage),
  };
}

export function createDefaultUserCenterConfig(
  input: UserCenterRuntimeConfigInput,
): UserCenterRuntimeConfig {
  return normalizeUserCenterConfig(input);
}
