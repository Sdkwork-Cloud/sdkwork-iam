import { defaultIfBlank } from "@sdkwork/utils";

export interface ResolveUserCenterSurfaceInitialEntryOptions {
  fallbackEntry: string;
  location?: {
    hash?: string;
    pathname?: string;
    search?: string;
  } | null;
}

function resolveLocationSnapshot(
  location?: ResolveUserCenterSurfaceInitialEntryOptions["location"],
) {
  if (location !== undefined) {
    return location;
  }

  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location;
}

export function resolveUserCenterSurfaceInitialEntry({
  fallbackEntry,
  location,
}: ResolveUserCenterSurfaceInitialEntryOptions): string {
  const resolvedLocation = resolveLocationSnapshot(location);
  if (!resolvedLocation) {
    return fallbackEntry;
  }

  const pathname = defaultIfBlank(resolvedLocation.pathname, "");
  const search = resolvedLocation.search || "";
  const hash = resolvedLocation.hash || "";
  const currentEntry = `${pathname}${search}${hash}`.trim();

  return currentEntry || fallbackEntry;
}
