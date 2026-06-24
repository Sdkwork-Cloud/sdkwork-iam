# @sdkwork/user-center-pc-react

Shared UI surface assembly for the SDKWork user-center standard.

This package is intentionally the UI-only root package for desktop applications. It provides governed appearance presets, shared theme-token mapping, and page-level wrappers that compose `@sdkwork/auth-pc-react` and `@sdkwork/user-pc-react` into one reusable identity surface standard.

If you need server runtime contracts, local/private deployment authority planning, app-api bridge contracts, token/session runtime logic, deployment variables, validation plugins, or canonical route standards, use `@sdkwork/user-center-core-pc-react`.

## Responsibilities

This package owns only four concerns:

- shared auth + user-center appearance presets and theme-token mapping
- page-level auth surface assembly
- page-level user-center surface assembly
- lightweight router-aware helpers for auth entry resolution

It does not own:

- bridge config normalization
- local API route catalogs
- plugin definitions
- server authority contracts
- token/session runtime clients
- validation or handshake contracts
- Rust/native runtime logic

Those capabilities belong to `@sdkwork/user-center-core-pc-react`.

## Root Export Rule

Import this package only from its root export:

```ts
import {
  SdkworkUserCenterAuthSurfacePage,
  SdkworkUserCenterProfileSurfacePage,
  createUserCenterSurfaceAppearanceBundle,
  resolveUserCenterSurfaceInitialEntry,
} from "@sdkwork/user-center-pc-react";
```

Do not deep-import internal files from this package.

## Surface Assembly

Use `createUserCenterSurfaceAppearanceBundle` when an application wants one governed visual contract for both auth and user-center pages.

```ts
import { createUserCenterSurfaceAppearanceBundle } from "@sdkwork/user-center-pc-react";

const surfaceAppearance = createUserCenterSurfaceAppearanceBundle({
  preset: "sdkwork",
  theme: {
    shellShadow: "0 32px 96px rgba(2, 6, 23, 0.46)",
    badgeTextColor: "#bfdbfe",
  },
});

const authAppearance = surfaceAppearance.auth;
const userAppearance = surfaceAppearance.user;
```

Use `SdkworkUserCenterAuthSurfacePage` when a host application needs a shared login/register/forgot-password surface but still wants to inject its own controller, locale, runtimeConfig, and router mode.

```tsx
import {
  SdkworkUserCenterAuthSurfacePage,
  resolveUserCenterSurfaceInitialEntry,
} from "@sdkwork/user-center-pc-react";

export function AppAuthPage() {
  return (
    <SdkworkUserCenterAuthSurfacePage
      basePath="/login"
      controller={controller}
      locale="zh-CN"
      router={{
        kind: "memory",
        initialEntries: [
          resolveUserCenterSurfaceInitialEntry({
            fallbackEntry: "/login/login",
          }),
        ],
      }}
      runtimeConfig={runtimeConfig}
    />
  );
}
```

Use `SdkworkUserCenterProfileSurfacePage` when a host application needs the shared account/profile surface and wants to control authenticated fallback behavior itself.

```tsx
import { SdkworkUserCenterProfileSurfacePage } from "@sdkwork/user-center-pc-react";

export function AppUserCenterPage() {
  return (
    <SdkworkUserCenterProfileSurfacePage
      controller={controller}
      isAuthenticated={Boolean(currentUser)}
      locale="zh-CN"
      unauthenticatedState={{
        title: "Please sign in first",
        description: "The shared user-center surface becomes available after the unified auth flow succeeds.",
      }}
    />
  );
}
```

`SdkworkUserCenterProfileSurfacePage` now provides a standard unauthenticated state out of the box. Host apps can:

- do nothing and use the governed default empty state
- pass `unauthenticatedState` to customize only title/description/action
- pass `unauthenticatedFallback` only when a full custom replacement is unavoidable
- use `onAuthenticationRequired` to trigger analytics, route nudges, or guarded shell behavior without forking the page

## Canonical Page Factories

Use the canonical page factories when an app should stay as a thin adapter and let `sdkwork-appbase` own the actual auth and user-center page composition.

`createSdkworkCanonicalAuthSurfacePage(...)` is for login, register, forgot-password, QR login, and OAuth callback flows:

```tsx
import {
  createSdkworkCanonicalAuthSurfacePage,
  type SdkworkCanonicalAuthSurfacePageProps,
} from "@sdkwork/user-center-pc-react";
import { useTranslation } from "react-i18next";
import {
  createAppAuthController,
  resolveAppAuthRuntimeConfig,
} from "../auth-surface.ts";
import {
  APP_USER_CENTER_AUTH_BASE_PATH,
  useAppAuth,
  useAppServices,
} from "../app-runtime.ts";

export type AuthPageProps = SdkworkCanonicalAuthSurfacePageProps;

export const AuthPage = createSdkworkCanonicalAuthSurfacePage({
  defaultBasePath: APP_USER_CENTER_AUTH_BASE_PATH,
  defaultHomePath: "/",
  defaultSurfaceAppearance: {
    preset: "sdkwork",
  },
  resolveRuntimeConfig: resolveAppAuthRuntimeConfig,
  useAuthConfig() {
    return useAppAuth().authConfig;
  },
  useLocale() {
    return useTranslation().i18n.language;
  },
  useService() {
    return useAppServices().authService;
  },
  createController({ authConfig, locale, messages, service }) {
    return createAppAuthController({
      authConfig,
      locale,
      messages,
      service,
    });
  },
});
```

The auth factory can also carry shared defaults so app adapters stay thin:

- `defaultAppearance`: auth-surface appearance defaults
- `defaultMessages`: shared auth copy overrides
- `defaultRuntimeConfig`: app-level auth defaults before per-page overrides
- `defaultSlots`: shared slot implementations
- `defaultEvents`: shared analytics or telemetry hooks
- `defaultSurfaceAppearance`: governed auth+user preset/theme defaults

`createSdkworkCanonicalUserCenterSurfacePage(...)` is for profile and preferences entry pages:

```tsx
import {
  createSdkworkCanonicalUserCenterSurfacePage,
  type SdkworkCanonicalUserCenterSurfacePageProps,
} from "@sdkwork/user-center-pc-react";
import { useTranslation } from "react-i18next";
import { useAppAuth } from "../app-runtime.ts";
import { createAppUserCenterController } from "../user-surface.ts";

export type UserCenterPageProps = SdkworkCanonicalUserCenterSurfacePageProps;

export const UserCenterPage = createSdkworkCanonicalUserCenterSurfacePage({
  defaultSurfaceAppearance: {
    preset: "sdkwork",
  },
  defaultUnauthenticatedState: {
    title: "Sign in to open the user center",
    description:
      "Sign in through the unified sdkwork-appbase authentication workflow to access your shared profile and preferences.",
  },
  useLocale() {
    return useTranslation().i18n.language;
  },
  useUser() {
    return useAppAuth().user;
  },
  createController({ locale, messages, user }) {
    return createAppUserCenterController({
      locale,
      messages,
      user,
    });
  },
});
```

The user-center factory supports the same thin-adapter pattern with:

- `defaultAppearance`
- `defaultMessages`
- `defaultSurfaceAppearance`
- `defaultUnauthenticatedState`

This is the preferred integration model for new apps:

- shared UI, visual system, slots, events, and theme tokens stay in `sdkwork-appbase`
- app packages keep only route/base-path choices, service injection, and app-specific identity mapping
- server, desktop, and browser deployments can switch between local/private identity and upstream unified identity without forking the page layer

## Integration Boundary

The intended layering is:

- `@sdkwork/user-center-core-pc-react`: canonical user-center standard, local/private deployment model, app-api/external integration model, deployment/env contracts, token/session/validation/server contracts
- `@sdkwork/user-center-pc-react`: reusable UI assembly and governed appearance for auth + user-center pages
- thin app adapters: inject app-specific controller logic and route/base-path choices without rebuilding the shared surface or restyling fallback states locally

This keeps applications thin and keeps the user-center standard centralized in `sdkwork-appbase`.

## SDKWork Documentation Contract

Domain: iam
Capability: user-center
Package type: react-package
Status: ready

### Public API

Public exports are declared in `specs/component.spec.json` under `contracts.publicExports`.

### Required SDK Surface

- None declared in `specs/component.spec.json`.

### Configuration

Configuration keys and runtime entrypoints are declared in `specs/component.spec.json`.

### SaaS/Private/Local Behavior

This module follows the canonical standards linked from `specs/component.spec.json`, including deployment and runtime configuration rules where applicable.

### Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this module.

### Extension Points

Extension points are limited to declared public exports, runtime entrypoints, SDK clients, events, and config keys.

### Verification

- `pnpm --filter @sdkwork/user-center-pc-react typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
