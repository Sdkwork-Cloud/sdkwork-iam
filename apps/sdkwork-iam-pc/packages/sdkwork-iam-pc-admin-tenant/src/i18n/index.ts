import { useSdkworkModuleMessages } from "@sdkwork/i18n-pc-react";

import { SDKWORK_IAM_TENANT_ADMIN_I18N_CATALOG } from "./manifest";

export * from "./manifest";
export type * from "../types/tenant-admin-messages";

export function useSdkworkIamTenantAdminMessages() {
  return useSdkworkModuleMessages(SDKWORK_IAM_TENANT_ADMIN_I18N_CATALOG);
}
