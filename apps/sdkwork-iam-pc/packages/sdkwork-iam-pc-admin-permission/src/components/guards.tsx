import { createContext, useContext, type ReactNode } from "react";

import type {
  SdkworkAuthorizationHint,
  SdkworkIamPermissionController,
} from "../types/permission-admin-types";

const PermissionControllerContext = createContext<SdkworkIamPermissionController | undefined>(
  undefined,
);

export interface SdkworkIamPermissionProviderProps {
  children: ReactNode;
  controller: SdkworkIamPermissionController;
}

export function SdkworkIamPermissionProvider({
  children,
  controller,
}: SdkworkIamPermissionProviderProps) {
  return (
    <PermissionControllerContext.Provider value={controller}>
      {children}
    </PermissionControllerContext.Provider>
  );
}

export function useSdkworkIamPermissionController(): SdkworkIamPermissionController {
  const controller = useContext(PermissionControllerContext);

  if (!controller) {
    throw new Error(
      "useSdkworkIamPermissionController must be used inside SdkworkIamPermissionProvider",
    );
  }

  return controller;
}

function resolveController(
  controller: SdkworkIamPermissionController | undefined,
): SdkworkIamPermissionController {
  const contextController = useContext(PermissionControllerContext);
  const resolved = controller ?? contextController;

  if (!resolved) {
    throw new Error(
      "IAM permission guard requires controller prop or SdkworkIamPermissionProvider",
    );
  }

  return resolved;
}

export interface RequirePermissionProps {
  children: ReactNode;
  controller?: SdkworkIamPermissionController;
  fallback?: ReactNode;
  hint: string | SdkworkAuthorizationHint;
}

export function RequirePermission({
  children,
  controller,
  fallback = null,
  hint,
}: RequirePermissionProps) {
  const resolved = resolveController(controller);

  if (!resolved.can(hint)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export interface RequireOrganizationMemberProps {
  children: ReactNode;
  controller?: SdkworkIamPermissionController;
  fallback?: ReactNode;
}

export function RequireOrganizationMember({
  children,
  controller,
  fallback = null,
}: RequireOrganizationMemberProps) {
  const resolved = resolveController(controller);

  if (!resolved.isOrganizationMember()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export interface RequireBackendAccessProps {
  children: ReactNode;
  controller?: SdkworkIamPermissionController;
  fallback?: ReactNode;
}

export function RequireBackendAccess({
  children,
  controller,
  fallback = null,
}: RequireBackendAccessProps) {
  const resolved = resolveController(controller);

  if (!resolved.canAccessBackend()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
