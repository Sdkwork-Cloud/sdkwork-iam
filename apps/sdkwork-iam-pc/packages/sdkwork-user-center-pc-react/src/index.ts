export const userCenterPackageMeta = {
  package: "@sdkwork/user-center-pc-react",
  architecture: "pc-react",
  domain: "iam",
  capability: "user-center",
  status: "ready",
} as const;

export type UserCenterPackageMeta = typeof userCenterPackageMeta;

export * from "./domain/userCenterAppearance.ts";
export * from "./domain/userCenterSurfaceRouting.ts";
export * from "./pages/canonicalSurfacePages.tsx";
export * from "./pages/userCenterAuthSurfacePage.tsx";
export * from "./pages/userCenterProfileSurfacePage.tsx";
export type {
  UserCenterSurfaceAppearanceBundle,
  UserCenterSurfaceAppearanceInput,
  UserCenterSurfaceAppearancePreset,
  UserCenterSurfaceThemeAppearanceBundle,
  UserCenterSurfaceThemeTokens,
} from "./types/userCenterSurfaceTypes.ts";
