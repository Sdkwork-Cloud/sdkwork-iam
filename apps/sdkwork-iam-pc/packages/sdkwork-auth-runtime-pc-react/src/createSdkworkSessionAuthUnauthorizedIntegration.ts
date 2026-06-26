import {
  attachSdkworkSdkSessionAuthBoundary,
  attachSdkworkSdkSessionAuthBoundaries,
  type SdkworkSdkClientWithHttp,
} from "./attachSdkworkSdkSessionAuthBoundary.ts";
import {
  handleSdkworkSessionAuthUnauthorizedError,
  resetSdkworkSessionAuthRedirectState,
  type SdkworkSessionAuthUnauthorizedHandlerOptions,
} from "./handleSdkworkSessionAuthUnauthorizedError.ts";
import { isSdkworkSdkSessionAuthError } from "./sdkSessionAuthError.ts";
import {
  createSdkworkSessionAuthEnvReader,
  resolveSdkworkSessionAuthUnauthorizedMode,
} from "./sessionAuthUnauthorizedEnv.ts";

export type CreateSdkworkSessionAuthUnauthorizedIntegrationOptions =
  SdkworkSessionAuthUnauthorizedHandlerOptions;

export interface SdkworkSessionAuthUnauthorizedIntegration {
  attachSdkClientBoundary<TClient extends SdkworkSdkClientWithHttp>(client: TClient): TClient;
  attachSdkClientBoundaries<TClient extends SdkworkSdkClientWithHttp>(
    clients: readonly TClient[],
  ): TClient[];
  handleSessionAuthError(error: unknown): boolean;
  isSessionAuthError(error: unknown): boolean;
  resetRedirectState(): void;
  resolveMode(): ReturnType<typeof resolveSdkworkSessionAuthUnauthorizedMode>;
}

export function createSdkworkSessionAuthUnauthorizedIntegration(
  options: CreateSdkworkSessionAuthUnauthorizedIntegrationOptions = {},
): SdkworkSessionAuthUnauthorizedIntegration {
  const readEnv = createSdkworkSessionAuthEnvReader(options.readEnv);

  return {
    attachSdkClientBoundary: <TClient extends SdkworkSdkClientWithHttp>(client: TClient) =>
      attachSdkworkSdkSessionAuthBoundary(client, options),
    attachSdkClientBoundaries: <TClient extends SdkworkSdkClientWithHttp>(
      clients: readonly TClient[],
    ) => attachSdkworkSdkSessionAuthBoundaries(clients, options),
    handleSessionAuthError: (error) => handleSdkworkSessionAuthUnauthorizedError(error, options),
    isSessionAuthError: isSdkworkSdkSessionAuthError,
    resetRedirectState: resetSdkworkSessionAuthRedirectState,
    resolveMode: () => resolveSdkworkSessionAuthUnauthorizedMode({
      hostname: typeof window === "undefined" ? undefined : window.location.hostname,
      readEnv,
    }),
  };
}
