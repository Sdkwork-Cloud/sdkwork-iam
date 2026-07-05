import {
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Button,
  SdkworkToaster,
  sdkToast,
} from "@sdkwork/ui-pc-react";
import {
  createSdkworkAuthDarkHeaderStyle,
  createSdkworkAuthLightShellStyle,
  SDKWORK_AUTH_SURFACE_THEME_STYLE,
  mergeSdkworkAuthClassNames,
  mergeSdkworkAuthStyles,
  resolveSdkworkAuthAppearance,
  type SdkworkAuthAppearanceConfig,
} from "../auth-appearance.ts";
import { coalesce } from "@sdkwork/utils";
import { useSdkworkAuthIntl } from "../auth-intl.tsx";
import {
  createAuthRouteCatalog,
  resolveAuthRedirectTarget,
} from "../auth.ts";
import {
  buildSdkworkAuthOAuthCallbackUri,
  isConfiguredSdkworkAuthOAuthProvider,
  isSdkworkAuthOAuthLoginEnabled,
  normalizeSdkworkAuthOAuthProvider,
  normalizeSdkworkAuthThirdPartyLoginErrorMessage,
  readSdkworkIdentityErrorMessage,
  resolveSdkworkAuthOAuthProviders,
  type SdkworkAuthRuntimeConfig,
} from "../auth-config.ts";
import {
  useSdkworkAuthController,
  useSdkworkAuthControllerState,
  type CreateSdkworkAuthControllerOptions,
  type SdkworkAuthController,
} from "../auth-controller.ts";
import {
  SdkworkAuthOrganizationSelectionRequiredError,
  type SdkworkAuthOrganizationSelectionChallenge,
} from "../auth-service.ts";
import { SdkworkOrganizationSelectionDialog } from "../components/organization-selection-dialog.tsx";
import {
  SdkworkAuthPageRouterContextBoundary,
  type SdkworkAuthPageRouterContextMode,
} from "./routerContextBoundary.tsx";

export interface SdkworkAuthOAuthCallbackPageProps {
  appearance?: SdkworkAuthAppearanceConfig;
  basePath?: string;
  controller?: SdkworkAuthController;
  homePath?: string;
  routerContextMode?: SdkworkAuthPageRouterContextMode;
  runtimeConfig?: SdkworkAuthRuntimeConfig;
}

function resolveLoginRoutePath(basePath: string): string {
  return createAuthRouteCatalog(basePath).find((route) => route.id === "login")?.path
    ?? "/auth/login";
}

function buildLoginRoute(
  basePath: string,
  redirectTarget: string,
  homePath: string,
): string {
  const loginRoutePath = resolveLoginRoutePath(basePath);
  if (redirectTarget === homePath) {
    return loginRoutePath;
  }

  return `${loginRoutePath}?redirect=${encodeURIComponent(redirectTarget)}`;
}

interface SdkworkAuthOAuthCallbackPageContentProps extends SdkworkAuthOAuthCallbackPageProps {}

function SdkworkAuthOAuthCallbackPageContent({
  appearance,
  basePath = "/auth",
  controller: providedController,
  homePath = "/dashboard",
  runtimeConfig,
}: SdkworkAuthOAuthCallbackPageContentProps) {
  const { copy } = useSdkworkAuthIntl();
  const resolvedAppearance = resolveSdkworkAuthAppearance(appearance);
  const controllerOptions = useMemo<CreateSdkworkAuthControllerOptions>(() => ({}), []);
  const controller = useSdkworkAuthController(providedController, controllerOptions);
  const authState = useSdkworkAuthControllerState(controller);
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const redirectTarget = resolveAuthRedirectTarget(searchParams.get("redirect"), homePath, basePath);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(true);
  const [organizationSelectionChallenge, setOrganizationSelectionChallenge] =
    useState<SdkworkAuthOrganizationSelectionChallenge | null>(null);
  const [organizationSelectionErrorMessage, setOrganizationSelectionErrorMessage] = useState("");
  const [selectingPersonalLogin, setSelectingPersonalLogin] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const loginRoute = buildLoginRoute(basePath, redirectTarget, homePath);
  const runtimeOAuthProvidersKey = (runtimeConfig?.oauthProviders ?? []).join("|");
  const configuredProviders = useMemo(
    () => isSdkworkAuthOAuthLoginEnabled(runtimeConfig?.oauthLoginEnabled)
      ? resolveSdkworkAuthOAuthProviders(runtimeConfig?.oauthProviders, runtimeConfig?.oauthProviderRegion)
      : [],
    [runtimeConfig?.oauthLoginEnabled, runtimeConfig?.oauthProviderRegion, runtimeOAuthProvidersKey],
  );
  const configuredProvidersKey = configuredProviders.join("|");

  const handleSelectOrganization = async (organizationId: string) => {
    if (!organizationSelectionChallenge || selectedOrganizationId || selectingPersonalLogin) {
      return;
    }

    setSelectedOrganizationId(organizationId);
    setOrganizationSelectionErrorMessage("");
    try {
      await controller.selectOrganization({
        continuationToken: organizationSelectionChallenge.continuationToken,
        organizationId,
      });
      setOrganizationSelectionChallenge(null);
      startTransition(() => {
        navigate(redirectTarget, { replace: true });
      });
    } catch (error) {
      setSelectedOrganizationId("");
      setOrganizationSelectionErrorMessage(
        readSdkworkIdentityErrorMessage(error, copy.common.requestFailed),
      );
    }
  };

  const handleSelectPersonalLogin = async () => {
    if (!organizationSelectionChallenge || selectedOrganizationId || selectingPersonalLogin) {
      return;
    }

    setSelectingPersonalLogin(true);
    setOrganizationSelectionErrorMessage("");
    try {
      await controller.selectPersonalLogin({
        continuationToken: organizationSelectionChallenge.continuationToken,
      });
      setOrganizationSelectionChallenge(null);
      startTransition(() => {
        navigate(redirectTarget, { replace: true });
      });
    } catch (error) {
      setSelectingPersonalLogin(false);
      setOrganizationSelectionErrorMessage(
        readSdkworkIdentityErrorMessage(error, copy.common.requestFailed),
      );
    }
  };

  useEffect(() => {
    const normalizedProvider = normalizeSdkworkAuthOAuthProvider(provider);
    const providerError = (searchParams.get("error_description") || searchParams.get("error") || "").trim();
    const code = (searchParams.get("code") || "").trim();

    if (!normalizedProvider || !isConfiguredSdkworkAuthOAuthProvider(normalizedProvider, configuredProviders)) {
      setErrorMessage(copy.callback.invalidProvider);
      setIsProcessing(false);
      return undefined;
    }

    if (providerError) {
      setErrorMessage(normalizeSdkworkAuthThirdPartyLoginErrorMessage(providerError, {
        genericProviderError: copy.callback.genericProviderError,
        invalidProvider: copy.callback.invalidProvider,
        providerDenied: copy.callback.providerDenied,
      }));
      setIsProcessing(false);
      return undefined;
    }

    if (!code) {
      setErrorMessage(copy.callback.missingCode);
      setIsProcessing(false);
      return undefined;
    }

    let disposed = false;

    void (async () => {
      try {
        await controller.signInWithOAuth({
          code,
          deviceType: "desktop",
          provider: normalizedProvider,
          redirectUri: buildSdkworkAuthOAuthCallbackUri(normalizedProvider, redirectTarget, {
            basePath,
            fallbackRoute: homePath,
          }),
          state: coalesce(searchParams.get("state") ?? undefined),
        });
        if (!disposed) {
          startTransition(() => {
            navigate(redirectTarget, { replace: true });
          });
        }
      } catch (error) {
        if (disposed) {
          return;
        }

        if (error instanceof SdkworkAuthOrganizationSelectionRequiredError) {
          setOrganizationSelectionChallenge(error.challenge);
          setOrganizationSelectionErrorMessage("");
          setSelectedOrganizationId("");
          setIsProcessing(false);
          return;
        }

        const message = readSdkworkIdentityErrorMessage(
          error,
          copy.common.requestFailed,
        );
        const normalizedMessage = normalizeSdkworkAuthThirdPartyLoginErrorMessage(message, {
          genericProviderError: copy.callback.genericProviderError,
          invalidProvider: copy.callback.invalidProvider,
          providerDenied: copy.callback.providerDenied,
        });
        sdkToast.error(normalizedMessage);
        setErrorMessage(normalizedMessage);
        setIsProcessing(false);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [configuredProvidersKey, controller, copy.callback.genericProviderError, copy.callback.invalidProvider, copy.callback.missingCode, copy.callback.providerDenied, copy.common.requestFailed, navigate, provider, redirectTarget, searchParams]);

  if (authState.isAuthenticated) {
    return <Navigate replace to={redirectTarget} />;
  }

  return (
    <>
      <div
        className={mergeSdkworkAuthClassNames(
          "sdkwork-auth-surface relative flex h-[100dvh] min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-zinc-100 p-4 dark:bg-zinc-950 sm:p-8",
          resolvedAppearance?.pageClassName,
        )}
        style={resolvedAppearance?.pageStyle}
      >
      <style>{SDKWORK_AUTH_SURFACE_THEME_STYLE}</style>
      <SdkworkToaster />
      <div
        className={mergeSdkworkAuthClassNames(
          "sdkwork-auth-callback-shell relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white/92 shadow-2xl dark:bg-zinc-900/92",
          resolvedAppearance?.callbackShellClassName,
        )}
        style={mergeSdkworkAuthStyles(
          createSdkworkAuthLightShellStyle(),
          resolvedAppearance?.callbackShellStyle,
        )}
      >
        <div
          className={mergeSdkworkAuthClassNames(
            "border-b border-zinc-200/80 bg-zinc-950 px-8 py-6 text-white dark:border-zinc-800",
            resolvedAppearance?.callbackHeaderClassName,
          )}
          style={mergeSdkworkAuthStyles(
            createSdkworkAuthDarkHeaderStyle(),
            resolvedAppearance?.callbackHeaderStyle,
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600/90">
              {isProcessing ? (
                <LoaderCircle className="h-6 w-6 animate-spin" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-200">
                {copy.callback.badge}
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight">
                {isProcessing ? copy.callback.processingTitle : copy.callback.failedTitle}
              </h1>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-8 py-8">
          {isProcessing ? (
            <>
              <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                {copy.callback.processingDescription}
              </p>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                  <ShieldCheck className="h-5 w-5 text-primary-500" />
                  <span>{copy.callback.processingHint}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{errorMessage}</p>
              <Button
                className="h-auto w-full py-3 font-bold"
                onClick={() => navigate(loginRoute, { replace: true })}
                type="button"
              >
                {copy.callback.backToLogin}
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Button>
            </>
          )}
        </div>
      </div>
      </div>
      {organizationSelectionChallenge ? (
        <SdkworkOrganizationSelectionDialog
          challenge={organizationSelectionChallenge}
          copy={copy.organizationSelection}
          errorMessage={organizationSelectionErrorMessage}
          onCancel={() => {
            if (selectedOrganizationId || selectingPersonalLogin) {
              return;
            }
            setOrganizationSelectionChallenge(null);
            setOrganizationSelectionErrorMessage("");
            navigate(loginRoute, { replace: true });
          }}
          onSelectOrganization={handleSelectOrganization}
          onSelectPersonal={
            organizationSelectionChallenge.challengeType === "LOGIN_CONTEXT_SELECTION"
              ? handleSelectPersonalLogin
              : undefined
          }
          selectedOrganizationId={selectedOrganizationId}
          selectingPersonal={selectingPersonalLogin}
        />
      ) : null}
    </>
  );
}

export function SdkworkAuthOAuthCallbackPage({
  routerContextMode = "auto",
  ...props
}: SdkworkAuthOAuthCallbackPageProps) {
  return (
    <SdkworkAuthPageRouterContextBoundary mode={routerContextMode}>
      <SdkworkAuthOAuthCallbackPageContent {...props} />
    </SdkworkAuthPageRouterContextBoundary>
  );
}
