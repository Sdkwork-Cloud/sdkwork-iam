import { describe, expect, it, vi } from "vitest";
import { createSdkworkAuthController } from "../src";

describe("sdkwork-auth-pc-react controller", () => {
  it("transitions into authenticated state after sign-in and clears state on sign-out", async () => {
    const service = {
      signIn: vi.fn().mockResolvedValue({
        accessToken: "access-token-1",
        authToken: "auth-token-1",
        refreshToken: "refresh-token-1",
        user: {
          avatar: {
            kind: "image",
            publicUrl: "https://cdn.sdkwork.ai/avatar.png",
            source: "external_url",
            url: "https://cdn.sdkwork.ai/avatar.png",
          },
          displayName: "Sdkwork Operator",
          email: "sdkwork@sdkwork.ai",
          firstName: "Sdkwork",
          id: "user-1",
          initials: "CO",
          lastName: "Operator",
          username: "sdkwork",
        },
      }),
      signOut: vi.fn().mockResolvedValue(undefined),
      getCurrentSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
    };

    const controller = createSdkworkAuthController({ service });

    await controller.signIn({
      password: "secret",
      username: "sdkwork",
    });

    expect(controller.getState()).toMatchObject({
      isAuthenticated: true,
      status: "authenticated",
      user: {
        displayName: "Sdkwork Operator",
        email: "sdkwork@sdkwork.ai",
      },
    });

    await controller.signOut();

    expect(service.signOut).toHaveBeenCalledTimes(1);
    expect(controller.getState()).toMatchObject({
      isAuthenticated: false,
      status: "anonymous",
      user: null,
    });
  });

  it("rejects direct controller session injection without dual tokens", () => {
    const controller = createSdkworkAuthController({
      service: {
        getCurrentSession: vi.fn().mockResolvedValue(null),
        getCurrentUser: vi.fn().mockResolvedValue(null),
      },
    });

    expect(() => controller.applySession({
      authToken: "auth-token-only",
    } as never)).toThrow("Valid IAM auth session is required.");
    expect(controller.getState()).toMatchObject({
      isAuthenticated: false,
      session: null,
      status: "anonymous",
      user: null,
    });
  });

  it("applies session state after organization-selection continuation completes", async () => {
    const service = {
      getCurrentSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
      selectOrganization: vi.fn().mockResolvedValue({
        accessToken: "selected-access-token",
        authToken: "selected-auth-token",
        context: {
          organizationId: "org-2",
          sessionId: "session-2",
          tenantId: "tenant-1",
          userId: "user-1",
        },
        sessionId: "session-2",
        user: {
          displayName: "Sdkwork Operator",
          email: "sdkwork@sdkwork.ai",
          firstName: "Sdkwork",
          id: "user-1",
          initials: "SO",
          lastName: "Operator",
          username: "sdkwork",
        },
      }),
    };

    const controller = createSdkworkAuthController({ service });

    await expect(controller.selectOrganization({
      continuationToken: "continue-org-selection-1",
      organizationId: "org-2",
    })).resolves.toMatchObject({
      accessToken: "selected-access-token",
      authToken: "selected-auth-token",
      sessionId: "session-2",
    });
    expect(service.selectOrganization).toHaveBeenCalledWith({
      continuationToken: "continue-org-selection-1",
      organizationId: "org-2",
    });
    expect(controller.getState()).toMatchObject({
      isAuthenticated: true,
      session: {
        context: {
          organizationId: "org-2",
        },
      },
      status: "authenticated",
      user: {
        id: "user-1",
      },
    });
  });

  it("normalizes incomplete initial sessions to anonymous state", () => {
    const controller = createSdkworkAuthController({
      initialState: {
        isAuthenticated: true,
        isBootstrapped: true,
        session: {
          accessToken: "initial-access-token",
        } as never,
        status: "authenticated",
        user: {
          displayName: "Initial User",
          email: "initial@sdkwork.ai",
          firstName: "Initial",
          initials: "IU",
          lastName: "User",
        },
      },
      service: {
        getCurrentSession: vi.fn().mockResolvedValue(null),
        getCurrentUser: vi.fn().mockResolvedValue(null),
      },
    });

    expect(controller.getState()).toMatchObject({
      isAuthenticated: false,
      isBootstrapped: true,
      session: null,
      status: "anonymous",
      user: null,
    });
  });

  it("does not sync user profiles into anonymous controller state", () => {
    const controller = createSdkworkAuthController({
      service: {
        getCurrentSession: vi.fn().mockResolvedValue(null),
        getCurrentUser: vi.fn().mockResolvedValue(null),
      },
    });

    controller.syncUserProfile({
      displayName: "Anonymous Profile",
      email: "anonymous@sdkwork.ai",
      firstName: "Anonymous",
      initials: "AP",
      lastName: "Profile",
    });

    expect(controller.getState()).toMatchObject({
      isAuthenticated: false,
      session: null,
      status: "anonymous",
      user: null,
    });
  });

  it("fails bootstrap closed when the auth service returns an incomplete session", async () => {
    const service = {
      getCurrentSession: vi.fn().mockResolvedValue({
        authToken: "stored-auth-token",
      }),
      getCurrentUser: vi.fn().mockResolvedValue(null),
    };
    const controller = createSdkworkAuthController({ service: service as never });

    await expect(controller.bootstrap()).rejects.toThrow(
      "Valid IAM auth session is required.",
    );
    expect(controller.getState()).toMatchObject({
      isAuthenticated: false,
      isBootstrapped: false,
      session: null,
      status: "anonymous",
      user: null,
    });
  });

  it("clears controller session state even when sign-out rejects after local cleanup", async () => {
    const service = {
      getCurrentSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
      signOut: vi.fn().mockRejectedValue(new Error("remote logout unavailable")),
    };
    const controller = createSdkworkAuthController({
      initialState: {
        isAuthenticated: true,
        isBootstrapped: true,
        session: {
          accessToken: "access-token-1",
          authToken: "auth-token-1",
          user: {
            displayName: "Sdkwork Operator",
            email: "sdkwork@sdkwork.ai",
            firstName: "Sdkwork",
            initials: "SO",
            lastName: "Operator",
          },
        },
        status: "authenticated",
        user: {
          displayName: "Sdkwork Operator",
          email: "sdkwork@sdkwork.ai",
          firstName: "Sdkwork",
          initials: "SO",
          lastName: "Operator",
        },
      },
      service,
    });

    await expect(controller.signOut()).rejects.toThrow("remote logout unavailable");
    expect(service.signOut).toHaveBeenCalledOnce();
    expect(controller.getState()).toMatchObject({
      isAuthenticated: false,
      isBootstrapped: true,
      session: null,
      status: "anonymous",
      user: null,
    });
  });

  it("updates authenticated state after session refresh and current-session update", async () => {
    const service = {
      getCurrentSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
      refreshSession: vi.fn().mockResolvedValue({
        accessToken: "refreshed-access-token",
        authToken: "refreshed-auth-token",
        refreshToken: "refreshed-refresh-token",
        user: {
          displayName: "Refreshed Operator",
          email: "refreshed@sdkwork.ai",
          id: "user-2",
          initials: "RO",
          username: "refreshed",
        },
      }),
      updateCurrentSession: vi.fn().mockResolvedValue({
        accessToken: "updated-access-token",
        authToken: "updated-auth-token",
        refreshToken: "updated-refresh-token",
        user: {
          displayName: "Updated Operator",
          email: "updated@sdkwork.ai",
          id: "user-3",
          initials: "UO",
          username: "updated",
        },
      }),
    };

    const controller = createSdkworkAuthController({ service });

    await controller.refreshSession({ refreshToken: "refresh-token-1" });

    expect(service.refreshSession).toHaveBeenCalledWith({
      refreshToken: "refresh-token-1",
    });
    expect(controller.getState()).toMatchObject({
      isAuthenticated: true,
      status: "authenticated",
      user: {
        email: "refreshed@sdkwork.ai",
      },
    });

    await controller.updateCurrentSession({ organizationId: "org-1" });

    expect(service.updateCurrentSession).toHaveBeenCalledWith({
      organizationId: "org-1",
    });
    expect(controller.getState()).toMatchObject({
      isAuthenticated: true,
      status: "authenticated",
      user: {
        email: "updated@sdkwork.ai",
      },
    });
  });

  it("keeps anonymous state when QR confirmation has no scanner session payload", async () => {
    const service = {
      confirmLoginQrCode: vi.fn().mockResolvedValue({
        status: "confirmed",
      }),
      getCurrentSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
    };

    const controller = createSdkworkAuthController({ service });

    await expect(controller.confirmLoginQrCode({
      sessionKey: "qr-browser-1",
    })).resolves.toEqual({
      status: "confirmed",
    });

    expect(service.confirmLoginQrCode).toHaveBeenCalledWith({
      sessionKey: "qr-browser-1",
    });
    expect(controller.getState()).toMatchObject({
      isAuthenticated: false,
      status: "anonymous",
    });
  });

  it("applies scanner QR confirmation sessions to the authenticated state", async () => {
    const service = {
      confirmLoginQrCode: vi.fn().mockResolvedValue({
        session: {
          accessToken: "qr-scanner-access-token",
          authToken: "qr-scanner-auth-token",
          user: {
            displayName: "QR Scanner Operator",
            email: "qr-scanner@sdkwork.ai",
            id: "qr-scanner-user-1",
          },
        },
        status: "confirmed",
      }),
      getCurrentSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
    };

    const controller = createSdkworkAuthController({ service });

    await expect(controller.confirmLoginQrCode({
      sessionKey: "qr-browser-2",
    })).resolves.toMatchObject({
      session: {
        accessToken: "qr-scanner-access-token",
      },
      status: "confirmed",
    });

    expect(service.confirmLoginQrCode).toHaveBeenCalledWith({
      sessionKey: "qr-browser-2",
    });
    expect(controller.getState()).toMatchObject({
      isAuthenticated: true,
      status: "authenticated",
      user: {
        email: "qr-scanner@sdkwork.ai",
        id: "qr-scanner-user-1",
      },
    });
  });

  it("rejects scanner QR confirmation results without dual-token sessions", async () => {
    const service = {
      confirmLoginQrCode: vi.fn().mockResolvedValue({
        session: {
          accessToken: "qr-scanner-access-token",
        },
        status: "confirmed",
      }),
      getCurrentSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
    };

    const controller = createSdkworkAuthController({ service: service as never });

    await expect(controller.confirmLoginQrCode({
      sessionKey: "qr-browser-incomplete",
    })).rejects.toThrow("Valid IAM auth session is required.");
    expect(controller.getState()).toMatchObject({
      isAuthenticated: false,
      session: null,
      status: "anonymous",
      user: null,
    });
  });

  it("applies desktop QR polling sessions to the authenticated state", async () => {
    const service = {
      checkLoginQrCodeStatus: vi.fn().mockResolvedValue({
        session: {
          accessToken: "qr-access-token",
          authToken: "qr-auth-token",
          user: {
            displayName: "QR Desktop Operator",
            email: "qr-desktop@sdkwork.ai",
            id: "qr-desktop-user-1",
          },
        },
        status: "confirmed",
      }),
      getCurrentSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
    };

    const controller = createSdkworkAuthController({ service });

    await expect(controller.checkLoginQrCodeStatus("qr-desktop-1")).resolves.toMatchObject({
      status: "confirmed",
      session: {
        accessToken: "qr-access-token",
      },
    });

    expect(service.checkLoginQrCodeStatus).toHaveBeenCalledWith("qr-desktop-1", undefined);
    expect(controller.getState()).toMatchObject({
      isAuthenticated: true,
      status: "authenticated",
      user: {
        email: "qr-desktop@sdkwork.ai",
        id: "qr-desktop-user-1",
      },
    });
  });

  it("rejects desktop QR polling results without dual-token sessions", async () => {
    const service = {
      checkLoginQrCodeStatus: vi.fn().mockResolvedValue({
        session: {
          authToken: "qr-auth-token",
        },
        status: "confirmed",
      }),
      getCurrentSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
    };

    const controller = createSdkworkAuthController({ service: service as never });

    await expect(controller.checkLoginQrCodeStatus("qr-incomplete-session")).rejects.toThrow(
      "Valid IAM auth session is required.",
    );
    expect(controller.getState()).toMatchObject({
      isAuthenticated: false,
      session: null,
      status: "anonymous",
      user: null,
    });
  });

  it("exposes backend verification policy without changing authentication state", async () => {
    const service = {
      getCurrentSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
      getVerificationPolicy: vi.fn().mockResolvedValue({
        emailCodeLoginEnabled: true,
        emailRegistrationVerificationRequired: true,
        phoneCodeLoginEnabled: false,
        phoneRegistrationVerificationRequired: false,
      }),
    };

    const controller = createSdkworkAuthController({ service });

    await expect(controller.getVerificationPolicy()).resolves.toEqual({
      emailCodeLoginEnabled: true,
      emailRegistrationVerificationRequired: true,
      phoneCodeLoginEnabled: false,
      phoneRegistrationVerificationRequired: false,
    });

    expect(service.getVerificationPolicy).toHaveBeenCalledOnce();
    expect(controller.getState()).toMatchObject({
      isAuthenticated: false,
      status: "anonymous",
    });
  });
});
