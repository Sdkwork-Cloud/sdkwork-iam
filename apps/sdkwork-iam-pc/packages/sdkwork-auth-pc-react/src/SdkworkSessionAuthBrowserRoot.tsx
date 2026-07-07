import type { ReactNode } from "react";

import {
  SdkworkSessionAuthUnauthorizedProvider,
  type SdkworkSessionAuthUnauthorizedProviderProps,
} from "./SessionAuthUnauthorizedProvider.tsx";

export type SdkworkSessionAuthBrowserRootProps = SdkworkSessionAuthUnauthorizedProviderProps;

/**
 * Standard browser root wrapper for SDK session-auth modal handling.
 * Mount inside `BrowserRouter` so login navigation can preserve return paths.
 * Pass `controller` or `getRuntime` so unauthorized responses open the full
 * auth modal instead of redirecting away from the current page.
 */
export function SdkworkSessionAuthBrowserRoot({
  children,
  ...providerProps
}: SdkworkSessionAuthBrowserRootProps) {
  return (
    <SdkworkSessionAuthUnauthorizedProvider {...providerProps}>
      {children}
    </SdkworkSessionAuthUnauthorizedProvider>
  );
}
