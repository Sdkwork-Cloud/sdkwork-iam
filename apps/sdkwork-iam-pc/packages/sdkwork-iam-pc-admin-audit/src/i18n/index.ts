import { useSdkworkModuleMessages } from "@sdkwork/i18n-pc-react";

import { SDKWORK_IAM_AUDIT_ADMIN_I18N_CATALOG } from "./manifest";

export * from "./manifest";
export type * from "../types/audit-admin-messages";

export function useSdkworkIamAuditAdminMessages() {
  return useSdkworkModuleMessages(SDKWORK_IAM_AUDIT_ADMIN_I18N_CATALOG);
}
