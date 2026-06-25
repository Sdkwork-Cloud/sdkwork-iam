export function listSdkworkIamPcConsoleSdkInventory() {
  return ["@sdkwork/iam-app-sdk"] as const;
}

export const IAM_PC_CONSOLE_CAPABILITY_PACKAGES = [
  "@sdkwork/iam-pc-console-tenant",
  "@sdkwork/iam-pc-console-organization",
  "@sdkwork/iam-pc-console-account-binding",
  "@sdkwork/iam-pc-console-user",
] as const;

export type IamPcConsoleCapabilityPackage = (typeof IAM_PC_CONSOLE_CAPABILITY_PACKAGES)[number];

export interface IamPcConsoleModuleRecord {
  capability: string;
  id: string;
  packageName: IamPcConsoleCapabilityPackage;
  permissionPrefix: string;
  routeBasePath: string;
}

export function createSdkworkIamPcConsoleModuleRegistry(): readonly IamPcConsoleModuleRecord[] {
  return [
    {
      capability: "tenant",
      id: "iam-console-tenant",
      packageName: "@sdkwork/iam-pc-console-tenant",
      permissionPrefix: "iam.tenant_console",
      routeBasePath: "/console/iam/tenant",
    },
    {
      capability: "organization",
      id: "iam-console-organization",
      packageName: "@sdkwork/iam-pc-console-organization",
      permissionPrefix: "iam.organization_console",
      routeBasePath: "/console/iam/organizations",
    },
    {
      capability: "account-binding",
      id: "iam-console-account-binding",
      packageName: "@sdkwork/iam-pc-console-account-binding",
      permissionPrefix: "iam.account_binding_console",
      routeBasePath: "/console/iam/account-binding",
    },
    {
      capability: "user",
      id: "iam-console-user",
      packageName: "@sdkwork/iam-pc-console-user",
      permissionPrefix: "iam.user_console",
      routeBasePath: "/console/iam/user",
    },
  ] as const;
}
