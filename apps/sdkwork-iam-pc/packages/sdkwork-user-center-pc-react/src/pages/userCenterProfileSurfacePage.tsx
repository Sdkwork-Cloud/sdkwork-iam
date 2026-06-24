import {
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  SdkworkUserCenterPage,
  mergeSdkworkUserClassNames,
  mergeSdkworkUserStyles,
  type SdkworkUserAppearanceConfig,
  type SdkworkUserCenterPageProps,
} from "@sdkwork/user-pc-react";
import { resolveUserCenterSurfaceUserAppearance } from "../domain/userCenterAppearance.ts";
import type { UserCenterSurfaceAppearanceInput } from "../types/userCenterSurfaceTypes.ts";

export interface SdkworkUserCenterUnauthenticatedStateConfig {
  action?: ReactNode;
  description?: ReactNode;
  title?: ReactNode;
}

export interface SdkworkUserCenterProfileSurfacePageProps
  extends Omit<SdkworkUserCenterPageProps, "appearance"> {
  appearance?: SdkworkUserAppearanceConfig;
  isAuthenticated?: boolean;
  onAuthenticationRequired?(): void;
  surfaceAppearance?: UserCenterSurfaceAppearanceInput;
  unauthenticatedFallback?: ReactNode;
  unauthenticatedState?: SdkworkUserCenterUnauthenticatedStateConfig;
}

function DefaultSdkworkUserCenterUnauthenticatedState({
  appearance,
  state,
}: {
  appearance?: SdkworkUserAppearanceConfig;
  state?: SdkworkUserCenterUnauthenticatedStateConfig;
}) {
  return (
    <div
      className={mergeSdkworkUserClassNames(
        "relative flex min-h-full items-center justify-center bg-[var(--sdk-color-surface-canvas)] px-4 py-4 sm:px-8 sm:py-8",
        appearance?.pageClassName,
      )}
      style={appearance?.pageStyle}
    >
      <div
        className={mergeSdkworkUserClassNames(
          "w-full max-w-3xl rounded-[2rem] border border-[var(--sdk-color-border-default)] bg-[color-mix(in_srgb,var(--sdk-color-surface-panel)_96%,white)] p-4 shadow-[0_28px_80px_rgba(24,24,27,0.10)] sm:p-6",
          appearance?.shellClassName,
        )}
        style={appearance?.shellStyle}
      >
        <section
          className={mergeSdkworkUserClassNames(
            "rounded-[1.75rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] px-6 py-6 shadow-[var(--sdk-shadow-sm)] sm:px-8 sm:py-8",
            appearance?.heroPanelClassName,
          )}
          style={appearance?.heroPanelStyle}
        >
          <div
            className={mergeSdkworkUserClassNames(
              "inline-flex rounded-full border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel-muted)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-brand-primary)]",
              appearance?.heroBadgeClassName,
            )}
            style={appearance?.heroBadgeStyle}
          >
            User Center
          </div>
          <h2
            className={mergeSdkworkUserClassNames(
              "mt-5 text-3xl font-semibold tracking-tight text-[var(--sdk-color-text-primary)] sm:text-4xl",
              appearance?.heroTitleClassName,
            )}
            style={appearance?.heroTitleStyle}
          >
            {state?.title ?? "Authentication required"}
          </h2>
          <p
            className={mergeSdkworkUserClassNames(
              "mt-3 max-w-2xl text-sm leading-7 text-[var(--sdk-color-text-secondary)]",
              appearance?.heroDescriptionClassName,
            )}
            style={mergeSdkworkUserStyles(
              appearance?.heroDescriptionStyle,
            )}
          >
            {state?.description ?? "Sign in to access the shared user-center profile, security, and preferences surface."}
          </p>
          {state?.action ? (
            <div className="mt-6">
              {state.action}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export function SdkworkUserCenterProfileSurfacePage({
  appearance,
  isAuthenticated = true,
  onAuthenticationRequired,
  surfaceAppearance,
  unauthenticatedFallback,
  unauthenticatedState,
  ...props
}: SdkworkUserCenterProfileSurfacePageProps) {
  const resolvedAppearance = useMemo(
    () => resolveUserCenterSurfaceUserAppearance(appearance, surfaceAppearance),
    [appearance, surfaceAppearance],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      onAuthenticationRequired?.();
    }
  }, [isAuthenticated, onAuthenticationRequired]);

  if (!isAuthenticated) {
    return (
      <>
        {unauthenticatedFallback ?? (
          <DefaultSdkworkUserCenterUnauthenticatedState
            appearance={resolvedAppearance}
            state={unauthenticatedState}
          />
        )}
      </>
    );
  }

  return (
    <SdkworkUserCenterPage
      {...props}
      appearance={resolvedAppearance}
    />
  );
}
