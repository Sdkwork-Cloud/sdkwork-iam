import { describe, expect, it } from "vitest";

import {
  attachSdkworkSdkSessionAuthBoundary,
  type SdkworkSdkClientWithHttp,
  handleSdkworkSessionAuthUnauthorizedError,
  isSdkworkSdkSessionAuthError,
  resolveSdkworkSessionAuthUnauthorizedMode,
} from "../src/index.ts";

describe("session auth unauthorized integration", () => {
  it("detects canonical SDK session auth errors", () => {
    expect(isSdkworkSdkSessionAuthError({
      code: "4010",
      msg: "app session token has expired",
    })).toBe(true);
    expect(isSdkworkSdkSessionAuthError({
      httpStatus: 401,
      message: "Authentication failed",
    })).toBe(true);
  });

  it("resolves modal mode on localhost by default", () => {
    expect(resolveSdkworkSessionAuthUnauthorizedMode({
      hostname: "127.0.0.1",
      readEnv: () => undefined,
    })).toBe("modal");
  });

  it("honors explicit redirect mode", () => {
    expect(resolveSdkworkSessionAuthUnauthorizedMode({
      hostname: "127.0.0.1",
      readEnv: (name) =>
        name === "VITE_SDKWORK_SESSION_AUTH_UNAUTHORIZED_MODE" ? "redirect" : undefined,
    })).toBe("redirect");
  });

  it("handles debug mode without clearing session", () => {
    let cleared = false;
    const handled = handleSdkworkSessionAuthUnauthorizedError(
      { code: "4010", msg: "app session token has expired" },
      {
        clearSession: () => {
          cleared = true;
        },
        readEnv: (name) =>
          name === "VITE_SDKWORK_SESSION_AUTH_UNAUTHORIZED_MODE" ? "debug" : undefined,
      },
    );

    expect(handled).toBe(true);
    expect(cleared).toBe(false);
  });

  it("does not clear an authenticated session for credential-entry or anonymous requests", async () => {
    let clearCalls = 0;
    const client: SdkworkSdkClientWithHttp = {
      http: {
        request: async <TResponse>(_path: string, _options?: unknown): Promise<TResponse> =>
          Promise.reject({ httpStatus: 401 }),
      },
    };

    attachSdkworkSdkSessionAuthBoundary(client, {
      clearSession: () => {
        clearCalls += 1;
      },
      readEnv: (name) =>
        name === "VITE_SDKWORK_SESSION_AUTH_UNAUTHORIZED_MODE" ? "modal" : undefined,
    });

    await expect(client.http!.request("/oauth/device_authorizations", {
      credentialEntryBootstrap: true,
    })).rejects.toMatchObject({ httpStatus: 401 });
    await expect(client.http!.request("/oauth/device_authorizations/qr-1", {
      skipAuth: true,
    })).rejects.toMatchObject({ httpStatus: 401 });

    expect(clearCalls).toBe(0);
  });

  it("still clears a session for a protected SDK request that returns 401", async () => {
    let clearCalls = 0;
    const client: SdkworkSdkClientWithHttp = {
      http: {
        request: async <TResponse>(_path: string, _options?: unknown): Promise<TResponse> =>
          Promise.reject({ httpStatus: 401 }),
      },
    };

    attachSdkworkSdkSessionAuthBoundary(client, {
      clearSession: () => {
        clearCalls += 1;
      },
      readEnv: (name) =>
        name === "VITE_SDKWORK_SESSION_AUTH_UNAUTHORIZED_MODE" ? "modal" : undefined,
    });

    await expect(client.http!.request("/backend/v3/api/iam/users")).rejects.toMatchObject({
      httpStatus: 401,
    });

    expect(clearCalls).toBe(1);
  });

  it("does not clear an authenticated session for a credential-entry SDK stream", async () => {
    let clearCalls = 0;
    const client: SdkworkSdkClientWithHttp = {
      http: {
        request: async <TResponse>(_path: string, _options?: unknown): Promise<TResponse> =>
          Promise.reject(new Error("The stream fixture does not issue requests")),
        async *streamJson<TResponse>(_path: string, _options?: unknown): AsyncIterable<TResponse> {
          throw { httpStatus: 401 };
        },
      },
    };

    attachSdkworkSdkSessionAuthBoundary(client, {
      clearSession: () => {
        clearCalls += 1;
      },
      readEnv: (name) =>
        name === "VITE_SDKWORK_SESSION_AUTH_UNAUTHORIZED_MODE" ? "modal" : undefined,
    });

    const readStream = async () => {
      for await (const _item of client.http!.streamJson!("/oauth/device_authorizations", {
        credentialEntryBootstrap: true,
      })) {
      }
    };

    await expect(readStream()).rejects.toMatchObject({ httpStatus: 401 });
    expect(clearCalls).toBe(0);
  });
});
