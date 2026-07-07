import {
  useCallback,
  useMemo,
  useState,
} from "react";
import { X } from "lucide-react";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import {
  createSdkworkAuthPageRouting,
  createSdkworkAuthPageRoutingNavigate,
} from "../auth-page-routing.ts";
import type { SdkworkAuthAppearanceConfig } from "../auth-appearance.ts";
import type { SdkworkAuthRuntimeConfig } from "../auth-config.ts";
import type { SdkworkAuthController } from "../auth-controller.ts";
import {
  createSdkworkIamRuntimeAuthController,
  type CreateSdkworkIamRuntimeAuthControllerOptions,
  type SdkworkIamRuntimeAuthRuntimeLike,
} from "../auth-iam-runtime.ts";
import {
  formatSdkworkAuthTemplate,
  SDKWORK_AUTH_I18N_CATALOG,
} from "../auth-copy.ts";
import { useSdkworkAuthIntl } from "../auth-intl.tsx";
import {
  SdkworkAuthPage,
  type SdkworkAuthPageEvents,
  type SdkworkAuthPageSlots,
} from "../pages/AuthPage.tsx";

export interface SdkworkSessionAuthLoginModalCopy {
  close: string;
}

export interface SdkworkSessionAuthLoginModalProps {
  appearance?: SdkworkAuthAppearanceConfig;
  authLoginPath?: string;
  basePath?: string;
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
  onAuthComplete(): void;
  onDismiss(): void;
  returnPath: string;
  runtimeConfig?: SdkworkAuthRuntimeConfig;
  slots?: SdkworkAuthPageSlots;
}

const DEFAULT_COPY: SdkworkSessionAuthLoginModalCopy = {
  close: "Stay on page",
};

function buildLoginEntryPath(
  authLoginPath: string,
  returnPath: string,
): string {
  return `${authLoginPath}?redirect=${encodeURIComponent(returnPath)}`;
}

function parseAuthLocation(path: string) {
  const url = new URL(path, "http://sdkwork.local");
  return {
    hash: url.hash,
    pathname: url.pathname,
    search: url.search,
  };
}

function SdkworkSessionAuthLoginModalContent({
  appearance,
  authLoginPath = "/auth/login",
  basePath = "/auth",
  controller: providedController,
  controllerOptions,
  copy,
  events,
  getRuntime,
  homePath = "/",
  methodUnavailableMessage,
  onAuthComplete,
  onDismiss,
  returnPath,
  runtimeConfig,
  slots,
}: SdkworkSessionAuthLoginModalProps) {
  const { copy: authCopy } = useSdkworkAuthIntl();
  const dialogCopy = { ...DEFAULT_COPY, ...copy };
  const loginEntryPath = buildLoginEntryPath(authLoginPath, returnPath);
  const [embeddedLocation, setEmbeddedLocation] = useState(
    () => parseAuthLocation(loginEntryPath),
  );
  const embeddedNavigate = useMemo(
    () => createSdkworkAuthPageRoutingNavigate(setEmbeddedLocation),
    [],
  );
  const embeddedRouting = useMemo(
    () => createSdkworkAuthPageRouting({
      location: embeddedLocation,
      navigate: embeddedNavigate,
    }),
    [embeddedLocation, embeddedNavigate],
  );
  const localizedMethodUnavailableMessage = useMemo(
    () => formatSdkworkAuthTemplate(authCopy.service.methodUnavailableTemplate, {
      name: authCopy.service.iamRuntimeAuthMethodName,
    }),
    [
      authCopy.service.iamRuntimeAuthMethodName,
      authCopy.service.methodUnavailableTemplate,
    ],
  );
  const resolvedMethodUnavailableMessage =
    methodUnavailableMessage
    ?? controllerOptions?.methodUnavailableMessage
    ?? localizedMethodUnavailableMessage;
  const runtimeController = useMemo(
    () => {
      if (providedController) {
        return providedController;
      }
      if (!getRuntime) {
        return null;
      }
      return createSdkworkIamRuntimeAuthController({
        ...(controllerOptions ?? {}),
        getRuntime,
        methodUnavailableMessage: resolvedMethodUnavailableMessage,
      });
    },
    [
      controllerOptions,
      getRuntime,
      providedController,
      resolvedMethodUnavailableMessage,
    ],
  );
  const resetEmbeddedLoginRoute = useCallback(() => {
    setEmbeddedLocation(parseAuthLocation(loginEntryPath));
  }, [loginEntryPath]);

  if (!runtimeController) {
    return null;
  }

  return (
    <>
      <SdkworkAuthPage
        appearance={appearance}
        basePath={basePath}
        controller={runtimeController}
        embeddedRouting={embeddedRouting}
        events={events}
        homePath={homePath}
        onAuthComplete={() => {
          resetEmbeddedLoginRoute();
          onAuthComplete();
        }}
        onDismiss={onDismiss}
        presentation="modal"
        runtimeConfig={runtimeConfig}
        slots={slots}
      />
      <div className="pointer-events-none absolute right-3 top-3 z-20 sm:right-4 sm:top-4">
        <button
          aria-label={dialogCopy.close}
          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 bg-white/95 text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary-500/35 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          onClick={onDismiss}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

export function SdkworkSessionAuthLoginModal({
  locale,
  ...props
}: SdkworkSessionAuthLoginModalProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/45 px-4 py-6">
      <div
        aria-labelledby="sdkwork-session-auth-login-title"
        aria-modal="true"
        className="relative w-full max-w-[920px]"
        role="dialog"
      >
        <span className="sr-only" id="sdkwork-session-auth-login-title">
          Sign in
        </span>
        <SdkworkI18nProvider
          catalogs={[SDKWORK_AUTH_I18N_CATALOG]}
          locale={locale}
        >
          <SdkworkSessionAuthLoginModalContent {...props} />
        </SdkworkI18nProvider>
      </div>
    </div>
  );
}
