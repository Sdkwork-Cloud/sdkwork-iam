import { useSdkworkModuleMessages } from "@sdkwork/i18n-pc-react";

import { SDKWORK_IAM_ACCOUNT_BINDING_ADMIN_I18N_CATALOG } from "./manifest";

export * from "./manifest";
export type * from "../types/account-binding-admin-messages";

export function useSdkworkIamAccountBindingAdminMessages() {
  return useSdkworkModuleMessages(SDKWORK_IAM_ACCOUNT_BINDING_ADMIN_I18N_CATALOG);
}
