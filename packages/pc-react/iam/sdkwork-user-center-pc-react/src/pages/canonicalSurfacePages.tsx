import { useMemo } from "react";
import {
  mergeSdkworkAuthAppearanceConfigs,
} from "@sdkwork/auth-pc-react";
import type {
  SdkworkAuthController,
  SdkworkAuthPageEvents,
  SdkworkAuthPageSlots,
  SdkworkAuthRuntimeConfig,
  SdkworkAuthAppearanceConfig,
} from "@sdkwork/auth-pc-react";
import {
  mergeSdkworkUserAppearanceConfigs,
  mergeSdkworkUserMessagesOverrides,
} from "@sdkwork/user-pc-react";
import type {
  SdkworkUserAppearanceConfig,
  SdkworkUserController,
  SdkworkUserMessagesOverrides,
} from "@sdkwork/user-pc-react";
import { resolveUserCenterSurfaceInitialEntry } from "../domain/userCenterSurfaceRouting.ts";
import type { UserCenterSurfaceAppearanceInput } from "../types/userCenterSurfaceTypes.ts";
import { mergeUserCenterSurfaceAppearanceInputs } from "../domain/userCenterAppearance.ts";
import {
  SdkworkUserCenterAuthSurfacePage,
  type SdkworkUserCenterAuthSurfacePageProps,
} from "./userCenterAuthSurfacePage.tsx";
import {
  SdkworkUserCenterProfileSurfacePage,
  type SdkworkUserCenterProfileSurfacePageProps,
  type SdkworkUserCenterUnauthenticatedStateConfig,
} from "./userCenterProfileSurfacePage.tsx";

export interface SdkworkCanonicalAuthSurfacePageProps
  extends Omit<SdkworkUserCenterAuthSurfacePageProps, "controller" | "router"> {
  appearance?: SdkworkAuthAppearanceConfig;
  events?: SdkworkAuthPageEvents;
  runtimeConfig?: SdkworkAuthRuntimeConfig;
  slots?: SdkworkAuthPageSlots;
  surfaceAppearance?: UserCenterSurfaceAppearanceInput;
}

export interface CreateSdkworkCanonicalAuthSurfaceControllerOptions<
  TAuthConfig,
  TService,
> {
  authConfig: TAuthConfig | null | undefined;
  service: TService;
}

export interface CreateSdkworkCanonicalAuthSurfacePageOptions<
  TAuthConfig,
  TService,
> {
  defaultBasePath: string;
  defaultAppearance?: SdkworkAuthAppearanceConfig;
  defaultEvents?: SdkworkAuthPageEvents;
  defaultHomePath?: string;
  defaultRuntimeConfig?: SdkworkAuthRuntimeConfig;
  defaultSlots?: SdkworkAuthPageSlots;
  defaultSurfaceAppearance?: UserCenterSurfaceAppearanceInput;
  displayName?: string;
  resolveInitialEntries?(options: {
    basePath: string;
    fallbackEntry: string;
  }): string[];
  resolveRuntimeConfig?(
    authConfig: TAuthConfig | null | undefined,
  ): SdkworkAuthRuntimeConfig | undefined;
  useAuthConfig(): TAuthConfig | null | undefined;
  useService(): TService;
  createController(
    options: CreateSdkworkCanonicalAuthSurfaceControllerOptions<TAuthConfig, TService>,
  ): SdkworkAuthController;
}

export interface SdkworkCanonicalUserCenterSurfacePageProps
  extends Omit<SdkworkUserCenterProfileSurfacePageProps, "controller" | "isAuthenticated" | "locale"> {
  appearance?: SdkworkUserAppearanceConfig;
  messages?: SdkworkUserMessagesOverrides;
  surfaceAppearance?: UserCenterSurfaceAppearanceInput;
  unauthenticatedState?: SdkworkUserCenterUnauthenticatedStateConfig;
}

export interface CreateSdkworkCanonicalUserCenterSurfaceControllerOptions<TUser> {
  locale?: string | null;
  messages?: SdkworkUserMessagesOverrides;
  user: TUser;
}

export interface CreateSdkworkCanonicalUserCenterSurfacePageOptions<TUser> {
  defaultAppearance?: SdkworkUserAppearanceConfig;
  defaultMessages?: SdkworkUserMessagesOverrides;
  defaultSurfaceAppearance?: UserCenterSurfaceAppearanceInput;
  defaultUnauthenticatedState?: SdkworkUserCenterUnauthenticatedStateConfig;
  displayName?: string;
  resolveIsAuthenticated?(user: TUser | null | undefined): boolean;
  useLocale(): string | null | undefined;
  useUser(): TUser | null | undefined;
  createController(
    options: CreateSdkworkCanonicalUserCenterSurfaceControllerOptions<TUser>,
  ): SdkworkUserController;
}

function resolveRuntimeConfigWithOverrides(
  ...runtimeConfigs: Array<SdkworkAuthRuntimeConfig | undefined>
): SdkworkAuthRuntimeConfig | undefined {
  const resolvedRuntimeConfigs = runtimeConfigs.filter(Boolean) as SdkworkAuthRuntimeConfig[];
  if (!resolvedRuntimeConfigs.length) {
    return undefined;
  }

  return Object.assign({}, ...resolvedRuntimeConfigs);
}

function mergeSdkworkAuthPageEvents(
  defaultEvents: SdkworkAuthPageEvents | undefined,
  overrideEvents: SdkworkAuthPageEvents | undefined,
): SdkworkAuthPageEvents | undefined {
  if (!defaultEvents && !overrideEvents) {
    return undefined;
  }

  return {
    onLoginMethodChange(method, context) {
      defaultEvents?.onLoginMethodChange?.(method, context);
      overrideEvents?.onLoginMethodChange?.(method, context);
    },
    onModeChange(mode, context) {
      defaultEvents?.onModeChange?.(mode, context);
      overrideEvents?.onModeChange?.(mode, context);
    },
    onQrStateChange(state, context) {
      defaultEvents?.onQrStateChange?.(state, context);
      overrideEvents?.onQrStateChange?.(state, context);
    },
  };
}

export function createSdkworkCanonicalAuthSurfacePage<
  TAuthConfig,
  TService,
>(
  options: CreateSdkworkCanonicalAuthSurfacePageOptions<TAuthConfig, TService>,
) {
  function SdkworkCanonicalAuthSurfacePage({
    appearance,
    basePath: providedBasePath,
    events,
    homePath,
    runtimeConfig: runtimeConfigOverrides,
    slots,
    surfaceAppearance,
  }: SdkworkCanonicalAuthSurfacePageProps = {}) {
    const authConfig = options.useAuthConfig();
    const service = options.useService();
    const basePath = providedBasePath ?? options.defaultBasePath;
    const resolvedHomePath = homePath ?? options.defaultHomePath ?? "/";
    const resolvedAppearance = useMemo(
      () =>
        mergeSdkworkAuthAppearanceConfigs(
          options.defaultAppearance,
          appearance,
        ),
      [appearance],
    );
    const runtimeConfig = useMemo(
      () =>
        resolveRuntimeConfigWithOverrides(
          options.resolveRuntimeConfig?.(authConfig),
          options.defaultRuntimeConfig,
          runtimeConfigOverrides,
        ),
      [authConfig, runtimeConfigOverrides],
    );
    const resolvedSlots = useMemo(
      () => ({
        ...(options.defaultSlots ?? {}),
        ...(slots ?? {}),
      }),
      [slots],
    );
    const resolvedEvents = useMemo(
      () => mergeSdkworkAuthPageEvents(options.defaultEvents, events),
      [events],
    );
    const resolvedSurfaceAppearance = useMemo(
      () =>
        mergeUserCenterSurfaceAppearanceInputs(
          options.defaultSurfaceAppearance,
          surfaceAppearance,
        ),
      [surfaceAppearance],
    );
    const initialEntries = useMemo(() => {
      const fallbackEntry = `${basePath}/login`;
      return options.resolveInitialEntries?.({
        basePath,
        fallbackEntry,
      }) ?? [resolveUserCenterSurfaceInitialEntry({ fallbackEntry })];
    }, [basePath]);
    const controller = useMemo(
      () =>
        options.createController({
          authConfig,
          service,
        }),
      [authConfig, service],
    );

    return (
      <SdkworkUserCenterAuthSurfacePage
        appearance={resolvedAppearance}
        basePath={basePath}
        controller={controller}
        events={resolvedEvents}
        homePath={resolvedHomePath}
        router={{
          initialEntries,
          kind: "memory",
        }}
        runtimeConfig={runtimeConfig}
        slots={resolvedSlots}
        surfaceAppearance={resolvedSurfaceAppearance}
      />
    );
  }

  SdkworkCanonicalAuthSurfacePage.displayName =
    options.displayName ?? "SdkworkCanonicalAuthSurfacePage";

  return SdkworkCanonicalAuthSurfacePage;
}

export function createSdkworkCanonicalUserCenterSurfacePage<TUser>(
  options: CreateSdkworkCanonicalUserCenterSurfacePageOptions<TUser>,
) {
  function SdkworkCanonicalUserCenterSurfacePage({
    appearance,
    description,
    messages,
    onAuthenticationRequired,
    surfaceAppearance,
    title,
    unauthenticatedFallback,
    unauthenticatedState,
  }: SdkworkCanonicalUserCenterSurfacePageProps = {}) {
    const locale = options.useLocale();
    const user = options.useUser();
    const isAuthenticated = options.resolveIsAuthenticated
      ? options.resolveIsAuthenticated(user)
      : Boolean(user);
    const resolvedAppearance = useMemo(
      () =>
        mergeSdkworkUserAppearanceConfigs(
          options.defaultAppearance,
          appearance,
        ),
      [appearance],
    );
    const resolvedMessages = useMemo(
      () =>
        mergeSdkworkUserMessagesOverrides(
          options.defaultMessages,
          messages,
        ),
      [messages],
    );
    const resolvedSurfaceAppearance = useMemo(
      () =>
        mergeUserCenterSurfaceAppearanceInputs(
          options.defaultSurfaceAppearance,
          surfaceAppearance,
        ),
      [surfaceAppearance],
    );
    const controller = useMemo(
      () =>
        user && isAuthenticated
          ? options.createController({
              locale,
              messages: resolvedMessages,
              user,
            })
          : undefined,
      [isAuthenticated, locale, resolvedMessages, user],
    );

    return (
      <SdkworkUserCenterProfileSurfacePage
        appearance={resolvedAppearance}
        controller={controller}
        description={description}
        isAuthenticated={isAuthenticated}
        locale={locale}
        messages={resolvedMessages}
        onAuthenticationRequired={onAuthenticationRequired}
        surfaceAppearance={resolvedSurfaceAppearance}
        title={title}
        unauthenticatedFallback={unauthenticatedFallback}
        unauthenticatedState={unauthenticatedState ?? options.defaultUnauthenticatedState}
      />
    );
  }

  SdkworkCanonicalUserCenterSurfacePage.displayName =
    options.displayName ?? "SdkworkCanonicalUserCenterSurfacePage";

  return SdkworkCanonicalUserCenterSurfacePage;
}
