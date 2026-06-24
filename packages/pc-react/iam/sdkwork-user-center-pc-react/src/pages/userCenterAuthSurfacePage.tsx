import { useMemo } from "react";
import { MemoryRouter } from "react-router-dom";
import {
  SdkworkAuthPage,
  type SdkworkAuthAppearanceConfig,
  type SdkworkAuthPageProps,
} from "@sdkwork/auth-pc-react";
import { resolveUserCenterSurfaceAuthAppearance } from "../domain/userCenterAppearance.ts";
import type { UserCenterSurfaceAppearanceInput } from "../types/userCenterSurfaceTypes.ts";

export interface SdkworkUserCenterAuthSurfaceRouterConfig {
  initialEntries?: string[];
  initialIndex?: number;
  kind?: "memory" | "none";
}

export interface SdkworkUserCenterAuthSurfacePageProps
  extends Omit<SdkworkAuthPageProps, "appearance"> {
  appearance?: SdkworkAuthAppearanceConfig;
  router?: SdkworkUserCenterAuthSurfaceRouterConfig;
  surfaceAppearance?: UserCenterSurfaceAppearanceInput;
}

export function SdkworkUserCenterAuthSurfacePage({
  appearance,
  router,
  surfaceAppearance,
  ...props
}: SdkworkUserCenterAuthSurfacePageProps) {
  const resolvedAppearance = useMemo(
    () => resolveUserCenterSurfaceAuthAppearance(appearance, surfaceAppearance),
    [appearance, surfaceAppearance],
  );
  const content = (
    <SdkworkAuthPage
      {...props}
      appearance={resolvedAppearance}
    />
  );

  if (router?.kind === "memory") {
    return (
      <MemoryRouter
        initialEntries={router.initialEntries}
        initialIndex={router.initialIndex}
      >
        {content}
      </MemoryRouter>
    );
  }

  return content;
}
