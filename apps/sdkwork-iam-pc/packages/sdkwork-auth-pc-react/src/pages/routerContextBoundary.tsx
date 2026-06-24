import type { ReactNode } from "react";
import {
  HashRouter,
  useInRouterContext,
} from "react-router-dom";

export type SdkworkAuthPageRouterContextMode = "auto" | "external";

interface SdkworkAuthPageRouterContextBoundaryProps {
  children: ReactNode;
  mode?: SdkworkAuthPageRouterContextMode;
}

function SdkworkAuthPageRouterContextBoundaryContent({
  children,
  mode = "auto",
}: SdkworkAuthPageRouterContextBoundaryProps) {
  const hasRouterContext = useInRouterContext();

  if (hasRouterContext || mode === "external") {
    return <>{children}</>;
  }

  // Page-level auth surfaces must be embeddable into apps that do not
  // provide a global router. Default to a self-hosted hash router so
  // integrators only need to render the page component.
  return <HashRouter>{children}</HashRouter>;
}

export function SdkworkAuthPageRouterContextBoundary(
  props: SdkworkAuthPageRouterContextBoundaryProps,
) {
  return <SdkworkAuthPageRouterContextBoundaryContent {...props} />;
}
