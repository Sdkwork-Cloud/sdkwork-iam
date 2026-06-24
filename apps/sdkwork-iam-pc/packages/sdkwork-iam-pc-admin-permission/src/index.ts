export {
  canAccessBackendApi,
  hasPermissionInScope,
  permissionMatches,
  resolveIamBackendOperationPermission,
  SDKWORK_STANDARD_ROLE_CODES,
  type IamUserSurface,
  type SdkworkStandardRoleCode,
} from "@sdkwork/iam-contracts";
export * from "./types/permission-admin-types";
export { createSdkworkIamPermissionController } from "./services/permission-admin-controller";
export { SdkworkIamPermissionAdminWorkspace } from "./pages/PermissionAdminWorkspace";
export { IAM_PC_ADMIN_PERMISSION_ROUTES } from "./routes/permission-admin-routes";
export {
  RequireBackendAccess,
  RequireOrganizationMember,
  RequirePermission,
  SdkworkIamPermissionProvider,
  useSdkworkIamPermissionController,
  type RequireBackendAccessProps,
  type RequireOrganizationMemberProps,
  type RequirePermissionProps,
  type SdkworkIamPermissionProviderProps,
} from "./components/guards";
