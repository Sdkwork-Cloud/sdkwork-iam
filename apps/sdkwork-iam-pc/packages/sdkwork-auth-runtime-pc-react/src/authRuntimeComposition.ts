import {
  resolveSdkworkAuthRuntimeConfigFromMetadata,
  type SdkworkCanonicalAuthMetadataLike,
} from "../../sdkwork-auth-pc-react/src/auth-runtime-metadata.ts";
import type { SdkworkAuthDevelopmentPrefillConfig, SdkworkAuthRuntimeConfig } from "../../sdkwork-auth-pc-react/src/auth-runtime-config.ts";
import {
  createIdentityDeploymentProfile,
  createUserCenterBridgeConfig,
  createUserCenterDeploymentProfiles,
  type IdentityDeploymentMode,
  type IdentityDeploymentSurface,
  type IdentityTransportKind,
  type UserCenterBridgeConfig,
  type UserCenterBridgeConfigInput,
  type UserCenterDeploymentProfile,
  type UserCenterDeploymentProfileSet,
} from "../../sdkwork-user-center-core-pc-react/src/index.ts";
import { resolveCanonicalAuthDevelopmentPrefill } from "./authRuntimeDevelopmentPrefill.ts";

function resolveSurface(
  surface: IdentityDeploymentSurface | undefined,
  bridgeConfig: Pick<UserCenterBridgeConfig, "provider">,
): IdentityDeploymentSurface {
  if (surface) {
    return surface;
  }

  return bridgeConfig.provider.kind === "builtin-local" ? "desktop" : "web";
}

function selectActiveDeploymentProfile(
  deploymentProfiles: UserCenterDeploymentProfileSet,
): UserCenterDeploymentProfile {
  if (deploymentProfiles.activeKind === "sdkwork-cloud-app-api") {
    return deploymentProfiles.externalAppApi;
  }

  if (deploymentProfiles.activeKind === "external-user-center") {
    return deploymentProfiles.externalUserCenter ?? deploymentProfiles.externalAppApi;
  }

  return deploymentProfiles.builtinLocal;
}

export interface CanonicalAuthIdentityDeploymentProfile {
  identityMode: IdentityDeploymentMode;
  providerKind: UserCenterDeploymentProfile["providerKind"];
  surface: IdentityDeploymentSurface;
  transportKind: IdentityTransportKind;
}

export interface CreateCanonicalAuthRuntimeCompositionOptions
  extends Omit<UserCenterBridgeConfigInput, "auth"> {
  authConfig?: SdkworkCanonicalAuthMetadataLike | null;
  developmentPrefill?: SdkworkAuthDevelopmentPrefillConfig;
  surface?: IdentityDeploymentSurface;
  userCenterAuth?: UserCenterBridgeConfigInput["auth"];
}

export interface CanonicalAuthRuntimeComposition {
  authRuntimeConfig: SdkworkAuthRuntimeConfig;
  developmentPrefill?: SdkworkAuthDevelopmentPrefillConfig;
  identityDeploymentProfile: CanonicalAuthIdentityDeploymentProfile;
  userCenterBridgeConfig: UserCenterBridgeConfig;
  userCenterDeploymentProfile: UserCenterDeploymentProfile;
}

export function createCanonicalAuthRuntimeComposition(
  options: CreateCanonicalAuthRuntimeCompositionOptions,
): CanonicalAuthRuntimeComposition {
  const userCenterBridgeConfig = createUserCenterBridgeConfig({
    auth: options.userCenterAuth,
    localApiBasePath: options.localApiBasePath,
    mode: options.mode,
    namespace: options.namespace,
    provider: options.provider,
    routes: options.routes,
    storageTopology: options.storageTopology,
  });
  const surface = resolveSurface(options.surface, userCenterBridgeConfig);
  const deploymentProfiles = createUserCenterDeploymentProfiles(userCenterBridgeConfig);
  const userCenterDeploymentProfile = selectActiveDeploymentProfile(deploymentProfiles);
  const fullIdentityDeploymentProfile = createIdentityDeploymentProfile({
    profile: userCenterDeploymentProfile,
    surface,
  });
  const developmentPrefill = resolveCanonicalAuthDevelopmentPrefill({
    developmentPrefill: options.developmentPrefill,
    identityDeploymentProfile: fullIdentityDeploymentProfile,
    namespace: userCenterBridgeConfig.namespace,
  });

  return {
    authRuntimeConfig: {
      ...resolveSdkworkAuthRuntimeConfigFromMetadata(options.authConfig),
      ...(developmentPrefill ? { developmentPrefill } : {}),
    },
    ...(developmentPrefill ? { developmentPrefill } : {}),
    identityDeploymentProfile: {
      identityMode: fullIdentityDeploymentProfile.identityMode,
      providerKind: fullIdentityDeploymentProfile.providerKind,
      surface: fullIdentityDeploymentProfile.surface,
      transportKind: fullIdentityDeploymentProfile.transportKind,
    },
    userCenterBridgeConfig,
    userCenterDeploymentProfile,
  };
}
