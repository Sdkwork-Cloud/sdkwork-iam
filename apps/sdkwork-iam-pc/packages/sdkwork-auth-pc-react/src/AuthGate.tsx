import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  createAuthRouteCatalog,
  isAuthRoute,
  resolveAuthAccess,
  resolveAuthRedirectTarget,
} from "./auth.ts";
import type { SdkworkAuthController } from "./auth-controller.ts";
import {
  useSdkworkAuthControllerState,
} from "./auth-controller.ts";

export interface SdkworkAuthGateProps {
  authBasePath?: string;
  children: ReactNode;
  controller: SdkworkAuthController;
  fallback?: ReactNode;
  homePath?: string;
  protectedPrefixes?: readonly string[];
  renderAuthRoutes?: ReactNode;
}

export function SdkworkAuthGate({
  authBasePath = "/auth",
  children,
  controller,
  fallback = null,
  homePath = "/",
  protectedPrefixes = [],
  renderAuthRoutes,
}: SdkworkAuthGateProps) {
  const location = useLocation();
  const routes = useMemo(() => createAuthRouteCatalog(authBasePath), [authBasePath]);
  const authState = useSdkworkAuthControllerState(controller);
  const [bootstrapping, setBootstrapping] = useState(!authState.isBootstrapped);
  const onAuthRoute = isAuthRoute(routes, location.pathname);

  useEffect(() => {
    let cancelled = false;
    setBootstrapping(true);
    void controller.bootstrap().finally(() => {
      if (!cancelled) {
        setBootstrapping(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [controller, location.pathname, location.search]);

  const redirectTarget = resolveAuthRedirectTarget(
    new URLSearchParams(location.search).get("redirect"),
    homePath,
    authBasePath,
  );

  const decision = resolveAuthAccess({
    currentPath: location.pathname,
    expiresAt: authState.session?.expiresAt,
    homePath: redirectTarget,
    isAuthenticating:
      bootstrapping
      || authState.isBusy
      || authState.status === "authenticating"
      || !authState.isBootstrapped,
    protectedPrefixes: [...protectedPrefixes],
    routes,
    session: authState.session,
  });

  if (decision.allowed === false) {
    if (decision.reason === "authenticating") {
      return <>{fallback}</>;
    }
    if (decision.redirectTo) {
      return <Navigate to={decision.redirectTo} replace />;
    }
    return <>{fallback}</>;
  }

  if (onAuthRoute) {
    return <>{renderAuthRoutes ?? fallback}</>;
  }

  return <>{children}</>;
}

/** @deprecated Use `SdkworkAuthGate` */
export const AuthGate = SdkworkAuthGate;
