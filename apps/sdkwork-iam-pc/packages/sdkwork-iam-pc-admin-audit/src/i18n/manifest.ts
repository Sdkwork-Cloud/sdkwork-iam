import { createSdkworkMessageCatalog } from "@sdkwork/i18n-pc-react";

import { sdkworkIamAuditAdminMessages as enMessages } from "./en-US/iam/audit/workspace";
import { sdkworkIamAuditAdminMessages as zhMessages } from "./zh-CN/iam/audit/workspace";
import type { SdkworkIamAuditAdminMessages } from "../types/audit-admin-messages";

export const SDKWORK_IAM_AUDIT_ADMIN_I18N_CATALOG = createSdkworkMessageCatalog<SdkworkIamAuditAdminMessages>({
  defaultLocale: "en-US",
  locales: {
    "en-US": enMessages,
    "zh-CN": zhMessages,
  },
  namespace: "iam.audit.admin",
});
