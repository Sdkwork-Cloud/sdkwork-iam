import type {
  NavigateFunction,
} from "react-router-dom";

export interface SdkworkAuthPageLocation {
  hash: string;
  pathname: string;
  search: string;
}

export interface SdkworkAuthPageNavigateOptions {
  replace?: boolean;
}

export interface SdkworkAuthPageNavigate {
  (to: string, options?: SdkworkAuthPageNavigateOptions): void;
}

export interface SdkworkAuthPageRouting {
  location: SdkworkAuthPageLocation;
  navigate: SdkworkAuthPageNavigate;
  params: Readonly<Record<string, string | undefined>>;
  searchParams: URLSearchParams;
}

export function createSdkworkAuthPageRouting({
  location,
  navigate,
  params = {},
  search = "",
}: {
  location: Pick<SdkworkAuthPageLocation, "pathname"> & Partial<SdkworkAuthPageLocation>;
  navigate: SdkworkAuthPageNavigate | NavigateFunction;
  params?: Readonly<Record<string, string | undefined>>;
  search?: string;
}): SdkworkAuthPageRouting {
  return {
    location: {
      hash: location.hash ?? "",
      pathname: location.pathname,
      search: location.search ?? search,
    },
    navigate: (to, options) => {
      navigate(to as never, options as never);
    },
    params,
    searchParams: new URLSearchParams(location.search ?? search),
  };
}

export function createSdkworkAuthPageRoutingNavigate(
  setLocation: (nextLocation: SdkworkAuthPageLocation) => void,
): SdkworkAuthPageNavigate {
  return (to, options) => {
    const target = typeof to === "string" ? to : `${to}`;
    const url = new URL(target, "http://sdkwork.local");
    const nextLocation = {
      hash: url.hash,
      pathname: url.pathname,
      search: url.search,
    };

    setLocation(nextLocation);
    void options;
  };
}
