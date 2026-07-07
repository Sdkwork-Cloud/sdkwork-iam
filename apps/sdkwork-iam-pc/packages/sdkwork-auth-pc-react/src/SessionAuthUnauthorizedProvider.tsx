import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetSdkworkSessionAuthRedirectState } from "../../sdkwork-auth-runtime-pc-react/src/handleSdkworkSessionAuthUnauthorizedError.ts";
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

function buildLoginRedirectPath(
  authLoginPath: string,
  location: { hash?: string; pathname: string; search?: string },
): string {
  const returnPath = `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`;
  return `${authLoginPath}?redirect=${encodeURIComponent(returnPath)}`;
}

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
    return subscribeSdkworkSessionAuthUnauthorized((nextDetail) => {
      if (!controller && !getRuntime) {
        onBeforeLoginRedirect?.(nextDetail);
        navigate(buildLoginRedirectPath(authLoginPath, location), { replace: true });
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
