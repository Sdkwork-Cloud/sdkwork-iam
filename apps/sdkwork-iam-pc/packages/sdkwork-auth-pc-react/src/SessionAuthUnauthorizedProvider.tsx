import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  isSdkworkSessionAuthRoutePath,
  resetSdkworkSessionAuthRedirectState,
} from "../../sdkwork-auth-runtime-pc-react/src/handleSdkworkSessionAuthUnauthorizedError.ts";
import { buildSdkworkLoginRedirectFromLocation } from "../../sdkwork-auth-runtime-pc-react/src/sessionAuthRedirect.ts";
import type { SdkworkSessionAuthUnauthorizedDetail } from "../../sdkwork-auth-runtime-pc-react/src/sessionAuthUnauthorized.ts";
import { subscribeSdkworkSessionAuthUnauthorized } from "../../sdkwork-auth-runtime-pc-react/src/sessionAuthUnauthorized.ts";
import type { SdkworkAuthAppearanceConfig } from "./auth-appearance.ts";
import type { SdkworkAuthRuntimeConfig } from "./auth-config.ts";
import type { SdkworkAuthController } from "./auth-controller.ts";
import type {
  CreateSdkworkIamRuntimeAuthControllerOptions,
  SdkworkIamRuntimeAuthRuntimeLike,
} from "./auth-iam-runtime.ts";
import {
  SdkworkSessionAuthLoginModal,
  type SdkworkSessionAuthLoginModalCopy,
} from "./components/session-auth-login-modal.tsx";
import type {
  SdkworkAuthPageEvents,
  SdkworkAuthPageSlots,
} from "./pages/AuthPage.tsx";

export interface SdkworkSessionAuthUnauthorizedProviderProps {
  appearance?: SdkworkAuthAppearanceConfig;
  authBasePath?: string;
  authLoginPath?: string;
  basePath?: string;
  children: ReactNode;
  controller?: SdkworkAuthController;
  controllerOptions?: Omit<
    CreateSdkworkIamRuntimeAuthControllerOptions,
    "getRuntime"
  >;
  copy?: Partial<SdkworkSessionAuthLoginModalCopy>;
  events?: SdkworkAuthPageEvents;
  getRuntime?: () =>
    | Promise<SdkworkIamRuntimeAuthRuntimeLike>
    | SdkworkIamRuntimeAuthRuntimeLike;
  homePath?: string;
  locale?: string | null;
  methodUnavailableMessage?: string;
  onAuthSuccess?: (detail: SdkworkSessionAuthUnauthorizedDetail) => void;
  onBeforeLoginRedirect?: (detail: SdkworkSessionAuthUnauthorizedDetail) => void;
  runtimeConfig?: SdkworkAuthRuntimeConfig;
  slots?: SdkworkAuthPageSlots;
}

/** Deduplicates the no-controller redirect so repeated unauthorized events for the same target do not re-navigate. */
let providerAuthRedirectTarget: string | null = null;

function resolveReturnPath(
  detail: SdkworkSessionAuthUnauthorizedDetail,
  location: { hash?: string; pathname: string; search?: string },
): string {
  if (detail.path?.trim()) {
    return detail.path.trim();
  }

  return `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`;
}

export function SdkworkSessionAuthUnauthorizedProvider({
  appearance,
  authBasePath = "/auth",
  authLoginPath = "/auth/login",
  basePath,
  children,
  controller,
  controllerOptions,
  copy,
  events,
  getRuntime,
  homePath = "/",
  locale,
  methodUnavailableMessage,
  onAuthSuccess,
  onBeforeLoginRedirect,
  runtimeConfig,
  slots,
}: SdkworkSessionAuthUnauthorizedProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<SdkworkSessionAuthUnauthorizedDetail | null>(null);
  const resolvedBasePath = basePath ?? authBasePath;
  const canRenderLoginModal = Boolean(controller || getRuntime);

  useEffect(() => {
    // A redirect target only protects the navigation that produced it. Once
    // the user leaves the auth surface, forget it so a later unauthorized
    // response can redirect again.
    if (!isSdkworkSessionAuthRoutePath(location.pathname, authLoginPath)) {
      providerAuthRedirectTarget = null;
    }

    return subscribeSdkworkSessionAuthUnauthorized((nextDetail) => {
      if (!controller && !getRuntime) {
        onBeforeLoginRedirect?.(nextDetail);
        // Never wrap an auth-route URL: the login surface already carries the
        // original return target, and wrapping the full current URL again
        // nests the `redirect` param one level deeper on every unauthorized
        // response (unbounded URL growth).
        if (isSdkworkSessionAuthRoutePath(location.pathname, authLoginPath)) {
          return;
        }
        const redirectTo = buildSdkworkLoginRedirectFromLocation(authLoginPath, location);
        if (providerAuthRedirectTarget === redirectTo) {
          return;
        }
        providerAuthRedirectTarget = redirectTo;
        navigate(redirectTo, { replace: true });
        return;
      }

      setDetail(nextDetail);
    });
  }, [
    authLoginPath,
    controller,
    getRuntime,
    location,
    navigate,
    onBeforeLoginRedirect,
  ]);

  const returnPath = useMemo(
    () => (detail ? resolveReturnPath(detail, location) : ""),
    [detail, location],
  );

  const handleDismiss = () => {
    setDetail(null);
  };

  const handleAuthComplete = () => {
    if (!detail) {
      return;
    }

    resetSdkworkSessionAuthRedirectState();
    onAuthSuccess?.(detail);
    setDetail(null);
  };

  return (
    <>
      {children}
      {detail && canRenderLoginModal ? (
        <SdkworkSessionAuthLoginModal
          appearance={appearance}
          authLoginPath={authLoginPath}
          basePath={resolvedBasePath}
          controller={controller}
          controllerOptions={controllerOptions}
          copy={copy}
          events={events}
          getRuntime={getRuntime}
          homePath={homePath}
          locale={locale}
          methodUnavailableMessage={methodUnavailableMessage}
          onAuthComplete={handleAuthComplete}
          onDismiss={handleDismiss}
          returnPath={returnPath}
          runtimeConfig={runtimeConfig}
          slots={slots}
        />
      ) : null}
    </>
  );
}
