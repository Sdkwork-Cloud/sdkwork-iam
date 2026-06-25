export function listSdkworkIamPcAdminSdkInventory() {
  return [
    "@sdkwork/iam-backend-sdk",
  ] as const;
}

export const IAM_PC_ADMIN_CAPABILITY_PACKAGES = [
  "@sdkwork/iam-pc-admin-oauth",
  "@sdkwork/iam-pc-admin-tenant",
  "@sdkwork/iam-pc-admin-organization",
  "@sdkwork/iam-pc-admin-permission",
  "@sdkwork/iam-pc-admin-account-binding",
  "@sdkwork/iam-pc-admin-user",
] as const;

export type IamPcAdminCapabilityPackage = (typeof IAM_PC_ADMIN_CAPABILITY_PACKAGES)[number];

export interface IamPcAdminModuleRecord {
  capability: string;
  id: string;
  packageName: IamPcAdminCapabilityPackage;
  permissionPrefix: string;
  routeBasePath: string;
}

export function createSdkworkIamPcAdminModuleRegistry(): readonly IamPcAdminModuleRecord[] {
  return [
    {
      capability: "oauth",
      id: "iam-oauth",
      packageName: "@sdkwork/iam-pc-admin-oauth",
      permissionPrefix: "iam.oauth",
      routeBasePath: "/admin/iam/oauth",
    },
    {
      capability: "tenant",
      id: "iam-tenant",
      packageName: "@sdkwork/iam-pc-admin-tenant",
      permissionPrefix: "iam.tenants",
      routeBasePath: "/admin/iam/tenants",
    },
    {
      capability: "organization",
      id: "iam-organization",
      packageName: "@sdkwork/iam-pc-admin-organization",
      permissionPrefix: "iam.organizations",
      routeBasePath: "/admin/iam/organizations",
    },
    {
      capability: "permission",
      id: "iam-permission",
      packageName: "@sdkwork/iam-pc-admin-permission",
      permissionPrefix: "iam.permissions",
      routeBasePath: "/admin/iam/permissions",
    },
    {
      capability: "account-binding",
      id: "iam-account-binding",
      packageName: "@sdkwork/iam-pc-admin-account-binding",
      permissionPrefix: "iam.account_binding",
      routeBasePath: "/admin/iam/account-binding",
    },
    {
      capability: "user",
      id: "iam-user",
      packageName: "@sdkwork/iam-pc-admin-user",
      permissionPrefix: "iam.users",
      routeBasePath: "/admin/iam/users",
    },
  ] as const;
}
