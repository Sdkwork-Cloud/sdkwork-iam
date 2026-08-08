import { describe, expect, it } from "vitest";

import {
  buildSdkworkLoginRedirectFromLocation,
  buildSdkworkLoginRedirectPath,
  decodeSdkworkAuthRedirectTargetBounded,
  isSdkworkAuthRoutePath,
  normalizeSdkworkAuthLoginBasePath,
  sanitizeSdkworkAuthRedirectTarget,
} from "../src/index.ts";

describe("isSdkworkAuthRoutePath", () => {
  it("identifies the auth surface and its children", () => {
    expect(isSdkworkAuthRoutePath("/auth", "/auth")).toBe(true);
    expect(isSdkworkAuthRoutePath("/auth/login", "/auth")).toBe(true);
    expect(isSdkworkAuthRoutePath("/auth/register", "/auth")).toBe(true);
    expect(isSdkworkAuthRoutePath("/auth/oauth/callback/github", "/auth")).toBe(true);
    expect(isSdkworkAuthRoutePath("/console/dashboard", "/auth")).toBe(false);
    expect(isSdkworkAuthRoutePath("/authx", "/auth")).toBe(false);
  });

  it("normalizes the base path argument", () => {
    expect(isSdkworkAuthRoutePath("/auth/login", "/auth/")).toBe(true);
    expect(isSdkworkAuthRoutePath("/auth/login", " /auth/// ")).toBe(true);
  });
});

describe("normalizeSdkworkAuthLoginBasePath", () => {
  it("derives the auth base from the login path", () => {
    expect(normalizeSdkworkAuthLoginBasePath("/auth/login")).toBe("/auth");
    expect(normalizeSdkworkAuthLoginBasePath("/workspace/auth/login")).toBe("/workspace/auth");
    expect(normalizeSdkworkAuthLoginBasePath("/login")).toBe("/auth");
  });
});

describe("decodeSdkworkAuthRedirectTargetBounded", () => {
  it("decodes to fixpoint without throwing on malformed values", () => {
    expect(decodeSdkworkAuthRedirectTargetBounded("/console/foo")).toBe("/console/foo");
    expect(decodeSdkworkAuthRedirectTargetBounded("%2Fconsole%2Ffoo")).toBe("/console/foo");
    expect(decodeSdkworkAuthRedirectTargetBounded("%252Fconsole%252Ffoo")).toBe("/console/foo");
    expect(decodeSdkworkAuthRedirectTargetBounded("%")).toBe("%");
  });
});

describe("sanitizeSdkworkAuthRedirectTarget", () => {
  it("falls back for missing or unsafe targets", () => {
    expect(sanitizeSdkworkAuthRedirectTarget(null)).toBe("/");
    expect(sanitizeSdkworkAuthRedirectTarget(undefined, "/home")).toBe("/home");
    expect(sanitizeSdkworkAuthRedirectTarget("", "/home")).toBe("/home");
    expect(sanitizeSdkworkAuthRedirectTarget("//evil.com")).toBe("/");
    expect(sanitizeSdkworkAuthRedirectTarget("/\\evil.com")).toBe("/");
    expect(sanitizeSdkworkAuthRedirectTarget("https://evil.com/path")).toBe("/");
    expect(sanitizeSdkworkAuthRedirectTarget("javascript:alert(1)")).toBe("/");
  });

  it("keeps legitimate in-app targets", () => {
    expect(sanitizeSdkworkAuthRedirectTarget("/settings/profile")).toBe("/settings/profile");
    expect(
      sanitizeSdkworkAuthRedirectTarget("/console/foo", "/home", "/auth"),
    ).toBe("/console/foo");
  });

  it("rejects auth routes including deeply nested and encoded forms", () => {
    expect(sanitizeSdkworkAuthRedirectTarget("/auth/login", "/home")).toBe("/home");
    expect(sanitizeSdkworkAuthRedirectTarget("/auth/login?redirect=%2Fconsole%2Ffoo", "/home")).toBe("/home");
    expect(
      sanitizeSdkworkAuthRedirectTarget(
        "/auth/login?redirect=%2Fauth%2Flogin%3Fredirect%3D%252Fauth%252Flogin%253Fredirect%253D%25252Fconsole",
        "/home",
      ),
    ).toBe("/home");
    expect(sanitizeSdkworkAuthRedirectTarget("/auth%2Flogin?redirect=%2Fconsole%2Ffoo", "/home")).toBe("/home");
    expect(sanitizeSdkworkAuthRedirectTarget("/auth/register", "/home")).toBe("/home");
    expect(sanitizeSdkworkAuthRedirectTarget("/login", "/home")).toBe("/home");
  });
});

describe("buildSdkworkLoginRedirectPath", () => {
  it("wraps a protected return path once", () => {
    expect(buildSdkworkLoginRedirectPath("/auth/login", "/console/foo?tab=1")).toBe(
      "/auth/login?redirect=%2Fconsole%2Ffoo%3Ftab%3D1",
    );
  });

  it("never re-wraps an auth-route return path", () => {
    expect(buildSdkworkLoginRedirectPath("/auth/login", "/auth/login?redirect=%2Fconsole%2Ffoo")).toBe(
      "/auth/login",
    );
    expect(buildSdkworkLoginRedirectPath("/auth/login", "/auth/register")).toBe("/auth/login");
    expect(buildSdkworkLoginRedirectPath("/auth/login", "/auth")).toBe("/auth/login");
  });
});

describe("buildSdkworkLoginRedirectFromLocation", () => {
  it("wraps a non-auth location with pathname, search and hash", () => {
    expect(
      buildSdkworkLoginRedirectFromLocation("/auth/login", {
        hash: "#comments",
        pathname: "/models/gpt-4o",
        search: "?sort=top",
      }),
    ).toBe("/auth/login?redirect=%2Fmodels%2Fgpt-4o%3Fsort%3Dtop%23comments");
  });

  it("reuses the existing redirect param verbatim on the auth surface", () => {
    expect(
      buildSdkworkLoginRedirectFromLocation("/auth/login", {
        pathname: "/auth/login",
        search: "?redirect=%2Fconsole%2Fdashboard",
      }),
    ).toBe("/auth/login?redirect=%2Fconsole%2Fdashboard");
  });

  it("returns the plain login path on the auth surface without a redirect param", () => {
    expect(
      buildSdkworkLoginRedirectFromLocation("/auth/login", {
        pathname: "/auth/register",
        search: "",
      }),
    ).toBe("/auth/login");
  });
});
