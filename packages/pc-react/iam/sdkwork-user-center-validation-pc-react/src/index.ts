export const userCenterValidationPackageMeta = {
  package: "@sdkwork/user-center-validation-pc-react",
  architecture: "pc-react",
  domain: "iam",
  capability: "user-center-validation",
  status: "ready",
} as const;

export type UserCenterValidationPackageMeta = typeof userCenterValidationPackageMeta;

export {
  assertUserCenterValidationInteropContract,
  assertUserCenterValidationPreflightCompatibility,
  USER_CENTER_VALIDATION_SOURCE_PACKAGE_NAME,
  createUserCenterValidationInteropContract,
  createUserCenterValidationPluginDefinition,
  createUserCenterValidationPreflightReport,
  createUserCenterValidationSnapshot,
  diffUserCenterValidationInteropContract,
  requireUserCenterProtectedToken,
  resolveUserCenterProtectedToken,
} from "./validation.ts";
export { createSdkworkCanonicalUserCenterValidationDefinition } from "./validationDefinition.ts";
export * from "./validation.ts";
export * from "./validationDefinition.ts";
export { createUserCenterServerValidationPluginDefinition } from "./serverValidation.ts";
export * from "./serverValidation.ts";
export type {
  UserCenterServerValidationPluginDefinition,
  UserCenterServerValidationPluginDefinitionOptions,
} from "@sdkwork/user-center-core-pc-react";
