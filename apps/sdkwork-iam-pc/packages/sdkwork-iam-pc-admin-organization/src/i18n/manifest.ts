import { createSdkworkMessageCatalog } from "@sdkwork/i18n-pc-react";

import { sdkworkIamOrganizationAdminMessages as enMessages } from "./en-US/iam/organization/workspace";
import { sdkworkIamOrganizationAdminMessages as zhMessages } from "./zh-CN/iam/organization/workspace";
import type { SdkworkIamOrganizationAdminMessages } from "../types/organization-admin-messages";

export const SDKWORK_IAM_ORGANIZATION_ADMIN_I18N_CATALOG = createSdkworkMessageCatalog<SdkworkIamOrganizationAdminMessages>({
  defaultLocale: "zh-CN",
  locales: {
    "en-US": enMessages,
    "zh-CN": zhMessages,
  },
  namespace: "iam.organization.admin",
});
