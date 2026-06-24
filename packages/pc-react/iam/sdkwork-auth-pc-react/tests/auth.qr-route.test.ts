import { describe, expect, it } from "vitest";

import {
  buildSdkworkAuthRouteWithContext,
  resolveSdkworkAuthQrEntryKey,
  resolveSdkworkAuthQrEntryCallbackEvent,
  resolveSdkworkAuthQrEntryKeyFromRoute,
} from "../src/auth-qr-route.ts";

describe("sdkwork-auth-pc-react QR auth routes", () => {
  it("keeps the scanned QR key when a browser QR entry switches between login and register", () => {
    const qrEntryKey = resolveSdkworkAuthQrEntryKeyFromRoute(
      "qr-browser-1",
      null,
      "/auth/qr/qr-browser-1",
      "/auth",
    );

    expect(qrEntryKey).toBe("qr-browser-1");
    expect(buildSdkworkAuthRouteWithContext("/auth/register", {
      homePath: "/dashboard",
      qrEntryKey,
      redirectTarget: "/workspace",
    })).toBe("/auth/register?redirect=%2Fworkspace&session_key=qr-browser-1");
    expect(buildSdkworkAuthRouteWithContext("/auth/login", {
      homePath: "/dashboard",
      qrEntryKey,
      redirectTarget: "/workspace",
    })).toBe("/auth/login?redirect=%2Fworkspace&session_key=qr-browser-1");
  });

  it("keeps standardized QR scanner metadata on explicit query keys", () => {
    const route = buildSdkworkAuthRouteWithContext("/auth/register", {
      homePath: "/dashboard",
      qrEntryKey: "qr-wechat-route",
      redirectTarget: "/dashboard",
    }, {
      account_id: "account_official_1",
      entry_id: "entry_official_1",
      external_user_id: "openid_1",
      ip_hash: "ip_hash_1",
      scan_source: "official_account",
      source: "legacy-source-should-not-leak",
      src: "legacy-src-should-not-leak",
    });

    const parsed = new URL(route, "https://console.example.test");
    expect(parsed.pathname).toBe("/auth/register");
    expect(parsed.searchParams.get("session_key")).toBe("qr-wechat-route");
    expect(parsed.searchParams.get("qrKey")).toBeNull();
    expect(parsed.searchParams.get("account_id")).toBe("account_official_1");
    expect(parsed.searchParams.get("entry_id")).toBe("entry_official_1");
    expect(parsed.searchParams.get("external_user_id")).toBe("openid_1");
    expect(parsed.searchParams.get("ip_hash")).toBe("ip_hash_1");
    expect(parsed.searchParams.get("scan_source")).toBe("official_account");
    expect(parsed.searchParams.get("src")).toBeNull();
    expect(parsed.searchParams.get("source")).toBeNull();
  });

  it("accepts QR session keys passed by API_SPEC-compliant URL query so register pages can confirm QR auth directly", () => {
    expect(resolveSdkworkAuthQrEntryKeyFromRoute(
      undefined,
      " session-from-query ",
      "/auth/register",
      "/auth",
    )).toBe("session-from-query");
  });

  it("keeps malformed encoded QR route keys from crashing the scanner page", () => {
    expect(resolveSdkworkAuthQrEntryKey("/auth/qr/%E0%A4%A", "/auth")).toBe("%E0%A4%A");
  });

  it("uses a registration-aware callback event for browser QR entries", () => {
    expect(resolveSdkworkAuthQrEntryCallbackEvent("login")).toBe("passwordRequired");
    expect(resolveSdkworkAuthQrEntryCallbackEvent("register")).toBe("bindRequired");
    expect(resolveSdkworkAuthQrEntryCallbackEvent("forgot")).toBe("passwordRequired");
  });
});
