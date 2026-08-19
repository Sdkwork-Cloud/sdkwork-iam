import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ensureRepoBootstrapAccessToken,
  isUsableBootstrapAccessToken,
  loadBootstrapAuthProfileFromHome,
  looksLikeLocalFixtureJwt,
  parseAccessTokenFromEnvFile,
  resolveBootstrapAuth,
  resolveBootstrapAuthProfileCandidates,
  resolveBootstrapAuthProfileDir,
  resolveBootstrapAuthProfilePaths,
  resolveRegisteredBootstrapEnvPaths,
  resolveSdkworkHomeDir,
  SDKWORK_IAM_BOOTSTRAP_DEFAULT_PROFILE,
  writeRegisteredBootstrapEnvFiles,
} from "../src/index";

describe("bootstrap auth profiles", () => {
  it("prefers explicit operator profile, then lifecycle, profile id, and default", () => {
    expect(
      resolveBootstrapAuthProfileCandidates({
        env: {
          SDKWORK_IAM_BOOTSTRAP_OPERATOR_PROFILE: "custom-operator",
          SDKWORK_PROFILE_ID: "standalone.development",
        },
      }),
    ).toEqual([
      "custom-operator",
      "development",
      "standalone.development",
      SDKWORK_IAM_BOOTSTRAP_DEFAULT_PROFILE,
      "super-admin",
    ]);
  });

  it("derives lifecycle candidates from launch env", () => {
    expect(
      resolveBootstrapAuthProfileCandidates({
        env: {
          SDKWORK_PROFILE_ID: "standalone.test",
          SDKWORK_ENVIRONMENT: "test",
        },
      }),
    ).toEqual(["test", "standalone.test", SDKWORK_IAM_BOOTSTRAP_DEFAULT_PROFILE, "super-admin"]);
  });

  it("maps SDKWORK_ENV=dev and local aliases to development.json", () => {
    expect(
      resolveBootstrapAuthProfileCandidates({
        env: { SDKWORK_ENV: "dev" },
      }),
    ).toEqual(["development", "standalone.development", SDKWORK_IAM_BOOTSTRAP_DEFAULT_PROFILE, "super-admin"]);
    expect(
      resolveBootstrapAuthProfileCandidates({
        env: { SDKWORK_ENV: "local" },
      })[0],
    ).toBe("development");
  });

  it("joins HOMEDRIVE and HOMEPATH on win32 when USERPROFILE is absent", () => {
    expect(
      resolveSdkworkHomeDir(
        { HOMEDRIVE: "C:", HOMEPATH: "\\Users\\admin", HOME: "/c/Users/gitbash" },
        "win32",
      ).replace(/\\/gu, "/"),
    ).toBe("C:/Users/admin");
  });

  it("searches iam-bootstrap dir before legacy users dir", () => {
    const paths = resolveBootstrapAuthProfilePaths({
      env: { SDKWORK_ENVIRONMENT: "development" },
      bootstrapProfileDir: "/home/.sdkwork/iam-bootstrap",
      legacyUsersDir: "/home/.sdkwork/users",
    });
    expect(paths[0]?.replace(/\\/gu, "/")).toBe("/home/.sdkwork/iam-bootstrap/development.json");
    expect(paths.map((path) => path.replace(/\\/gu, "/"))).toContain("/home/.sdkwork/iam-bootstrap/default.json");
    expect(paths.map((path) => path.replace(/\\/gu, "/"))).toContain("/home/.sdkwork/users/development.json");
  });

  it("prefers the canonical username field from the on-disk profile", async () => {
    const loaded = await loadBootstrapAuthProfileFromHome({
      bootstrapProfileDir: "/tmp/iam-bootstrap",
      legacyUsersDir: "/tmp/users",
      lifecycleEnvironment: "development",
      readFile: async (path) => {
        const normalized = path.replace(/\\/gu, "/");
        if (normalized.endsWith("/iam-bootstrap/development.json")) {
          return JSON.stringify({
            username: "admin",
            email: "admin@sdkwork.com",
            password: "Hello2026",
          });
        }
        throw new Error("missing");
      },
    });
    expect(loaded?.profile.username).toBe("admin");
    expect(loaded?.profile.email).toBe("admin@sdkwork.com");
    expect(
      resolveBootstrapAuth({
        env: {},
        profile: loaded?.profile,
      }).username,
    ).toBe("admin");
  });

  it("loads the first existing bootstrap auth profile file", async () => {
    const loaded = await loadBootstrapAuthProfileFromHome({
      bootstrapProfileDir: "/tmp/iam-bootstrap",
      legacyUsersDir: "/tmp/users",
      lifecycleEnvironment: "development",
      readFile: async (path) => {
        const normalized = path.replace(/\\/gu, "/");
        if (normalized.endsWith("/iam-bootstrap/development.json")) {
          return JSON.stringify({ email: "operator@example.com", password: "secret" });
        }
        throw new Error("missing");
      },
    });
    expect(loaded?.profileName).toBe("development");
    expect(loaded?.profile.email).toBe("operator@example.com");
  });

  it("merges env bootstrap auth over on-disk profile", () => {
    expect(
      resolveBootstrapAuth({
        env: {
          SDKWORK_IAM_BOOTSTRAP_OPERATOR_USERNAME: "env-user",
        },
        profile: { email: "profile@example.com", password: "profile-secret" },
      }),
    ).toEqual({
      authToken: undefined,
      username: "env-user",
      password: "profile-secret",
      email: "profile@example.com",
      phone: undefined,
    });
  });

  it("prefers USERPROFILE over HOME on win32", () => {
    expect(
      resolveSdkworkHomeDir(
        { USERPROFILE: "C:\\Users\\admin", HOME: "/c/Users/gitbash" },
        "win32",
      ),
    ).toBe("C:\\Users\\admin");
  });

  it("prefers HOME over USERPROFILE on unix", () => {
    expect(
      resolveSdkworkHomeDir(
        { HOME: "/home/dev", USERPROFILE: "C:\\Users\\admin" },
        "linux",
      ),
    ).toBe("/home/dev");
  });

  it("resolves iam-bootstrap dir from Windows USERPROFILE", () => {
    const dir = resolveBootstrapAuthProfileDir(
      { USERPROFILE: "C:\\Users\\admin" },
      "win32",
    );
    expect(dir.replace(/\\/gu, "/")).toBe("C:/Users/admin/.sdkwork/iam-bootstrap");
  });

  it("writes start/build overlay files and parses the access token", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "sdkwork-bootstrap-overlays-"));
    try {
      const paths = await writeRegisteredBootstrapEnvFiles(
        repoRoot,
        "SDKWORK_ACCESS_TOKEN=signed-dev-token\n",
        "dev",
      );
      expect(paths.map((path) => path.replace(/\\/gu, "/"))).toEqual(
        resolveRegisteredBootstrapEnvPaths(repoRoot, "development").map((path) => path.replace(/\\/gu, "/")),
      );
      const contents = await readFile(paths[0] ?? "", "utf8");
      expect(parseAccessTokenFromEnvFile(contents)).toBe("signed-dev-token");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("rejects fixture JWTs against non-loopback backends", () => {
    const fixture = [
      Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url"),
      Buffer.from(JSON.stringify({ token_type: "access" })).toString("base64url"),
      "signature",
    ].join(".");
    expect(looksLikeLocalFixtureJwt(fixture)).toBe(true);
    expect(isUsableBootstrapAccessToken(fixture, "http://api-dev.birdcoder.com")).toBe(false);
    expect(isUsableBootstrapAccessToken(fixture, "http://127.0.0.1:8080")).toBe(true);
    expect(isUsableBootstrapAccessToken("signed-jwt", "http://api-dev.birdcoder.com")).toBe(true);
  });

  it("parses access tokens from CRLF env overlays", () => {
    expect(parseAccessTokenFromEnvFile("SDKWORK_TENANT_ID=100001\r\nSDKWORK_ACCESS_TOKEN=win-token\r\n")).toBe(
      "win-token",
    );
  });

  it("reuses a registered overlay token during start/build ensure", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "sdkwork-bootstrap-ensure-"));
    try {
      await writeRegisteredBootstrapEnvFiles(repoRoot, "SDKWORK_ACCESS_TOKEN=signed-dev-token\n", "development");
      const result = await ensureRepoBootstrapAccessToken({
        repoRoot,
        environment: "development",
        env: { SDKWORK_BACKEND_BASE_URL: "http://api-dev.birdcoder.com" },
        tryApplicationBootstrap: false,
      });
      expect(result).toEqual({ status: "configured", token: "signed-dev-token" });
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("fails closed when no overlay and bootstrap is disabled", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "sdkwork-bootstrap-ensure-missing-"));
    try {
      const result = await ensureRepoBootstrapAccessToken({
        repoRoot,
        environment: "development",
        env: {},
        tryApplicationBootstrap: false,
      });
      expect(result.status).toBe("unavailable");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
});
