import {
  useMemo,
  type CSSProperties,
} from "react";
import {
  useLocation,
} from "react-router-dom";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import type { SdkworkAuthAppearanceConfig } from "../auth-appearance.ts";
import type {
  CreateSdkworkIamRuntimeAuthControllerOptions,
  SdkworkIamRuntimeAuthRuntimeLike,
} from "../auth-iam-runtime.ts";
import { createSdkworkIamRuntimeAuthController } from "../auth-iam-runtime.ts";
import type { SdkworkAuthPageRouterContextMode } from "./routerContextBoundary.tsx";
import {
  SdkworkAuthPageRouterContextBoundary,
} from "./routerContextBoundary.tsx";
import {
  SdkworkAuthOAuthCallbackPage,
} from "./AuthOAuthCallbackPage.tsx";
import {
  SdkworkAuthPage,
  type SdkworkAuthPageEvents,
  type SdkworkAuthPageSlots,
} from "./AuthPage.tsx";
import type { SdkworkAuthRuntimeConfig } from "../auth-config.ts";
import {
  formatSdkworkAuthTemplate,
  SDKWORK_AUTH_I18N_CATALOG,
} from "../auth-copy.ts";
import { useSdkworkAuthIntl } from "../auth-intl.tsx";
import {
  mergeSdkworkAuthClassNames,
  mergeSdkworkAuthStyles,
} from "../auth-appearance.ts";

export interface SdkworkIamAuthRoutesProps {
  appearance?: SdkworkAuthAppearanceConfig;
  basePath?: string;
  className?: string;
  controllerOptions?: Omit<
    CreateSdkworkIamRuntimeAuthControllerOptions,
    "getRuntime"
  >;
  events?: SdkworkAuthPageEvents;
  getRuntime: () =>
    | Promise<SdkworkIamRuntimeAuthRuntimeLike>
    | SdkworkIamRuntimeAuthRuntimeLike;
  homePath?: string;
  locale?: string | null;
  methodUnavailableMessage?: string;
  routerContextMode?: SdkworkAuthPageRouterContextMode;
  runtimeConfig?: SdkworkAuthRuntimeConfig;
  slots?: SdkworkAuthPageSlots;
  style?: CSSProperties;
  viewportMode?: "fixed" | "flow";
}

function normalizeBasePath(basePath: string): string {
  const normalized = basePath.trim().replace(/\/+$/u, "");
  return normalized || "/auth";
}

function isOAuthCallbackRoute(pathname: string, basePath: string): boolean {
  const normalizedBasePath = normalizeBasePath(basePath);
  return pathname === `${normalizedBasePath}/oauth/callback`
    || pathname.startsWith(`${normalizedBasePath}/oauth/callback/`);
}

export function SdkworkIamAuthRoutes({
  routerContextMode = "auto",
  ...props
}: SdkworkIamAuthRoutesProps) {
  return (
    <SdkworkAuthPageRouterContextBoundary mode={routerContextMode}>
      <SdkworkIamAuthRoutesContent
        {...props}
        routerContextMode="external"
      />
    </SdkworkAuthPageRouterContextBoundary>
  );
}

function SdkworkIamAuthRoutesContent({
  className,
  locale,
  style,
  viewportMode = "fixed",
  ...props
}: SdkworkIamAuthRoutesProps) {
  return (
    <section
      className={mergeSdkworkAuthClassNames(
        viewportMode === "fixed"
          ? "sdkwork-iam-auth-routes fixed inset-0 z-[60] h-full w-full min-w-0 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-950"
          : "sdkwork-iam-auth-routes relative isolate h-full w-full min-w-0 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-950",
        className,
      )}
      style={mergeSdkworkAuthStyles(
        {
          colorScheme: "light dark",
        },
        style,
      )}
    >
      <SdkworkI18nProvider
        catalogs={[SDKWORK_AUTH_I18N_CATALOG]}
        locale={locale}
      >
        <SdkworkIamAuthRoutesPage {...props} />
      </SdkworkI18nProvider>
    </section>
  );
}

function SdkworkIamAuthRoutesPage({
  appearance,
  basePath = "/auth",
  controllerOptions,
  events,
  getRuntime,
  homePath = "/dashboard",
  methodUnavailableMessage,
  routerContextMode,
  runtimeConfig,
  slots,
}: SdkworkIamAuthRoutesProps) {
  const { copy } = useSdkworkAuthIntl();
  const location = useLocation();
  const localizedMethodUnavailableMessage = useMemo(
    () => formatSdkworkAuthTemplate(copy.service.methodUnavailableTemplate, {
      name: copy.service.iamRuntimeAuthMethodName,
    }),
    [
      copy.service.iamRuntimeAuthMethodName,
      copy.service.methodUnavailableTemplate,
    ],
  );
  const resolvedMethodUnavailableMessage =
    methodUnavailableMessage
    ?? controllerOptions?.methodUnavailableMessage
    ?? localizedMethodUnavailableMessage;
  const controller = useMemo(
    () =>
      createSdkworkIamRuntimeAuthController({
        ...(controllerOptions ?? {}),
        getRuntime,
        methodUnavailableMessage: resolvedMethodUnavailableMessage,
      }),
    [
      controllerOptions,
      getRuntime,
      resolvedMethodUnavailableMessage,
    ],
  );
  const commonProps = {
    appearance,
    basePath,
    controller,
    homePath,
    routerContextMode,
    runtimeConfig,
  } satisfies Pick<
    Parameters<typeof SdkworkAuthPage>[0],
    | "appearance"
    | "basePath"
    | "controller"
    | "homePath"
    | "routerContextMode"
    | "runtimeConfig"
  >;

  if (isOAuthCallbackRoute(location.pathname, basePath)) {
    return <SdkworkAuthOAuthCallbackPage {...commonProps} />;
  }

  return (
    <SdkworkAuthPage
      {...commonProps}
      events={events}
      slots={slots}
    />
  );
}
