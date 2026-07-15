import type { SdkworkSessionAuthUnauthorizedHandlerOptions } from "./handleSdkworkSessionAuthUnauthorizedError.ts";
import { handleSdkworkSessionAuthUnauthorizedError } from "./handleSdkworkSessionAuthUnauthorizedError.ts";

export const SDKWORK_SDK_SESSION_AUTH_BOUNDARY = Symbol.for(
  "sdkwork.sdk.sessionAuthBoundary",
);

export interface SdkworkSdkClientWithHttp {
  http?: SdkworkSdkHttpRequestBoundary;
}

export interface SdkworkSdkHttpRequestBoundary {
  request<TResponse>(path: string, options?: unknown): Promise<TResponse>;
  streamJson?<TResponse>(
    path: string,
    options?: unknown,
  ): AsyncIterable<TResponse>;
  [SDKWORK_SDK_SESSION_AUTH_BOUNDARY]?: boolean;
}

interface SdkworkSdkRequestAuthOptions {
  credentialEntryBootstrap?: boolean;
  skipAuth?: boolean;
}

function shouldHandleSessionAuthUnauthorized(options: unknown): boolean {
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    return true;
  }

  const authOptions = options as SdkworkSdkRequestAuthOptions;
  return authOptions.credentialEntryBootstrap !== true && authOptions.skipAuth !== true;
}

export function attachSdkworkSdkSessionAuthBoundary<TClient extends SdkworkSdkClientWithHttp>(
  client: TClient,
  handlerOptions: SdkworkSessionAuthUnauthorizedHandlerOptions = {},
): TClient {
  const http = client.http as SdkworkSdkHttpRequestBoundary | undefined;
  if (!http || http[SDKWORK_SDK_SESSION_AUTH_BOUNDARY] || typeof http.request !== "function") {
    return client;
  }

  const handleError = (error: unknown) =>
    handleSdkworkSessionAuthUnauthorizedError(error, handlerOptions);

  const originalRequest = http.request.bind(http) as SdkworkSdkHttpRequestBoundary["request"];
  http.request = async <TResponse>(path: string, options?: unknown): Promise<TResponse> => {
    try {
      return await originalRequest<TResponse>(path, options);
    } catch (error) {
      if (shouldHandleSessionAuthUnauthorized(options)) {
        handleError(error);
      }
      throw error;
    }
  };

  if (typeof http.streamJson === "function") {
    const originalStreamJson = http.streamJson.bind(http) as NonNullable<
      SdkworkSdkHttpRequestBoundary["streamJson"]
    >;
    http.streamJson = async function* <TResponse>(
      path: string,
      options?: unknown,
    ): AsyncIterable<TResponse> {
      try {
        yield* originalStreamJson<TResponse>(path, options);
      } catch (error) {
        if (shouldHandleSessionAuthUnauthorized(options)) {
          handleError(error);
        }
        throw error;
      }
    };
  }

  Object.defineProperty(http, SDKWORK_SDK_SESSION_AUTH_BOUNDARY, {
    configurable: false,
    enumerable: false,
    value: true,
  });
  return client;
}

export function attachSdkworkSdkSessionAuthBoundaries<TClient extends SdkworkSdkClientWithHttp>(
  clients: readonly TClient[],
  handlerOptions: SdkworkSessionAuthUnauthorizedHandlerOptions = {},
): TClient[] {
  return clients.map((client) =>
    attachSdkworkSdkSessionAuthBoundary(client, handlerOptions),
  );
}
