import {
  createSdkworkIamPcConsoleModuleRegistry,
  type IamPcConsoleModuleRecord,
} from "@sdkwork/iam-pc-console-core";

export type IamConsoleShellMenuItem = {
  id: string;
  label: string;
  packageName: string;
  path: string;
  permissionPrefix: string;
};

export function listIamConsoleShellMenuItems(): IamConsoleShellMenuItem[] {
  return createSdkworkIamPcConsoleModuleRegistry().map(toMenuItem);
}

export function resolveIamConsoleModuleByPath(pathname: string): IamPcConsoleModuleRecord | undefined {
  return createSdkworkIamPcConsoleModuleRegistry().find((module) =>
    pathname === module.routeBasePath || pathname.startsWith(`${module.routeBasePath}/`),
  );
}

function toMenuItem(module: IamPcConsoleModuleRecord): IamConsoleShellMenuItem {
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
  createSdkworkIamPcConsoleModuleRegistry,
  IAM_PC_CONSOLE_CAPABILITY_PACKAGES,
  listSdkworkIamPcConsoleSdkInventory,
} from "@sdkwork/iam-pc-console-core";
