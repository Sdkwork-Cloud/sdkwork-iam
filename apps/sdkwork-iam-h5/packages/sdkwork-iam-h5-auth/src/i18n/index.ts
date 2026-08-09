import { useSdkworkModuleMessages } from "@sdkwork/i18n-pc-react";

import { SDKWORK_IAM_H5_AUTH_I18N_CATALOG } from "./iam-h5-auth-copy";

export {
  SDKWORK_IAM_H5_AUTH_I18N_CATALOG,
  SDKWORK_IAM_H5_AUTH_I18N_NAMESPACE,
  assertSdkworkIamH5AuthI18nCatalogParity,
  createSdkworkIamH5AuthMessages,
  normalizeSdkworkIamH5AuthLocale,
} from "./iam-h5-auth-copy";
export type {
  SdkworkIamH5AuthLocale,
  SdkworkIamH5AuthMessages,
} from "./iam-h5-auth-copy";

export function useSdkworkIamH5AuthMessages() {
  return useSdkworkModuleMessages(SDKWORK_IAM_H5_AUTH_I18N_CATALOG);
}
