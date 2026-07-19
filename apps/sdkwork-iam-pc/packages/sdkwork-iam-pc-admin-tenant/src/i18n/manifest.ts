import { createSdkworkMessageCatalog } from "@sdkwork/i18n-pc-react";

import { sdkworkIamTenantAdminMessages as enMessages } from "./en-US/iam/tenant/workspace";
import { sdkworkIamTenantAdminMessages as zhMessages } from "./zh-CN/iam/tenant/workspace";
import type { SdkworkIamTenantAdminMessages } from "./types";

export const SDKWORK_IAM_TENANT_ADMIN_I18N_CATALOG = createSdkworkMessageCatalog<SdkworkIamTenantAdminMessages>({
  defaultLocale: "zh-CN",
  locales: {
    "en-US": enMessages,
    "zh-CN": zhMessages,
  },
  namespace: "iam.tenant.admin",
});
