import { useSdkworkModuleMessages } from "@sdkwork/i18n-pc-react";

import { SDKWORK_IAM_ORGANIZATION_ADMIN_I18N_CATALOG } from "./manifest";

export * from "./manifest";
export type * from "../types/organization-admin-messages";

export function useSdkworkIamOrganizationAdminMessages() {
  return useSdkworkModuleMessages(SDKWORK_IAM_ORGANIZATION_ADMIN_I18N_CATALOG);
}
