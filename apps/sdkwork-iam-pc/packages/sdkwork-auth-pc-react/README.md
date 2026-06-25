# @sdkwork/auth-pc-react

## Purpose

Shared authentication surface for login, registration, password recovery, OAuth callback, QR login, and upstream session-bridge login.

This package is the standard auth UI layer for appbase-based desktop apps. Host applications should mount it directly and customize through the exported root-package contracts instead of maintaining app-specific login pages.

## Placement

- Architecture: `pc-react`
- Domain: `iam`
- Capability: `auth`
- Status: `ready`

## Standard surface model

- `SdkworkAuthPage` is the default page-level auth entry.
- `SdkworkAuthOAuthCallbackPage` handles OAuth callback completion with the same visual standard.
- `SdkworkAuthPageShell` is the reusable shell abstraction aligned to the current `sdkwork-studio` baseline.
- `appearance` is the single customization contract. It supports:
  - `theme`: token-level theme overrides
  - `slots`: component replacement for shell surfaces
  - `slotProps`: class/style injection per shell surface
  - `...ClassName` and `...Style`: targeted visual overrides
- `slots` adds semantic page-level extension points for:
  - `HeaderSupplement`
  - `LoginActions`
  - `ModeFooter`
- `events` adds runtime hooks for:
  - `onModeChange`
  - `onLoginMethodChange`
  - `onQrStateChange`
- `resolveSdkworkAuthAppearance(...)` guarantees the same appearance contract can be passed to nested auth surfaces like QR panels, OAuth grids, and callback views.

## Main exports

- Root entry: `@sdkwork/auth-pc-react`

Key exports:

- `SdkworkAuthPage`
- `SdkworkAuthOAuthCallbackPage`
- `SdkworkAuthPageShell`
- `createSdkworkAuthController`
- `SdkworkAuthGate`
- `createSdkworkCanonicalAuthDefinition`
- `createSdkworkAuthAppbaseIntegration`
- `createSdkworkCanonicalAuthRouteCatalog`
- `createSdkworkCanonicalAuthRouteIntent`
- `createSdkworkCanonicalAuthWorkspaceManifest`
- `createSdkworkCanonicalAuthController`
- `createSdkworkCanonicalRuntimeAuthAuthorityService`
- `createSdkworkIamRuntimeAuthController`
- `createSdkworkIamRuntimeAuthService`
- `resolveSdkworkAuthRuntimeConfigFromMetadata`
- `createSdkworkAuthUserFromCanonicalIdentity`
- `assertSdkworkAuthSession`
- `createSdkworkSyntheticAuthSession` (compatibility helper; requires explicit dual tokens)
- `SdkworkQrLoginPanel`
- `SdkworkOAuthProviderGrid`
- `SdkworkAccountPasswordLoginForm`
- `SdkworkEmailCodeLoginForm`
- `SdkworkPhoneCodeLoginForm`
- `SdkworkSessionBridgeLoginForm`
- `SdkworkRegisterFlow`
- `SdkworkForgotPasswordFlow`
- `createSdkworkAuthAppearancePreset`
- `createSdkworkAuthThemeAppearance`
- `mergeSdkworkAuthAppearanceConfigs`
- `resolveSdkworkAuthAppearance`

## Fast integration

```tsx
import { SdkworkAuthGate, SdkworkAuthPage, type SdkworkAuthController } from "@sdkwork/auth-pc-react";

export function AppRoutes({ controller }: { controller: SdkworkAuthController }) {
  return (
    <SdkworkAuthGate
      authBasePath="/auth"
      controller={controller}
      homePath="/"
      protectedPrefixes={["/workspace"]}
      renderAuthRoutes={<SdkworkAuthPage controller={controller} basePath="/auth" />}
    >
      <ProductShell />
    </SdkworkAuthGate>
  );
}
```

For a login route only:

```tsx
import { SdkworkAuthPage } from "@sdkwork/auth-pc-react";

export function LoginRoute() {
  return (
    <SdkworkAuthPage
      basePath="/auth"
      homePath="/"
    />
  );
}
```

## QR login and registration

`SdkworkAuthPage` uses the QR rail only for login and registration screens.
Password recovery never creates login/register QR sessions. QR session creation
goes through the standard app SDK IAM OAuth device authorization resource
`oauth.deviceAuthorizations.create` with only `purpose: "login" | "register"`.
The IAM OAuth device authorization surface owns default entry selection for
official-account, mini-app, and browser fallback QR URLs.

The QR content is the platform session content:

- When a default platform account and entry are configured, `qrContent.content`
  is that account's standard entry URL with `session_key` and `purpose` attached.
- When no default account is configured, `qrContent.content` is a browser URL
  with `session_key` and `purpose`. Any scanner app that can open URLs can use it.

Scanner browsers complete the QR session through the same auth page. The page
recognizes `/auth/qr/{sessionKey}` and fallback URLs such as
`/auth/login?session_key={sessionKey}&purpose=login` or
`/auth/login?session_key={sessionKey}&purpose=register`. Login QR entries expose
only password completion; OAuth, verification-code login, and session-bridge
login do not complete QR sessions. Registration QR entries use the register form
and complete the QR session as a bind/register password flow.

Every QR completion must have a recorded scan first. Browser fallback entries
call `oauth.deviceAuthorizations.scans.create` before password completion.
Direct password completion without a scan is rejected so scanner source, entry,
event, and login log data are always present.

Desktop QR polling uses `oauth.deviceAuthorizations.retrieve`. If the IAM
runtime returns `completed` without token data, the controller runs normal
session bootstrap; token issuing and storage stay owned by IAM/runtime rather
than the QR device authorization record.

## Login and registration verification policy

`SdkworkAuthPage` supports an explicit `verificationPolicy` in `runtimeConfig`.
By default, registration does not require an email or phone verification code,
and verification-code login methods are not shown. Password login remains the
default login method.

```tsx
<SdkworkAuthPage
  runtimeConfig={{
    verificationPolicy: {
      emailCodeLoginEnabled: true,
      phoneCodeLoginEnabled: false,
      emailRegistrationVerificationRequired: true,
      phoneRegistrationVerificationRequired: false,
    },
  }}
/>
```

Explicit `loginMethods` and `registerMethods` still take priority. Use them when
the host app needs a fixed method list. Use `verificationPolicy` when the app
wants defaults that can be changed by deployment configuration.

## Login context selection

When appbase returns `LOGIN_CONTEXT_SELECTION`, auth surfaces must treat the
response as a login continuation rather than an authenticated session.

- Personal platform login: `loginScope = "TENANT"` and `organizationId = "0"`.
- Organization login: `loginScope = "ORGANIZATION"` and a non-zero organization id from appbase.
- Organization id `"0"` is a platform sentinel only. It must not appear in organization choice lists and must not be submitted with `loginScope = "ORGANIZATION"`.
- `SdkworkAuthPage` and `SdkworkOrganizationSelectionDialog` handle this flow through `selectPersonalLogin` and `selectOrganization`.
- Shared helpers live in `@sdkwork/iam-contracts` (`buildPersonalLoginContextSelectionBody`, `normalizeIamLoginContextSelectionChallenge`, etc.).

The same contract applies to `@sdkwork/iam-h5-auth` and `sdkwork_iam_flutter_mobile_auth`.

The same policy can be enabled from `.env`:

```env
VITE_SDKWORK_AUTH_EMAIL_CODE_LOGIN_ENABLED=true
VITE_SDKWORK_AUTH_PHONE_CODE_LOGIN_ENABLED=false
VITE_SDKWORK_AUTH_EMAIL_REGISTER_VERIFICATION_REQUIRED=true
VITE_SDKWORK_AUTH_PHONE_REGISTER_VERIFICATION_REQUIRED=false
```

The package also accepts the shorter legacy prefixes:

```env
VITE_AUTH_EMAIL_CODE_LOGIN_ENABLED=true
VITE_AUTH_PHONE_CODE_LOGIN_ENABLED=true
VITE_AUTH_EMAIL_REGISTER_VERIFICATION_REQUIRED=true
VITE_AUTH_PHONE_REGISTER_VERIFICATION_REQUIRED=true
```

## Canonical authority integration

When an app already owns a server/client auth authority that follows the unified user-center request model, do not rebuild a local page adapter. Use the root-package authority bridge and keep the app layer thin.

```tsx
import {
  createSdkworkCanonicalAuthController,
  resolveSdkworkAuthRuntimeConfigFromMetadata,
} from "@sdkwork/auth-pc-react";

const runtimeConfig = resolveSdkworkAuthRuntimeConfigFromMetadata(authConfig);

const controller = createSdkworkCanonicalAuthController({
  authConfig,
  locale: "zh-CN",
  service: authService,
  toUser(user) {
    return {
      displayName: user.name || user.email,
      email: user.email,
      firstName: user.name || user.email,
      initials: "SU",
      lastName: "",
    };
  },
});
```

Canonical auth authorities must return a real `SdkworkAuthSession` for login,
registration, email/phone code login, session bridge, OAuth, refresh, and
current-session update flows. A user/profile object, user-center `sessionId`,
or local cache entry is not an SDKWork authenticated session and must not be
converted into `authToken` or `accessToken`. The compatibility
`createSdkworkSyntheticAuthSession(...)` helper now requires explicit
`accessToken` and `authToken`; it is not allowed to derive tokens from user ids,
emails, usernames, or session keys.

## Runtime-backed authority integration

When an application needs the same auth UI and controller standard and already has a standard `@sdkwork/iam-runtime`, use `createSdkworkIamRuntimeAuthController(...)`. The app layer only injects `getRuntime`, so SaaS Java backends and local Rust backends can switch by changing the runtime SDK clients and environment configuration.

```tsx
import {
  SdkworkAuthPage,
  createSdkworkIamRuntimeAuthController,
} from "@sdkwork/auth-pc-react";
import { getAppIamRuntime } from "./runtime/iam";

const controller = createSdkworkIamRuntimeAuthController({
  getRuntime: getAppIamRuntime,
});

export function LoginRoute() {
  return <SdkworkAuthPage controller={controller} basePath="/auth" />;
}
```

The controller maps password login, email/phone code login, registration, verification code, password reset, OAuth, session bridge, current session bootstrap, and logout through the standard IAM runtime service. Token persistence, AppContext, and ShardingContext stay owned by `@sdkwork/iam-runtime`.

Session lifecycle rules:

- `createSdkworkAuthService(...)` uses `commitSession(session, options?)` as the only session write hook. Do not pass or implement `persistSession`.
- New session flows such as password login, code login, registration, OAuth, QR password completion, and session bridge call `commitSession(session)` and must replace the stored token set. They must not inherit an old `refreshToken` when appbase does not return one.
- Current-session bootstrap, current-session update, and refresh continuation call `commitSession(session, { preserveRefreshToken: true })`. The session passed to a custom committer is already the normalized committed session, so a missing appbase `refreshToken` is filled from the stored session only for these continuation flows.
- `commitSession` may return the committed normalized session. If it returns `void`, the auth service reports the standard committed session it computed before calling the committer.
- `commitSession` is awaited before service and controller methods resolve. UI state must not report an authenticated session before token persistence and context propagation have completed.
- `signOut()` calls `auth.sessions.current.delete()` and clears local token/context state in a `finally` path. The controller also clears in-memory UI session state in `finally`, so remote logout failure cannot leave the renderer authenticated.
- `createSdkworkIamRuntimeAuthController(...)` delegates session lifecycle to `@sdkwork/iam-runtime`; host apps must not maintain a second token store or refresh flow beside the runtime.

When an application needs the same auth UI and controller standard but its actual session lifecycle is backed by a non-IAM runtime user-center bridge, use `createSdkworkCanonicalRuntimeAuthAuthorityService(...)` and keep the app layer limited to:

- local generated app-api calls for login, register, verify-code, and password recovery
- runtime bridge calls for session bootstrap, current-profile hydration, and logout
- app-local user/profile mapping and session-token persistence

That keeps cache policy, local-credential gating, session invalidation, and current-user hydration in the shared auth package instead of duplicating them per app.

## Appbase metadata integration

When an appbase PC app needs auth routes, capability manifest metadata, and package metadata together, use `createSdkworkAuthAppbaseIntegration(...)` instead of importing `@sdkwork/appbase-pc-react` catalog helpers and auth package metadata separately in the product app.

```ts
import { createSdkworkAuthAppbaseIntegration } from "@sdkwork/auth-pc-react";

const authIntegration = createSdkworkAuthAppbaseIntegration({
  app: {
    id: "sdkwork-chat-pc",
    title: "SDKWork Chat PC",
  },
  basePath: "/auth",
  extraPackageNames: ["@sdkwork/example-product-pc-react"],
});

export const authManifest = authIntegration.manifest;
export const authRoutes = authIntegration.routes;
export const authAppbaseMeta = authIntegration.appbaseMeta;
```

This keeps product packages limited to app identity, route base path, and product-owned extra capability packages. Appbase owns auth route catalogs, package metadata, preset manifest composition, and default auth package inclusion.

## Thin app-wrapper integration

When an application needs its own package identity such as `@sdkwork/example-auth` but should not reimplement auth route catalogs, route intents, or workspace manifests, build the app wrapper from the root package:

```ts
import {
  createSdkworkCanonicalAuthRouteCatalog,
  createSdkworkCanonicalAuthRouteIntent,
  createSdkworkCanonicalAuthWorkspaceManifest,
} from "@sdkwork/auth-pc-react";

const routes = createSdkworkCanonicalAuthRouteCatalog({
  basePath: "/auth",
  sourcePackageName: "@sdkwork/auth-pc-react",
});

const manifest = createSdkworkCanonicalAuthWorkspaceManifest({
  architecture: "example-auth",
  bridgePackageName: "@sdkwork/example-auth",
  host: "server",
  id: "sdkwork-example-auth",
  packageNames: ["@sdkwork/example-auth"],
  sourcePackageName: "@sdkwork/auth-pc-react",
  title: "Auth",
});

const intent = createSdkworkCanonicalAuthRouteIntent("login", {
  basePath: "/auth",
  sourcePackageName: "@sdkwork/auth-pc-react",
});
```

This keeps app packages limited to constants, route base paths, and branding metadata while the standard auth contract stays centralized in `sdkwork-iam`.

If the app wants one reusable bound definition instead of repeatedly passing the same base path, package name, bridge package, and manifest defaults, use `createSdkworkCanonicalAuthDefinition(...)` and call `definition.createRouteCatalog(...)`, `definition.createWorkspaceManifest(...)`, and `definition.createRouteIntent(...)` from the app wrapper.

## Theme configuration

```tsx
import {
  SdkworkAuthPage,
  createSdkworkAuthAppearancePreset,
  mergeSdkworkAuthAppearanceConfigs,
} from "@sdkwork/auth-pc-react";

const appearance = mergeSdkworkAuthAppearanceConfigs(
  createSdkworkAuthAppearancePreset("sdkwork"),
  {
    theme: {
      pageBackgroundColor: "#020617",
      shellBackgroundColor: "rgba(2,6,23,0.88)",
      shellBorderColor: "rgba(148,163,184,0.14)",
      badgeTextColor: "#bfdbfe",
    },
  },
);

export function LoginRoute() {
  return <SdkworkAuthPage appearance={appearance} />;
}
```

## Semantic extension points

```tsx
import {
  SdkworkAuthPage,
  type SdkworkAuthModeFooterSlotProps,
} from "@sdkwork/auth-pc-react";

function LegalFooter({ actionLabel, helperText, navigateToLogin }: SdkworkAuthModeFooterSlotProps) {
  return (
    <div className="mt-8 space-y-4 text-center text-sm text-zinc-500">
      {helperText ? (
        <div>
          {helperText}{" "}
          <button className="font-bold text-primary-600" onClick={navigateToLogin} type="button">
            {actionLabel}
          </button>
        </div>
      ) : null}
      <p>By continuing you agree to the current workspace access policy.</p>
    </div>
  );
}

export function LoginRoute() {
  return (
    <SdkworkAuthPage
      events={{
        onLoginMethodChange(method) {
          console.info("auth-method", method);
        },
      }}
      slots={{
        ModeFooter: LegalFooter,
      }}
    />
  );
}
```

## Slot-based shell customization

```tsx
import {
  SdkworkAuthPage,
  type SdkworkAuthSurfaceSlots,
} from "@sdkwork/auth-pc-react";

const slots: SdkworkAuthSurfaceSlots = {
  Header({ badge, className, description, style, title }) {
    return (
      <header className={className} style={style}>
        <div className="space-y-3">
          {badge}
          {title}
          {description}
        </div>
      </header>
    );
  },
};

export function LoginRoute() {
  return (
    <SdkworkAuthPage
      appearance={{
        slots,
        slotProps: {
          body: { className: "mt-10" },
        },
      }}
    />
  );
}
```

## Integration rule

- Host apps should not fork auth page structure for branding.
- Prefer root-package `appearance`, `slots`, and `events` for all visual and composition changes.
- Keep runtime behavior in the controller and service layer; keep product styling in `appearance`.

## SDKWork Documentation Contract

Domain: iam
Capability: auth
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

- `pnpm --filter @sdkwork/auth-pc-react typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
