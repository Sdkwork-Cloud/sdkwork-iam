import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";

import { SDKWORK_IAM_H5_AUTH_I18N_CATALOG } from "../i18n";
import type {
  SdkworkIamH5AuthController,
  SdkworkIamH5AuthSession,
} from "../types/auth-h5-types";
import { IAM_H5_AUTH_ROUTES } from "../types/auth-h5-types";
import { SdkworkIamH5AuthLoginScreen } from "./AuthLoginScreen";
import { SdkworkIamH5AuthOAuthCallbackScreen } from "./AuthOAuthCallbackScreen";

export interface SdkworkIamH5AuthRoutesProps {
  /**
   * Mobile auth controller built over the host's IAM service. Successful
   * sessions are committed by the host runtime (session bridge), which emits
   * the host session-changed event and unlocks the app's auth gate.
   */
  controller: SdkworkIamH5AuthController;
  /** Base path of the auth surface; defaults to `/auth`. */
  basePath?: string;
  /** BCP-47 locale hint; defaults to the catalog default when omitted. */
  locale?: string | null;
  onAuthenticated?: (session: SdkworkIamH5AuthSession) => void;
  /** Invoked when a scan-login QR session was completed on this device. */
  onScanLoginCompleted?: () => void;
  /**
   * Invoked when a third-party provider entry is activated; the host decides
   * the provider flow (the IM product currently fails closed).
   */
  onThirdPartyLogin?: (platform: string) => void;
}

function isOAuthCallbackRoute(pathname: string, basePath: string): boolean {
  return pathname === `${basePath}/oauth/callback`;
}

/**
 * Reusable mobile auth route host (zip-design login/register system).
 *
 * Mounts the login screen (password/code login, register, recovery, terms,
 * third-party, login-context selection and scan-login completion) and the
 * OAuth callback screen under `basePath`, wrapped in the IAM H5 auth i18n
 * provider. Hosts render it at their auth route — no per-host wiring beyond
 * building the controller from the host IAM service.
 */
export function SdkworkIamH5AuthRoutes({
  controller,
  basePath = IAM_H5_AUTH_ROUTES.loginPath.replace(/\/login$/, ""),
  locale,
  onAuthenticated,
  onScanLoginCompleted,
  onThirdPartyLogin,
}: SdkworkIamH5AuthRoutesProps) {
  const location = useLocation();
  const resolvedBasePath = useMemo(() => normalizeBasePath(basePath), [basePath]);

  return (
    <SdkworkI18nProvider
      catalogs={[SDKWORK_IAM_H5_AUTH_I18N_CATALOG]}
      locale={locale}
    >
      {isOAuthCallbackRoute(location.pathname, resolvedBasePath) ? (
        <SdkworkIamH5AuthOAuthCallbackScreen
          controller={controller}
          onAuthenticated={onAuthenticated}
          onScanLoginCompleted={onScanLoginCompleted}
        />
      ) : (
        <SdkworkIamH5AuthLoginScreen
          controller={controller}
          onAuthenticated={onAuthenticated}
          onScanLoginCompleted={onScanLoginCompleted}
          onThirdPartyLogin={onThirdPartyLogin}
        />
      )}
    </SdkworkI18nProvider>
  );
}

function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim().replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
