import {
  createSdkworkIamPcAdminModuleRegistry,
  type IamPcAdminModuleRecord,
} from "@sdkwork/iam-pc-admin-core";

export type IamAdminShellMenuItem = {
  id: string;
  label: string;
  packageName: string;
  path: string;
  permissionPrefix: string;
};

export function listIamAdminShellMenuItems(): IamAdminShellMenuItem[] {
  return createSdkworkIamPcAdminModuleRegistry().map(toMenuItem);
}

export function resolveIamAdminModuleByPath(pathname: string): IamPcAdminModuleRecord | undefined {
  return createSdkworkIamPcAdminModuleRegistry().find((module) =>
    pathname === module.routeBasePath || pathname.startsWith(`${module.routeBasePath}/`),
  );
}

function toMenuItem(module: IamPcAdminModuleRecord): IamAdminShellMenuItem {
  return {
    id: module.id,
    label: formatModuleLabel(module.capability),
    packageName: module.packageName,
    path: module.routeBasePath,
    permissionPrefix: module.permissionPrefix,
  };
}

function formatModuleLabel(capability: string): string {
  return capability
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export {
  createSdkworkIamPcAdminModuleRegistry,
  IAM_PC_ADMIN_CAPABILITY_PACKAGES,
  listSdkworkIamPcAdminSdkInventory,
} from "@sdkwork/iam-pc-admin-core";
