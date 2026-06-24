import {
  createSdkworkAppCapabilityManifest,
  type CreateSdkworkAppCapabilityManifestOptions,
  type SdkworkAppCapabilityManifest,
} from "@sdkwork/appbase-pc-react";
import { isBlank, trim } from "@sdkwork/utils";

export type SdkworkAuthStatus = "anonymous" | "authenticated" | "authenticating" | "expired";
export type SdkworkAuthRouteId =
  | "forgot-password"
  | "login"
  | "oauth-callback"
  | "qr-entry"
  | "qr-login"
  | "register";
export type SdkworkAuthEntryFlow = "forgot-password" | "login" | "register";
export type SdkworkAuthEntryKind = "method" | "oauth-provider" | "qr-login";
export type SdkworkAuthMethod =
  | "email"
  | "email-code"
  | "passkey"
  | "password"
  | "phone"
  | "phone-code";

export interface SdkworkAuthRouteDefinition {
  access: "anonymous-only";
  id: SdkworkAuthRouteId;
  path: string;
}

export interface BuildSdkworkAuthQrEntryPathOptions {
  basePath?: string;
}

export interface BuildSdkworkAuthQrEntryUrlOptions extends BuildSdkworkAuthQrEntryPathOptions {
  origin?: string;
}

export interface SdkworkAuthSessionLike {
  accessToken?: string;
  authToken?: string;
  refreshToken?: string;
}

export interface ResolveSdkworkAuthStatusOptions {
  expiresAt?: Date | number | string | null;
  isAuthenticating?: boolean;
}

export type SdkworkAuthAccessDecision =
  | {
      allowed: true;
      status: SdkworkAuthStatus;
    }
  | {
      allowed: false;
      reason: "already-authenticated" | "authenticating" | "login-required";
      redirectTo?: string;
      status: SdkworkAuthStatus;
    };

export interface ResolveSdkworkAuthAccessOptions extends ResolveSdkworkAuthStatusOptions {
  currentPath: string;
  homePath?: string;
  protectedPrefixes?: readonly string[];
  routes: readonly SdkworkAuthRouteDefinition[];
  session?: SdkworkAuthSessionLike | null;
}

export interface SdkworkAuthMethodEntry {
  enabled?: boolean;
  flow: SdkworkAuthEntryFlow;
  id: string;
  kind: "method";
  method: SdkworkAuthMethod;
  route?: string;
}

export interface SdkworkAuthOAuthProviderEntry {
  callbackRoute?: string;
  enabled?: boolean;
  flow: "login";
  id: string;
  kind: "oauth-provider";
  launchHref?: string;
  provider: string;
  route?: string;
}

export interface SdkworkAuthQrEntry {
  enabled?: boolean;
  flow: "login";
  id: string;
  kind: "qr-login";
  route?: string;
}

export type SdkworkAuthEntry =
  | SdkworkAuthMethodEntry
  | SdkworkAuthOAuthProviderEntry
  | SdkworkAuthQrEntry;

export type SdkworkAuthEntryDigestStatus =
  | "current"
  | "enabled"
  | "external"
  | "restricted";

export interface CreateAuthEntryDigestOptions {
  activeFlow?: SdkworkAuthEntryFlow;
  callbackRoute?: string | null;
  currentEntryId?: string;
  entryKindFilter?: SdkworkAuthEntryKind;
  launchHref?: string | null;
  route?: string | null;
}

export interface SdkworkAuthEntryDigestBase {
  digestStatus: SdkworkAuthEntryDigestStatus;
  entryId: string;
  entryKind: SdkworkAuthEntryKind;
  flow: SdkworkAuthEntryFlow;
  isAvailable: boolean;
  isCurrent: boolean;
  isEnabled: boolean;
  isExternal: boolean;
  matchesFlow: boolean;
  matchesKind: boolean;
  route?: string;
}

export interface SdkworkAuthMethodDigest extends SdkworkAuthEntryDigestBase {
  entryKind: "method";
  method: SdkworkAuthMethod;
}

export interface SdkworkAuthOAuthProviderDigest extends SdkworkAuthEntryDigestBase {
  callbackRoute?: string;
  entryKind: "oauth-provider";
  hasCallbackRoute: boolean;
  hasLaunchHref: boolean;
  launchHref?: string;
  provider: string;
}

export interface SdkworkAuthQrDigest extends SdkworkAuthEntryDigestBase {
  entryKind: "qr-login";
}

export type SdkworkAuthEntryDigest =
  | SdkworkAuthMethodDigest
  | SdkworkAuthOAuthProviderDigest
  | SdkworkAuthQrDigest;

export interface SdkworkAuthEntryDigestSummary {
  currentEntries: number;
  enabledEntries: number;
  externalEntries: number;
  loginEntries: number;
  oauthEntries: number;
  qrEntries: number;
  recoveryEntries: number;
  registerEntries: number;
  restrictedEntries: number;
  totalEntries: number;
}

export type SdkworkAuthEntryAction = "open-entry" | "start-oauth";

export type SdkworkAuthEntryIssue =
  | "callback-route-missing"
  | "entry-disabled"
  | "entry-kind-mismatch"
  | "flow-mismatch"
  | "launch-href-missing"
  | "missing-route"
  | "oauth-provider-required";

export interface EvaluateAuthEntryReadinessOptions {
  action?: SdkworkAuthEntryAction;
}

export interface SdkworkAuthEntryChecklist {
  hasCallbackRoute: boolean;
  hasLaunchHref: boolean;
  hasRoute: boolean;
  isAvailable: boolean;
  isEnabled: boolean;
  isExternal: boolean;
  matchesFlow: boolean;
  matchesKind: boolean;
}

export interface SdkworkAuthEntryCapabilities {
  canOpenEntry: boolean;
  canStartOAuth: boolean;
}

export interface SdkworkAuthEntryReadiness {
  capabilities: SdkworkAuthEntryCapabilities;
  checklist: SdkworkAuthEntryChecklist;
  degraded: boolean;
  issues: SdkworkAuthEntryIssue[];
  ready: boolean;
}

export interface SdkworkAuthWorkspaceManifest extends SdkworkAppCapabilityManifest {
  capability: "auth";
  forgotPasswordRoutePath: string;
  loginRoutePath: string;
  oauthCallbackRoutePattern: string;
  qrRoutePath: string;
  registerRoutePath: string;
}

export interface CreateAuthWorkspaceManifestOptions
  extends Partial<
    Pick<CreateSdkworkAppCapabilityManifestOptions, "description" | "host" | "id" | "packageNames" | "theme" | "title">
  > {
  forgotPasswordRoutePath?: string;
  loginRoutePath?: string;
  oauthCallbackRoutePattern?: string;
  qrRoutePath?: string;
  registerRoutePath?: string;
}

export interface SdkworkAuthWorkspaceRoutes {
  forgotPasswordRoutePath: string;
  loginRoutePath: string;
  oauthCallbackRoutePattern: string;
  qrRoutePath: string;
  registerRoutePath: string;
}

export interface SdkworkAuthRouteIntent {
  focusWindow: boolean;
  provider?: string;
  redirectTo?: string;
  route: string;
  routeId: SdkworkAuthRouteId;
  source: "auth-workspace";
  type: "auth-route-intent";
}

export interface CreateAuthRouteIntentOptions {
  focusWindow?: boolean;
  provider?: string;
  redirectTo?: string | null;
  routes?: readonly SdkworkAuthRouteDefinition[];
}

export interface SdkworkCanonicalAuthRouteDefinition<
  TSourcePackageName extends string = string,
> extends SdkworkAuthRouteDefinition {
  capability: "auth";
  sourcePackageName: TSourcePackageName;
}

export interface CreateSdkworkCanonicalAuthRouteCatalogOptions<
  TSourcePackageName extends string = string,
> {
  basePath?: string;
  sourcePackageName: TSourcePackageName;
}

export interface SdkworkCanonicalAuthRouteIntent<
  TSourcePackageName extends string = string,
> extends SdkworkAuthRouteIntent {
  capability: "auth";
  path: string;
  sourcePackageName: TSourcePackageName;
}

export interface CreateSdkworkCanonicalAuthRouteIntentOptions<
  TSourcePackageName extends string = string,
> extends Omit<CreateAuthRouteIntentOptions, "routes"> {
  basePath?: string;
  routes?: readonly SdkworkCanonicalAuthRouteDefinition<TSourcePackageName>[];
  sourcePackageName: TSourcePackageName;
}

export interface SdkworkCanonicalAuthWorkspaceManifest<
  TArchitecture extends string = string,
  TBridgePackageName extends string = string,
  TSourcePackageName extends string = string,
> extends Omit<SdkworkAuthWorkspaceManifest, "architecture"> {
  architecture: TArchitecture;
  bridgePackageName: TBridgePackageName;
  sourcePackageNames: readonly [TSourcePackageName];
}

export interface CreateSdkworkCanonicalAuthWorkspaceManifestOptions<
  TArchitecture extends string = string,
  TBridgePackageName extends string = string,
  TSourcePackageName extends string = string,
> extends Omit<CreateAuthWorkspaceManifestOptions, "packageNames"> {
  architecture: TArchitecture;
  bridgePackageName: TBridgePackageName;
  packageNames?: readonly string[];
  sourcePackageName: TSourcePackageName;
}

function normalizeBasePath(basePath: string): string {
  const normalized = basePath.trim().replace(/\/+$/, "");
  return normalized || "/auth";
}

function normalizeRoute(route: string | null | undefined): string | undefined {
  const normalized = route?.trim();
  return normalized ? normalized : undefined;
}

function normalizeRedirectTarget(path: string): string {
  return path.split(/[?#]/, 1)[0] ?? path;
}

function isExpired(expiresAt: ResolveSdkworkAuthStatusOptions["expiresAt"]): boolean {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() <= Date.now();
}

function hasSessionToken(session: SdkworkAuthSessionLike | null | undefined): boolean {
  return !isBlank(session?.accessToken) && !isBlank(session?.authToken);
}

function pathMatchesRoutePattern(pattern: string, path: string): boolean {
  const normalizedPattern = normalizeRedirectTarget(pattern);
  const normalizedPath = normalizeRedirectTarget(path);
  const patternSegments = normalizedPattern.split("/").filter(Boolean);
  const pathSegments = normalizedPath.split("/").filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return false;
  }

  return patternSegments.every((segment, index) => {
    if (segment.startsWith(":")) {
      return Boolean(pathSegments[index]);
    }

    return segment === pathSegments[index];
  });
}

function isEntryEnabled(entry: SdkworkAuthEntry): boolean {
  return entry.enabled !== false;
}

function toUniquePackages(packageNames: readonly string[]): string[] {
  return Array.from(new Set(packageNames.map((packageName) => packageName.trim()).filter(Boolean)));
}

function toUniqueAuthEntryIssues(
  issues: readonly SdkworkAuthEntryIssue[],
): SdkworkAuthEntryIssue[] {
  return Array.from(new Set(issues));
}

function resolveAuthEntryDigestStatus(
  entry: SdkworkAuthEntry,
  route: string | undefined,
  options: CreateAuthEntryDigestOptions,
): SdkworkAuthEntryDigestStatus {
  if (!isEntryEnabled(entry) || !route) {
    return "restricted";
  }

  if (entry.id === options.currentEntryId) {
    return "current";
  }

  if (entry.kind === "oauth-provider") {
    return "external";
  }

  return "enabled";
}

function resolveAuthRouteDefinition(
  routeId: SdkworkAuthRouteId,
  routes: readonly SdkworkAuthRouteDefinition[],
): SdkworkAuthRouteDefinition {
  const route = routes.find((candidate) => candidate.id === routeId);
  if (!route) {
    throw new Error(`Unknown auth route id: ${routeId}`);
  }

  return route;
}

function buildAuthRoute(
  route: SdkworkAuthRouteDefinition,
  options: CreateAuthRouteIntentOptions,
): string {
  if (route.id === "oauth-callback") {
    const provider = options.provider;
    if (!provider || isBlank(provider)) {
      throw new Error("Third-party login callback route requires a provider.");
    }

    return route.path.replace(":provider", provider.trim());
  }

  return route.path;
}

function resolveAuthBasePathFromRoutes(
  routes: readonly SdkworkAuthRouteDefinition[],
): string {
  const loginRoute = routes.find((route) => route.id === "login")?.path;
  if (!loginRoute) {
    return "/auth";
  }

  return loginRoute.endsWith("/login")
    ? normalizeBasePath(loginRoute.slice(0, -"/login".length))
    : "/auth";
}

export function createAuthRouteCatalog(basePath = "/auth"): SdkworkAuthRouteDefinition[] {
  const resolvedBasePath = normalizeBasePath(basePath);

  return [
    {
      access: "anonymous-only",
      id: "login",
      path: `${resolvedBasePath}/login`,
    },
    {
      access: "anonymous-only",
      id: "register",
      path: `${resolvedBasePath}/register`,
    },
    {
      access: "anonymous-only",
      id: "forgot-password",
      path: `${resolvedBasePath}/forgot-password`,
    },
    {
      access: "anonymous-only",
      id: "oauth-callback",
      path: `${resolvedBasePath}/oauth/callback/:provider`,
    },
    {
      access: "anonymous-only",
      id: "qr-login",
      path: `${resolvedBasePath}/qr-login`,
    },
    {
      access: "anonymous-only",
      id: "qr-entry",
      path: `${resolvedBasePath}/qr/:sessionKey`,
    },
  ];
}

export function buildSdkworkAuthQrEntryPath(
  sessionKey: string,
  options: BuildSdkworkAuthQrEntryPathOptions = {},
): string {
  const resolvedBasePath = normalizeBasePath(options.basePath ?? "/auth");
  const normalizedSessionKey = sessionKey.trim();

  if (!normalizedSessionKey) {
    return `${resolvedBasePath}/qr`;
  }

  return `${resolvedBasePath}/qr/${encodeURIComponent(normalizedSessionKey)}`;
}

export function buildSdkworkAuthQrEntryUrl(
  sessionKey: string,
  options: BuildSdkworkAuthQrEntryUrlOptions = {},
): string {
  const path = buildSdkworkAuthQrEntryPath(sessionKey, options);
  const origin = options.origin?.trim();

  if (!origin) {
    return path;
  }

  return new URL(path, origin.endsWith("/") ? origin : `${origin}/`).toString();
}

export function resolveAuthRoutePath(
  routeId: SdkworkAuthRouteId,
  routes: readonly SdkworkAuthRouteDefinition[],
): string {
  return resolveAuthRouteDefinition(routeId, routes).path;
}

export function resolveAuthWorkspaceRoutes(basePath = "/auth"): SdkworkAuthWorkspaceRoutes {
  const routes = createAuthRouteCatalog(basePath);

  return {
    forgotPasswordRoutePath: resolveAuthRoutePath("forgot-password", routes),
    loginRoutePath: resolveAuthRoutePath("login", routes),
    oauthCallbackRoutePattern: resolveAuthRoutePath("oauth-callback", routes),
    qrRoutePath: resolveAuthRoutePath("qr-login", routes),
    registerRoutePath: resolveAuthRoutePath("register", routes),
  };
}

export function createSdkworkCanonicalAuthRouteCatalog<
  TSourcePackageName extends string,
>({
  basePath = "/auth",
  sourcePackageName,
}: CreateSdkworkCanonicalAuthRouteCatalogOptions<TSourcePackageName>): Array<
  SdkworkCanonicalAuthRouteDefinition<TSourcePackageName>
> {
  return createAuthRouteCatalog(basePath).map((route) => ({
    ...route,
    capability: "auth",
    sourcePackageName,
  }));
}

export function isAuthRoute(
  routes: readonly SdkworkAuthRouteDefinition[],
  path: string,
): boolean {
  return routes.some((route) => pathMatchesRoutePattern(route.path, path));
}

export function resolveAuthStatus(
  session?: SdkworkAuthSessionLike | null,
  options: ResolveSdkworkAuthStatusOptions = {},
): SdkworkAuthStatus {
  if (options.isAuthenticating) {
    return "authenticating";
  }

  if (hasSessionToken(session)) {
    return isExpired(options.expiresAt) ? "expired" : "authenticated";
  }

  return "anonymous";
}

export function resolveAuthAccess({
  currentPath,
  expiresAt,
  homePath = "/",
  isAuthenticating,
  protectedPrefixes = [],
  routes,
  session,
}: ResolveSdkworkAuthAccessOptions): SdkworkAuthAccessDecision {
  const status = resolveAuthStatus(session, {
    expiresAt,
    isAuthenticating,
  });

  if (status === "authenticating") {
    return {
      allowed: false,
      reason: "authenticating",
      status,
    };
  }

  if (isAuthRoute(routes, currentPath) && status === "authenticated") {
    return {
      allowed: false,
      reason: "already-authenticated",
      redirectTo: homePath,
      status,
    };
  }

  const requiresAuth = protectedPrefixes.some((prefix) => currentPath.startsWith(prefix));
  if (requiresAuth && status !== "authenticated") {
    const loginPath = routes.find((route) => route.id === "login")?.path ?? "/login";
    return {
      allowed: false,
      reason: "login-required",
      redirectTo: `${loginPath}?redirect=${encodeURIComponent(currentPath)}`,
      status,
    };
  }

  return {
    allowed: true,
    status,
  };
}

export function createAuthEntryDigest(
  entry: SdkworkAuthEntry,
  options: CreateAuthEntryDigestOptions = {},
): SdkworkAuthEntryDigest {
  const route = Object.prototype.hasOwnProperty.call(options, "route")
    ? normalizeRoute(options.route)
    : normalizeRoute(entry.route);
  const isEnabled = isEntryEnabled(entry);
  const isAvailable = isEnabled && Boolean(route);
  const isCurrent = entry.id === options.currentEntryId;
  const matchesFlow = options.activeFlow ? options.activeFlow === entry.flow : true;
  const matchesKind = options.entryKindFilter ? options.entryKindFilter === entry.kind : true;
  const digestStatus = resolveAuthEntryDigestStatus(entry, route, options);
  const baseDigest: SdkworkAuthEntryDigestBase = {
    digestStatus,
    entryId: entry.id,
    entryKind: entry.kind,
    flow: entry.flow,
    isAvailable,
    isCurrent,
    isEnabled,
    isExternal: entry.kind === "oauth-provider",
    matchesFlow,
    matchesKind,
    ...(route ? { route } : {}),
  };

  if (entry.kind === "method") {
    return {
      ...baseDigest,
      entryKind: "method",
      method: entry.method,
    };
  }

  if (entry.kind === "oauth-provider") {
    const callbackRoute = Object.prototype.hasOwnProperty.call(options, "callbackRoute")
      ? normalizeRoute(options.callbackRoute)
      : normalizeRoute(entry.callbackRoute);
    const launchHref = Object.prototype.hasOwnProperty.call(options, "launchHref")
      ? normalizeRoute(options.launchHref)
      : normalizeRoute(entry.launchHref);

    return {
      ...baseDigest,
      ...(callbackRoute ? { callbackRoute } : {}),
      entryKind: "oauth-provider",
      hasCallbackRoute: Boolean(callbackRoute),
      hasLaunchHref: Boolean(launchHref),
      ...(launchHref ? { launchHref } : {}),
      provider: entry.provider,
    };
  }

  return {
    ...baseDigest,
    entryKind: "qr-login",
  };
}

export function summarizeAuthEntryDigests(
  digests: readonly SdkworkAuthEntryDigest[],
): SdkworkAuthEntryDigestSummary {
  return digests.reduce<SdkworkAuthEntryDigestSummary>(
    (summary, digest) => {
      summary.totalEntries += 1;

      if (digest.isCurrent) {
        summary.currentEntries += 1;
      }

      if (digest.isEnabled) {
        summary.enabledEntries += 1;
      }

      if (digest.isExternal) {
        summary.externalEntries += 1;
      }

      if (digest.flow === "login") {
        summary.loginEntries += 1;
      }

      if (digest.flow === "register") {
        summary.registerEntries += 1;
      }

      if (digest.flow === "forgot-password") {
        summary.recoveryEntries += 1;
      }

      if (digest.entryKind === "oauth-provider") {
        summary.oauthEntries += 1;
      }

      if (digest.entryKind === "qr-login") {
        summary.qrEntries += 1;
      }

      if (digest.digestStatus === "restricted") {
        summary.restrictedEntries += 1;
      }

      return summary;
    },
    {
      currentEntries: 0,
      enabledEntries: 0,
      externalEntries: 0,
      loginEntries: 0,
      oauthEntries: 0,
      qrEntries: 0,
      recoveryEntries: 0,
      registerEntries: 0,
      restrictedEntries: 0,
      totalEntries: 0,
    },
  );
}

export function evaluateAuthEntryReadiness(
  digest: SdkworkAuthEntryDigest,
  options: EvaluateAuthEntryReadinessOptions = {},
): SdkworkAuthEntryReadiness {
  const action = options.action ?? "open-entry";
  const checklist: SdkworkAuthEntryChecklist = {
    hasCallbackRoute: digest.entryKind === "oauth-provider" ? digest.hasCallbackRoute : false,
    hasLaunchHref: digest.entryKind === "oauth-provider" ? digest.hasLaunchHref : false,
    hasRoute: Boolean(digest.route),
    isAvailable: digest.isAvailable,
    isEnabled: digest.isEnabled,
    isExternal: digest.isExternal,
    matchesFlow: digest.matchesFlow,
    matchesKind: digest.matchesKind,
  };
  const capabilities: SdkworkAuthEntryCapabilities = {
    canOpenEntry: digest.isEnabled && Boolean(digest.route),
    canStartOAuth:
      digest.entryKind === "oauth-provider"
        && digest.isEnabled
        && digest.hasLaunchHref
        && digest.hasCallbackRoute,
  };
  const issues = toUniqueAuthEntryIssues([
    ...(digest.matchesFlow ? [] : ["flow-mismatch" as const]),
    ...(digest.matchesKind ? [] : ["entry-kind-mismatch" as const]),
    ...(digest.isEnabled ? [] : ["entry-disabled" as const]),
    ...(action === "open-entry" && !digest.route ? ["missing-route" as const] : []),
    ...(action === "start-oauth" && digest.entryKind !== "oauth-provider"
      ? ["oauth-provider-required" as const]
      : []),
    ...(action === "start-oauth" && digest.entryKind === "oauth-provider" && !digest.hasLaunchHref
      ? ["launch-href-missing" as const]
      : []),
    ...(action === "start-oauth" && digest.entryKind === "oauth-provider" && !digest.hasCallbackRoute
      ? ["callback-route-missing" as const]
      : []),
  ]);

  return {
    capabilities,
    checklist,
    degraded: issues.includes("flow-mismatch") || issues.includes("entry-kind-mismatch"),
    issues,
    ready: action === "start-oauth" ? capabilities.canStartOAuth : capabilities.canOpenEntry,
  };
}

export function resolveAuthRedirectTarget(
  rawTarget: string | null | undefined,
  fallbackRoute = "/dashboard",
  authBasePath = "/auth",
): string {
  const normalizedTarget = rawTarget?.trim();
  if (!normalizedTarget || !isSafeInAppRedirectTarget(normalizedTarget)) {
    return fallbackRoute;
  }

  const redirectPath = normalizeRedirectTarget(normalizedTarget);
  const normalizedAuthBasePath = normalizeBasePath(authBasePath);
  const blockedExactRoutes = new Set([
    normalizedAuthBasePath,
    `${normalizedAuthBasePath}/login`,
    `${normalizedAuthBasePath}/register`,
    `${normalizedAuthBasePath}/forgot-password`,
    `${normalizedAuthBasePath}/qr-login`,
    "/login",
    "/register",
    "/forgot-password",
    "/qr-login",
  ]);

  if (
    blockedExactRoutes.has(redirectPath)
    || redirectPath.startsWith(`${normalizedAuthBasePath}/oauth/callback`)
    || redirectPath.startsWith(`${normalizedAuthBasePath}/qr/`)
    || redirectPath.startsWith("/auth/oauth/callback")
    || redirectPath.startsWith("/auth/qr/")
    || redirectPath.startsWith("/login/oauth/callback")
    || redirectPath.startsWith("/login/qr/")
  ) {
    return fallbackRoute;
  }

  return redirectPath;
}

function isSafeInAppRedirectTarget(target: string): boolean {
  if (!target.startsWith("/")) {
    return false;
  }
  if (target.startsWith("//") || target.startsWith("/\\")) {
    return false;
  }
  if (target.includes("://") || target.includes("\\")) {
    return false;
  }
  return true;
}

export function createAuthWorkspaceManifest({
  description = "Auth workspace for anonymous-entry routing, OAuth callbacks, and reusable auth surface assembly.",
  forgotPasswordRoutePath = "/auth/forgot-password",
  host,
  id = "sdkwork-auth",
  loginRoutePath = "/auth/login",
  oauthCallbackRoutePattern = "/auth/oauth/callback/:provider",
  packageNames = [
    "@sdkwork/auth-pc-react",
    "@sdkwork/user-pc-react",
  ],
  qrRoutePath = "/auth/qr-login",
  registerRoutePath = "/auth/register",
  theme,
  title = "Auth",
}: CreateAuthWorkspaceManifestOptions = {}): SdkworkAuthWorkspaceManifest {
  return {
    ...createSdkworkAppCapabilityManifest({
      description,
      host,
      id,
      packageNames: toUniquePackages(packageNames),
      theme,
      title,
    }),
    capability: "auth",
    forgotPasswordRoutePath,
    loginRoutePath,
    oauthCallbackRoutePattern,
    qrRoutePath,
    registerRoutePath,
  };
}

export function createSdkworkCanonicalAuthWorkspaceManifest<
  TArchitecture extends string,
  TBridgePackageName extends string,
  TSourcePackageName extends string,
>({
  architecture,
  bridgePackageName,
  packageNames,
  sourcePackageName,
  ...options
}: CreateSdkworkCanonicalAuthWorkspaceManifestOptions<
  TArchitecture,
  TBridgePackageName,
  TSourcePackageName
>): SdkworkCanonicalAuthWorkspaceManifest<
  TArchitecture,
  TBridgePackageName,
  TSourcePackageName
> {
  return {
    ...createAuthWorkspaceManifest({
      ...options,
      packageNames: packageNames ? [...packageNames] : undefined,
    }),
    architecture,
    bridgePackageName,
    sourcePackageNames: [sourcePackageName],
  };
}

export function createAuthRouteIntent(
  routeId: SdkworkAuthRouteId,
  options: CreateAuthRouteIntentOptions = {},
): SdkworkAuthRouteIntent {
  const routes = options.routes ?? createAuthRouteCatalog("/auth");
  const route = resolveAuthRouteDefinition(routeId, routes);
  const authBasePath = resolveAuthBasePathFromRoutes(routes);
  const redirectTo = options.redirectTo === undefined
    ? undefined
    : resolveAuthRedirectTarget(options.redirectTo, "/dashboard", authBasePath);
  const routeValue = buildAuthRoute(route, options);
  const queryParams = new URLSearchParams();

  if (redirectTo && redirectTo !== "/dashboard") {
    queryParams.set("redirect", redirectTo);
  }

  const querySuffix = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return {
    focusWindow: options.focusWindow !== false,
    ...(options.provider && !isBlank(options.provider) ? { provider: trim(options.provider) } : {}),
    ...(redirectTo ? { redirectTo } : {}),
    route: `${routeValue}${querySuffix}`,
    routeId,
    source: "auth-workspace",
    type: "auth-route-intent",
  };
}

export function createSdkworkCanonicalAuthRouteIntent<
  TSourcePackageName extends string,
>(
  routeId: SdkworkAuthRouteId,
  {
    basePath = "/auth",
    routes,
    sourcePackageName,
    ...options
  }: CreateSdkworkCanonicalAuthRouteIntentOptions<TSourcePackageName>,
): SdkworkCanonicalAuthRouteIntent<TSourcePackageName> {
  const resolvedRoutes = routes ?? createSdkworkCanonicalAuthRouteCatalog({
    basePath,
    sourcePackageName,
  });
  const intent = createAuthRouteIntent(routeId, {
    ...options,
    routes: resolvedRoutes,
  });

  return {
    ...intent,
    capability: "auth",
    path: intent.route,
    sourcePackageName,
  };
}

export const authPackageMeta = {
  architecture: "pc-react",
  domain: "iam",
  package: "@sdkwork/auth-pc-react",
  status: "ready",
} as const;

export type AuthPackageMeta = typeof authPackageMeta;
