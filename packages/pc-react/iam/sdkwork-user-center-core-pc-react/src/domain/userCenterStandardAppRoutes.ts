import type { UserCenterBridgeConfig } from "../types/userCenterTypes.ts";
import {
  createUserCenterSurfaceRouteRecord,
  type UserCenterResolvedSurfaceRoute,
  type UserCenterSurfaceRouteBinding,
} from "./userCenterSurfaceRoutes.ts";

export type UserCenterStandardAppRouteKey =
  | "authConfig"
  | "authSession"
  | "exchangeUserCenterSession"
  | "getCurrentUserProfile"
  | "login"
  | "loginWithEmailCode"
  | "loginWithPhoneCode"
  | "logout"
  | "requestPasswordReset"
  | "register"
  | "resetPassword"
  | "updateCurrentUserProfile";

export type UserCenterStandardAppOperationId =
  | "app.exchangeUserCenterSession"
  | "app.getCurrentUserProfile"
  | "app.getCurrentUserSession"
  | "app.getUserCenterConfig"
  | "app.login"
  | "app.loginWithEmailCode"
  | "app.loginWithPhoneCode"
  | "app.logout"
  | "app.requestPasswordReset"
  | "app.register"
  | "app.resetPassword"
  | "app.updateCurrentUserProfile";

export type UserCenterStandardAppSurfaceRoute<
  TSurface extends string = "app",
  TAuthMode extends string = "user",
> = UserCenterResolvedSurfaceRoute<
  UserCenterStandardAppRouteKey,
  UserCenterStandardAppOperationId,
  TSurface,
  TAuthMode
>;

export type UserCenterStandardAppSurfaceRouteRecord<
  TSurface extends string = "app",
  TAuthMode extends string = "user",
> = Record<
  UserCenterStandardAppRouteKey,
  UserCenterStandardAppSurfaceRoute<TSurface, TAuthMode>
>;

export interface CreateUserCenterStandardAppRouteProjectionOptions<
  TProjectedRoute,
  TSurface extends string = "app",
  TAuthMode extends string = "user",
> {
  authMode?: TAuthMode;
  formatOperationKey?: (
    route: UserCenterStandardAppSurfaceRoute<TSurface, TAuthMode>,
  ) => string;
  mapRoute: (
    route: UserCenterStandardAppSurfaceRoute<TSurface, TAuthMode>,
  ) => TProjectedRoute;
  surface?: TSurface;
}

export interface UserCenterStandardAppRouteProjection<
  TProjectedRoute,
  TSurface extends string = "app",
  TAuthMode extends string = "user",
> {
  mergeContract<TBaseContract extends object>(
    baseContract: TBaseContract,
  ): TBaseContract & Record<UserCenterStandardAppRouteKey, TProjectedRoute>;
  operationEntries: Array<readonly [string, UserCenterStandardAppOperationId]>;
  routeRecord: Record<UserCenterStandardAppRouteKey, TProjectedRoute>;
  standardRouteRecord: UserCenterStandardAppSurfaceRouteRecord<TSurface, TAuthMode>;
  standardRoutes: UserCenterStandardAppSurfaceRoute<TSurface, TAuthMode>[];
}

export const USER_CENTER_STANDARD_APP_ROUTE_BINDINGS = [
  {
    contractKey: "authConfig",
    operationId: "app.getUserCenterConfig",
    routeKey: "authConfig",
    summary: "Get active user-center provider metadata and login capability switches.",
  },
  {
    contractKey: "authSession",
    operationId: "app.getCurrentUserSession",
    routeKey: "authSession",
    summary: "Get the current login session snapshot for the active principal.",
  },
  {
    contractKey: "exchangeUserCenterSession",
    operationId: "app.exchangeUserCenterSession",
    routeKey: "authSessionExchange",
    summary: "Exchange an upstream or third-party session into the local AuthToken and AccessToken bundle.",
  },
  {
    contractKey: "getCurrentUserProfile",
    operationId: "app.getCurrentUserProfile",
    routeKey: "userProfileGet",
    summary: "Get the current user's canonical profile projection.",
  },
  {
    contractKey: "login",
    operationId: "app.login",
    routeKey: "authLogin",
    summary: "Create a login session with account and password credentials.",
  },
  {
    contractKey: "loginWithEmailCode",
    operationId: "app.loginWithEmailCode",
    routeKey: "authEmailLogin",
    summary: "Create a login session with email verification credentials.",
  },
  {
    contractKey: "loginWithPhoneCode",
    operationId: "app.loginWithPhoneCode",
    routeKey: "authPhoneLogin",
    summary: "Create a login session with phone verification credentials.",
  },
  {
    contractKey: "logout",
    operationId: "app.logout",
    routeKey: "authLogout",
    summary: "Revoke the current user-center login session and its token shadows.",
  },
  {
    contractKey: "requestPasswordReset",
    operationId: "app.requestPasswordReset",
    routeKey: "authPasswordResetRequest",
    summary: "Request a password-reset challenge through the configured verification channel.",
  },
  {
    contractKey: "register",
    operationId: "app.register",
    routeKey: "authRegister",
    summary: "Register a local user and return the initial account projection when enabled.",
  },
  {
    contractKey: "resetPassword",
    operationId: "app.resetPassword",
    routeKey: "authPasswordReset",
    summary: "Reset the current account password using a verified recovery challenge.",
  },
  {
    contractKey: "updateCurrentUserProfile",
    operationId: "app.updateCurrentUserProfile",
    routeKey: "userProfileUpdate",
    summary: "Update the current user's canonical profile projection.",
  },
] as const satisfies readonly UserCenterSurfaceRouteBinding<
  UserCenterStandardAppRouteKey,
  UserCenterStandardAppOperationId
>[];

export function formatUserCenterStandardAppOperationKey(
  route: Pick<UserCenterStandardAppSurfaceRoute<string, string>, "method" | "path">,
): string {
  return `${route.method} ${route.path}`;
}

export function mergeUserCenterStandardAppRouteRecord<TBaseContract extends object, TProjectedRoute>(
  baseContract: TBaseContract,
  routeRecord: Record<UserCenterStandardAppRouteKey, TProjectedRoute>,
): TBaseContract & Record<UserCenterStandardAppRouteKey, TProjectedRoute> {
  return {
    ...baseContract,
    ...routeRecord,
  } as TBaseContract & Record<UserCenterStandardAppRouteKey, TProjectedRoute>;
}

export function createUserCenterStandardAppRouteRecord<
  TSurface extends string = "app",
  TAuthMode extends string = "user",
>(
  bridgeConfig: UserCenterBridgeConfig,
  options: {
    authMode?: TAuthMode;
    surface?: TSurface;
  } = {},
): UserCenterStandardAppSurfaceRouteRecord<TSurface, TAuthMode> {
  const authMode = options.authMode ?? ("user" as TAuthMode);
  const surface = options.surface ?? ("app" as TSurface);

  return createUserCenterSurfaceRouteRecord(
    bridgeConfig,
    USER_CENTER_STANDARD_APP_ROUTE_BINDINGS,
    {
      authMode,
      surface,
    },
  );
}

export function createUserCenterStandardAppRouteProjection<
  TProjectedRoute,
  TSurface extends string = "app",
  TAuthMode extends string = "user",
>(
  bridgeConfig: UserCenterBridgeConfig,
  options: CreateUserCenterStandardAppRouteProjectionOptions<
    TProjectedRoute,
    TSurface,
    TAuthMode
  >,
): UserCenterStandardAppRouteProjection<TProjectedRoute, TSurface, TAuthMode> {
  const standardRouteRecord = createUserCenterStandardAppRouteRecord<
    TSurface,
    TAuthMode
  >(bridgeConfig, {
    authMode: options.authMode,
    surface: options.surface,
  });
  const standardRoutes = Object.values(standardRouteRecord);
  const formatOperationKey =
    options.formatOperationKey ?? formatUserCenterStandardAppOperationKey;

  return {
    mergeContract<TBaseContract extends object>(baseContract: TBaseContract) {
      return mergeUserCenterStandardAppRouteRecord(baseContract, this.routeRecord);
    },
    operationEntries: standardRoutes.map((route) => [
      formatOperationKey(route),
      route.operationId,
    ] as const),
    routeRecord: Object.fromEntries(
      standardRoutes.map((route) => [
        route.contractKey,
        options.mapRoute(route),
      ]),
    ) as Record<UserCenterStandardAppRouteKey, TProjectedRoute>,
    standardRouteRecord,
    standardRoutes,
  };
}
