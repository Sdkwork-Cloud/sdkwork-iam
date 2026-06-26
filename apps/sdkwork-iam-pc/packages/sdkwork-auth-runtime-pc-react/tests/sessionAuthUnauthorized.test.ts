import { describe, expect, it } from "vitest";

import {
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
});
