import { useSdkworkModuleMessages } from "@sdkwork/i18n-pc-react";

import { SDKWORK_IAM_OAUTH_ADMIN_I18N_CATALOG } from "./manifest";

export * from "./manifest";
export type * from "../types/oauth-admin-messages";

export function useSdkworkIamOauthAdminMessages() {
  return useSdkworkModuleMessages(SDKWORK_IAM_OAUTH_ADMIN_I18N_CATALOG);
}
