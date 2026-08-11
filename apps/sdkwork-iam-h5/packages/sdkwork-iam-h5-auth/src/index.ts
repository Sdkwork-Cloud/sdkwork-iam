import "./styles/iam-h5-auth-surface.css";

export {
  IAM_H5_AUTH_ROUTES,
} from "./types/auth-h5-types";
export * from "./types/auth-h5-types";
export {
  blockWechatAutoAuthorization,
  buildScanLoginOAuthState,
  clearOAuthFlowContext,
  clearScanLoginUrlContext,
  clearWechatAutoAuthorizationBlock,
  createSdkworkIamH5AuthController,
  isWechatAutoAuthorizationBlocked,
  readOAuthFlowContext,
  readScanLoginPollSecretFromOAuthState,
  readScanLoginProviderFromOAuthState,
  readScanLoginSessionKeyFromOAuthState,
  resolveScanLoginContext,
  resolveSdkworkIamH5VerifyType,
  storeOAuthFlowContext,
} from "./services/auth-h5-controller";
export {
  SDKWORK_IAM_H5_AUTH_I18N_CATALOG,
  SDKWORK_IAM_H5_AUTH_I18N_NAMESPACE,
  assertSdkworkIamH5AuthI18nCatalogParity,
  createSdkworkIamH5AuthMessages,
  normalizeSdkworkIamH5AuthLocale,
  useSdkworkIamH5AuthMessages,
} from "./i18n";
export type {
  SdkworkIamH5AuthLocale,
  SdkworkIamH5AuthMessages,
} from "./i18n";
export { SdkworkIamH5AuthFooter } from "./components/AuthFooter";
export { SdkworkIamH5AuthFormFields } from "./components/AuthFormFields";
export { SdkworkIamH5AuthHeader } from "./components/AuthHeader";
export { SdkworkIamH5AuthModeLinks } from "./components/AuthModeLinks";
export { SdkworkIamH5AuthPrimaryButton } from "./components/AuthPrimaryButton";
export { SdkworkIamH5AuthTermsModal } from "./components/TermsModal";
export { SdkworkIamH5AuthThirdPartyLogin } from "./components/ThirdPartyLogin";
export { SdkworkIamH5AuthLoginContextSelectionScreen } from "./pages/AuthLoginContextSelectionScreen";
export { SdkworkIamH5AuthLoginScreen } from "./pages/AuthLoginScreen";
export type { SdkworkIamH5AuthLoginScreenProps } from "./pages/AuthLoginScreen";
export { SdkworkIamH5AuthOAuthCallbackScreen } from "./pages/AuthOAuthCallbackScreen";
export { SdkworkIamH5AuthRoutes } from "./pages/AuthH5Routes";
export type { SdkworkIamH5AuthRoutesProps } from "./pages/AuthH5Routes";
export { isSdkworkMobileAuthViewport } from "./utils/viewport";
export type { SdkworkMobileAuthViewportEnvironment } from "./utils/viewport";
