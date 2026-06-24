import type {
  UserCenterDeploymentProfileSet,
  UserCenterPluginCapabilityName,
  UserCenterPluginDefinition,
  UserCenterPluginDefinitionOptions,
  UserCenterWorkspaceManifestBase,
} from "../types/userCenterTypes.ts";
import { createUserCenterBridgeConfig } from "./userCenterBridge.ts";
import { createUserCenterDeploymentProfiles } from "./userCenterDeployment.ts";

const USER_CENTER_PLUGIN_CAPABILITIES = ["auth", "user"] as const satisfies readonly UserCenterPluginCapabilityName[];

function toUniquePackages(packageNames: readonly string[]): string[] {
  return Array.from(
    new Set(
      packageNames
        .map((packageName) => packageName.trim())
        .filter(Boolean),
    ),
  );
}

function resolvePluginCapabilities(
  capabilities: UserCenterPluginDefinitionOptions["capabilities"],
): UserCenterPluginCapabilityName[] {
  if (!capabilities || capabilities.length === 0) {
    return [...USER_CENTER_PLUGIN_CAPABILITIES];
  }

  return USER_CENTER_PLUGIN_CAPABILITIES.filter((capability) => capabilities.includes(capability));
}

function createManifestBase(options: {
  description?: string;
  host?: "browser" | "server" | "tauri";
  id: string;
  packageNames: string[];
  theme?: string;
  title: string;
}): UserCenterWorkspaceManifestBase {
  return {
    ...(options.description ? { description: options.description } : {}),
    ...(options.host ? { host: options.host } : {}),
    id: options.id,
    packageNames: toUniquePackages(options.packageNames),
    ...(options.theme ? { theme: options.theme } : {}),
    title: options.title,
  };
}

export function createUserCenterPluginDefinition(
  options: UserCenterPluginDefinitionOptions,
): UserCenterPluginDefinition {
  const bridgeConfig = createUserCenterBridgeConfig(options);
  const capabilities = resolvePluginCapabilities(options.capabilities);
  const packageNames = options.packageNames ?? ["@sdkwork/user-center-core-pc-react"];
  const host = options.host;
  const title = options.title ?? "User Center";
  const theme = options.theme;
  const manifests: UserCenterPluginDefinition["manifests"] = {};
  const deployment: UserCenterDeploymentProfileSet =
    createUserCenterDeploymentProfiles(bridgeConfig);

  if (capabilities.includes("auth")) {
    manifests.auth = {
      ...createManifestBase({
        description:
          "Auth workspace for anonymous-entry routing, OAuth callbacks, and reusable auth surface assembly.",
        host,
        id: `${bridgeConfig.namespace}-auth`,
        packageNames,
        theme,
        title: `${title} Auth`,
      }),
      capability: "auth",
      forgotPasswordRoutePath: `${bridgeConfig.routes.authBasePath}/forgot-password`,
      loginRoutePath: `${bridgeConfig.routes.authBasePath}/login`,
      oauthCallbackRoutePattern: `${bridgeConfig.routes.authBasePath}/oauth/callback/:provider`,
      qrRoutePath: `${bridgeConfig.routes.authBasePath}/qr-login`,
      registerRoutePath: `${bridgeConfig.routes.authBasePath}/register`,
    };
  }

  if (capabilities.includes("user")) {
    manifests.user = {
      ...createManifestBase({
        description:
          "User workspace for profile-center routing, section navigation, and reusable account-surface assembly.",
        host,
        id: `${bridgeConfig.namespace}-user`,
        packageNames,
        theme,
        title: `${title} User`,
      }),
      capability: "user",
      routePath: bridgeConfig.routes.userRoutePath,
      sectionRoutePattern: `${bridgeConfig.routes.userRoutePath}/sections/:sectionId`,
    };
  }

  return {
    auth: bridgeConfig.auth,
    capability: "user-center",
    capabilities,
    bridgeConfig,
    deployment,
    integration: bridgeConfig.integration,
    manifests,
    storageTopology: bridgeConfig.storageTopology,
    storagePlan: bridgeConfig.storagePlan,
  };
}
