import { createSdkworkMessageCatalog } from "@sdkwork/i18n-pc-react";

import { sdkworkIamAccountBindingAdminMessages as enMessages } from "./en-US/iam/account-binding/workspace";
import { sdkworkIamAccountBindingAdminMessages as zhMessages } from "./zh-CN/iam/account-binding/workspace";
import type { SdkworkIamAccountBindingAdminMessages } from "../types/account-binding-admin-messages";

export const SDKWORK_IAM_ACCOUNT_BINDING_ADMIN_I18N_CATALOG = createSdkworkMessageCatalog<SdkworkIamAccountBindingAdminMessages>({
  defaultLocale: "en-US",
  locales: {
    "en-US": enMessages,
    "zh-CN": zhMessages,
  },
  namespace: "iam.account-binding.admin",
});
