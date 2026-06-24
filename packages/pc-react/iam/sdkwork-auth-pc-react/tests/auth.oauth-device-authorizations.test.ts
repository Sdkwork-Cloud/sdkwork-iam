import { describe, expect, it, vi } from "vitest";

import {
  createSdkworkAuthService,
  type SdkworkAuthClient,
} from "../src/index.ts";
import { mockAccessToken, mockAuthToken } from "./authJwtFixtures.ts";

describe("sdkwork-auth-pc-react OAuth device authorization migration", () => {
  it("routes OAuth and QR login flows through the OAuth device authorization SDK surface", async () => {
    const authorizationUrlsCreate = vi.fn().mockResolvedValue({
      data: {
        authUrl: "https://auth.sdkwork.ai/oauth/github",
      },
    });
    const oauthSessionCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("oauth-access"),
        authToken: mockAuthToken("oauth-auth"),
      },
    });
    const deviceAuthorizationsCreate = vi.fn().mockResolvedValue({
      data: {
        deviceAuthorizationId: "device-auth-1",
        qrContent: {
          content: "sdkwork://auth/qr-login?device_authorization_id=device-auth-1",
          mode: "fallback_url",
        },
        status: "pending",
      },
    });
    const deviceAuthorizationsRetrieve = vi.fn().mockResolvedValue({
      data: {
        deviceAuthorizationId: "device-auth-1",
        status: "completed",
      },
    });
    const scansCreate = vi.fn().mockResolvedValue({
      data: {
        deviceAuthorizationId: "device-auth-1",
        status: "scanned",
      },
    });
    const passwordCompletionsCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("qr-access"),
        authToken: mockAuthToken("qr-auth"),
      },
    });
    const client = {
      auth: {},
      oauth: {
        authorizationUrls: {
          create: authorizationUrlsCreate,
        },
        sessions: {
          create: oauthSessionCreate,
        },
        deviceAuthorizations: {
          create: deviceAuthorizationsCreate,
          retrieve: deviceAuthorizationsRetrieve,
          scans: {
            create: scansCreate,
          },
          passwordCompletions: {
            create: passwordCompletionsCreate,
          },
        },
      },
    };
    const service = createSdkworkAuthService({
      commitSession: vi.fn(),
      getClient: () => client as unknown as SdkworkAuthClient,
    });

    await expect(service.getOAuthAuthorizationUrl({
      provider: "github",
      redirectUri: "https://app.sdkwork.ai/oauth/callback",
      scope: "profile email",
      state: "state-1",
    })).resolves.toBe("https://auth.sdkwork.ai/oauth/github");
    await service.signInWithOAuth({
      code: "oauth-code",
      provider: "github",
      state: "state-1",
    });
    await expect(service.generateLoginQrCode()).resolves.toMatchObject({
      qrContent: "sdkwork://auth/qr-login?device_authorization_id=device-auth-1",
      sessionKey: "device-auth-1",
      type: "fallback_url",
    });
    await expect(service.checkLoginQrCodeStatus(" device-auth-1 ")).resolves.toMatchObject({
      status: "confirmed",
    });
    await expect(service.callbackLoginQrCode({
      scanSource: "browser",
      sessionKey: " device-auth-1 ",
    })).resolves.toMatchObject({
      status: "scanned",
    });
    await expect(service.confirmLoginQrCode({
      password: "qr-secret",
      sessionKey: " device-auth-1 ",
      username: "qr-user",
    })).resolves.toMatchObject({
      status: "confirmed",
    });

    expect(authorizationUrlsCreate).toHaveBeenCalledWith({
      provider: "GITHUB",
      redirectUri: "https://app.sdkwork.ai/oauth/callback",
      scope: "profile email",
      state: "state-1",
    });
    expect(oauthSessionCreate).toHaveBeenCalledWith({
      code: "oauth-code",
      deviceId: undefined,
      deviceType: undefined,
      provider: "GITHUB",
      state: "state-1",
    });
    expect(deviceAuthorizationsCreate).toHaveBeenCalledWith({
      purpose: "login",
    });
    expect(deviceAuthorizationsRetrieve).toHaveBeenCalledWith("device-auth-1");
    expect(scansCreate).toHaveBeenCalledWith("device-auth-1", {
      scanSource: "browser",
    });
    expect(passwordCompletionsCreate).toHaveBeenCalledWith("device-auth-1", {
      password: "qr-secret",
      username: "qr-user",
    });
  });
});
