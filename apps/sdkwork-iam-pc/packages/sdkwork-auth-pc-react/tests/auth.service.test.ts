import { mockAccessToken, mockAuthToken } from "./authJwtFixtures.ts";
import { describe, expect, it, vi } from "vitest";
import * as authPackage from "../src";
import {
  createSdkworkAuthService,
  createSdkworkCanonicalAuthController,
  createSdkworkCanonicalRuntimeAuthAuthorityService,
  createSdkworkIamRuntimeAuthController,
  createSdkworkLocalAuthService,
  SdkworkAuthOrganizationSelectionRequiredError,
  type SdkworkAuthClient,
} from "../src";

interface LocalAuthTestUser {
  email: string;
  id: string;
  name: string;
}

function createLocalAuthSession(input: {
  accessToken: string;
  authToken: string;
  user: LocalAuthTestUser;
}) {
  return {
    accessToken: input.accessToken,
    authToken: input.authToken,
    user: {
      displayName: input.user.name,
      email: input.user.email,
      firstName: "SDKWork",
      id: input.user.id,
      initials: "BO",
      lastName: "Operator",
      username: input.user.email,
    },
  };
}

const authAvatar = {
  kind: "image",
  publicUrl: "https://cdn.sdkwork.ai/avatar.png",
  source: "external_url",
  url: "https://cdn.sdkwork.ai/avatar.png",
} as const;

const runtimeQrCode = {
  kind: "image",
  publicUrl: "https://cdn.sdkwork.ai/auth/qr-runtime.png",
  source: "external_url",
  url: "https://cdn.sdkwork.ai/auth/qr-runtime.png",
} as const;

const resourceQrCode = {
  kind: "image",
  publicUrl: "https://cdn.sdkwork.ai/auth/qr-resource.png",
  source: "external_url",
  url: "https://cdn.sdkwork.ai/auth/qr-resource.png",
} as const;

describe("sdkwork-auth-pc-react service", () => {
  it("does not synthesize auth user profile fields from a missing identity", () => {
    expect(authPackage.createSdkworkAuthUserFromIdentity({})).toEqual({
      avatar: undefined,
      displayName: "",
      email: "",
      firstName: "",
      id: undefined,
      initials: "",
      lastName: "",
    });
  });

  it("creates an auth controller from a standard IAM runtime without application-specific auth adapters", async () => {
    const tokenStore = {
      clear: vi.fn(),
      get: vi.fn().mockResolvedValue({
        accessToken: mockAccessToken("stored-access-token"),
        authToken: mockAuthToken("stored-auth-token"),
        refreshToken: "stored-refresh-token",
      }),
      set: vi.fn(),
    };
    const contextStore = {
      clear: vi.fn(),
      getAppContext: vi.fn(),
      getShardingContext: vi.fn(),
      setAppContext: vi.fn(),
    };
    const runtime = {
      config: {
        appId: "sdkwork-test-app",
        deploymentMode: "saas",
        environment: "test",
      },
      contextStore,
      getAuthHeaders: vi.fn(),
      service: {
        auth: {
          passwordResetRequests: {
            create: vi.fn().mockResolvedValue({ requestId: "reset-request-1" }),
          },
          passwordResets: {
            create: vi.fn().mockResolvedValue({ reset: true }),
          },
          registrations: {
            create: vi.fn().mockResolvedValue({
              accessToken: mockAccessToken("registered-access-token"),
              authToken: mockAuthToken("registered-auth-token"),
              refreshToken: "registered-refresh-token",
              user: {
                displayName: "Registered Operator",
                email: "registered@sdkwork.ai",
                id: "registered-user-1",
              },
            }),
          },
          sessions: {
            create: vi.fn().mockResolvedValue({
              accessToken: mockAccessToken("session-access-token"),
              authToken: mockAuthToken("session-auth-token"),
              refreshToken: "session-refresh-token",
              user: {
                displayName: "Session Operator",
                email: "session@sdkwork.ai",
                id: "session-user-1",
              },
            }),
            current: {
              delete: vi.fn().mockResolvedValue(undefined),
              retrieve: vi.fn().mockResolvedValue({
                accessToken: mockAccessToken("current-access-token"),
                authToken: mockAuthToken("current-auth-token"),
                user: {
                  displayName: "Current Operator",
                  email: "current@sdkwork.ai",
                  id: "current-user-1",
                },
              }),
              update: vi.fn().mockResolvedValue({
                accessToken: mockAccessToken("updated-access-token"),
                authToken: mockAuthToken("updated-auth-token"),
                refreshToken: "updated-refresh-token",
                user: {
                  displayName: "Updated Operator",
                  email: "updated@sdkwork.ai",
                  id: "updated-user-1",
                },
              }),
            },
            refresh: vi.fn().mockResolvedValue({
              accessToken: mockAccessToken("refreshed-access-token"),
              authToken: mockAuthToken("refreshed-auth-token"),
              refreshToken: "refreshed-refresh-token",
              user: {
                displayName: "Refreshed Operator",
                email: "refreshed@sdkwork.ai",
                id: "refreshed-user-1",
              },
            }),
          },
        },
        oauth: {
          authorizationUrls: {
            create: vi.fn().mockResolvedValue({
              authUrl: "https://auth.sdkwork.ai/oauth/github",
            }),
          },
          sessions: {
            create: vi.fn().mockResolvedValue({
              accessToken: mockAccessToken("oauth-access-token"),
              authToken: mockAuthToken("oauth-auth-token"),
              user: {
                displayName: "OAuth Operator",
                email: "oauth@sdkwork.ai",
                id: "oauth-user-1",
              },
            }),
          },
          deviceAuthorizations: {
            create: vi.fn().mockResolvedValue({
              qrContent: {
                content: "sdkwork://auth/qr-login?key=qr-runtime-1",
                mode: "fallback_url",
              },
              sessionKey: "qr-runtime-1",
              status: "pending",
              title: "Desktop QR Login",
            }),
            retrieve: vi.fn().mockResolvedValue({
              sessionKey: "qr-runtime-1",
              status: "completed",
            }),
            passwordCompletions: {
              create: vi.fn().mockResolvedValue({
                accessToken: mockAccessToken("qr-password-access-token"),
                authToken: mockAuthToken("qr-password-auth-token"),
                expiresIn: 3600,
                userId: "qr-runtime-user",
              }),
            },
            scans: {
              create: vi.fn().mockResolvedValue({
                sessionKey: "qr-runtime-1",
                status: "scanned",
              }),
            },
          },
        },
        messaging: {
          verificationCodes: {
            create: vi.fn().mockResolvedValue({ codeId: "code-1" }),
            verify: vi.fn().mockResolvedValue({ verified: true }),
          },
        },
        iam: {
          users: {
            current: {
              retrieve: vi.fn().mockResolvedValue({
                displayName: "Profile Operator",
                email: "profile@sdkwork.ai",
                id: "profile-user-1",
                username: "profile",
              }),
            },
          },
        },
        system: {
          iam: {
            verificationPolicy: {
              retrieve: vi.fn().mockResolvedValue({
                emailCodeLoginEnabled: true,
                emailRegisterVerificationRequired: true,
                phoneCodeLoginEnabled: false,
                phoneRegisterVerificationRequired: false,
              }),
            },
          },
        },
      },
      tokenStore,
    };
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => runtime as never,
    });

    await expect(controller.bootstrap()).resolves.toMatchObject({
      isAuthenticated: true,
      user: {
        email: "current@sdkwork.ai",
        id: "current-user-1",
      },
    });
    await expect(controller.signIn({
      password: "secret",
      username: "sdkwork",
    })).resolves.toMatchObject({
      accessToken: mockAccessToken("session-access-token"),
      authToken: mockAuthToken("session-auth-token"),
      user: {
        email: "session@sdkwork.ai",
        firstName: "Session",
        id: "session-user-1",
        initials: "SO",
        lastName: "Operator",
      },
    });
    await expect(controller.signInWithSessionBridge({
      bridgeToken: " bridge-token-1 ",
      email: " bridge@sdkwork.ai ",
      name: "Bridge Operator",
      subject: "sdkwork:bridge-user",
    })).resolves.toMatchObject({
      accessToken: mockAccessToken("session-access-token"),
      authToken: mockAuthToken("session-auth-token"),
    });
    await expect(controller.register({
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "registered@sdkwork.ai",
      password: "secret",
      username: "registered",
      verificationCode: "123456",
    })).resolves.toMatchObject({
      accessToken: mockAccessToken("registered-access-token"),
      authToken: mockAuthToken("registered-auth-token"),
      user: {
        id: "registered-user-1",
      },
    });
    await expect(controller.getVerificationPolicy()).resolves.toEqual({
      emailCodeLoginEnabled: true,
      emailRegistrationVerificationRequired: true,
      phoneCodeLoginEnabled: false,
      phoneRegistrationVerificationRequired: false,
    });
    await controller.sendVerifyCode({
      scene: "REGISTER",
      target: " registered@sdkwork.ai ",
      verifyType: "EMAIL",
    });
    await expect(controller.verifyCode({
      code: "123456",
      scene: "REGISTER",
      target: "registered@sdkwork.ai",
      verifyType: "EMAIL",
    })).resolves.toBe(true);
    await controller.requestPasswordReset({
      account: "registered@sdkwork.ai",
      channel: "EMAIL",
    });
    await controller.resetPassword({
      account: "registered@sdkwork.ai",
      code: "123456",
      newPassword: "new-secret",
    });
    await expect(controller.getOAuthAuthorizationUrl({
      provider: "github",
      redirectUri: "https://app.sdkwork.ai/oauth/callback",
      scope: "profile email",
      state: "state-1",
    })).resolves.toBe("https://auth.sdkwork.ai/oauth/github");
    await expect(controller.updateCurrentSession({
      organizationId: "org-1",
    })).resolves.toMatchObject({
      accessToken: mockAccessToken("updated-access-token"),
      authToken: mockAuthToken("updated-auth-token"),
      user: {
        email: "updated@sdkwork.ai",
      },
    });
    await expect(controller.refreshSession({
      refreshToken: "stored-refresh-token",
      sessionId: "must-not-forward",
      token: "must-not-forward",
    } as unknown as { refreshToken: string })).resolves.toMatchObject({
      accessToken: mockAccessToken("refreshed-access-token"),
      authToken: mockAuthToken("refreshed-auth-token"),
      user: {
        email: "refreshed@sdkwork.ai",
      },
    });
    expect(runtime.service.auth.sessions.refresh).toHaveBeenCalledWith({
      refreshToken: "stored-refresh-token",
    });
    await expect(controller.generateLoginQrCode({
      purpose: "login",
    })).resolves.toMatchObject({
      qrContent: "sdkwork://auth/qr-login?key=qr-runtime-1",
      sessionKey: "qr-runtime-1",
      title: "Desktop QR Login",
    });
    await expect(controller.checkLoginQrCodeStatus(" qr-runtime-1 ")).resolves.toMatchObject({
      status: "confirmed",
    });
    await expect(controller.confirmLoginQrCode({
      password: "qr-secret",
      sessionKey: " qr-runtime-1 ",
      username: "qr-user",
    })).resolves.toMatchObject({
      status: "confirmed",
    });
    await expect(controller.callbackLoginQrCode({
      event: "passwordRequired",
      sessionKey: " qr-runtime-1 ",
      scanSource: "browser",
    })).resolves.toMatchObject({
      status: "scanned",
    });
    await controller.signInWithOAuth({
      code: "oauth-code",
      provider: "github",
      state: "state-1",
    });
    await controller.signOut();

    expect(runtime.service.auth.sessions.current.retrieve).toHaveBeenCalledOnce();
    expect(runtime.service.auth.sessions.create).toHaveBeenCalledWith({
      grantType: "password",
      password: "secret",
      username: "sdkwork",
    });
    expect(runtime.service.auth.sessions.create).toHaveBeenCalledWith({
      bridgeToken: "bridge-token-1",
      email: "bridge@sdkwork.ai",
      grantType: "session_bridge",
      name: "Bridge Operator",
      subject: "sdkwork:bridge-user",
    });
    expect(runtime.service.auth.registrations.create).toHaveBeenCalledWith({
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "registered@sdkwork.ai",
      password: "secret",
      phone: undefined,
      username: "registered",
      verificationCode: "123456",
    });
    expect(runtime.service.system.iam.verificationPolicy.retrieve).toHaveBeenCalledOnce();
    expect(runtime.service.messaging?.verificationCodes?.create).toHaveBeenCalledWith({
      scene: "REGISTER",
      target: "registered@sdkwork.ai",
      verifyType: "EMAIL",
    });
    expect(runtime.service.oauth.authorizationUrls.create).toHaveBeenCalledWith({
      provider: "GITHUB",
      redirectUri: "https://app.sdkwork.ai/oauth/callback",
      scope: "profile email",
      state: "state-1",
    });
    expect(runtime.service.oauth.sessions.create).toHaveBeenCalledWith({
      code: "oauth-code",
      deviceId: undefined,
      deviceType: undefined,
      provider: "GITHUB",
      state: "state-1",
    });
    expect(runtime.service.auth.sessions.current.update).toHaveBeenCalledWith({
      organizationId: "org-1",
    });
    expect(runtime.service.auth.sessions.refresh).toHaveBeenCalledWith({
      refreshToken: "stored-refresh-token",
    });
    expect(runtime.service.oauth.deviceAuthorizations.create).toHaveBeenCalledWith({
      purpose: "login",
    });
    expect(runtime.service.oauth.deviceAuthorizations.retrieve).toHaveBeenCalledWith("qr-runtime-1");
    expect(runtime.service.oauth.deviceAuthorizations.passwordCompletions.create).toHaveBeenCalledWith("qr-runtime-1", {
      password: "qr-secret",
      username: "qr-user",
    });
    expect(runtime.service.oauth.deviceAuthorizations.scans.create).toHaveBeenCalledWith("qr-runtime-1", {
      scanSource: "browser",
    });
    expect(runtime.service.auth.sessions.current.delete).toHaveBeenCalledOnce();
    expect(tokenStore.clear).toHaveBeenCalledOnce();
    expect(contextStore.clear).toHaveBeenCalledOnce();
  });

  it("surfaces organization-selection challenges from IAM runtime sign-in without committing a session", async () => {
    const tokenStore = {
      clear: vi.fn(),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
    };
    const runtime = {
      service: {
        auth: {
          sessions: {
            create: vi.fn().mockResolvedValue({
              accessToken: null,
              authToken: null,
              challengeType: "ORGANIZATION_SELECTION",
              continuationToken: "continue-org-selection-runtime-1",
              organizations: [
                {
                  displayName: "Primary Workspace",
                  organizationId: "org-1",
                  tenantId: "tenant-1",
                },
                {
                  displayName: "Secondary Workspace",
                  organizationId: "org-2",
                  tenantId: "tenant-1",
                },
              ],
            }),
          },
        },
        iam: {
          users: {
            current: {
              retrieve: vi.fn(),
            },
          },
        },
      },
      tokenStore,
    };
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => runtime as never,
    });

    const error = await controller.signIn({
      password: "secret",
      username: "sdkwork",
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(SdkworkAuthOrganizationSelectionRequiredError);
    expect((error as SdkworkAuthOrganizationSelectionRequiredError).challenge).toMatchObject({
      challengeType: "ORGANIZATION_SELECTION",
      continuationToken: "continue-org-selection-runtime-1",
      organizations: [
        {
          displayName: "Primary Workspace",
          organizationId: "org-1",
        },
        {
          displayName: "Secondary Workspace",
          organizationId: "org-2",
        },
      ],
    });
    expect(tokenStore.set).not.toHaveBeenCalled();
    expect(controller.getState()).toMatchObject({
      isAuthenticated: false,
      session: null,
      status: "anonymous",
    });
  });

  it("completes open registration without tenant selection challenge", async () => {
    const tokenStore = {
      clear: vi.fn(),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
    };
    const runtime = {
      service: {
        auth: {
          registrations: {
            create: vi.fn().mockResolvedValue({
              accessToken: mockAccessToken("registered-access-token"),
              authToken: mockAuthToken("registered-auth-token"),
              context: { tenantId: "100001" },
              refreshToken: "refresh-token",
              user: { id: "registered-user-1" },
            }),
          },
        },
      },
      tokenStore,
    };
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => runtime as never,
    });

    await expect(controller.register({
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "ada@example.test",
      password: "secret",
      username: "ada@example.test",
    })).resolves.toMatchObject({
      accessToken: mockAccessToken("registered-access-token"),
      authToken: mockAuthToken("registered-auth-token"),
      user: {
        id: "registered-user-1",
      },
    });
    expect(tokenStore.set).toHaveBeenCalled();
  });

  it("maps IAM runtime QR organization-selection completion without committing a session", async () => {
    const tokenStore = {
      clear: vi.fn(),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
    };
    const runtime = {
      service: {
        auth: {
          sessions: {
            create: vi.fn(),
          },
        },
        oauth: {
          deviceAuthorizations: {
              passwordCompletions: {
                create: vi.fn().mockResolvedValue({
                  accessToken: null,
                  authToken: null,
                  challengeType: "ORGANIZATION_SELECTION",
                  continuationToken: "continue-qr-org-selection-runtime-1",
                  organizations: [
                    {
                      displayName: "Secondary Workspace",
                      organizationId: "org-2",
                      tenantId: "tenant-1",
                    },
                  ],
                  status: "organization_selection_required",
                }),
              },

          },
        },
      },
      tokenStore,
    };
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => runtime as never,
    });

    await expect(controller.confirmLoginQrCode({
      password: "qr-secret",
      sessionKey: "qr-runtime-org-selection-1",
      username: "qr-user",
    })).resolves.toMatchObject({
      organizationSelection: {
        challengeType: "ORGANIZATION_SELECTION",
        continuationToken: "continue-qr-org-selection-runtime-1",
        organizations: [
          {
            displayName: "Secondary Workspace",
            organizationId: "org-2",
          },
        ],
      },
      status: "organizationSelectionRequired",
    });
    expect(tokenStore.set).not.toHaveBeenCalled();
  });

  it("clears IAM runtime local token and context stores when remote logout fails", async () => {
    const tokenStore = {
      clear: vi.fn(),
      get: vi.fn().mockResolvedValue({
        accessToken: mockAccessToken("stored-access-token"),
        authToken: mockAuthToken("stored-auth-token"),
      }),
      set: vi.fn(),
    };
    const contextStore = {
      clear: vi.fn(),
    };
    const deleteCurrentSession = vi.fn().mockRejectedValue(new Error("remote logout unavailable"));
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        contextStore,
        service: {
          auth: {
            passwordResetRequests: {
              create: vi.fn(),
            },
            passwordResets: {
              create: vi.fn(),
            },
            registrations: {
              create: vi.fn(),
            },
            sessions: {
              create: vi.fn(),
              current: {
                delete: deleteCurrentSession,
                retrieve: vi.fn(),
              },
            },
          },
          messaging: {
            verificationCodes: {
              create: vi.fn(),
              verify: vi.fn(),
            },
          },
          iam: {
            users: {
              current: {
                retrieve: vi.fn(),
              },
            },
          },
        },
        tokenStore,
      } as never),
    });

    await expect(controller.signOut()).rejects.toThrow("remote logout unavailable");
    expect(deleteCurrentSession).toHaveBeenCalledOnce();
    expect(tokenStore.clear).toHaveBeenCalledOnce();
    expect(contextStore.clear).toHaveBeenCalledOnce();
  });

  it("commits IAM runtime registration with the new user, context, and session id", async () => {
    const registeredContext = {
      appId: "sdkwork-chat-pc",
      authLevel: "password",
      dataScope: ["tenant:t_demo"],
      deploymentMode: "saas",
      environment: "dev",
      permissionScope: ["*"],
      sessionId: "registered-session-id",
      tenantId: "t_demo",
      userId: "registered-user-1",
    };
    const tokenStore = {
      clear: vi.fn(),
      get: vi.fn().mockResolvedValue({
        accessToken: mockAccessToken("old-access-token"),
        authToken: mockAuthToken("old-auth-token"),
        refreshToken: "old-refresh-token",
      }),
      set: vi.fn(),
    };
    const runtime = {
      service: {
        auth: {
          registrations: {
            create: vi.fn().mockResolvedValue({
              accessToken: mockAccessToken("registered-access-token"),
              authToken: mockAuthToken("registered-auth-token"),
              context: registeredContext,
              sessionId: "registered-session-id",
              user: {
                displayName: "Registered Operator",
                email: "registered@sdkwork.ai",
                userId: "registered-user-1",
                username: "registered",
              },
            }),
          },
        },
        iam: {
          users: {
            current: {
              retrieve: vi.fn(),
            },
          },
        },
      },
      tokenStore,
    };
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => runtime as never,
    });

    await expect(controller.register({
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "registered@sdkwork.ai",
      password: "secret",
      username: "registered",
    })).resolves.toMatchObject({
      accessToken: mockAccessToken("registered-access-token"),
      authToken: mockAuthToken("registered-auth-token"),
      context: registeredContext,
      sessionId: "registered-session-id",
      user: {
        email: "registered@sdkwork.ai",
        id: "registered-user-1",
      },
    });
    expect(tokenStore.set).toHaveBeenCalledWith({
      accessToken: mockAccessToken("registered-access-token"),
      authToken: mockAuthToken("registered-auth-token"),
      context: registeredContext,
      sessionId: "registered-session-id",
      user: expect.objectContaining({
        email: "registered@sdkwork.ai",
        id: "registered-user-1",
      }),
    });
    expect(controller.getState()).toMatchObject({
      isAuthenticated: true,
      session: {
        context: registeredContext,
        sessionId: "registered-session-id",
      },
      user: {
        id: "registered-user-1",
      },
    });
  });

  it("does not bootstrap IAM runtime auth from incomplete dual-token storage", async () => {
    const retrieveCurrentSession = vi.fn().mockRejectedValue(new Error("current session unavailable"));
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            sessions: {
              current: {
                retrieve: retrieveCurrentSession,
              },
            },
          },
          iam: {
            users: {
              current: {
                retrieve: vi.fn(),
              },
            },
          },
        },
        tokenStore: {
          clear: vi.fn(),
          get: vi.fn().mockResolvedValue({
            authToken: mockAuthToken("stored-auth-token"),
          }),
          set: vi.fn(),
        },
      } as never),
    });

    await expect(controller.bootstrap()).resolves.toMatchObject({
      isAuthenticated: false,
      session: null,
      status: "anonymous",
    });
    expect(retrieveCurrentSession).not.toHaveBeenCalled();
  });

  it("does not bootstrap IAM runtime auth from stored tokens when current-session validation fails", async () => {
    const retrieveCurrentSession = vi.fn().mockRejectedValue(new Error("session revoked"));
    const retrieveCurrentUser = vi.fn().mockResolvedValue({
      displayName: "Stale Runtime User",
      email: "stale-runtime@sdkwork.ai",
      id: "stale-runtime-user",
    });
    const tokenStore = {
      clear: vi.fn(),
      get: vi.fn().mockResolvedValue({
        accessToken: mockAccessToken("stored-access-token"),
        authToken: mockAuthToken("stored-auth-token"),
        refreshToken: "stored-refresh-token",
      }),
      set: vi.fn(),
    };
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            sessions: {
              current: {
                retrieve: retrieveCurrentSession,
              },
            },
          },
          iam: {
            users: {
              current: {
                retrieve: retrieveCurrentUser,
              },
            },
          },
        },
        tokenStore,
      } as never),
    });

    await expect(controller.bootstrap()).resolves.toMatchObject({
      isAuthenticated: false,
      session: null,
      status: "anonymous",
    });

    expect(retrieveCurrentSession).toHaveBeenCalledOnce();
    expect(retrieveCurrentUser).not.toHaveBeenCalled();
    expect(tokenStore.clear).toHaveBeenCalledOnce();
    expect(tokenStore.set).not.toHaveBeenCalled();
  });

  it("verifies IAM runtime code grants through messaging before creating sessions", async () => {
    const sessionsCreate = vi.fn().mockResolvedValue({
      accessToken: mockAccessToken("runtime-code-access-token"),
      authToken: mockAuthToken("runtime-code-auth-token"),
    });
    const registrationsCreate = vi.fn().mockResolvedValue({
      accessToken: mockAccessToken("runtime-registration-access-token"),
      authToken: mockAuthToken("runtime-registration-auth-token"),
    });
    const verificationCodesVerify = vi.fn().mockResolvedValue({ data: { verified: true } });
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            registrations: {
              create: registrationsCreate,
            },
            sessions: {
              create: sessionsCreate,
            },
          },
          messaging: {
            verificationCodes: {
              verify: verificationCodesVerify,
            },
          },
        },
      } as never),
    });

    await controller.signInWithEmailCode({
      code: " 123456 ",
      email: " operator@sdkwork.ai ",
    });
    await controller.signInWithPhoneCode({
      code: " 654321 ",
      phone: " 13800138000 ",
    });
    await controller.register({
      channel: "EMAIL",
      confirmPassword: "RegisterPass#2026",
      email: " operator@sdkwork.ai ",
      password: "RegisterPass#2026",
      username: " operator ",
      verificationCode: " 777777 ",
    });

    expect(verificationCodesVerify).toHaveBeenCalledWith({
      code: "123456",
      scene: "LOGIN",
      target: "operator@sdkwork.ai",
      verifyType: "EMAIL",
    });
    expect(verificationCodesVerify).toHaveBeenCalledWith({
      code: "654321",
      scene: "LOGIN",
      target: "13800138000",
      verifyType: "PHONE",
    });
    expect(verificationCodesVerify).toHaveBeenCalledWith({
      code: "777777",
      scene: "REGISTER",
      target: "operator@sdkwork.ai",
      verifyType: "EMAIL",
    });
    expect(verificationCodesVerify.mock.invocationCallOrder[0]).toBeLessThan(
      sessionsCreate.mock.invocationCallOrder[0],
    );
    expect(verificationCodesVerify.mock.invocationCallOrder[1]).toBeLessThan(
      sessionsCreate.mock.invocationCallOrder[1],
    );
    expect(verificationCodesVerify.mock.invocationCallOrder[2]).toBeLessThan(
      registrationsCreate.mock.invocationCallOrder[0],
    );
  });

  it("rejects IAM runtime registration and reset password confirmation mismatches before SDK calls", async () => {
    const registrationsCreate = vi.fn().mockResolvedValue({
      accessToken: mockAccessToken("runtime-registration-access-token"),
      authToken: mockAuthToken("runtime-registration-auth-token"),
    });
    const passwordResetsCreate = vi.fn().mockResolvedValue({ reset: true });
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            passwordResets: {
              create: passwordResetsCreate,
            },
            registrations: {
              create: registrationsCreate,
            },
          },
        },
      } as never),
    });

    await expect(controller.register({
      channel: "EMAIL",
      confirmPassword: "DifferentPass#2026",
      email: "runtime-mismatch@sdkwork.ai",
      password: "RegisterPass#2026",
      username: "runtime-mismatch",
    })).rejects.toThrow(/password/i);
    await expect(controller.resetPassword({
      account: "runtime-mismatch@sdkwork.ai",
      code: "123456",
      confirmPassword: "DifferentPass#2026",
      newPassword: "ResetPass#2026",
    })).rejects.toThrow(/password/i);

    expect(registrationsCreate).not.toHaveBeenCalled();
    expect(passwordResetsCreate).not.toHaveBeenCalled();
  });

  it("persists IAM runtime QR password completion tokens and applies the scanner session", async () => {
    const tokenStore = {
      clear: vi.fn(),
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn(),
    };
    const passwordsCreate = vi.fn().mockResolvedValue({
      accessToken: mockAccessToken("runtime-qr-password-access-token"),
      authToken: mockAuthToken("runtime-qr-password-auth-token"),
      refreshToken: "runtime-qr-password-refresh-token",
      user: {
        displayName: "Runtime QR Password Operator",
        email: "runtime-qr-password@sdkwork.ai",
        id: "runtime-qr-password-user-1",
      },
    });
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            passwordResetRequests: {
              create: vi.fn(),
            },
            passwordResets: {
              create: vi.fn(),
            },
            registrations: {
              create: vi.fn(),
            },
            sessions: {
              create: vi.fn(),
              current: {
                delete: vi.fn(),
                retrieve: vi.fn(),
              },
            },
          },
          messaging: {
            verificationCodes: {
              create: vi.fn(),
              verify: vi.fn(),
            },
          },
          iam: {
            users: {
              current: {
                retrieve: vi.fn(),
              },
            },
          },
          oauth: {
            deviceAuthorizations: {
                create: vi.fn(),
                retrieve: vi.fn(),
                passwordCompletions: {
                  create: passwordsCreate,
                },

            },
          },
        },
        tokenStore,
      } as never),
    });

    await expect(controller.confirmLoginQrCode({
      password: "runtime-secret",
      sessionKey: " runtime_qr_password_1 ",
      username: "runtime-user",
    })).resolves.toMatchObject({
      session: {
        accessToken: mockAccessToken("runtime-qr-password-access-token"),
        authToken: mockAuthToken("runtime-qr-password-auth-token"),
        refreshToken: "runtime-qr-password-refresh-token",
        user: {
          email: "runtime-qr-password@sdkwork.ai",
          id: "runtime-qr-password-user-1",
        },
      },
      status: "confirmed",
    });
    expect(passwordsCreate).toHaveBeenCalledWith("runtime_qr_password_1", {
      password: "runtime-secret",
      username: "runtime-user",
    });
    expect(tokenStore.set).toHaveBeenCalledWith({
      accessToken: mockAccessToken("runtime-qr-password-access-token"),
      authToken: mockAuthToken("runtime-qr-password-auth-token"),
      refreshToken: "runtime-qr-password-refresh-token",
      user: expect.objectContaining({
        email: "runtime-qr-password@sdkwork.ai",
        id: "runtime-qr-password-user-1",
      }),
    });
    expect(controller.getState()).toMatchObject({
      isAuthenticated: true,
      status: "authenticated",
      user: {
        email: "runtime-qr-password@sdkwork.ai",
      },
    });
  });

  it("rejects IAM runtime session bridge login without a bridge token", async () => {
    const sessionsCreate = vi.fn();
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            sessions: {
              create: sessionsCreate,
              current: {
                retrieve: vi.fn().mockResolvedValue(null),
              },
            },
          },
        },
        tokenStore: {
          clear: vi.fn(),
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn(),
        },
      } as never),
    });

    await expect(controller.signInWithSessionBridge({
      bridgeToken: " ",
      email: "bridge@sdkwork.ai",
      name: "Bridge Operator",
      subject: "sdkwork:bridge-user",
    })).rejects.toThrow(/bridge token/i);
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("rejects IAM runtime QR password completion without standard credentials", async () => {
    const create = vi.fn();
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            sessions: {
              current: {
                retrieve: vi.fn().mockResolvedValue(null),
              },
            },
          },
          oauth: {
            deviceAuthorizations: {
                passwordCompletions: {
                  create,
                },

            },
          },
        },
        tokenStore: {
          clear: vi.fn(),
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn(),
        },
      } as never),
    });

    await expect(controller.confirmLoginQrCode({
      sessionKey: "runtime_qr_missing_credentials",
    })).rejects.toThrow(/username/i);
    await expect(controller.confirmLoginQrCode({
      sessionKey: "runtime_qr_missing_password",
      username: "runtime-user",
      password: " ",
    })).rejects.toThrow(/password/i);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects IAM runtime QR scans with a non-standard scan source", async () => {
    const create = vi.fn();
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            sessions: {
              current: {
                retrieve: vi.fn().mockResolvedValue(null),
              },
            },
          },
          oauth: {
            deviceAuthorizations: {
                scans: {
                  create,
                },

            },
          },
        },
        tokenStore: {
          clear: vi.fn(),
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn(),
        },
      } as never),
    });

    await expect(controller.callbackLoginQrCode({
      sessionKey: "runtime_qr_invalid_scan_source",
      scanSource: "wechat",
    })).rejects.toThrow(/scan source/i);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects IAM runtime QR session creation with a non-standard purpose", async () => {
    const create = vi.fn();
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            sessions: {
              current: {
                retrieve: vi.fn().mockResolvedValue(null),
              },
            },
          },
          oauth: {
            deviceAuthorizations: {
                create,

            },
          },
        },
        tokenStore: {
          clear: vi.fn(),
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn(),
        },
      } as never),
    });

    await expect(controller.generateLoginQrCode({
      purpose: "reset_password",
    } as never)).rejects.toThrow(/purpose/i);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects IAM runtime QR content that points to the session status API", async () => {
    const create = vi.fn().mockResolvedValue({
      fallbackUrl: "http://127.0.0.1:18079/app/v3/api/oauth/device_authorizations/sdkwork-local-qr-5",
      sessionKey: "sdkwork-local-qr-5",
    });
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            sessions: {
              current: {
                retrieve: vi.fn().mockResolvedValue(null),
              },
            },
          },
          oauth: {
            deviceAuthorizations: {
                create,

            },
          },
        },
        tokenStore: {
          clear: vi.fn(),
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn(),
        },
      } as never),
    });

    await expect(controller.generateLoginQrCode()).rejects.toThrow(/QR auth content/i);
  });

  it("preserves backend QR images as MediaResource objects from IAM runtime responses", async () => {
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            passwordResetRequests: {
              create: vi.fn(),
            },
            passwordResets: {
              create: vi.fn(),
            },
            registrations: {
              create: vi.fn(),
            },
            sessions: {
              create: vi.fn(),
              current: {
                delete: vi.fn(),
                retrieve: vi.fn(),
              },
            },
          },
          messaging: {
            verificationCodes: {
              create: vi.fn(),
              verify: vi.fn(),
            },
          },
          oauth: {
            deviceAuthorizations: {
                create: vi.fn().mockResolvedValue({
                  qrCode: runtimeQrCode,
                  qrContent: "sdkwork://auth/runtime-url-fallback",
                  sessionKey: "qr-runtime-url-1",
                }),
                retrieve: vi.fn(),

            },
          },
          iam: {
            users: {
              current: {
                retrieve: vi.fn(),
              },
            },
          },
        },
      }),
    });

    await expect(controller.generateLoginQrCode()).resolves.toMatchObject({
      qrContent: "sdkwork://auth/runtime-url-fallback",
      qrCode: runtimeQrCode,
      sessionKey: "qr-runtime-url-1",
    });
  });

  it("keeps text-only IAM runtime QR content separate from QR image resources", async () => {
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            passwordResetRequests: {
              create: vi.fn(),
            },
            passwordResets: {
              create: vi.fn(),
            },
            registrations: {
              create: vi.fn(),
            },
            sessions: {
              create: vi.fn(),
              current: {
                delete: vi.fn(),
                retrieve: vi.fn(),
              },
            },
          },
          messaging: {
            verificationCodes: {
              create: vi.fn(),
              verify: vi.fn(),
            },
          },
          oauth: {
            deviceAuthorizations: {
                create: vi.fn().mockResolvedValue({
                  qrContent: "https://mp.weixin.qq.com/sdkwork-login?session_key=qr-runtime-content-1",
                  sessionKey: "qr-runtime-content-1",
                }),
                retrieve: vi.fn(),

            },
          },
          iam: {
            users: {
              current: {
                retrieve: vi.fn(),
              },
            },
          },
        },
      }),
    });

    await expect(controller.generateLoginQrCode()).resolves.toMatchObject({
      qrContent: "https://mp.weixin.qq.com/sdkwork-login?session_key=qr-runtime-content-1",
      qrCode: undefined,
      sessionKey: "qr-runtime-content-1",
    });
  });

  it("keeps IAM runtime fallback URLs as QR content instead of rendered image assets", async () => {
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            passwordResetRequests: {
              create: vi.fn(),
            },
            passwordResets: {
              create: vi.fn(),
            },
            registrations: {
              create: vi.fn(),
            },
            sessions: {
              create: vi.fn(),
              current: {
                delete: vi.fn(),
                retrieve: vi.fn(),
              },
            },
          },
          messaging: {
            verificationCodes: {
              create: vi.fn(),
              verify: vi.fn(),
            },
          },
          oauth: {
            deviceAuthorizations: {
                create: vi.fn().mockResolvedValue({
                  qrContent: {
                    content: "https://console.example.test/auth/qr/qr-runtime-alias-1?session_key=qr-runtime-alias-1&purpose=login",
                    mode: "fallback_url",
                  },
                  sessionKey: "qr-runtime-alias-1",
                }),
                retrieve: vi.fn(),

            },
          },
          iam: {
            users: {
              current: {
                retrieve: vi.fn(),
              },
            },
          },
        },
      }),
    });

    await expect(controller.generateLoginQrCode()).resolves.toMatchObject({
      qrContent: "https://console.example.test/auth/qr/qr-runtime-alias-1?session_key=qr-runtime-alias-1&purpose=login",
      qrCode: undefined,
      sessionKey: "qr-runtime-alias-1",
      type: "fallback_url",
    });
  });

  it("maps login responses and persists runtime session tokens through standard resource SDK methods", async () => {
    const commitSession = vi.fn();
    const client = {
      auth: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            code: "2000",
            data: {
              accessToken: mockAccessToken("access-token-1"),
              authToken: mockAuthToken("auth-token-1"),
              refreshToken: "refresh-token-1",
              user: {
                email: "sdkwork@sdkwork.ai",
                displayName: "Sdkwork Operator",
              },
            },
          }),
        },
      },
      iam: {
        users: {
          current: {
            retrieve: vi.fn().mockResolvedValue({
              code: "2000",
              data: {
                avatar: authAvatar,
                email: "sdkwork@sdkwork.ai",
                displayName: "Sdkwork Operator",
                userId: "user-1",
                username: "sdkwork",
              },
            }),
          },
        },
      },
    };

    const service = createSdkworkAuthService({
      getClient: () => client,
      commitSession,
      resolveAccessToken: () => "access-token-1",
    });

    const session = await service.signIn({
      password: "secret",
      username: "sdkwork",
    });

    expect(client.auth.sessions.create).toHaveBeenCalledWith({
      grantType: "password",
      password: "secret",
      username: "sdkwork",
    });
    expect(commitSession).toHaveBeenCalledWith({
      accessToken: mockAccessToken("access-token-1"),
      authToken: mockAuthToken("auth-token-1"),
      refreshToken: "refresh-token-1",
    });
    expect(session).toEqual({
      accessToken: mockAccessToken("access-token-1"),
      authToken: mockAuthToken("auth-token-1"),
      refreshToken: "refresh-token-1",
      user: {
        avatar: authAvatar,
        displayName: "Sdkwork Operator",
        email: "sdkwork@sdkwork.ai",
        firstName: "Sdkwork",
        id: "user-1",
        initials: "SO",
        lastName: "Operator",
        username: "sdkwork",
      },
    });
  });

  it("preserves appbase login context and session id when committing a password session", async () => {
    const commitSession = vi.fn();
    const loginContext = {
      appId: "sdkwork-chat",
      deploymentMode: "saas",
      environment: "dev",
      loginScope: "ORGANIZATION",
      organizationId: "org-1",
      sessionId: "session-1",
      tenantId: "tenant-1",
      userId: "user-1",
    };
    const accessToken = mockAccessToken("access-token-1", {
      app_id: "sdkwork-chat",
      environment: "dev",
    });
    const authToken = mockAuthToken("auth-token-1", {
      app_id: "sdkwork-chat",
      environment: "dev",
    });
    const client = {
      auth: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            data: {
              accessToken,
              authToken,
              context: loginContext,
              refreshToken: "refresh-token-1",
              sessionId: "session-1",
            },
          }),
        },
      },
    };

    const service = createSdkworkAuthService({
      commitSession,
      getClient: () => client,
    });

    const session = await service.signIn({
      password: "secret",
      username: "sdkwork",
    });

    expect(commitSession).toHaveBeenCalledWith({
      accessToken,
      authToken,
      context: loginContext,
      refreshToken: "refresh-token-1",
      sessionId: "session-1",
    });
    expect(session).toMatchObject({
      accessToken,
      authToken,
      context: loginContext,
      refreshToken: "refresh-token-1",
      sessionId: "session-1",
    });
  });

  it("normalizes appbase login context without exposing shardingContext or duplicate wire aliases", async () => {
    const commitSession = vi.fn();
    const chatAccessToken = mockAccessToken("access-token-1", { app_id: "sdkwork-chat" });
    const chatAuthToken = mockAuthToken("auth-token-1", { app_id: "sdkwork-chat" });
    const client = {
      auth: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            data: {
              accessToken: chatAccessToken,
              authToken: chatAuthToken,
              context: {
                app_id: "sdkwork-chat",
                auth_level: "password",
                data_scope: ["tenant:tenant-1"],
                deployment_mode: "saas",
                environment: "test",
                extraContext: "must-not-leak",
                login_scope: "ORGANIZATION",
                organization_id: "org-1",
                permission_scope: ["iam.users.read"],
                session_id: "session-1",
                shardingContext: {
                  shardingKey: "wrong",
                  shardingStrategy: "single",
                },
                tenant_id: "tenant-1",
                user_id: "user-1",
              },
            },
          }),
        },
      },
    };

    const service = createSdkworkAuthService({
      commitSession,
      getClient: () => client,
    });

    const session = await service.signIn({
      password: "secret",
      username: "sdkwork",
    });

    expect(session.context).toEqual({
      appId: "sdkwork-chat",
      authLevel: "password",
      dataScope: ["tenant:tenant-1"],
      deploymentMode: "saas",
      environment: "test",
      loginScope: "ORGANIZATION",
      organizationId: "org-1",
      permissionScope: ["iam.users.read"],
      sessionId: "session-1",
      tenantId: "tenant-1",
      userId: "user-1",
    });
    expect(session.sessionId).toBe("session-1");
    expect(commitSession).toHaveBeenCalledWith({
      accessToken: chatAccessToken,
      authToken: chatAuthToken,
      context: session.context,
      sessionId: "session-1",
    });
  });

  it("surfaces organization-selection login challenges without committing a session", async () => {
    const commitSession = vi.fn();
    const client = {
      auth: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            data: {
              accessToken: null,
              authToken: null,
              challengeType: "ORGANIZATION_SELECTION",
              continuationToken: "continue-org-selection-1",
              organizations: [
                {
                  displayName: "Primary Workspace",
                  organizationId: "org-1",
                  tenantId: "tenant-1",
                },
                {
                  displayName: "Secondary Workspace",
                  organizationId: "org-2",
                  tenantId: "tenant-1",
                },
              ],
            },
          }),
        },
      },
    };
    const service = createSdkworkAuthService({
      commitSession,
      getClient: () => client,
    });

    let error: unknown;
    try {
      await service.signIn({
        password: "secret",
        username: "sdkwork",
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(SdkworkAuthOrganizationSelectionRequiredError);
    expect((error as SdkworkAuthOrganizationSelectionRequiredError).challenge).toMatchObject({
      challengeType: "ORGANIZATION_SELECTION",
      continuationToken: "continue-org-selection-1",
      organizations: [
        {
          displayName: "Primary Workspace",
          organizationId: "org-1",
          tenantId: "tenant-1",
        },
        {
          displayName: "Secondary Workspace",
          organizationId: "org-2",
          tenantId: "tenant-1",
        },
      ],
    });
    expect(commitSession).not.toHaveBeenCalled();
  });

  it("completes organization selection through login context selection before committing the session", async () => {
    const commitSession = vi.fn();
    const selectedAccessToken = mockAccessToken("selected-access-token", {
      app_id: "sdkwork-chat",
      login_scope: "ORGANIZATION",
      organization_id: "org-2",
      session_id: "session-2",
      tenant_id: "tenant-1",
      user_id: "user-1",
    });
    const selectedAuthToken = mockAuthToken("selected-auth-token", {
      app_id: "sdkwork-chat",
      login_scope: "ORGANIZATION",
      organization_id: "org-2",
      session_id: "session-2",
      tenant_id: "tenant-1",
      user_id: "user-1",
    });
    const loginContextSelectionCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: selectedAccessToken,
        authToken: selectedAuthToken,
        context: {
          appId: "sdkwork-chat",
          loginScope: "ORGANIZATION",
          organizationId: "org-2",
          sessionId: "session-2",
          tenantId: "tenant-1",
          userId: "user-1",
        },
        refreshToken: "selected-refresh-token",
        sessionId: "session-2",
      },
    });
    const client = {
      auth: {
        sessions: {
          loginContextSelection: {
            create: loginContextSelectionCreate,
          },
        },
      },
    };
    const service = createSdkworkAuthService({
      commitSession,
      getClient: () => client,
    });

    await expect(service.selectOrganization({
      continuationToken: " continue-org-selection-1 ",
      organizationId: " org-2 ",
    })).resolves.toMatchObject({
      accessToken: selectedAccessToken,
      authToken: selectedAuthToken,
      context: {
        organizationId: "org-2",
        sessionId: "session-2",
      },
      refreshToken: "selected-refresh-token",
      sessionId: "session-2",
    });
    expect(loginContextSelectionCreate).toHaveBeenCalledWith({
      continuationToken: "continue-org-selection-1",
      loginScope: "ORGANIZATION",
      organizationId: "org-2",
    });
    expect(commitSession).toHaveBeenCalledWith({
      accessToken: selectedAccessToken,
      authToken: selectedAuthToken,
      context: expect.objectContaining({
        organizationId: "org-2",
        sessionId: "session-2",
      }),
      refreshToken: "selected-refresh-token",
      sessionId: "session-2",
    });
  });

  it("completes personal login through login context selection before committing the session", async () => {
    const commitSession = vi.fn();
    const selectedAccessToken = mockAccessToken("personal-access-token", {
      app_id: "sdkwork-chat",
      login_scope: "TENANT",
      organization_id: "0",
      session_id: "session-personal",
      tenant_id: "tenant-1",
      user_id: "user-1",
    });
    const selectedAuthToken = mockAuthToken("personal-auth-token", {
      app_id: "sdkwork-chat",
      login_scope: "TENANT",
      organization_id: "0",
      session_id: "session-personal",
      tenant_id: "tenant-1",
      user_id: "user-1",
    });
    const loginContextSelectionCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: selectedAccessToken,
        authToken: selectedAuthToken,
        context: {
          appId: "sdkwork-chat",
          loginScope: "TENANT",
          sessionId: "session-personal",
          tenantId: "tenant-1",
          userId: "user-1",
        },
        refreshToken: "personal-refresh-token",
        sessionId: "session-personal",
      },
    });
    const service = createSdkworkAuthService({
      commitSession,
      getClient: () => ({
        auth: {
          sessions: {
            loginContextSelection: {
              create: loginContextSelectionCreate,
            },
          },
        },
      }),
    });

    await expect(service.selectPersonalLogin({
      continuationToken: " continue-personal-login-1 ",
    })).resolves.toMatchObject({
      accessToken: selectedAccessToken,
      authToken: selectedAuthToken,
      context: {
        loginScope: "TENANT",
        sessionId: "session-personal",
      },
      refreshToken: "personal-refresh-token",
      sessionId: "session-personal",
    });
    expect(loginContextSelectionCreate).toHaveBeenCalledWith({
      continuationToken: "continue-personal-login-1",
      loginScope: "TENANT",
      organizationId: "0",
    });
  });

  it("creates registrations through auth.registrations.create without falling back to password login", async () => {
    const commitSession = vi.fn();
    const registrationsCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("registered-access-token"),
        authToken: mockAuthToken("registered-auth-token"),
        refreshToken: "registered-refresh-token",
        user: {
          displayName: "Registered Operator",
          email: "registered@sdkwork.ai",
          userId: "registered-user-1",
          username: "registered",
        },
      },
    });
    const sessionsCreate = vi.fn();
    const verificationCodesVerify = vi.fn().mockResolvedValue({ data: { verified: true } });
    const client = {
      auth: {
        registrations: {
          create: registrationsCreate,
        },
        sessions: {
          create: sessionsCreate,
        },
      },
      iam: {
        users: {
          current: {
            retrieve: vi.fn().mockResolvedValue({
              data: {
                displayName: "Registered Operator",
                email: "registered@sdkwork.ai",
                userId: "registered-user-1",
                username: "registered",
              },
            }),
          },
        },
      },
      messaging: {
        verificationCodes: {
          verify: verificationCodesVerify,
        },
      },
    };

    const service = createSdkworkAuthService({
      getClient: () => client,
      commitSession,
    });

    const session = await service.register({
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "registered@sdkwork.ai",
      password: "secret",
      username: "registered",
      verificationCode: "123456",
    });

    expect(registrationsCreate).toHaveBeenCalledWith({
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "registered@sdkwork.ai",
      password: "secret",
      phone: undefined,
      username: "registered",
      verificationCode: "123456",
    });
    expect(verificationCodesVerify).toHaveBeenCalledWith({
      code: "123456",
      scene: "REGISTER",
      target: "registered@sdkwork.ai",
      verifyType: "EMAIL",
    });
    expect(verificationCodesVerify.mock.invocationCallOrder[0]).toBeLessThan(
      registrationsCreate.mock.invocationCallOrder[0],
    );
    expect(sessionsCreate).not.toHaveBeenCalled();
    expect(commitSession).toHaveBeenCalledWith({
      accessToken: mockAccessToken("registered-access-token"),
      authToken: mockAuthToken("registered-auth-token"),
      refreshToken: "registered-refresh-token",
    });
    expect(session).toMatchObject({
      accessToken: mockAccessToken("registered-access-token"),
      authToken: mockAuthToken("registered-auth-token"),
      user: {
        email: "registered@sdkwork.ai",
        id: "registered-user-1",
      },
    });
  });

  it("rejects mismatched registration password confirmation before calling the app SDK", async () => {
    const registrationsCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("registered-access-token"),
        authToken: mockAuthToken("registered-auth-token"),
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {
          registrations: {
            create: registrationsCreate,
          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.register({
      confirmPassword: "DifferentPass#2026",
      email: "mismatch@sdkwork.ai",
      password: "RegisterPass#2026",
      username: "mismatch",
    })).rejects.toThrow(/password/i);

    expect(registrationsCreate).not.toHaveBeenCalled();
  });

  it("rejects mismatched password reset confirmation before calling the app SDK", async () => {
    const passwordResetsCreate = vi.fn().mockResolvedValue({ data: { reset: true } });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {
          passwordResets: {
            create: passwordResetsCreate,
          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.resetPassword({
      account: "mismatch@sdkwork.ai",
      code: "123456",
      confirmPassword: "DifferentPass#2026",
      newPassword: "ResetPass#2026",
    })).rejects.toThrow(/password/i);

    expect(passwordResetsCreate).not.toHaveBeenCalled();
  });

  it("does not synthesize missing password confirmations for registration or reset SDK calls", async () => {
    const registrationsCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("registered-access-token"),
        authToken: mockAuthToken("registered-auth-token"),
      },
    });
    const passwordResetsCreate = vi.fn().mockResolvedValue({ data: { reset: true } });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {
          passwordResets: {
            create: passwordResetsCreate,
          },
          registrations: {
            create: registrationsCreate,
          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await service.register({
      email: "missing-confirm@sdkwork.ai",
      password: "RegisterPass#2026",
      username: "missing-confirm",
    });
    await service.resetPassword({
      account: "missing-confirm@sdkwork.ai",
      code: "123456",
      newPassword: "ResetPass#2026",
    });

    expect(registrationsCreate).toHaveBeenCalledWith(expect.objectContaining({
      confirmPassword: undefined,
      password: "RegisterPass#2026",
    }));
    expect(passwordResetsCreate).toHaveBeenCalledWith(expect.objectContaining({
      confirmPassword: undefined,
      newPassword: "ResetPass#2026",
    }));
  });

  it("preserves password whitespace when calling app SDK registration and reset resources", async () => {
    const registrationsCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("registered-access-token"),
        authToken: mockAuthToken("registered-auth-token"),
        user: {
          email: "space-password@sdkwork.ai",
          userId: "space-password-user",
        },
      },
    });
    const passwordResetsCreate = vi.fn().mockResolvedValue({ data: { reset: true } });
    const verificationCodesVerify = vi.fn().mockResolvedValue({ data: { verified: true } });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {
          passwordResets: {
            create: passwordResetsCreate,
          },
          registrations: {
            create: registrationsCreate,
          },
        },
        messaging: {
          verificationCodes: {
            verify: verificationCodesVerify,
          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await service.register({
      channel: "EMAIL",
      confirmPassword: " SpacePass#2026 ",
      email: " space-password@sdkwork.ai ",
      password: " SpacePass#2026 ",
      username: " space-password ",
      verificationCode: " 123456 ",
    });
    await service.resetPassword({
      account: " space-password@sdkwork.ai ",
      code: " 654321 ",
      confirmPassword: " ResetPass#2026 ",
      newPassword: " ResetPass#2026 ",
    });

    expect(registrationsCreate).toHaveBeenCalledWith({
      channel: "EMAIL",
      confirmPassword: " SpacePass#2026 ",
      email: "space-password@sdkwork.ai",
      password: " SpacePass#2026 ",
      phone: undefined,
      username: "space-password",
      verificationCode: "123456",
    });
    expect(verificationCodesVerify).toHaveBeenCalledWith({
      code: "123456",
      scene: "REGISTER",
      target: "space-password@sdkwork.ai",
      verifyType: "EMAIL",
    });
    expect(passwordResetsCreate).toHaveBeenCalledWith({
      account: "space-password@sdkwork.ai",
      code: "654321",
      confirmPassword: " ResetPass#2026 ",
      newPassword: " ResetPass#2026 ",
    });
  });

  it("preserves password whitespace through canonical auth controller adapters", async () => {
    const register = vi.fn().mockResolvedValue({
      accessToken: mockAccessToken("canonical-register-access-token"),
      authToken: mockAuthToken("canonical-register-auth-token"),
      user: {
        email: "canonical@sdkwork.ai",
        id: "canonical-user",
      },
    });
    const resetPassword = vi.fn().mockResolvedValue(undefined);
    const controller = createSdkworkCanonicalAuthController({
      service: {
        login: vi.fn(),
        logout: vi.fn(async () => undefined),
        register,
        resetPassword,
      },
      toUser(user: LocalAuthTestUser) {
        return {
          displayName: user.name,
          email: user.email,
          firstName: "Canonical",
          id: user.id,
          initials: "CU",
          lastName: "User",
          username: user.email,
        };
      },
    });

    await controller.register({
      channel: "EMAIL",
      confirmPassword: " SpacePass#2026 ",
      email: " canonical@sdkwork.ai ",
      password: " SpacePass#2026 ",
      username: " canonical ",
      verificationCode: " 123456 ",
    });
    await controller.resetPassword({
      account: " canonical@sdkwork.ai ",
      code: " 654321 ",
      confirmPassword: " ResetPass#2026 ",
      newPassword: " ResetPass#2026 ",
    });

    expect(register).toHaveBeenCalledWith({
      channel: "EMAIL",
      confirmPassword: " SpacePass#2026 ",
      email: "canonical@sdkwork.ai",
      name: "canonical",
      password: " SpacePass#2026 ",
      phone: undefined,
      username: "canonical",
      verificationCode: "123456",
    });
    expect(resetPassword).toHaveBeenCalledWith({
      account: "canonical@sdkwork.ai",
      code: "654321",
      confirmPassword: " ResetPass#2026 ",
      newPassword: " ResetPass#2026 ",
    });
  });

  it("preserves the stored refresh token only for refresh and current-session continuation flows", async () => {
    const commitSession = vi.fn();
    const sessionsRefresh = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("refreshed-access-token"),
        authToken: mockAuthToken("refreshed-auth-token"),
      },
    });
    const sessionsCurrentUpdate = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("updated-access-token"),
        authToken: mockAuthToken("updated-auth-token"),
      },
    });
    const service = createSdkworkAuthService({
      commitSession,
      getClient: () => ({
        auth: {
          sessions: {
            current: {
              update: sessionsCurrentUpdate,
            },
            refresh: sessionsRefresh,
          },
        },
      } as unknown as SdkworkAuthClient),
      readSession: () => ({
        accessToken: mockAccessToken("stored-access-token"),
        authToken: mockAuthToken("stored-auth-token"),
        refreshToken: "stored-refresh-token",
      }),
    });

    await expect(service.refreshSession()).resolves.toMatchObject({
      accessToken: mockAccessToken("refreshed-access-token"),
      authToken: mockAuthToken("refreshed-auth-token"),
      refreshToken: "stored-refresh-token",
    });
    await expect(service.updateCurrentSession({
      organizationId: "org-1",
    })).resolves.toMatchObject({
      accessToken: mockAccessToken("updated-access-token"),
      authToken: mockAuthToken("updated-auth-token"),
      refreshToken: "stored-refresh-token",
    });

    expect(sessionsRefresh).toHaveBeenCalledWith({
      refreshToken: "stored-refresh-token",
    });
    expect(sessionsCurrentUpdate).toHaveBeenCalledWith({
      organizationId: "org-1",
    });
    expect(commitSession).toHaveBeenNthCalledWith(
      1,
      {
        accessToken: mockAccessToken("refreshed-access-token"),
        authToken: mockAuthToken("refreshed-auth-token"),
        refreshToken: "stored-refresh-token",
      },
      { preserveRefreshToken: true },
    );
    expect(commitSession).toHaveBeenNthCalledWith(
      2,
      {
        accessToken: mockAccessToken("updated-access-token"),
        authToken: mockAuthToken("updated-auth-token"),
        refreshToken: "stored-refresh-token",
      },
      { preserveRefreshToken: true },
    );
  });

  it("switches to personal login scope through auth.sessions.current.update", async () => {
    const commitSession = vi.fn();
    const personalAccessToken = mockAccessToken("personal-access-token", {
      app_id: "sdkwork-chat",
      login_scope: "TENANT",
      organization_id: "0",
      session_id: "session-personal",
      tenant_id: "tenant-1",
      user_id: "user-1",
    });
    const personalAuthToken = mockAuthToken("personal-auth-token", {
      app_id: "sdkwork-chat",
      login_scope: "TENANT",
      organization_id: "0",
      session_id: "session-personal",
      tenant_id: "tenant-1",
      user_id: "user-1",
    });
    const sessionsCurrentUpdate = vi.fn().mockResolvedValue({
      data: {
        accessToken: personalAccessToken,
        authToken: personalAuthToken,
        context: {
          appId: "sdkwork-chat",
          dataScope: ["tenant:tenant-1", "user:user-1"],
          loginScope: "TENANT",
          sessionId: "session-personal",
          tenantId: "tenant-1",
          userId: "user-1",
        },
        sessionId: "session-personal",
      },
    });
    const service = createSdkworkAuthService({
      commitSession,
      getClient: () => ({
        auth: {
          sessions: {
            current: {
              update: sessionsCurrentUpdate,
            },
          },
        },
      } as unknown as SdkworkAuthClient),
      readSession: () => ({
        accessToken: mockAccessToken("org-access-token", {
          login_scope: "ORGANIZATION",
          organization_id: "org-1",
        }),
        authToken: mockAuthToken("org-auth-token", {
          login_scope: "ORGANIZATION",
          organization_id: "org-1",
        }),
        refreshToken: "stored-refresh-token",
      }),
    });

    await expect(service.updateCurrentSession({
      loginScope: "TENANT",
    })).resolves.toMatchObject({
      accessToken: personalAccessToken,
      authToken: personalAuthToken,
      context: {
        loginScope: "TENANT",
        sessionId: "session-personal",
      },
      refreshToken: "stored-refresh-token",
    });
    expect(sessionsCurrentUpdate).toHaveBeenCalledWith({
      loginScope: "TENANT",
      organizationId: "0",
    });
    expect(commitSession).toHaveBeenCalledWith(
      {
        accessToken: personalAccessToken,
        authToken: personalAuthToken,
        context: expect.objectContaining({
          loginScope: "TENANT",
          sessionId: "session-personal",
        }),
        refreshToken: "stored-refresh-token",
        sessionId: "session-personal",
      },
      { preserveRefreshToken: true },
    );
  });

  it("does not forward sessionId or token aliases during refresh", async () => {
    const sessionsRefresh = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("refreshed-access-token"),
        authToken: mockAuthToken("refreshed-auth-token"),
        refreshToken: "rotated-refresh-token",
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {
          sessions: {
            refresh: sessionsRefresh,
          },
        },
      } as unknown as SdkworkAuthClient),
      readSession: () => ({
        accessToken: mockAccessToken("stored-access-token"),
        authToken: mockAuthToken("stored-auth-token"),
        refreshToken: "stored-refresh-token",
      }),
    });

    await expect(service.refreshSession({
      refreshToken: "explicit-refresh-token",
      sessionId: "must-not-forward",
      token: "must-not-forward",
    } as unknown as { refreshToken: string })).resolves.toMatchObject({
      accessToken: mockAccessToken("refreshed-access-token"),
      authToken: mockAuthToken("refreshed-auth-token"),
      refreshToken: "rotated-refresh-token",
    });

    expect(sessionsRefresh).toHaveBeenCalledWith({
      refreshToken: "explicit-refresh-token",
    });
  });

  it("clears stored sessions when refresh fails", async () => {
    const sessionsRefresh = vi.fn().mockRejectedValue(new Error("refresh token invalid"));
    const clearSession = vi.fn();
    const service = createSdkworkAuthService({
      clearSession,
      getClient: () => ({
        auth: {
          sessions: {
            refresh: sessionsRefresh,
          },
        },
      } as unknown as SdkworkAuthClient),
      readSession: () => ({
        accessToken: mockAccessToken("stored-access-token"),
        authToken: mockAuthToken("stored-auth-token"),
        refreshToken: "stored-refresh-token",
      }),
    });

    await expect(service.refreshSession()).rejects.toThrow("refresh token invalid");
    expect(sessionsRefresh).toHaveBeenCalledOnce();
    expect(clearSession).toHaveBeenCalledOnce();
  });

  it("allows registration without verificationCode when the app policy does not require one", async () => {
    const legacyRegister = vi.fn().mockResolvedValue({});
    const legacyLogin = vi.fn().mockResolvedValue({
      data: {
        authToken: mockAuthToken("legacy-auth-token"),
      },
    });
    const registrationsCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("registered-access-token"),
        authToken: mockAuthToken("registered-auth-token"),
        user: {
          displayName: "Missing Code Operator",
          email: "missing-code@sdkwork.ai",
          userId: "missing-code-user",
        },
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {
          login: legacyLogin,
          register: legacyRegister,
          registrations: {
            create: registrationsCreate,
          },
        },
      } as unknown as SdkworkAuthClient),
      resolveAccessToken: () => "access-token",
    });

    await expect(service.register({
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "missing-code@sdkwork.ai",
      password: "secret",
      username: "missing-code",
    })).resolves.toMatchObject({
      authToken: mockAuthToken("registered-auth-token"),
      user: {
        email: "missing-code@sdkwork.ai",
      },
    });
    expect(registrationsCreate).toHaveBeenCalledWith({
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "missing-code@sdkwork.ai",
      password: "secret",
      phone: undefined,
      username: "missing-code",
    });
    expect(legacyRegister).not.toHaveBeenCalled();
    expect(legacyLogin).not.toHaveBeenCalled();
  });

  it("retrieves and normalizes public IAM verification policy through the system IAM resource SDK", async () => {
    const retrieve = vi.fn().mockResolvedValue({
      data: {
        emailCodeLoginEnabled: true,
        emailRegisterVerificationRequired: true,
        phoneCodeLoginEnabled: false,
        phoneRegisterVerificationRequired: false,
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {
        },
        system: {
          iam: {
            verificationPolicy: {
              retrieve,
            },
          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.getVerificationPolicy()).resolves.toEqual({
      emailCodeLoginEnabled: true,
      emailRegistrationVerificationRequired: true,
      phoneCodeLoginEnabled: false,
      phoneRegistrationVerificationRequired: false,
    });
    expect(retrieve).toHaveBeenCalledOnce();
  });

  it("passes optional registration verificationCode through the IAM runtime only when provided", async () => {
    const registrationsCreate = vi.fn().mockResolvedValue({
      accessToken: mockAccessToken("registered-access-token"),
      authToken: mockAuthToken("registered-auth-token"),
      user: {
        displayName: "Runtime Registered",
        email: "runtime@sdkwork.ai",
        id: "runtime-user",
      },
    });
    const verificationCodesVerify = vi.fn().mockResolvedValue({ data: { verified: true } });
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            passwordResetRequests: {
              create: vi.fn(),
            },
            passwordResets: {
              create: vi.fn(),
            },
            registrations: {
              create: registrationsCreate,
            },
            sessions: {
              create: vi.fn(),
              current: {
                delete: vi.fn(),
                retrieve: vi.fn(),
              },
            },
          },
          messaging: {
            verificationCodes: {
              create: vi.fn(),
              verify: verificationCodesVerify,
            },
          },
          iam: {
            users: {
              current: {
                retrieve: vi.fn(),
              },
            },
          },
        },
      }),
    });

    await controller.register({
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "runtime@sdkwork.ai",
      password: "secret",
      username: "runtime",
    });
    await controller.register({
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "runtime@sdkwork.ai",
      password: "secret",
      username: "runtime",
      verificationCode: " 123456 ",
    });

    expect(verificationCodesVerify).toHaveBeenCalledWith({
      code: "123456",
      scene: "REGISTER",
      target: "runtime@sdkwork.ai",
      verifyType: "EMAIL",
    });
    expect(verificationCodesVerify.mock.invocationCallOrder[0]).toBeLessThan(
      registrationsCreate.mock.invocationCallOrder[1],
    );
    expect(registrationsCreate).toHaveBeenNthCalledWith(1, {
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "runtime@sdkwork.ai",
      password: "secret",
      phone: undefined,
      username: "runtime",
    });
    expect(registrationsCreate).toHaveBeenNthCalledWith(2, {
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "runtime@sdkwork.ai",
      password: "secret",
      phone: undefined,
      username: "runtime",
      verificationCode: "123456",
    });
  });

  it("passes optional registration verificationCode through canonical runtime authority only when provided", async () => {
    const register = vi.fn()
      .mockResolvedValueOnce({
        accessToken: mockAccessToken("canonical-access-1"),
        authToken: mockAuthToken("canonical-auth-1"),
        sessionId: "canonical-session-1",
        user: {
          email: "runtime@sdkwork.ai",
          id: "runtime-user",
          name: "Runtime User",
        },
      } satisfies {
        accessToken: string;
        authToken: string;
        sessionId: string;
        user: LocalAuthTestUser;
      })
      .mockResolvedValueOnce({
        accessToken: mockAccessToken("canonical-access-2"),
        authToken: mockAuthToken("canonical-auth-2"),
        sessionId: "canonical-session-2",
        user: {
          email: "runtime@sdkwork.ai",
          id: "runtime-user",
          name: "Runtime User",
        },
      } satisfies {
        accessToken: string;
        authToken: string;
        sessionId: string;
        user: LocalAuthTestUser;
      });
    const authority = createSdkworkCanonicalRuntimeAuthAuthorityService({
      clearSessionToken: vi.fn(),
      login: vi.fn(),
      mapProfileUser: (profile: LocalAuthTestUser) => profile,
      mapSessionUser: (session: {
        sessionId: string;
        user: LocalAuthTestUser;
      }) => session.user,
      readSessionToken: vi.fn().mockReturnValue(null),
      register,
      writeSessionToken: vi.fn((token: string) => token),
    });

    await expect(authority.register({
      email: " runtime@sdkwork.ai ",
      password: "secret",
      username: " runtime ",
    })).resolves.toMatchObject({
      accessToken: mockAccessToken("canonical-access-1"),
      authToken: mockAuthToken("canonical-auth-1"),
      user: {
        email: "runtime@sdkwork.ai",
      },
    });
    await authority.register({
      email: " runtime@sdkwork.ai ",
      password: "secret",
      username: " runtime ",
      verificationCode: " 123456 ",
    });

    expect(register).toHaveBeenNthCalledWith(1, {
      channel: undefined,
      confirmPassword: undefined,
      email: "runtime@sdkwork.ai",
      name: "runtime",
      password: "secret",
      phone: undefined,
      username: "runtime",
    });
    expect(register).toHaveBeenNthCalledWith(2, {
      channel: undefined,
      confirmPassword: undefined,
      email: "runtime@sdkwork.ai",
      name: "runtime",
      password: "secret",
      phone: undefined,
      username: "runtime",
      verificationCode: "123456",
    });
  });

  it("preserves password whitespace through canonical runtime authority adapters", async () => {
    const register = vi.fn().mockResolvedValue({
      accessToken: mockAccessToken("canonical-access-token"),
      authToken: mockAuthToken("canonical-auth-token"),
      sessionId: "canonical-session",
      user: {
        email: "runtime@sdkwork.ai",
        id: "runtime-user",
        name: "Runtime User",
      },
    } satisfies {
      accessToken: string;
      authToken: string;
      sessionId: string;
      user: LocalAuthTestUser;
    });
    const resetPassword = vi.fn().mockResolvedValue(undefined);
    const authority = createSdkworkCanonicalRuntimeAuthAuthorityService({
      clearSessionToken: vi.fn(),
      login: vi.fn(),
      mapProfileUser: (profile: LocalAuthTestUser) => profile,
      mapSessionUser: (session: {
        sessionId: string;
        user: LocalAuthTestUser;
      }) => session.user,
      readSessionToken: vi.fn().mockReturnValue(null),
      register,
      resetPassword,
      writeSessionToken: vi.fn((token: string) => token),
    });

    await authority.register({
      confirmPassword: " SpacePass#2026 ",
      email: " runtime@sdkwork.ai ",
      password: " SpacePass#2026 ",
      username: " runtime ",
      verificationCode: " 123456 ",
    });
    expect(authority.resetPassword).toBeDefined();
    await authority.resetPassword!({
      account: " runtime@sdkwork.ai ",
      code: " 654321 ",
      confirmPassword: " ResetPass#2026 ",
      newPassword: " ResetPass#2026 ",
    });

    expect(register).toHaveBeenCalledWith({
      channel: undefined,
      confirmPassword: " SpacePass#2026 ",
      email: "runtime@sdkwork.ai",
      name: "runtime",
      password: " SpacePass#2026 ",
      phone: undefined,
      username: "runtime",
      verificationCode: "123456",
    });
    expect(resetPassword).toHaveBeenCalledWith({
      account: "runtime@sdkwork.ai",
      code: "654321",
      confirmPassword: " ResetPass#2026 ",
      newPassword: " ResetPass#2026 ",
    });
  });

  it("rejects canonical runtime authority sessions without SDKWork dual tokens", async () => {
    const authority = createSdkworkCanonicalRuntimeAuthAuthorityService({
      clearSessionToken: vi.fn(),
      login: vi.fn(),
      mapProfileUser: (profile: LocalAuthTestUser) => profile,
      mapSessionUser: (session: {
        sessionId: string;
        user: LocalAuthTestUser;
      }) => session.user,
      readSessionToken: vi.fn().mockReturnValue(null),
      register: vi.fn(async () => ({
        sessionId: "canonical-session-only",
        user: {
          email: "runtime@sdkwork.ai",
          id: "runtime-user",
          name: "Runtime User",
        },
      })),
      writeSessionToken: vi.fn((token: string) => token),
    });

    await expect(authority.register({
      email: "runtime@sdkwork.ai",
      password: "secret",
      username: "runtime",
    })).rejects.toThrow("Valid IAM auth session is required.");
  });

  it("does not expose synthetic auth session construction APIs", () => {
    expect(authPackage).not.toHaveProperty("createSdkworkSyntheticAuthSession");
    expect(authPackage).not.toHaveProperty("CreateSdkworkSyntheticAuthSessionOptions");
  });

  it("routes secondary auth flows through the resource-style app SDK surface", async () => {
    const clearSession = vi.fn();
    const authorizationUrlCreate = vi.fn().mockResolvedValue({
      data: {
        url: "https://auth.sdkwork.ai/oauth/github",
      },
    });
    const oauthSessionCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("oauth-access-token"),
        authToken: mockAuthToken("oauth-auth-token"),
      },
    });
    const passwordResetRequestsCreate = vi.fn().mockResolvedValue({ data: { requestId: "reset-1" } });
    const passwordResetsCreate = vi.fn().mockResolvedValue({ data: { reset: true } });
    const sessionsCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("code-access-token"),
        authToken: mockAuthToken("code-auth-token"),
      },
    });
    const sessionsCurrentDelete = vi.fn().mockResolvedValue({ data: undefined });
    const verificationCodesCreate = vi.fn().mockResolvedValue({ data: { codeId: "code-1" } });
    const verificationCodesVerify = vi.fn().mockResolvedValue({ data: { verified: true } });
    const client = {
      auth: {
        passwordResetRequests: {
          create: passwordResetRequestsCreate,
        },
        passwordResets: {
          create: passwordResetsCreate,
        },
        sessions: {
          create: sessionsCreate,
          current: {
            delete: sessionsCurrentDelete,
          },
        },
      },
      oauth: {
        authorizationUrls: {
          create: authorizationUrlCreate,
        },
        sessions: {
          create: oauthSessionCreate,
        },
      },
      messaging: {
        verificationCodes: {
          create: verificationCodesCreate,
          verify: verificationCodesVerify,
        },
      },
    };
    const service = createSdkworkAuthService({
      clearSession,
      getClient: () => client,
    });

    await service.signInWithPhoneCode({
      code: "123456",
      deviceId: "device-1",
      phone: " 13800138000 ",
    });
    await service.signInWithEmailCode({
      code: "654321",
      email: " operator@sdkwork.ai ",
    });
    await service.sendVerifyCode({
      scene: "REGISTER",
      target: " operator@sdkwork.ai ",
      verifyType: "EMAIL",
    });
    await expect(service.verifyCode({
      code: "123456",
      scene: "REGISTER",
      target: "operator@sdkwork.ai",
      verifyType: "EMAIL",
    })).resolves.toBe(true);
    await service.requestPasswordReset({
      account: "operator@sdkwork.ai",
      channel: "EMAIL",
    });
    await service.resetPassword({
      account: "operator@sdkwork.ai",
      code: "123456",
      newPassword: "new-secret",
    });
    await expect(service.getOAuthAuthorizationUrl({
      provider: "github",
      redirectUri: "https://app.sdkwork.ai/callback",
      scope: "profile email",
      state: "state-1",
    })).resolves.toBe("https://auth.sdkwork.ai/oauth/github");
    await service.signInWithOAuth({
      code: "oauth-code",
      provider: "github",
      state: "state-1",
    });
    await service.signOut();

    expect(sessionsCreate).toHaveBeenCalledWith({
      appVersion: undefined,
      code: "123456",
      deviceId: "device-1",
      deviceName: undefined,
      deviceType: undefined,
      grantType: "phone_code",
      phone: "13800138000",
    });
    expect(sessionsCreate).toHaveBeenCalledWith({
      appVersion: undefined,
      code: "654321",
      deviceId: undefined,
      deviceName: undefined,
      deviceType: undefined,
      email: "operator@sdkwork.ai",
      grantType: "email_code",
    });
    expect(verificationCodesCreate).toHaveBeenCalledWith({
      scene: "REGISTER",
      target: "operator@sdkwork.ai",
      verifyType: "EMAIL",
    });
    expect(verificationCodesVerify).toHaveBeenCalledWith({
      code: "123456",
      scene: "LOGIN",
      target: "13800138000",
      verifyType: "PHONE",
    });
    expect(verificationCodesVerify).toHaveBeenCalledWith({
      code: "654321",
      scene: "LOGIN",
      target: "operator@sdkwork.ai",
      verifyType: "EMAIL",
    });
    expect(verificationCodesVerify).toHaveBeenCalledWith({
      code: "123456",
      scene: "REGISTER",
      target: "operator@sdkwork.ai",
      verifyType: "EMAIL",
    });
    expect(verificationCodesVerify.mock.invocationCallOrder[0]).toBeLessThan(
      sessionsCreate.mock.invocationCallOrder[0],
    );
    expect(verificationCodesVerify.mock.invocationCallOrder[1]).toBeLessThan(
      sessionsCreate.mock.invocationCallOrder[1],
    );
    expect(passwordResetRequestsCreate).toHaveBeenCalledWith({
      account: "operator@sdkwork.ai",
      channel: "EMAIL",
    });
    expect(passwordResetsCreate).toHaveBeenCalledWith({
      account: "operator@sdkwork.ai",
      code: "123456",
      confirmPassword: undefined,
      newPassword: "new-secret",
    });
    expect(authorizationUrlCreate).toHaveBeenCalledWith({
      provider: "GITHUB",
      redirectUri: "https://app.sdkwork.ai/callback",
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
    expect(sessionsCurrentDelete).toHaveBeenCalledOnce();
    expect(clearSession).toHaveBeenCalledOnce();
  });

  it("fails code sign-in closed when messaging verification rejects the code", async () => {
    const sessionsCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("code-access-token"),
        authToken: mockAuthToken("code-auth-token"),
      },
    });
    const verificationCodesVerify = vi.fn().mockResolvedValue({ data: { verified: false } });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {
          sessions: {
            create: sessionsCreate,
          },
        },
        messaging: {
          verificationCodes: {
            verify: verificationCodesVerify,
          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.signInWithEmailCode({
      code: "000000",
      email: "operator@sdkwork.ai",
    })).rejects.toThrow(/verify code/i);

    expect(verificationCodesVerify).toHaveBeenCalledWith({
      code: "000000",
      scene: "LOGIN",
      target: "operator@sdkwork.ai",
      verifyType: "EMAIL",
    });
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("verifies registration codes through messaging before creating the registration session", async () => {
    const registrationsCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("registration-access-token"),
        authToken: mockAuthToken("registration-auth-token"),
      },
    });
    const verificationCodesVerify = vi.fn().mockResolvedValue({ data: { verified: true } });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {
          registrations: {
            create: registrationsCreate,
          },
        },
        messaging: {
          verificationCodes: {
            verify: verificationCodesVerify,
          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await service.register({
      channel: "EMAIL",
      confirmPassword: "RegisterPass#2026",
      email: " operator@sdkwork.ai ",
      password: "RegisterPass#2026",
      username: " operator ",
      verificationCode: " 123456 ",
    });

    expect(verificationCodesVerify).toHaveBeenCalledWith({
      code: "123456",
      scene: "REGISTER",
      target: "operator@sdkwork.ai",
      verifyType: "EMAIL",
    });
    expect(registrationsCreate).toHaveBeenCalledWith({
      channel: "EMAIL",
      confirmPassword: "RegisterPass#2026",
      email: "operator@sdkwork.ai",
      password: "RegisterPass#2026",
      phone: undefined,
      username: "operator",
      verificationCode: "123456",
    });
    expect(verificationCodesVerify.mock.invocationCallOrder[0]).toBeLessThan(
      registrationsCreate.mock.invocationCallOrder[0],
    );
  });

  it("fails registration closed when messaging verification rejects the code", async () => {
    const registrationsCreate = vi.fn();
    const verificationCodesVerify = vi.fn().mockResolvedValue({ data: { verified: false } });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {
          registrations: {
            create: registrationsCreate,
          },
        },
        messaging: {
          verificationCodes: {
            verify: verificationCodesVerify,
          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.register({
      channel: "PHONE",
      confirmPassword: "RegisterPass#2026",
      password: "RegisterPass#2026",
      phone: " 13800138000 ",
      username: " operator ",
      verificationCode: "000000",
    })).rejects.toThrow(/verify code/i);

    expect(verificationCodesVerify).toHaveBeenCalledWith({
      code: "000000",
      scene: "REGISTER",
      target: "13800138000",
      verifyType: "PHONE",
    });
    expect(registrationsCreate).not.toHaveBeenCalled();
  });

  it("does not restore a current session from incomplete dual-token storage", async () => {
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        iam: {
          users: {
            current: {
              retrieve: vi.fn(),
            },
          },
        },
      } as unknown as SdkworkAuthClient),
      readSession: () => ({
        authToken: mockAuthToken("stored-auth-token"),
      }),
      resolveAccessToken: () => "fallback-access-token",
    });

    await expect(service.getCurrentSession()).resolves.toBeNull();
  });

  it("validates stored sessions through the current-session SDK before restoring authentication", async () => {
    const currentSessionRetrieve = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("current-access-token"),
        authToken: mockAuthToken("current-auth-token"),
        user: {
          displayName: "Current Session Operator",
          email: "current-session@sdkwork.ai",
          id: "current-session-user-1",
        },
      },
    });
    const commitSession = vi.fn();
    const service = createSdkworkAuthService({
      commitSession,
      getClient: () => ({
        auth: {
          sessions: {
            current: {
              retrieve: currentSessionRetrieve,
            },
          },
        },
      } as unknown as SdkworkAuthClient),
      readSession: () => ({
        accessToken: mockAccessToken("stored-access-token"),
        authToken: mockAuthToken("stored-auth-token"),
        refreshToken: "stored-refresh-token",
      }),
    });

    await expect(service.getCurrentSession()).resolves.toMatchObject({
      accessToken: mockAccessToken("current-access-token"),
      authToken: mockAuthToken("current-auth-token"),
      refreshToken: "stored-refresh-token",
      user: {
        email: "current-session@sdkwork.ai",
        id: "current-session-user-1",
      },
    });

    expect(currentSessionRetrieve).toHaveBeenCalledOnce();
    expect(commitSession).toHaveBeenCalledWith(
      {
        accessToken: mockAccessToken("current-access-token"),
        authToken: mockAuthToken("current-auth-token"),
        refreshToken: "stored-refresh-token",
      },
      { preserveRefreshToken: true },
    );
  });

  it("clears stored sessions when current-session SDK validation fails", async () => {
    const currentSessionRetrieve = vi.fn().mockRejectedValue(new Error("session revoked"));
    const clearSession = vi.fn();
    const service = createSdkworkAuthService({
      clearSession,
      getClient: () => ({
        auth: {
          sessions: {
            current: {
              retrieve: currentSessionRetrieve,
            },
          },
        },
        iam: {
          users: {
            current: {
              retrieve: vi.fn(),
            },
          },
        },
      } as unknown as SdkworkAuthClient),
      readSession: () => ({
        accessToken: mockAccessToken("stored-access-token"),
        authToken: mockAuthToken("stored-auth-token"),
      }),
    });

    await expect(service.getCurrentSession()).resolves.toBeNull();

    expect(currentSessionRetrieve).toHaveBeenCalledOnce();
    expect(clearSession).toHaveBeenCalledOnce();
  });

  it("creates QR auth sessions through the OAuth device authorization SDK", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        expiresAt: "2026-05-21T05:05:00.000Z",
        fallbackUrl: "https://auth.example.test/qr?session_key=session_1&purpose=login",
        qrContent: {
          content: "https://auth.example.test/qr?session_key=session_1&purpose=login",
          mode: "fallback_url",
        },
        sessionKey: "session_1",
        status: "pending",
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              create,

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    const result = await service.generateLoginQrCode();
    expect(result).toMatchObject({
      expireTime: Date.parse("2026-05-21T05:05:00.000Z"),
      qrContent: "https://auth.example.test/qr?session_key=session_1&purpose=login",
      sessionKey: "session_1",
      type: "fallback_url",
    });
    expect(result).not.toHaveProperty("qrKey");
    expect(create).toHaveBeenCalledWith({
      purpose: "login",
    });
  });

  it("creates register QR auth sessions through the OAuth device authorization SDK when requested", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        qrContent: {
          content: "weixin://dl/business/?t=mini_login",
          mode: "mini_app_url",
        },
        sessionKey: "session_register_1",
        status: "pending",
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              create,

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.generateLoginQrCode({
      purpose: "register",
    })).resolves.toMatchObject({
      qrContent: "weixin://dl/business/?t=mini_login",
      sessionKey: "session_register_1",
      type: "mini_app_url",
    });
    expect(create).toHaveBeenCalledWith({
      purpose: "register",
    });
  });

  it("rejects generated SDK QR content that points to the session status API", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        fallbackUrl: "http://127.0.0.1:18079/app/v3/api/oauth/device_authorizations/sdkwork-local-qr-5",
        sessionKey: "sdkwork-local-qr-5",
        status: "pending",
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              create,

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.generateLoginQrCode()).rejects.toThrow(/QR auth content/i);
  });

  it("rejects QR auth session creation with a non-standard purpose", async () => {
    const create = vi.fn();
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              create,

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.generateLoginQrCode({
      purpose: "reset_password",
    } as never)).rejects.toThrow(/purpose/i);
    expect(create).not.toHaveBeenCalled();
  });

  it("maps completed QR auth sessions without requiring platform token payloads", async () => {
    const retrieve = vi.fn().mockResolvedValue({
      data: {
        sessionKey: "session_completed_1",
        status: "completed",
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              retrieve,

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.checkLoginQrCodeStatus(" session_completed_1 ")).resolves.toEqual({
      status: "confirmed",
      user: undefined,
    });
    expect(retrieve).toHaveBeenCalledWith("session_completed_1");
  });

  it("reports browser QR entry scans through OAuth device authorization sessions", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        status: "scanned",
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              scans: {
                create,
              },

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.callbackLoginQrCode({
      event: "passwordRequired",
      sessionKey: " session_scan_1 ",
      scanSource: "browser",
    })).resolves.toEqual({
      status: "scanned",
      user: undefined,
    });

    expect(create).toHaveBeenCalledWith("session_scan_1", {
      scanSource: "browser",
    });
  });

  it("reports standardized QR scan metadata through OAuth device authorization sessions", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        id: "qr_auth_scan_1",
        scanSource: "official_account",
        sessionKey: "session_scan_standard_1",
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              scans: {
                create,
              },

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.callbackLoginQrCode({
      accountId: "account_official_1",
      entryId: "entry_official_1",
      externalUserId: "openid_1",
      ipHash: "ip_hash_1",
      sessionKey: " session_scan_standard_1 ",
      scanSource: "official_account",
      userAgent: "MicroMessenger",
    })).resolves.toEqual({
      status: "scanned",
      user: undefined,
    });

    expect(create).toHaveBeenCalledWith("session_scan_standard_1", {
      accountId: "account_official_1",
      entryId: "entry_official_1",
      externalUserId: "openid_1",
      ipHash: "ip_hash_1",
      scanSource: "official_account",
      userAgent: "MicroMessenger",
    });
  });

  it("rejects QR entry scans with a non-standard scan source", async () => {
    const create = vi.fn();
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              scans: {
                create,
              },

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.callbackLoginQrCode({
      sessionKey: "session_invalid_scan_source",
      scanSource: "wechat",
    })).rejects.toThrow(/scan source/i);
    expect(create).not.toHaveBeenCalled();
  });

  it("treats platform QR scan records without status as scanned after the SDK call succeeds", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        id: "qr_auth_scan_1",
        scanSource: "browser",
        sessionKey: "session_scan_record_1",
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              scans: {
                create,
              },

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.callbackLoginQrCode({
      sessionKey: " session_scan_record_1 ",
      scanSource: "browser",
    })).resolves.toEqual({
      status: "scanned",
      user: undefined,
    });

    expect(create).toHaveBeenCalledWith("session_scan_record_1", {
      scanSource: "browser",
    });
  });

  it("completes browser QR entry password login through OAuth device authorization password completions", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("access_password_alice"),
        authToken: mockAuthToken("auth_password_alice"),
        expiresIn: 3600,
        userId: "alice",
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              passwordCompletions: {
                create,
              },

          },
        },
      } as unknown as SdkworkAuthClient),
      commitSession: vi.fn(),
    });

    await expect(service.confirmLoginQrCode({
      password: "login-secret",
      sessionKey: " session_password_1 ",
      username: "alice",
    })).resolves.toMatchObject({
      session: {
        accessToken: mockAccessToken("access_password_alice"),
        authToken: mockAuthToken("auth_password_alice"),
        user: {
          id: "alice",
        },
      },
      status: "confirmed",
    });

    expect(create).toHaveBeenCalledWith("session_password_1", {
      password: "login-secret",
      username: "alice",
    });
  });

  it("maps non-token QR password completion statuses instead of forcing confirmed", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        status: "cancelled",
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              passwordCompletions: {
                create,
              },

          },
        },
      } as unknown as SdkworkAuthClient),
      commitSession: vi.fn(),
    });

    await expect(service.confirmLoginQrCode({
      password: "login-secret",
      sessionKey: " session_password_cancelled_1 ",
      username: "alice",
    })).resolves.toEqual({
      status: "failed",
      user: undefined,
    });

    expect(create).toHaveBeenCalledWith("session_password_cancelled_1", {
      password: "login-secret",
      username: "alice",
    });
  });

  it("maps QR password organization-selection completion without committing a session", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        accessToken: null,
        authToken: null,
        challengeType: "ORGANIZATION_SELECTION",
        continuationToken: "continue-qr-org-selection-1",
        organizations: [
          {
            displayName: "Secondary Workspace",
            organizationId: "org-2",
            tenantId: "tenant-1",
          },
        ],
        status: "organization_selection_required",
      },
    });
    const commitSession = vi.fn();
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              passwordCompletions: {
                create,
              },

          },
        },
      } as unknown as SdkworkAuthClient),
      commitSession,
    });

    await expect(service.confirmLoginQrCode({
      password: "login-secret",
      sessionKey: " session_password_org_selection_1 ",
      username: "alice",
    })).resolves.toMatchObject({
      organizationSelection: {
        challengeType: "ORGANIZATION_SELECTION",
        continuationToken: "continue-qr-org-selection-1",
        organizations: [
          {
            displayName: "Secondary Workspace",
            organizationId: "org-2",
          },
        ],
      },
      status: "organizationSelectionRequired",
    });
    expect(commitSession).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith("session_password_org_selection_1", {
      password: "login-secret",
      username: "alice",
    });
  });

  it("rejects browser QR entry password completion without standard credentials", async () => {
    const create = vi.fn();
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              passwordCompletions: {
                create,
              },

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.confirmLoginQrCode({
      sessionKey: "session_password_missing_credentials",
    })).rejects.toThrow(/username/i);
    await expect(service.confirmLoginQrCode({
      sessionKey: "session_password_missing_password",
      username: "alice",
      password: "",
    })).rejects.toThrow(/password/i);
    expect(create).not.toHaveBeenCalled();
  });

  it("persists scanner browser sessions returned by QR password completion", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        accessToken: mockAccessToken("qr-password-access-token"),
        authToken: mockAuthToken("qr-password-auth-token"),
        refreshToken: "qr-password-refresh-token",
        user: {
          displayName: "QR Password Operator",
          email: "qr-password@sdkwork.ai",
          id: "qr-password-user-1",
        },
      },
    });
    const commitSession = vi.fn();
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        iam: {
          users: {
            current: {
              retrieve: vi.fn().mockResolvedValue({
                data: {
                  displayName: "QR Password Profile",
                  email: "qr-password-profile@sdkwork.ai",
                  id: "qr-password-profile-user-1",
                },
              }),
            },
          },
        },
        oauth: {
          deviceAuthorizations: {
              passwordCompletions: {
                create,
              },

          },
        },
      } as unknown as SdkworkAuthClient),
      commitSession,
    });

    await expect(service.confirmLoginQrCode({
      password: "login-secret",
      sessionKey: " session_password_2 ",
      username: "alice",
    })).resolves.toMatchObject({
      session: {
        accessToken: mockAccessToken("qr-password-access-token"),
        authToken: mockAuthToken("qr-password-auth-token"),
        refreshToken: "qr-password-refresh-token",
        user: {
          email: "qr-password-profile@sdkwork.ai",
          id: "qr-password-profile-user-1",
        },
      },
      status: "confirmed",
      user: {
        email: "qr-password-profile@sdkwork.ai",
      },
    });
    expect(create).toHaveBeenCalledWith("session_password_2", {
      password: "login-secret",
      username: "alice",
    });
    expect(commitSession).toHaveBeenCalledWith({
      accessToken: mockAccessToken("qr-password-access-token"),
      authToken: mockAuthToken("qr-password-auth-token"),
      refreshToken: "qr-password-refresh-token",
    });
  });

  it("accepts sdkwork-router QR password completion envelopes with completed status and embedded session", async () => {
    const create = vi.fn().mockResolvedValue({
      code: "2000",
      msg: "SUCCESS",
      data: {
        id: "qr_auth_session_f87f5a94c62a69b471a71faaa0922b9e",
        sessionKey: "f87f5a94c62a69b471a71faaa0922b9e",
        purpose: "login",
        defaultAccountId: null,
        defaultEntryId: null,
        defaultProvider: null,
        defaultAccountType: null,
        qrContent: {
          content: "https://127.0.0.1:3900/auth/qr/f87f5a94c62a69b471a71faaa0922b9e?session_key=f87f5a94c62a69b471a71faaa0922b9e&purpose=login&scan_source=browser",
          mode: "fallback_url",
        },
        fallbackUrl: "https://127.0.0.1:3900/auth/qr/f87f5a94c62a69b471a71faaa0922b9e?session_key=f87f5a94c62a69b471a71faaa0922b9e&purpose=login&scan_source=browser",
        status: "completed",
        scannedAt: "2026-06-03T13:24:01Z",
        completedAt: "2026-06-03T13:24:02Z",
        expiresAt: "2026-06-03T13:28:32Z",
        createdAt: "2026-06-03T13:23:32Z",
        updatedAt: "2026-06-03T13:24:02Z",
        session: {
          accessToken: mockAccessToken("sdkwork-router-qr-access-token"),
          authToken: mockAuthToken("sdkwork-router-qr-auth-token"),
          refreshToken: "sdkwork-router-qr-refresh-token",
          user: {
            displayName: "Sdkwork Router QR Operator",
            email: "sdkwork-router-qr@sdkwork.ai",
            id: "sdkwork-router-qr-user-1",
          },
        },
      },
    });
    const commitSession = vi.fn();
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              passwordCompletions: {
                create,
              },

          },
        },
      } as unknown as SdkworkAuthClient),
      commitSession,
    });

    await expect(service.confirmLoginQrCode({
      password: "login-secret",
      sessionKey: " f87f5a94c62a69b471a71faaa0922b9e ",
      username: "alice",
    })).resolves.toMatchObject({
      session: {
        accessToken: mockAccessToken("sdkwork-router-qr-access-token"),
        authToken: mockAuthToken("sdkwork-router-qr-auth-token"),
        refreshToken: "sdkwork-router-qr-refresh-token",
        user: {
          email: "sdkwork-router-qr@sdkwork.ai",
          id: "sdkwork-router-qr-user-1",
        },
      },
      status: "confirmed",
      user: {
        email: "sdkwork-router-qr@sdkwork.ai",
      },
    });
    expect(create).toHaveBeenCalledWith("f87f5a94c62a69b471a71faaa0922b9e", {
      password: "login-secret",
      username: "alice",
    });
    expect(commitSession).toHaveBeenCalledWith({
      accessToken: mockAccessToken("sdkwork-router-qr-access-token"),
      authToken: mockAuthToken("sdkwork-router-qr-auth-token"),
      refreshToken: "sdkwork-router-qr-refresh-token",
    });
  });

  it("does not treat legacy QR token field as an authenticated browser session", async () => {
    const create = vi.fn().mockResolvedValue({
      code: "2000",
      data: {
        sessionKey: "legacy-token-session",
        status: "completed",
        token: {
          accessToken: mockAccessToken("legacy-token-access"),
          authToken: mockAuthToken("legacy-token-auth"),
          refreshToken: "legacy-token-refresh",
          user: {
            displayName: "Legacy Token User",
            email: "legacy-token@sdkwork.ai",
            id: "legacy-token-user-1",
          },
        },
      },
    });
    const commitSession = vi.fn();
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              passwordCompletions: {
                create,
              },

          },
        },
      } as unknown as SdkworkAuthClient),
      commitSession,
    });

    await expect(service.confirmLoginQrCode({
      password: "login-secret",
      sessionKey: " legacy-token-session ",
      username: "alice",
    })).resolves.toMatchObject({
      status: "confirmed",
    });
    expect(commitSession).not.toHaveBeenCalled();
  });

  it("preserves platform QR images as MediaResource objects from SDK responses", async () => {
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
            create: vi.fn().mockResolvedValue({
              data: {
                expiresAt: "2026-05-21T05:05:00.000Z",
                qrContent: "sdkwork://auth/resource-url-fallback",
                qrCode: resourceQrCode,
                sessionKey: "qr-resource-url-1",
              },
            }),

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.generateLoginQrCode()).resolves.toMatchObject({
      qrContent: "sdkwork://auth/resource-url-fallback",
      qrCode: resourceQrCode,
      sessionKey: "qr-resource-url-1",
    });
  });

  it("keeps text-only QR content separate from QR image resources", async () => {
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
            create: vi.fn().mockResolvedValue({
              data: {
                qrContent: "https://wxaurl.cn/sdkwork-login?session_key=qr-resource-content-1",
                sessionKey: "qr-resource-content-1",
              },
            }),

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.generateLoginQrCode()).resolves.toMatchObject({
      qrContent: "https://wxaurl.cn/sdkwork-login?session_key=qr-resource-content-1",
      qrCode: undefined,
      sessionKey: "qr-resource-content-1",
    });
  });

  it("keeps fallback QR URLs as content instead of rendered image assets", async () => {
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              create: vi.fn().mockResolvedValue({
                data: {
                  qrContent: {
                    content: "https://console.example.test/auth/qr/qr-resource-alias-1?session_key=qr-resource-alias-1&purpose=login",
                    mode: "fallback_url",
                  },
                  sessionKey: "qr-resource-alias-1",
                },
              }),

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.generateLoginQrCode()).resolves.toMatchObject({
      qrContent: "https://console.example.test/auth/qr/qr-resource-alias-1?session_key=qr-resource-alias-1&purpose=login",
      qrCode: undefined,
      sessionKey: "qr-resource-alias-1",
      type: "fallback_url",
    });
  });

  it("maps official-account QR auth content from the configured default OAuth device entry", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        qrContent: {
          content: "https://mp.weixin.qq.com/s/sdkwork-login",
          mode: "official_account_entry",
        },
        sessionKey: "qr-official-account-1",
      },
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              create,

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.generateLoginQrCode()).resolves.toMatchObject({
      qrContent: "https://mp.weixin.qq.com/s/sdkwork-login",
      sessionKey: "qr-official-account-1",
      type: "official_account_entry",
    });

    expect(create).toHaveBeenCalledWith({
      purpose: "login",
    });
  });

  it("normalizes expired QR status errors from the OAuth device authorization SDK", async () => {
    const retrieve = vi.fn().mockResolvedValue({
      code: "4001",
      msg: "Invalid or expired QR login code",
    });
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {},
        oauth: {
          deviceAuthorizations: {
              retrieve,

          },
        },
      } as unknown as SdkworkAuthClient),
    });

    await expect(service.checkLoginQrCodeStatus(" qr-expired-1 ")).resolves.toEqual({
      status: "expired",
      user: undefined,
    });
    expect(retrieve).toHaveBeenCalledWith("qr-expired-1");
  });

  it("accepts confirmed QR status sessions when an IAM exchange response is available", async () => {
    const retrieve = vi.fn().mockResolvedValue({
      data: {
        session: {
          accessToken: mockAccessToken("qr-session-access-token"),
          authToken: mockAuthToken("qr-session-auth-token"),
          user: {
            displayName: "QR Session Operator",
            email: "qr-session@sdkwork.ai",
            id: "qr-session-user-1",
          },
        },
        status: "confirmed",
      },
    });
    const commitSession = vi.fn();
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {
        },
        oauth: {
          deviceAuthorizations: {
              retrieve,

          },
        },
      } as unknown as SdkworkAuthClient),
      commitSession,
    });

    await expect(service.checkLoginQrCodeStatus(" qr-session-1 ")).resolves.toMatchObject({
      session: {
        accessToken: mockAccessToken("qr-session-access-token"),
        authToken: mockAuthToken("qr-session-auth-token"),
        user: {
          email: "qr-session@sdkwork.ai",
          id: "qr-session-user-1",
        },
      },
      status: "confirmed",
    });
    expect(retrieve).toHaveBeenCalledWith("qr-session-1");
    expect(commitSession).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: mockAccessToken("qr-session-access-token"),
      authToken: mockAuthToken("qr-session-auth-token"),
    }));
  });

  it("accepts confirmed QR status sessions when an IAM exchange response is available", async () => {
    const retrieve = vi.fn().mockResolvedValue({
      data: {
        status: "confirmed",
        session: {
          accessToken: mockAccessToken("qr-token-access-token"),
          authToken: mockAuthToken("qr-token-auth-token"),
          user: {
            displayName: "QR Token Operator",
            email: "qr-token@sdkwork.ai",
            id: "qr-token-user-1",
          },
        },
      },
    });
    const commitSession = vi.fn();
    const service = createSdkworkAuthService({
      getClient: () => ({
        auth: {
        },
        oauth: {
          deviceAuthorizations: {
              retrieve,

          },
        },
      } as unknown as SdkworkAuthClient),
      commitSession,
    });

    await expect(service.checkLoginQrCodeStatus(" qr-token-1 ")).resolves.toMatchObject({
      session: {
        accessToken: mockAccessToken("qr-token-access-token"),
        authToken: mockAuthToken("qr-token-auth-token"),
        user: {
          email: "qr-token@sdkwork.ai",
          id: "qr-token-user-1",
        },
      },
      status: "confirmed",
    });
    expect(retrieve).toHaveBeenCalledWith("qr-token-1");
    expect(commitSession).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: mockAccessToken("qr-token-access-token"),
      authToken: mockAuthToken("qr-token-auth-token"),
    }));
  });

  it("normalizes expired QR status errors from IAM runtime OAuth device authorization services", async () => {
    const retrieve = vi.fn().mockRejectedValue(new Error("Invalid or expired QR login code"));
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            passwordResetRequests: {
              create: vi.fn(),
            },
            passwordResets: {
              create: vi.fn(),
            },
            registrations: {
              create: vi.fn(),
            },
            sessions: {
              create: vi.fn(),
              current: {
                delete: vi.fn(),
                retrieve: vi.fn(),
              },
            },
          },
          messaging: {
            verificationCodes: {
              create: vi.fn(),
              verify: vi.fn(),
            },
          },
          oauth: {
            deviceAuthorizations: {
                create: vi.fn(),
                retrieve,

            },
          },
          iam: {
            users: {
              current: {
                retrieve: vi.fn(),
              },
            },
          },
        },
      }),
    });

    await expect(controller.checkLoginQrCodeStatus(" qr-expired-runtime-1 ")).resolves.toEqual({
      status: "expired",
    });
    expect(retrieve).toHaveBeenCalledWith("qr-expired-runtime-1");
  });

  it("keeps IAM runtime QR responses with incomplete session tokens anonymous", async () => {
    const tokenStore = {
      clear: vi.fn(),
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn(),
    };
    const retrieve = vi.fn().mockResolvedValue({
      session: {
        authToken: mockAuthToken("runtime-qr-auth-token-only"),
      },
      status: "completed",
    });
    const controller = createSdkworkIamRuntimeAuthController({
      getRuntime: () => ({
        service: {
          auth: {
            passwordResetRequests: {
              create: vi.fn(),
            },
            passwordResets: {
              create: vi.fn(),
            },
            registrations: {
              create: vi.fn(),
            },
            sessions: {
              create: vi.fn(),
              current: {
                delete: vi.fn(),
                retrieve: vi.fn(),
              },
            },
          },
          oauth: {
            deviceAuthorizations: {
                create: vi.fn(),
                retrieve,

            },
          },
          iam: {
            users: {
              current: {
                retrieve: vi.fn(),
              },
            },
          },
        },
        tokenStore,
      }),
    });

    await expect(controller.checkLoginQrCodeStatus(" runtime-qr-single-token ")).resolves.toEqual({
      status: "confirmed",
    });

    expect(retrieve).toHaveBeenCalledWith("runtime-qr-single-token");
    expect(tokenStore.set).not.toHaveBeenCalled();
    expect(controller.getState()).toMatchObject({
      isAuthenticated: false,
      session: null,
      status: "anonymous",
    });
  });

  it("creates a reusable local auth service for product adapters", async () => {
    const register = vi.fn().mockResolvedValue(createLocalAuthSession({
      accessToken: mockAccessToken("registered-access-token"),
      authToken: mockAuthToken("registered-auth-token"),
      user: {
        email: "example@sdkwork.ai",
        id: "example-user-1",
        name: "SDKWork Example Operator",
      },
    }));
    const refreshSession = vi.fn().mockResolvedValue(createLocalAuthSession({
      accessToken: mockAccessToken("refreshed-access-token"),
      authToken: mockAuthToken("refreshed-auth-token"),
      user: {
        email: "refreshed@sdkwork.ai",
        id: "refreshed-user-1",
        name: "Refreshed Operator",
      },
    }));
    const updateCurrentSession = vi.fn().mockResolvedValue(createLocalAuthSession({
      accessToken: mockAccessToken("updated-access-token"),
      authToken: mockAuthToken("updated-auth-token"),
      user: {
        email: "updated@sdkwork.ai",
        id: "updated-user-1",
        name: "Updated Operator",
      },
    }));
    const signInWithSessionBridge = vi.fn(async (input) => createLocalAuthSession({
      accessToken: mockAccessToken("bridge-access-token"),
      authToken: mockAuthToken("bridge-auth-token"),
      user: {
        email: input.email,
        id: "bridge-user",
        name: input.name || "Bridge User",
      },
    }));
    const service = createSdkworkLocalAuthService<LocalAuthTestUser>({
      register: async (input) =>
        register({
          email: input.email,
          password: input.password,
          username: input.username,
          verificationCode: input.verificationCode,
        }),
      refreshSession,
      signIn: async () => createLocalAuthSession({
        accessToken: mockAccessToken("signin-access-token"),
        authToken: mockAuthToken("signin-auth-token"),
        user: {
          email: "example@sdkwork.ai",
          id: "example-user-1",
          name: "SDKWork Example Operator",
        },
      }),
      signInWithSessionBridge,
      signOut: vi.fn(),
      toUser(user: LocalAuthTestUser) {
        return {
          displayName: user.name,
          email: user.email,
          firstName: "SDKWork",
          id: user.id,
          initials: "BO",
          lastName: "Operator",
          username: user.email,
        };
      },
      updateCurrentSession,
      user: null,
    });

    const session = await service.register({
      email: "example@sdkwork.ai",
      password: "secret",
      username: "example",
      verificationCode: "123456",
    });
    const bridgeSession = await service.signInWithSessionBridge({
      bridgeToken: "local-bridge-token",
      email: "bridge@sdkwork.ai",
      name: "Bridge User",
      subject: "external-user-center:bridge@sdkwork.ai",
    });
    const refreshedSession = await service.refreshSession({
      refreshToken: "refresh-token-1",
    });
    const updatedSession = await service.updateCurrentSession({
      organizationId: "org-1",
    });

    expect(register).toHaveBeenCalledWith({
      email: "example@sdkwork.ai",
      password: "secret",
      username: "example",
      verificationCode: "123456",
    });
    expect(session).toMatchObject({
      accessToken: mockAccessToken("registered-access-token"),
      authToken: mockAuthToken("registered-auth-token"),
      user: {
        email: "example@sdkwork.ai",
        id: "example-user-1",
      },
    });
    expect(signInWithSessionBridge).toHaveBeenCalledWith({
      bridgeToken: "local-bridge-token",
      email: "bridge@sdkwork.ai",
      name: "Bridge User",
      subject: "external-user-center:bridge@sdkwork.ai",
    });
    expect(bridgeSession).toMatchObject({
      accessToken: mockAccessToken("bridge-access-token"),
      authToken: mockAuthToken("bridge-auth-token"),
      user: {
        email: "bridge@sdkwork.ai",
        id: "bridge-user",
      },
    });
    expect(refreshSession).toHaveBeenCalledWith({
      refreshToken: "refresh-token-1",
    });
    expect(refreshedSession).toMatchObject({
      accessToken: mockAccessToken("refreshed-access-token"),
      authToken: mockAuthToken("refreshed-auth-token"),
      user: {
        email: "refreshed@sdkwork.ai",
        id: "refreshed-user-1",
      },
    });
    expect(updateCurrentSession).toHaveBeenCalledWith({
      organizationId: "org-1",
    });
    expect(updatedSession).toMatchObject({
      accessToken: mockAccessToken("updated-access-token"),
      authToken: mockAuthToken("updated-auth-token"),
      user: {
        email: "updated@sdkwork.ai",
        id: "updated-user-1",
      },
    });
  });

  it("rejects local auth actions that return only a user instead of a real session", async () => {
    const service = createSdkworkLocalAuthService<LocalAuthTestUser>({
      register: (async () => ({
        email: "example@sdkwork.ai",
        id: "example-user-1",
        name: "SDKWork Example Operator",
      })) as never,
      signIn: (async () => ({
        email: "example@sdkwork.ai",
        id: "example-user-1",
        name: "SDKWork Example Operator",
      })) as never,
      signOut: vi.fn(),
      toUser(user: LocalAuthTestUser) {
        return {
          displayName: user.name,
          email: user.email,
          firstName: "SDKWork",
          id: user.id,
          initials: "BO",
          lastName: "Operator",
          username: user.email,
        };
      },
    });

    await expect(service.signIn({
      password: "any-password",
      username: "example",
    })).rejects.toThrow("Valid IAM auth session is required.");
    await expect(service.register({
      email: "example@sdkwork.ai",
      password: "secret",
      username: "example",
      verificationCode: "123456",
    })).rejects.toThrow("Valid IAM auth session is required.");
  });

  it("does not synthesize a current session from local user-only state", async () => {
    const toUser = (user: LocalAuthTestUser) => ({
      displayName: user.name,
      email: user.email,
      firstName: "SDKWork",
      id: user.id,
      initials: "BO",
      lastName: "Operator",
      username: user.email,
    });
    const getCurrentUserService = createSdkworkLocalAuthService<LocalAuthTestUser>({
      getCurrentUser: async () => ({
        email: "current@sdkwork.ai",
        id: "current-user-1",
        name: "Current User",
      }),
      signOut: vi.fn(),
      toUser,
    });
    const initialUserService = createSdkworkLocalAuthService<LocalAuthTestUser>({
      signOut: vi.fn(),
      toUser,
      user: {
        email: "initial@sdkwork.ai",
        id: "initial-user-1",
        name: "Initial User",
      },
    });

    await expect(getCurrentUserService.getCurrentUser()).resolves.toMatchObject({
      email: "current@sdkwork.ai",
      id: "current-user-1",
    });
    await expect(getCurrentUserService.getCurrentSession()).resolves.toBeNull();
    await expect(initialUserService.getCurrentUser()).resolves.toMatchObject({
      email: "initial@sdkwork.ai",
      id: "initial-user-1",
    });
    await expect(initialUserService.getCurrentSession()).resolves.toBeNull();
  });

  it("rejects canonical auth authority results that do not include a real session", async () => {
    const controller = createSdkworkCanonicalAuthController({
      service: {
        login: vi.fn(async () => ({
          email: "canonical@sdkwork.ai",
          id: "canonical-user",
          name: "Canonical User",
        }) as never),
        logout: vi.fn(async () => undefined),
        register: vi.fn(async () => ({
          email: "canonical@sdkwork.ai",
          id: "canonical-user",
          name: "Canonical User",
        }) as never),
      },
      toUser(user: LocalAuthTestUser) {
        return {
          displayName: user.name,
          email: user.email,
          firstName: "Canonical",
          id: user.id,
          initials: "CU",
          lastName: "User",
          username: user.email,
        };
      },
    });

    await expect(controller.signIn({
      password: "any-password",
      username: "canonical",
    })).rejects.toThrow("Valid IAM auth session is required.");
    await expect(controller.register({
      channel: "EMAIL",
      confirmPassword: "secret",
      email: "canonical@sdkwork.ai",
      password: "secret",
      username: "canonical",
      verificationCode: "123456",
    })).rejects.toThrow("Valid IAM auth session is required.");
  });

  it("uses the default verification policy when a local auth adapter does not provide one", async () => {
    const service = createSdkworkLocalAuthService<LocalAuthTestUser>({
      signOut: vi.fn(),
      toUser(user: LocalAuthTestUser) {
        return {
          displayName: user.name,
          email: user.email,
          firstName: "SDKWork",
          id: user.id,
          initials: "BO",
          lastName: "Operator",
          username: user.email,
        };
      },
    });

    await expect(service.getVerificationPolicy()).resolves.toEqual({
      emailCodeLoginEnabled: false,
      emailRegistrationVerificationRequired: false,
      phoneCodeLoginEnabled: false,
      phoneRegistrationVerificationRequired: false,
    });
  });
});
