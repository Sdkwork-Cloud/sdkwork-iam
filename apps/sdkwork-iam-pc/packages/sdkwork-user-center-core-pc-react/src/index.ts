export const userCenterCorePackageMeta = {
  package: "@sdkwork/user-center-core-pc-react",
  architecture: "pc-react",
  domain: "iam",
  capability: "user-center-core",
  status: "ready",
} as const;

export type UserCenterCorePackageMeta = typeof userCenterCorePackageMeta;

export * from "./types/userCenterTypes.ts";
export * from "./domain/userCenterStorage.ts";
export * from "./domain/userCenterLocalApi.ts";
export * from "./domain/userCenterCanonicalRoutes.ts";
export * from "./domain/userCenterSurfaceRoutes.ts";
export * from "./domain/userCenterStandardAppRoutes.ts";
export * from "./domain/userCenterStandard.ts";
export * from "./domain/userCenterCanonicalDefinition.ts";
export {
  createUserCenterHandshakeSigningMessage,
  createUserCenterSignedHandshakeHeaders,
} from "./domain/userCenterStandard.ts";
export * from "./domain/userCenterAuthInterop.ts";
export * from "./domain/userCenterBridge.ts";
export * from "./domain/userCenterConfig.ts";
export * from "./domain/userCenterDeployment.ts";
export {
  createIdentityDeploymentProfile,
  createUserCenterPrefixedEnvironmentVariableName,
  createUserCenterDeploymentProfiles,
  createUserCenterDeploymentEnvArtifact,
  createUserCenterDeploymentEnvArtifactForProfile,
  mapUserCenterDeploymentVariablesToEnvironmentVariables,
  mergeUserCenterDeploymentVariables,
  renderUserCenterDeploymentEnvTemplate,
  USER_CENTER_DEPLOYMENT_VARIABLE_NAMES,
  selectUserCenterDeploymentVariables,
} from "./domain/userCenterDeployment.ts";
export * from "./domain/userCenterCommandMatrix.ts";
export * from "./domain/userCenterMapping.ts";
export * from "./domain/userCenterPlugin.ts";
export * from "./domain/userCenterServer.ts";
export { createUserCenterServerPluginDefinition } from "./domain/userCenterServer.ts";
export * from "./domain/userCenterSeedContracts.ts";
export * from "./domain/userCenterProtectedToken.ts";
export * from "./domain/userCenterSession.ts";
export * from "./domain/userCenterRuntimeClient.ts";
export * from "./domain/userCenterAppSdkRuntimeClient.ts";
export * from "./domain/userCenterRuntimeBridge.ts";
export * from "./domain/userCenterRuntimeSessionBinding.ts";
export * from "./domain/userCenterRuntimeBindings.ts";
