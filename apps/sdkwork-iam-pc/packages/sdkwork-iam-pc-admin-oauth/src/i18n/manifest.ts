import { createSdkworkMessageCatalog } from "@sdkwork/i18n-pc-react";

import { sdkworkIamOauthAdminMessages as enMessages } from "./en-US/iam/oauth/workspace";
import { sdkworkIamOauthAdminMessages as zhMessages } from "./zh-CN/iam/oauth/workspace";
import type { SdkworkIamOauthAdminMessages } from "../types/oauth-admin-messages";

export const SDKWORK_IAM_OAUTH_ADMIN_I18N_CATALOG = createSdkworkMessageCatalog<SdkworkIamOauthAdminMessages>({
  defaultLocale: "en-US",
  locales: {
    "en-US": enMessages,
    "zh-CN": zhMessages,
  },
  namespace: "iam.oauth.admin",
});
