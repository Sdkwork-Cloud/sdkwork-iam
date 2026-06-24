import { describe, expect, it, vi } from "vitest";

import { assertIamAppSdkClient, assertIamBackendSdkClient, getIamSdkSurface } from "@sdkwork/iam-sdk-ports";

import {
  createIamAppSdkAdapter,
  createIamBackendSdkAdapter,
  createIamSdkAdapters,
  unwrapIamSdkResponse,
} from "../src/index";

describe("SDKWork IAM generated SDK adapters", () => {
  it("unwraps standard response envelopes at the IAM app SDK adapter boundary", async () => {
    const generatedAppClient = createGeneratedAppClient({
      auth: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            code: "2000",
            msg: "SUCCESS",
            data: {
              accessToken: "access",
              authToken: "auth",
            },
          }),
        },
      },
      oauth: {
        deviceAuthorizations: {
          create: vi.fn().mockResolvedValue({
            code: 2000,
            data: {
              deviceAuthorizationId: "device-authorization-1",
              qrContent: {
                content: "https://127.0.0.1:3900/auth/device/device-authorization-1",
                mode: "fallback_url",
              },
              status: "pending",
            },
            msg: "SUCCESS",
          }),
        },
      },
    });

    const appClient = createIamAppSdkAdapter(generatedAppClient);

    await expect(appClient.auth?.sessions?.create?.({
      password: "secret",
      username: "alice",
    })).resolves.toEqual({
      accessToken: "access",
      authToken: "auth",
    });
    await expect(appClient.oauth?.deviceAuthorizations?.create?.({ purpose: "login" })).resolves.toEqual({
      deviceAuthorizationId: "device-authorization-1",
      qrContent: {
        content: "https://127.0.0.1:3900/auth/device/device-authorization-1",
        mode: "fallback_url",
      },
      status: "pending",
    });
  });

  it("adapts generated OAuth device authorization path-parameter methods to standard IAM ports", async () => {
    const deviceAuthorization = (deviceAuthorizationId: string, status: string) => ({
      id: `device_authorization_${deviceAuthorizationId}`,
      deviceAuthorizationId,
      purpose: "login",
      defaultAccountId: null,
      defaultEntryId: null,
      defaultProvider: null,
      defaultAccountType: null,
      qrContent: {
        content: `https://127.0.0.1:3900/auth/device/${deviceAuthorizationId}?device_authorization_id=${deviceAuthorizationId}&purpose=login&scan_source=browser`,
        mode: "fallback_url",
      },
      fallbackUrl: `https://127.0.0.1:3900/auth/device/${deviceAuthorizationId}?device_authorization_id=${deviceAuthorizationId}&purpose=login&scan_source=browser`,
      status,
      scannedAt: null,
      completedAt: null,
      expiresAt: "2099-01-01T00:00:00Z",
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
    });
    const retrieveCalls: unknown[][] = [];
    const scanCalls: unknown[][] = [];
    const passwordCalls: unknown[][] = [];
    function retrieve(pathParams: { deviceAuthorizationId: string }) {
      retrieveCalls.push([pathParams]);
      return Promise.resolve({
        code: "2000",
        msg: "SUCCESS",
        data: deviceAuthorization(pathParams.deviceAuthorizationId, "pending"),
      });
    }
    function createScan(pathParams: { deviceAuthorizationId: string }, body: Record<string, unknown>) {
      scanCalls.push([pathParams, body]);
      return Promise.resolve({
        code: "2000",
        msg: "SUCCESS",
        data: {
          ...deviceAuthorization(pathParams.deviceAuthorizationId, "scanned"),
          scannedAt: "2026-06-03T00:01:00Z",
          scanSource: body.scanSource,
        },
      });
    }
    function createPassword(pathParams: { deviceAuthorizationId: string }, body: Record<string, unknown>) {
      passwordCalls.push([pathParams, body]);
      return Promise.resolve({
        code: "2000",
        msg: "SUCCESS",
        data: {
          ...deviceAuthorization(pathParams.deviceAuthorizationId, "completed"),
          completedAt: "2026-06-03T00:02:00Z",
          session: {
            accessToken: "access-token",
            authToken: "auth-token",
            user: {
              email: body.username,
              id: "user-1",
            },
          },
        },
      });
    }
    const generatedAppClient = createGeneratedAppClient({
      oauth: {
        deviceAuthorizations: {
          create: vi.fn().mockResolvedValue({
            code: "2000",
            msg: "SUCCESS",
            data: deviceAuthorization("device-authorization-1", "pending"),
          }),
          retrieve,
          scans: {
            create: createScan,
          },
          passwordCompletions: {
            create: createPassword,
          },
        },
      },
    });

    const appClient = createIamAppSdkAdapter(generatedAppClient);

    await expect(appClient.oauth?.deviceAuthorizations?.create?.({ purpose: "login" })).resolves.toMatchObject({
      qrContent: { mode: "fallback_url" },
      deviceAuthorizationId: "device-authorization-1",
      status: "pending",
    });
    await expect(appClient.oauth?.deviceAuthorizations?.retrieve?.("device-authorization-1")).resolves.toMatchObject({
      deviceAuthorizationId: "device-authorization-1",
      status: "pending",
    });
    await expect(appClient.oauth?.deviceAuthorizations?.scans?.create?.("device-authorization-1", {
      scanSource: "browser",
    })).resolves.toMatchObject({
      deviceAuthorizationId: "device-authorization-1",
      status: "scanned",
    });
    await expect(appClient.oauth?.deviceAuthorizations?.passwordCompletions?.create?.("device-authorization-1", {
      password: "secret",
      username: "alice@example.com",
    })).resolves.toMatchObject({
      session: {
        accessToken: "access-token",
        authToken: "auth-token",
      },
      deviceAuthorizationId: "device-authorization-1",
      status: "completed",
    });

    expect(retrieveCalls).toEqual([[{ deviceAuthorizationId: "device-authorization-1" }]]);
    expect(scanCalls).toEqual([[{ deviceAuthorizationId: "device-authorization-1" }, {
      scanSource: "browser",
    }]]);
    expect(passwordCalls).toEqual([[{ deviceAuthorizationId: "device-authorization-1" }, {
      password: "secret",
      username: "alice@example.com",
    }]]);
  });

  it("adapts string path-parameter OAuth device authorization methods from sdkwork-router style generated SDKs", async () => {
    const deviceAuthorization = (deviceAuthorizationId: string, status: string) => ({
      id: `device_authorization_${deviceAuthorizationId}`,
      deviceAuthorizationId,
      purpose: "login",
      defaultAccountId: null,
      defaultEntryId: null,
      defaultProvider: null,
      defaultAccountType: null,
      qrContent: {
        content: `https://127.0.0.1:3900/auth/device/${deviceAuthorizationId}?device_authorization_id=${deviceAuthorizationId}&purpose=login&scan_source=browser`,
        mode: "fallback_url",
      },
      fallbackUrl: `https://127.0.0.1:3900/auth/device/${deviceAuthorizationId}?device_authorization_id=${deviceAuthorizationId}&purpose=login&scan_source=browser`,
      status,
      scannedAt: null,
      completedAt: null,
      expiresAt: "2099-01-01T00:00:00Z",
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
    });
    const generatedAppClient = createGeneratedAppClient({
      oauth: {
        deviceAuthorizations: {
          retrieve: vi.fn().mockImplementation((deviceAuthorizationId: string) => Promise.resolve({
            code: "2000",
            msg: "SUCCESS",
            data: deviceAuthorization(deviceAuthorizationId, "pending"),
          })),
          scans: {
            create: vi.fn().mockImplementation((deviceAuthorizationId: string, body: Record<string, unknown>) => Promise.resolve({
              code: "2000",
              msg: "SUCCESS",
              data: {
                ...deviceAuthorization(deviceAuthorizationId, "scanned"),
                scannedAt: "2026-06-03T00:01:00Z",
                scanSource: body.scanSource,
              },
            })),
          },
          passwordCompletions: {
            create: vi.fn().mockImplementation((deviceAuthorizationId: string, body: Record<string, unknown>) => Promise.resolve({
              code: "2000",
              msg: "SUCCESS",
              data: {
                ...deviceAuthorization(deviceAuthorizationId, "completed"),
                completedAt: "2026-06-03T00:02:00Z",
                session: {
                  accessToken: "access-token",
                  authToken: "auth-token",
                  user: {
                    email: body.username,
                    id: "user-1",
                  },
                },
              },
            })),
          },
        },
      },
    });

    const appClient = createIamAppSdkAdapter(generatedAppClient);

    await expect(appClient.oauth?.deviceAuthorizations?.retrieve?.("device-authorization-1")).resolves.toMatchObject({
      deviceAuthorizationId: "device-authorization-1",
      status: "pending",
    });
    await expect(appClient.oauth?.deviceAuthorizations?.scans?.create?.("device-authorization-1", {
      scanSource: "browser",
    })).resolves.toMatchObject({
      deviceAuthorizationId: "device-authorization-1",
      status: "scanned",
    });
    await expect(appClient.oauth?.deviceAuthorizations?.passwordCompletions?.create?.("device-authorization-1", {
      password: "secret",
      username: "alice@example.com",
    })).resolves.toMatchObject({
      session: {
        accessToken: "access-token",
        authToken: "auth-token",
      },
      deviceAuthorizationId: "device-authorization-1",
      status: "completed",
    });

    expect(generatedAppClient.oauth.deviceAuthorizations.retrieve).toHaveBeenCalledWith("device-authorization-1");
    expect(generatedAppClient.oauth.deviceAuthorizations.scans.create).toHaveBeenCalledWith("device-authorization-1", {
      scanSource: "browser",
    });
    expect(generatedAppClient.oauth.deviceAuthorizations.passwordCompletions.create).toHaveBeenCalledWith("device-authorization-1", {
      password: "secret",
      username: "alice@example.com",
    });
  });

  it("preserves class method this-binding for generated app SDK IAM resources", async () => {
    const transport = {
      request: vi.fn().mockImplementation((operation: string, payload?: unknown) => Promise.resolve({
        code: "2000",
        msg: "SUCCESS",
        data: {
          operation,
          payload,
          deviceAuthorizationId: operation.includes("deviceAuthorizations")
            ? (Array.isArray(payload) ? payload[0] : "device-authorization-1")
            : undefined,
          status: operation.includes("passwordCompletions") ? "completed" : "pending",
        },
      })),
    };

    class SessionsApi {
      readonly loginContextSelection: {
        create: (body: Record<string, unknown>) => Promise<unknown>;
      };
      readonly organizationSelection: {
        create: (body: Record<string, unknown>) => Promise<unknown>;
      };
      readonly current: {
        delete: () => Promise<unknown>;
        retrieve: () => Promise<unknown>;
        update: (body?: Record<string, unknown>) => Promise<unknown>;
      };

      constructor(private readonly apiTransport: typeof transport) {
        this.loginContextSelection = {
          create: (body: Record<string, unknown>) =>
            this.apiTransport.request("auth.sessions.loginContextSelection.create", body),
        };
        this.organizationSelection = {
          create: (body: Record<string, unknown>) =>
            this.apiTransport.request("auth.sessions.organizationSelection.create", body),
        };
        this.current = {
          delete: () => this.apiTransport.request("auth.sessions.current.delete"),
          retrieve: () => this.apiTransport.request("auth.sessions.current.retrieve"),
          update: (body?: Record<string, unknown>) => this.apiTransport.request("auth.sessions.current.update", body),
        };
      }

      create(body: Record<string, unknown>) {
        return this.apiTransport.request("auth.sessions.create", body);
      }

      refresh(body: Record<string, unknown>) {
        return this.apiTransport.request("auth.sessions.refresh", body);
      }
    }

    class OauthDeviceAuthorizationPasswordCompletionsApi {
      constructor(private readonly apiTransport: typeof transport) {}

      create(deviceAuthorizationId: string, body: Record<string, unknown>) {
        return this.apiTransport.request("oauth.deviceAuthorizations.passwordCompletions.create", [deviceAuthorizationId, body]);
      }
    }

    class OauthDeviceAuthorizationSessionExchangesApi {
      constructor(private readonly apiTransport: typeof transport) {}

      create(deviceAuthorizationId: string, body: Record<string, unknown>) {
        return this.apiTransport.request("oauth.deviceAuthorizations.sessionExchanges.create", [deviceAuthorizationId, body]);
      }
    }

    class OauthDeviceAuthorizationsApi {
      readonly passwordCompletions: OauthDeviceAuthorizationPasswordCompletionsApi;
      readonly sessionExchanges: OauthDeviceAuthorizationSessionExchangesApi;
      readonly scans: {
        create: (deviceAuthorizationId: string, body?: Record<string, unknown>) => Promise<unknown>;
      };

      constructor(private readonly apiTransport: typeof transport) {
        this.passwordCompletions = new OauthDeviceAuthorizationPasswordCompletionsApi(apiTransport);
        this.sessionExchanges = new OauthDeviceAuthorizationSessionExchangesApi(apiTransport);
        this.scans = {
          create: (deviceAuthorizationId: string, body?: Record<string, unknown>) =>
            this.apiTransport.request("oauth.deviceAuthorizations.scans.create", [deviceAuthorizationId, body]),
        };
      }

      create(body: Record<string, unknown>) {
        return this.apiTransport.request("oauth.deviceAuthorizations.create", body);
      }

      retrieve(deviceAuthorizationId: string) {
        return this.apiTransport.request("oauth.deviceAuthorizations.retrieve", [deviceAuthorizationId]);
      }
    }

    const generatedAppClient = createGeneratedAppClient();
    generatedAppClient.auth.sessions = new SessionsApi(transport);
    generatedAppClient.oauth.deviceAuthorizations = new OauthDeviceAuthorizationsApi(transport);

    const appClient = createIamAppSdkAdapter(generatedAppClient);

    await expect(appClient.auth?.sessions?.create?.({
      password: "secret",
      username: "alice",
    })).resolves.toMatchObject({
      operation: "auth.sessions.create",
    });
    await expect(appClient.auth?.sessions?.loginContextSelection?.create?.({
      continuationToken: "select-login-context-token",
      loginScope: "TENANT",
    })).resolves.toMatchObject({
      operation: "auth.sessions.loginContextSelection.create",
    });
    await expect(appClient.auth?.sessions?.organizationSelection?.create?.({
      continuationToken: "select-organization-token",
      organizationId: "o1",
    })).resolves.toMatchObject({
      operation: "auth.sessions.organizationSelection.create",
    });
    await expect(appClient.oauth?.deviceAuthorizations?.create?.({ purpose: "login" })).resolves.toMatchObject({
      operation: "oauth.deviceAuthorizations.create",
    });
    await expect(appClient.oauth?.deviceAuthorizations?.retrieve?.("device-authorization-1")).resolves.toMatchObject({
      operation: "oauth.deviceAuthorizations.retrieve",
      deviceAuthorizationId: "device-authorization-1",
    });
    await expect(appClient.oauth?.deviceAuthorizations?.passwordCompletions?.create?.("device-authorization-1", {
      password: "secret",
      username: "alice",
    })).resolves.toMatchObject({
      operation: "oauth.deviceAuthorizations.passwordCompletions.create",
      deviceAuthorizationId: "device-authorization-1",
      status: "completed",
    });
  });

  it("keeps raw DTOs and rejects non-success standard IAM envelopes", () => {
    expect(unwrapIamSdkResponse({ deviceAuthorizationId: "device-authorization-1", status: "pending" })).toEqual({
      deviceAuthorizationId: "device-authorization-1",
      status: "pending",
    });
    expect(unwrapIamSdkResponse({ code: "0", data: { ok: true } })).toEqual({ ok: true });
    expect(unwrapIamSdkResponse({ code: 200, data: ["a"] })).toEqual(["a"]);
    expect(() => unwrapIamSdkResponse({
      code: "5000",
      data: null,
      msg: "QR session unavailable",
    }, "QR auth failed")).toThrow("QR session unavailable");
  });

  it("adapts the current generated appbase app SDK auth and system IAM surfaces into standard IAM ports", async () => {
    const generatedAppClient = createGeneratedAppClient({
      oauth: {
        authorizationUrls: {
          create: vi.fn().mockResolvedValue({ data: { url: "https://auth.example" } }),
        },
        sessions: {
          create: vi.fn().mockResolvedValue({ data: { accessToken: "oauth-access", authToken: "oauth-auth" } }),
        },
      },
      auth: {
        passwordResetRequests: {
          create: vi.fn().mockResolvedValue({ data: true }),
        },
        passwordResets: {
          create: vi.fn().mockResolvedValue({ data: true }),
        },
        registrations: {
          create: vi.fn().mockResolvedValue({ data: { accessToken: "registered-access", authToken: "registered-auth" } }),
        },
        sessions: {
          create: vi.fn().mockResolvedValue({ data: { accessToken: "access", authToken: "auth" } }),
          current: {
            delete: vi.fn().mockResolvedValue({ data: undefined }),
            retrieve: vi.fn().mockResolvedValue({ data: { accessToken: "current-access", authToken: "current-auth" } }),
            update: vi.fn().mockResolvedValue({ data: { accessToken: "updated-access", authToken: "updated-auth" } }),
          },
          refresh: vi.fn().mockResolvedValue({ data: { accessToken: "refresh-access", authToken: "refresh-auth" } }),
        },
      },
      system: {
        iam: {
          runtime: {
            retrieve: vi.fn().mockResolvedValue({
              data: {
                loginMethods: ["password", "emailCode"],
              },
            }),
          },
          verificationPolicy: {
            retrieve: vi.fn().mockResolvedValue({
              data: {
                emailCodeLoginEnabled: true,
                emailRegistrationVerificationRequired: true,
                phoneCodeLoginEnabled: false,
                phoneRegistrationVerificationRequired: false,
              },
            }),
          },
        },
      },
      iam: {
        users: {
          current: {
            retrieve: vi.fn().mockResolvedValue({ data: { displayName: "Alice", id: "u1" } }),
          },
        },
        organizations: {
          list: vi.fn().mockResolvedValue({ data: [{ organizationId: "org-1" }] }),
          tree: {
            retrieve: vi.fn().mockResolvedValue({ data: [{ organizationId: "org-1", children: [] }] }),
          },
        },
        organizationMemberships: {
          list: vi.fn().mockResolvedValue({ data: [{ id: "membership-1", organizationId: "org-1", userId: "u1" }] }),
        },
        departments: {
          list: vi.fn().mockResolvedValue({ data: [{ departmentId: "dept-1", organizationId: "org-1" }] }),
          tree: {
            retrieve: vi.fn().mockResolvedValue({ data: [{ departmentId: "dept-1", children: [] }] }),
          },
        },
        departmentAssignments: {
          list: vi.fn().mockResolvedValue({ data: [{ departmentId: "dept-1", userId: "u1" }] }),
        },
        positions: {
          list: vi.fn().mockResolvedValue({ data: [{ positionId: "position-1" }] }),
        },
        positionAssignments: {
          list: vi.fn().mockResolvedValue({ data: [{ positionId: "position-1", userId: "u1" }] }),
        },
        roleBindings: {
          list: vi.fn().mockResolvedValue({ data: [{ roleId: "role-1", scopeId: "org-1" }] }),
        },
      },
    });

    const appClient = createIamAppSdkAdapter(generatedAppClient);

    expect(() => assertIamAppSdkClient(appClient)).not.toThrow();
    await appClient.auth?.sessions?.create?.({ password: "secret", username: "alice" });
    await appClient.oauth?.authorizationUrls?.create?.({ provider: "github", redirectUri: "https://app.example/callback" });
    await appClient.oauth?.sessions?.create?.({ code: "oauth-code", provider: "github" });
    await appClient.auth?.registrations?.create?.({ password: "secret", username: "alice", verificationCode: "123456" });
    await appClient.system?.iam?.runtime?.retrieve?.({ tenantCode: "default" });
    await appClient.system?.iam?.verificationPolicy?.retrieve?.();
    await appClient.iam?.users?.current?.retrieve?.();
    await appClient.iam?.organizations?.list?.({ tenantId: "tenant-1" });
    await appClient.iam?.organizations?.tree?.retrieve?.({ tenantId: "tenant-1" });
    await appClient.iam?.organizationMemberships?.list?.({ organizationId: "org-1" });
    await appClient.iam?.departments?.list?.({ organizationId: "org-1" });
    await appClient.iam?.departments?.tree?.retrieve?.({ organizationId: "org-1" });
    await appClient.iam?.departmentAssignments?.list?.({ departmentId: "dept-1" });
    await appClient.iam?.positions?.list?.({ departmentId: "dept-1" });
    await appClient.iam?.positionAssignments?.list?.({ departmentAssignmentId: "assignment-1" });
    await appClient.iam?.roleBindings?.list?.({ scopeId: "org-1" });

    expect(generatedAppClient.auth.sessions.create).toHaveBeenCalledWith({ password: "secret", username: "alice" });
    expect(generatedAppClient.oauth.authorizationUrls.create).toHaveBeenCalledWith({ provider: "github", redirectUri: "https://app.example/callback" });
    expect(generatedAppClient.oauth.sessions.create).toHaveBeenCalledWith({ code: "oauth-code", provider: "github" });
    expect(generatedAppClient.auth.registrations.create).toHaveBeenCalledWith({ password: "secret", username: "alice", verificationCode: "123456" });
    expect(generatedAppClient.system.iam.runtime.retrieve).toHaveBeenCalledWith({ tenantCode: "default" });
    expect(generatedAppClient.system.iam.verificationPolicy.retrieve).toHaveBeenCalledTimes(1);
    expect(generatedAppClient.iam.users.current.retrieve).toHaveBeenCalled();
    expect(generatedAppClient.iam.organizations.list).toHaveBeenCalledWith({ tenantId: "tenant-1" });
    expect(generatedAppClient.iam.organizations.tree.retrieve).toHaveBeenCalledWith({ tenantId: "tenant-1" });
    expect(generatedAppClient.iam.departments.list).toHaveBeenCalledWith({ organizationId: "org-1" });
    expect(generatedAppClient.iam.departmentAssignments.list).toHaveBeenCalledWith({ departmentId: "dept-1" });
  });

  it("rejects legacy app SDK auth methods instead of adapting them into appbase login ports", () => {
    expect(() =>
      createIamAppSdkAdapter({
        auth: {
          login: vi.fn(),
          refreshToken: vi.fn(),
        },
        user: {
          getUserProfile: vi.fn(),
        },
      }),
    ).toThrow(/forbidden legacy IAM methods.*auth\.login.*auth\.refreshToken.*user.*user\.getUserProfile/i);
  });

  it("adapts the current generated backend SDK management surface into standard IAM ports", async () => {
    const generatedBackendClient = {
      iam: {
        accessCredentials: {
          create: vi.fn().mockResolvedValue({ data: { id: "credential-1" } }),
        },
        applications: {
          register: vi.fn().mockResolvedValue({ data: { applicationId: "app-1" } }),
        },
        apiKeys: {
          list: vi.fn().mockResolvedValue({ data: [] }),
          revoke: vi.fn().mockResolvedValue({ data: true }),
        },
        auditEvents: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
        organizations: {
          create: vi.fn().mockResolvedValue({ data: { id: "organization-1" } }),
          delete: vi.fn().mockResolvedValue({ data: true }),
          retrieve: vi.fn().mockResolvedValue({ data: { id: "organization-1" } }),
          update: vi.fn().mockResolvedValue({ data: { id: "organization-1" } }),
        },
        organizationMemberships: {
          create: vi.fn().mockResolvedValue({ data: { id: "membership-1" } }),
          update: vi.fn().mockResolvedValue({ data: { id: "membership-1" } }),
        },
        departments: {
          create: vi.fn().mockResolvedValue({ data: { id: "department-1" } }),
          delete: vi.fn().mockResolvedValue({ data: true }),
          retrieve: vi.fn().mockResolvedValue({ data: { id: "department-1" } }),
          update: vi.fn().mockResolvedValue({ data: { id: "department-1" } }),
        },
        departmentAssignments: {
          create: vi.fn().mockResolvedValue({ data: { id: "department-assignment-1" } }),
          update: vi.fn().mockResolvedValue({ data: { id: "department-assignment-1" } }),
        },
        permissions: {
          create: vi.fn().mockResolvedValue({ data: { id: "permission-1" } }),
          delete: vi.fn().mockResolvedValue({ data: true }),
          list: vi.fn().mockResolvedValue({ data: [] }),
          retrieve: vi.fn().mockResolvedValue({ data: { id: "permission-1" } }),
          update: vi.fn().mockResolvedValue({ data: { id: "permission-1" } }),
        },
        policies: {
          create: vi.fn().mockResolvedValue({ data: { id: "policy-1" } }),
          delete: vi.fn().mockResolvedValue({ data: true }),
          list: vi.fn().mockResolvedValue({ data: [] }),
          retrieve: vi.fn().mockResolvedValue({ data: { id: "policy-1" } }),
          update: vi.fn().mockResolvedValue({ data: { id: "policy-1" } }),
        },
        accountBindingPolicy: {
          retrieve: vi.fn().mockResolvedValue({ data: { contactBinding: { enabled: true } } }),
          update: vi.fn().mockResolvedValue({ data: { contactBinding: { enabled: true } } }),
        },
        positions: {
          create: vi.fn().mockResolvedValue({ data: { id: "position-1" } }),
          delete: vi.fn().mockResolvedValue({ data: true }),
          update: vi.fn().mockResolvedValue({ data: { id: "position-1" } }),
        },
        positionAssignments: {
          create: vi.fn().mockResolvedValue({ data: { id: "position-assignment-1" } }),
          update: vi.fn().mockResolvedValue({ data: { id: "position-assignment-1" } }),
        },
        roles: {
          create: vi.fn().mockResolvedValue({ data: { id: "role-1" } }),
          delete: vi.fn().mockResolvedValue({ data: true }),
          list: vi.fn().mockResolvedValue({ data: [] }),
          retrieve: vi.fn().mockResolvedValue({ data: { id: "role-1" } }),
          update: vi.fn().mockResolvedValue({ data: { id: "role-1" } }),
          permissions: {
            create: vi.fn().mockResolvedValue({ data: { id: "rp-1" } }),
            delete: vi.fn().mockResolvedValue({ data: true }),
            list: vi.fn().mockResolvedValue({ data: [] }),
          },
        },
        roleBindings: {
          create: vi.fn().mockResolvedValue({ data: { id: "role-binding-1" } }),
          delete: vi.fn().mockResolvedValue({ data: true }),
        },
        securityEvents: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
        tenantApplications: {
          enable: vi.fn().mockResolvedValue({ data: { tenantApplicationId: "ta-1" } }),
          provision: vi.fn().mockResolvedValue({ data: { tenantApplicationId: "ta-1" } }),
          update: vi.fn().mockResolvedValue({ data: { tenantApplicationId: "ta-1" } }),
        },
        tenants: {
          create: vi.fn().mockResolvedValue({ data: { id: "tenant-1" } }),
          delete: vi.fn().mockResolvedValue({ data: true }),
          list: vi.fn().mockResolvedValue({ data: [] }),
          retrieve: vi.fn().mockResolvedValue({ data: { id: "tenant-1" } }),
          update: vi.fn().mockResolvedValue({ data: { id: "tenant-1" } }),
          members: {
            create: vi.fn().mockResolvedValue({ data: { id: "tenant-member-1" } }),
            delete: vi.fn().mockResolvedValue({ data: true }),
            list: vi.fn().mockResolvedValue({ data: [] }),
            update: vi.fn().mockResolvedValue({ data: { id: "tenant-member-1" } }),
          },
        },
        users: {
          create: vi.fn().mockResolvedValue({ data: { id: "user-1" } }),
          delete: vi.fn().mockResolvedValue({ data: true }),
          list: vi.fn().mockResolvedValue({ data: [] }),
          retrieve: vi.fn().mockResolvedValue({ data: { id: "u1" } }),
          update: vi.fn().mockResolvedValue({ data: { id: "u1" } }),
        },
      },
    };

    const backendClient = createIamBackendSdkAdapter(generatedBackendClient);

    expect(() => assertIamBackendSdkClient(backendClient)).not.toThrow();
    await backendClient.iam?.tenants?.create?.({ name: "Tenant" });
    await backendClient.iam?.tenants?.delete?.("t1");
    await backendClient.iam?.tenants?.list?.();
    await backendClient.iam?.tenants?.retrieve?.("t1");
    await backendClient.iam?.tenants?.update?.("t1", { name: "Tenant 2" });
    await backendClient.iam?.tenants?.members?.create?.("t1", { userId: "u1" });
    await backendClient.iam?.tenants?.members?.delete?.("t1", "u1");
    await backendClient.iam?.tenants?.members?.list?.("t1");
    await backendClient.iam?.tenants?.members?.update?.("t1", "u1", { status: "active" });
    await backendClient.iam?.apiKeys?.list?.();
    await backendClient.iam?.apiKeys?.revoke?.("api-key-1");
    await backendClient.iam?.auditEvents?.list?.({ tenantId: "tenant-1" });
    await backendClient.iam?.securityEvents?.list?.({ tenantId: "tenant-1" });
    await backendClient.iam?.organizations?.create?.({ name: "Org" });
    await backendClient.iam?.organizations?.delete?.("o1");
    await backendClient.iam?.organizations?.retrieve?.("o1");
    await backendClient.iam?.organizations?.update?.("o1", { name: "Org 2" });
    await backendClient.iam?.organizationMemberships?.create?.({ organizationId: "o1", userId: "u1" });
    await backendClient.iam?.organizationMemberships?.update?.("membership-1", { status: "active" });
    await backendClient.iam?.departments?.create?.({ organizationId: "o1", name: "Product" });
    await backendClient.iam?.departments?.delete?.("department-1");
    await backendClient.iam?.departments?.retrieve?.("department-1");
    await backendClient.iam?.departments?.update?.("department-1", { name: "Platform" });
    await backendClient.iam?.departmentAssignments?.create?.({ departmentId: "department-1", userId: "u1" });
    await backendClient.iam?.departmentAssignments?.update?.("department-assignment-1", { isPrimary: true });
    expect(Object.prototype.hasOwnProperty.call(backendClient.iam?.organizations ?? {}, "members")).toBe(false);
    await backendClient.iam?.users?.create?.({ username: "alice" });
    await backendClient.iam?.users?.delete?.("u1");
    await backendClient.iam?.users?.list?.();
    await backendClient.iam?.users?.retrieve?.("u1");
    await backendClient.iam?.users?.update?.("u1", { displayName: "Alice" });
    await backendClient.iam?.roles?.create?.({ code: "admin" });
    await backendClient.iam?.roles?.delete?.("r1");
    await backendClient.iam?.roles?.list?.();
    await backendClient.iam?.roles?.retrieve?.("r1");
    await backendClient.iam?.roles?.update?.("r1", { name: "Admin" });
    await backendClient.iam?.roles?.permissions?.create?.("r1", "p1");
    await backendClient.iam?.roles?.permissions?.delete?.("r1", "p1");
    await backendClient.iam?.roles?.permissions?.list?.("r1");
    await backendClient.iam?.permissions?.create?.({ code: "iam.users.read" });
    await backendClient.iam?.permissions?.delete?.("p1");
    await backendClient.iam?.permissions?.list?.();
    await backendClient.iam?.permissions?.retrieve?.("p1");
    await backendClient.iam?.permissions?.update?.("p1", { name: "Read users" });
    await backendClient.iam?.policies?.create?.({ code: "policy" });
    await backendClient.iam?.policies?.delete?.("po1");
    await backendClient.iam?.policies?.list?.();
    await backendClient.iam?.policies?.retrieve?.("po1");
    await backendClient.iam?.policies?.update?.("po1", { name: "Policy" });
    await backendClient.iam?.positions?.create?.({ name: "Product Owner" });
    await backendClient.iam?.positions?.delete?.("position-1");
    await backendClient.iam?.positions?.update?.("position-1", { name: "Senior Product Owner" });
    await backendClient.iam?.positionAssignments?.create?.({ positionId: "position-1", userId: "u1" });
    await backendClient.iam?.positionAssignments?.update?.("position-assignment-1", { isPrimary: true });
    await backendClient.iam?.roleBindings?.create?.({ roleId: "role-1", scopeId: "o1" });
    await backendClient.iam?.roleBindings?.delete?.("role-binding-1");
    expect(Object.prototype.hasOwnProperty.call(backendClient.iam?.users ?? {}, "roles")).toBe(false);

    expect(generatedBackendClient.iam.tenants.create).toHaveBeenCalledWith({ name: "Tenant" });
    expect(generatedBackendClient.iam.tenants.delete).toHaveBeenCalledWith("t1");
    expect(generatedBackendClient.iam.tenants.retrieve).toHaveBeenCalledWith("t1");
    expect(generatedBackendClient.iam.tenants.update).toHaveBeenCalledWith("t1", { name: "Tenant 2" });
    expect(generatedBackendClient.iam.tenants.members.create).toHaveBeenCalledWith("t1", { userId: "u1" });
    expect(generatedBackendClient.iam.tenants.members.delete).toHaveBeenCalledWith("t1", "u1");
    expect(generatedBackendClient.iam.tenants.members.update).toHaveBeenCalledWith("t1", "u1", { status: "active" });
    expect(generatedBackendClient.iam.tenants.list).toHaveBeenCalled();
    expect(generatedBackendClient.iam.apiKeys.list).toHaveBeenCalled();
    expect(generatedBackendClient.iam.apiKeys.revoke).toHaveBeenCalledWith("api-key-1");
    expect(generatedBackendClient.iam.auditEvents.list).toHaveBeenCalledWith({ tenantId: "tenant-1" });
    expect(generatedBackendClient.iam.securityEvents.list).toHaveBeenCalledWith({ tenantId: "tenant-1" });
    expect(generatedBackendClient.iam.organizations.create).toHaveBeenCalledWith({ name: "Org" });
    expect(generatedBackendClient.iam.organizations.delete).toHaveBeenCalledWith("o1");
    expect(generatedBackendClient.iam.organizations.retrieve).toHaveBeenCalledWith("o1");
    expect(generatedBackendClient.iam.organizations.update).toHaveBeenCalledWith("o1", { name: "Org 2" });
    expect(generatedBackendClient.iam.organizationMemberships.create).toHaveBeenCalledWith({ organizationId: "o1", userId: "u1" });
    expect(generatedBackendClient.iam.organizationMemberships.update).toHaveBeenCalledWith("membership-1", { status: "active" });
    expect(generatedBackendClient.iam.departments.create).toHaveBeenCalledWith({ organizationId: "o1", name: "Product" });
    expect(generatedBackendClient.iam.departments.delete).toHaveBeenCalledWith("department-1");
    expect(generatedBackendClient.iam.departments.retrieve).toHaveBeenCalledWith("department-1");
    expect(generatedBackendClient.iam.departments.update).toHaveBeenCalledWith("department-1", { name: "Platform" });
    expect(generatedBackendClient.iam.departmentAssignments.create).toHaveBeenCalledWith({ departmentId: "department-1", userId: "u1" });
    expect(generatedBackendClient.iam.departmentAssignments.update).toHaveBeenCalledWith("department-assignment-1", { isPrimary: true });
    expect(generatedBackendClient.iam.users.create).toHaveBeenCalledWith({ username: "alice" });
    expect(generatedBackendClient.iam.users.delete).toHaveBeenCalledWith("u1");
    expect(generatedBackendClient.iam.users.retrieve).toHaveBeenCalledWith("u1");
    expect(generatedBackendClient.iam.users.update).toHaveBeenCalledWith("u1", { displayName: "Alice" });
    expect(generatedBackendClient.iam.roles.create).toHaveBeenCalledWith({ code: "admin" });
    expect(generatedBackendClient.iam.roles.delete).toHaveBeenCalledWith("r1");
    expect(generatedBackendClient.iam.roles.retrieve).toHaveBeenCalledWith("r1");
    expect(generatedBackendClient.iam.roles.update).toHaveBeenCalledWith("r1", { name: "Admin" });
    expect(generatedBackendClient.iam.roles.permissions.create).toHaveBeenCalledWith("r1", "p1");
    expect(generatedBackendClient.iam.roles.permissions.delete).toHaveBeenCalledWith("r1", "p1");
    expect(generatedBackendClient.iam.roles.permissions.list).toHaveBeenCalledWith("r1");
    expect(generatedBackendClient.iam.permissions.create).toHaveBeenCalledWith({ code: "iam.users.read" });
    expect(generatedBackendClient.iam.permissions.delete).toHaveBeenCalledWith("p1");
    expect(generatedBackendClient.iam.permissions.retrieve).toHaveBeenCalledWith("p1");
    expect(generatedBackendClient.iam.permissions.update).toHaveBeenCalledWith("p1", { name: "Read users" });
    expect(generatedBackendClient.iam.policies.create).toHaveBeenCalledWith({ code: "policy" });
    expect(generatedBackendClient.iam.policies.delete).toHaveBeenCalledWith("po1");
    expect(generatedBackendClient.iam.policies.retrieve).toHaveBeenCalledWith("po1");
    expect(generatedBackendClient.iam.policies.update).toHaveBeenCalledWith("po1", { name: "Policy" });
    expect(generatedBackendClient.iam.positions.create).toHaveBeenCalledWith({ name: "Product Owner" });
    expect(generatedBackendClient.iam.positions.delete).toHaveBeenCalledWith("position-1");
    expect(generatedBackendClient.iam.positions.update).toHaveBeenCalledWith("position-1", { name: "Senior Product Owner" });
    expect(generatedBackendClient.iam.positionAssignments.create).toHaveBeenCalledWith({ positionId: "position-1", userId: "u1" });
    expect(generatedBackendClient.iam.positionAssignments.update).toHaveBeenCalledWith("position-assignment-1", { isPrimary: true });
    expect(generatedBackendClient.iam.roleBindings.create).toHaveBeenCalledWith({ roleId: "role-1", scopeId: "o1" });
    expect(generatedBackendClient.iam.roleBindings.delete).toHaveBeenCalledWith("role-binding-1");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.organizations.list");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.organizations.tree.retrieve");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.organizations.members.create");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.organizations.members.delete");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.organizations.members.list");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.organizations.members.update");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.users.roles.create");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.users.roles.delete");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.users.roles.list");
  });

  it("filters app-only IAM read resources from generated backend SDK clients", () => {
    const generatedBackendClient = createGeneratedBackendClient({
      iam: {
        departmentAssignments: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
        departments: {
          list: vi.fn().mockResolvedValue({ data: [] }),
          tree: {
            retrieve: vi.fn().mockResolvedValue({ data: [] }),
          },
        },
        organizationMemberships: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
        organizations: {
          list: vi.fn().mockResolvedValue({ data: [] }),
          tree: {
            retrieve: vi.fn().mockResolvedValue({ data: [] }),
          },
        },
        positionAssignments: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
        positions: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
        roleBindings: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    });

    const backendClient = createIamBackendSdkAdapter(generatedBackendClient);
    const backendSurface = getIamSdkSurface(backendClient);

    expect(() => assertIamBackendSdkClient(backendClient)).not.toThrow();
    expect(backendSurface).not.toContain("iam.departmentAssignments.list");
    expect(backendSurface).not.toContain("iam.departments.list");
    expect(backendSurface).not.toContain("iam.departments.tree.retrieve");
    expect(backendSurface).not.toContain("iam.organizationMemberships.list");
    expect(backendSurface).not.toContain("iam.organizations.list");
    expect(backendSurface).not.toContain("iam.organizations.tree.retrieve");
    expect(backendSurface).not.toContain("iam.positionAssignments.list");
    expect(backendSurface).not.toContain("iam.positions.list");
    expect(backendSurface).not.toContain("iam.roleBindings.list");
  });

  it("returns app and backend adapters together for runtime bootstrap", () => {
    const adapters = createIamSdkAdapters({
      appbaseApp: createGeneratedAppClient(),
      appbaseBackend: createGeneratedBackendClient(),
    });

    expect(adapters.appbaseApp.auth?.sessions?.create).toBeTypeOf("function");
    expect(adapters.appbaseApp.oauth?.deviceAuthorizations?.create).toBeTypeOf("function");
    expect(adapters.appbaseBackend?.iam?.tenants?.list).toBeTypeOf("function");
  });
});

type AnyRecord = Record<string, any>;

function createGeneratedAppClient(overrides: AnyRecord = {}): AnyRecord {
  return mergeRecords({
    auth: {
      passwordResetRequests: {
        create: vi.fn().mockResolvedValue({ data: null }),
      },
      passwordResets: {
        create: vi.fn().mockResolvedValue({ data: null }),
      },
      registrations: {
        create: vi.fn().mockResolvedValue({ data: null }),
      },
      sessions: {
        create: vi.fn().mockResolvedValue({ data: null }),
        loginContextSelection: {
          create: vi.fn().mockResolvedValue({ data: null }),
        },
        organizationSelection: {
          create: vi.fn().mockResolvedValue({ data: null }),
        },
        current: {
          delete: vi.fn().mockResolvedValue({ data: null }),
          retrieve: vi.fn().mockResolvedValue({ data: null }),
          update: vi.fn().mockResolvedValue({ data: null }),
        },
        refresh: vi.fn().mockResolvedValue({ data: null }),
      },
    },
    oauth: {
      providers: {
        list: vi.fn().mockResolvedValue({ data: null }),
      },
      authorizationUrls: {
        create: vi.fn().mockResolvedValue({ data: null }),
      },
      deviceAuthorizations: {
        create: vi.fn().mockResolvedValue({ data: null }),
        retrieve: vi.fn().mockResolvedValue({ data: null }),
        scans: {
          create: vi.fn().mockResolvedValue({ data: null }),
        },
        passwordCompletions: {
          create: vi.fn().mockResolvedValue({ data: null }),
        },
        sessionExchanges: {
          create: vi.fn().mockResolvedValue({ data: null }),
        },
      },
      callbacks: {
        handleGet: vi.fn().mockResolvedValue({ data: null }),
        handlePost: vi.fn().mockResolvedValue({ data: null }),
      },
      miniProgramSessions: {
        create: vi.fn().mockResolvedValue({ data: null }),
      },
      sessions: {
        create: vi.fn().mockResolvedValue({ data: null }),
      },
      accountLinks: {
        delete: vi.fn().mockResolvedValue({ data: null }),
        list: vi.fn().mockResolvedValue({ data: null }),
      },
      grants: {
        delete: vi.fn().mockResolvedValue({ data: null }),
        list: vi.fn().mockResolvedValue({ data: null }),
      },
    },
    system: {
      iam: {
        runtime: {
          retrieve: vi.fn().mockResolvedValue({ data: null }),
        },
        verificationPolicy: {
          retrieve: vi.fn().mockResolvedValue({ data: null }),
        },
        accountBindingPolicy: {
          retrieve: vi.fn().mockResolvedValue({ data: null }),
        },
      },
    },
    iam: {
      organizations: {
        list: vi.fn().mockResolvedValue({ data: null }),
        tree: {
          retrieve: vi.fn().mockResolvedValue({ data: null }),
        },
      },
      organizationMemberships: {
        list: vi.fn().mockResolvedValue({ data: null }),
      },
      departments: {
        list: vi.fn().mockResolvedValue({ data: null }),
        tree: {
          retrieve: vi.fn().mockResolvedValue({ data: null }),
        },
      },
      departmentAssignments: {
        list: vi.fn().mockResolvedValue({ data: null }),
      },
      positions: {
        list: vi.fn().mockResolvedValue({ data: null }),
      },
      positionAssignments: {
        list: vi.fn().mockResolvedValue({ data: null }),
      },
      roleBindings: {
        list: vi.fn().mockResolvedValue({ data: null }),
      },
      users: {
        current: {
          retrieve: vi.fn().mockResolvedValue({ data: null }),
          update: vi.fn().mockResolvedValue({ data: null }),
          emailBindings: {
            create: vi.fn().mockResolvedValue({ data: null }),
            delete: vi.fn().mockResolvedValue({ data: null }),
          },
          password: {
            update: vi.fn().mockResolvedValue({ data: null }),
          },
          phoneBindings: {
            create: vi.fn().mockResolvedValue({ data: null }),
            delete: vi.fn().mockResolvedValue({ data: null }),
          },
        },
      },
    },
  }, overrides);
}

function createGeneratedBackendClient(overrides: AnyRecord = {}): AnyRecord {
  return mergeRecords({
    iam: {
      accessCredentials: {
        create: vi.fn().mockResolvedValue({ data: null }),
      },
      applications: {
        register: vi.fn().mockResolvedValue({ data: null }),
      },
      apiKeys: {
        list: vi.fn().mockResolvedValue({ data: null }),
        revoke: vi.fn().mockResolvedValue({ data: null }),
      },
      auditEvents: {
        list: vi.fn().mockResolvedValue({ data: null }),
      },
      organizations: {
        create: vi.fn().mockResolvedValue({ data: null }),
        delete: vi.fn().mockResolvedValue({ data: null }),
        retrieve: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
      },
      organizationMemberships: {
        create: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
      },
      departments: {
        create: vi.fn().mockResolvedValue({ data: null }),
        delete: vi.fn().mockResolvedValue({ data: null }),
        retrieve: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
      },
      departmentAssignments: {
        create: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
      },
      permissions: {
        create: vi.fn().mockResolvedValue({ data: null }),
        delete: vi.fn().mockResolvedValue({ data: null }),
        list: vi.fn().mockResolvedValue({ data: null }),
        retrieve: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
      },
      policies: {
        create: vi.fn().mockResolvedValue({ data: null }),
        delete: vi.fn().mockResolvedValue({ data: null }),
        list: vi.fn().mockResolvedValue({ data: null }),
        retrieve: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
      },
      accountBindingPolicy: {
        retrieve: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
      },
      positions: {
        create: vi.fn().mockResolvedValue({ data: null }),
        delete: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
      },
      positionAssignments: {
        create: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
      },
      roles: {
        create: vi.fn().mockResolvedValue({ data: null }),
        delete: vi.fn().mockResolvedValue({ data: null }),
        list: vi.fn().mockResolvedValue({ data: null }),
        retrieve: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
        permissions: {
          create: vi.fn().mockResolvedValue({ data: null }),
          delete: vi.fn().mockResolvedValue({ data: null }),
          list: vi.fn().mockResolvedValue({ data: null }),
        },
      },
      roleBindings: {
        create: vi.fn().mockResolvedValue({ data: null }),
        delete: vi.fn().mockResolvedValue({ data: null }),
      },
      securityEvents: {
        list: vi.fn().mockResolvedValue({ data: null }),
      },
      tenantApplications: {
        enable: vi.fn().mockResolvedValue({ data: null }),
        provision: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
      },
      tenants: {
        create: vi.fn().mockResolvedValue({ data: null }),
        delete: vi.fn().mockResolvedValue({ data: null }),
        list: vi.fn().mockResolvedValue({ data: null }),
        retrieve: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
        members: {
          create: vi.fn().mockResolvedValue({ data: null }),
          delete: vi.fn().mockResolvedValue({ data: null }),
          list: vi.fn().mockResolvedValue({ data: null }),
          update: vi.fn().mockResolvedValue({ data: null }),
        },
      },
      users: {
        create: vi.fn().mockResolvedValue({ data: null }),
        delete: vi.fn().mockResolvedValue({ data: null }),
        list: vi.fn().mockResolvedValue({ data: null }),
        retrieve: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockResolvedValue({ data: null }),
      },
    },
  }, overrides);
}

function mergeRecords(base: AnyRecord, overrides: AnyRecord): AnyRecord {
  const merged = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    const existing = merged[key];
    if (isPlainRecord(existing) && isPlainRecord(value)) {
      merged[key] = mergeRecords(existing, value);
      continue;
    }
    merged[key] = value;
  }
  return merged;
}

function isPlainRecord(value: unknown): value is AnyRecord {
  return !!value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
}
