import { describe, expect, it, vi } from "vitest";

import {
  SDKWORK_IAM_APP_SDK_REQUIRED_METHODS,
  SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS,
  getIamSdkSurface,
} from "@sdkwork/iam-sdk-ports";

import { createSdkworkIamService } from "../src/index";

describe("SDKWork IAM service", () => {
  it("exposes the same resource facade surface as the canonical app and backend SDK ports", () => {
    const service = createSdkworkIamService({
      appbaseAppClient: {},
      appbaseBackendClient: {},
    });

    expect(getIamSdkSurface(service)).toEqual(
      [
        ...SDKWORK_IAM_APP_SDK_REQUIRED_METHODS,
        ...SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS,
      ].sort(),
    );
  });

  it("creates app sessions through app SDK auth.sessions.create and commits the normalized session", async () => {
    const commitSession = vi.fn();
    const create = vi.fn().mockResolvedValue({
      data: {
        accessToken: "access-token",
        authToken: "auth-token",
        context: {
          appId: "sdkwork-router",
          authLevel: "password",
          dataScope: ["tenant:t1"],
          deploymentMode: "saas",
          environment: "dev",
          permissionScope: ["iam.users.read"],
          sessionId: "s1",
          tenantId: "t1",
          userId: "u1",
        },
        expiresAt: "2026-05-11T00:00:00.000Z",
        refreshToken: "refresh-token",
        sessionId: "s1",
        user: {
          displayName: "Alice",
          id: "u1",
          username: "alice",
        },
      },
    });
    const service = createSdkworkIamService({
      appbaseAppClient: {
        auth: {
          sessions: {
            create,
          },
        },
      },
      commitSession,
    });

    const session = await service.auth.sessions.create({
      password: "secret",
      username: "alice",
    });

    expect(create).toHaveBeenCalledWith({
      password: "secret",
      username: "alice",
    });
    expect(session).toMatchObject({
      accessToken: "access-token",
      authToken: "auth-token",
      refreshToken: "refresh-token",
      sessionId: "s1",
      user: {
        displayName: "Alice",
        id: "u1",
      },
    });
    expect(commitSession).toHaveBeenNthCalledWith(1, expect.objectContaining({
      accessToken: "access-token",
      authToken: "auth-token",
      refreshToken: "refresh-token",
      sessionId: "s1",
    }));
  });

  it("does not normalize duplicate legacy userInfo as the app session user", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        accessToken: "access-token",
        authToken: "auth-token",
        userInfo: {
          displayName: "Legacy User",
          id: "legacy-user",
          username: "legacy-user",
        },
      },
    });
    const service = createSdkworkIamService({
      appbaseAppClient: {
        auth: {
          sessions: {
            create,
          },
        },
      },
    });

    const session = await service.auth.sessions.create({
      password: "secret",
      username: "alice",
    });

    expect(session.user).toBeUndefined();
  });

  it("normalizes session context to AppContext fields without exposing shardingContext duplicates", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        accessToken: "access-token",
        authToken: "auth-token",
        context: {
          appId: "app",
          authLevel: "password",
          dataScope: ["tenant:t1"],
          deploymentMode: "saas",
          environment: "test",
          extraContext: "must-not-leak",
          permissionScope: ["iam.users.read"],
          sessionId: "s1",
          shardingContext: {
            shardingKey: "wrong",
            shardingStrategy: "single",
          },
          tenantId: "t1",
          userId: "u1",
        },
      },
    });
    const service = createSdkworkIamService({
      appbaseAppClient: {
        auth: {
          sessions: {
            create,
          },
        },
      },
    });

    const session = await service.auth.sessions.create({
      password: "secret",
      username: "alice",
    });

    expect(session.context).toEqual({
      appId: "app",
      authLevel: "password",
      dataScope: ["tenant:t1"],
      deploymentMode: "saas",
      environment: "test",
      permissionScope: ["iam.users.read"],
      sessionId: "s1",
      tenantId: "t1",
      userId: "u1",
    });
  });

  it("waits for async session commit before resolving session APIs", async () => {
    let releaseCommit!: () => void;
    const commitStarted = vi.fn();
    const commitSession = vi.fn(async () => {
      commitStarted();
      await new Promise<void>((resolve) => {
        releaseCommit = resolve;
      });
    });
    const service = createSdkworkIamService({
      appbaseAppClient: {
        auth: {
          sessions: {
            create: vi.fn().mockResolvedValue({
              data: {
                accessToken: "access-token",
                authToken: "auth-token",
              },
            }),
          },
        },
      },
      commitSession,
    });

    let resolved = false;
    const sessionPromise = service.auth.sessions.create({
      password: "secret",
      username: "alice",
    }).then((session) => {
      resolved = true;
      return session;
    });

    for (let attempt = 0; attempt < 10 && commitStarted.mock.calls.length === 0; attempt += 1) {
      await Promise.resolve();
    }
    expect(commitStarted).toHaveBeenCalledOnce();
    expect(resolved).toBe(false);

    releaseCommit();
    await expect(sessionPromise).resolves.toMatchObject({
      accessToken: "access-token",
      authToken: "auth-token",
    });
    expect(commitSession).toHaveBeenCalledOnce();
  });

  it("marks refresh and current-session commits as current-session continuations", async () => {
    const commitSession = vi.fn();
    const service = createSdkworkIamService({
      appbaseAppClient: {
        auth: {
          sessions: {
            current: {
              retrieve: vi.fn().mockResolvedValue({
                data: {
                  accessToken: "current-access",
                  authToken: "current-auth",
                },
              }),
              update: vi.fn().mockResolvedValue({
                data: {
                  accessToken: "updated-access",
                  authToken: "updated-auth",
                },
              }),
            },
            refresh: vi.fn().mockResolvedValue({
              data: {
                accessToken: "refreshed-access",
                authToken: "refreshed-auth",
              },
            }),
          },
        },
      },
      commitSession,
    });

    await service.auth.sessions.current.retrieve();
    await service.auth.sessions.current.update({ displayName: "Alice" });
    await service.auth.sessions.refresh({ refreshToken: "refresh-token" });

    expect(commitSession).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        accessToken: "current-access",
        authToken: "current-auth",
      }),
      { preserveRefreshToken: true },
    );
    expect(commitSession).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        accessToken: "updated-access",
        authToken: "updated-auth",
      }),
      { preserveRefreshToken: true },
    );
    expect(commitSession).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        accessToken: "refreshed-access",
        authToken: "refreshed-auth",
      }),
      { preserveRefreshToken: true },
    );
  });

  it("runs local session clearing hooks even when remote current-session delete fails", async () => {
    const clearSession = vi.fn();
    const service = createSdkworkIamService({
      appbaseAppClient: {
        auth: {
          sessions: {
            current: {
              delete: vi.fn().mockRejectedValue(new Error("remote logout unavailable")),
            },
          },
        },
      },
      clearSession,
    });

    await expect(service.auth.sessions.current.delete()).rejects.toThrow("remote logout unavailable");
    expect(clearSession).toHaveBeenCalledOnce();
  });

  it("continues organization selection through app SDK auth.sessions.organizationSelection.create", async () => {
    const clearSession = vi.fn();
    const commitSession = vi.fn();
    const organizationSelectionCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: "organization-access-token",
        authToken: "organization-auth-token",
        context: {
          appId: "app",
          authLevel: "password",
          dataScope: ["tenant:t1", "organization:o1"],
          deploymentMode: "saas",
          environment: "test",
          organizationId: "o1",
          permissionScope: ["iam.organizations.read"],
          sessionId: "s1",
          tenantId: "t1",
          userId: "u1",
        },
        refreshToken: "organization-refresh-token",
        sessionId: "s1",
      },
    });
    const service = createSdkworkIamService({
      appbaseAppClient: {
        auth: {
          sessions: {
            organizationSelection: {
              create: organizationSelectionCreate,
            },
          },
        },
      },
      clearSession,
      commitSession,
    });

    const session = await service.auth.sessions.organizationSelection.create({
      continuationToken: "select-organization-token",
      organizationId: "o1",
    });

    expect(organizationSelectionCreate).toHaveBeenCalledWith({
      continuationToken: "select-organization-token",
      organizationId: "o1",
    });
    expect(clearSession).toHaveBeenCalledOnce();
    expect(commitSession).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: "organization-access-token",
      authToken: "organization-auth-token",
      refreshToken: "organization-refresh-token",
      sessionId: "s1",
    }));
    expect(session).toMatchObject({
      accessToken: "organization-access-token",
      authToken: "organization-auth-token",
      refreshToken: "organization-refresh-token",
      sessionId: "s1",
    });
  });

  it("continues login context selection through app SDK auth.sessions.loginContextSelection.create", async () => {
    const clearSession = vi.fn();
    const commitSession = vi.fn();
    const loginContextSelectionCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: "personal-access-token",
        authToken: "personal-auth-token",
        context: {
          appId: "app",
          authLevel: "password",
          dataScope: ["tenant:t1", "user:u1"],
          deploymentMode: "saas",
          environment: "test",
          loginScope: "TENANT",
          permissionScope: ["iam:self"],
          sessionId: "s1",
          tenantId: "t1",
          userId: "u1",
        },
        refreshToken: "personal-refresh-token",
        sessionId: "s1",
      },
    });
    const service = createSdkworkIamService({
      appbaseAppClient: {
        auth: {
          sessions: {
            loginContextSelection: {
              create: loginContextSelectionCreate,
            },
          },
        },
      },
      clearSession,
      commitSession,
    });

    const session = await service.auth.sessions.loginContextSelection.create({
      continuationToken: "select-login-context-token",
      loginScope: "TENANT",
    });

    expect(loginContextSelectionCreate).toHaveBeenCalledWith({
      continuationToken: "select-login-context-token",
      loginScope: "TENANT",
    });
    expect(clearSession).toHaveBeenCalledOnce();
    expect(commitSession).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: "personal-access-token",
      authToken: "personal-auth-token",
      refreshToken: "personal-refresh-token",
      sessionId: "s1",
    }));
    expect(session).toMatchObject({
      accessToken: "personal-access-token",
      authToken: "personal-auth-token",
      refreshToken: "personal-refresh-token",
      sessionId: "s1",
    });
  });

  it("always resolves session APIs from app client even when backend IAM client is injected", async () => {
    const appSessionCreate = vi.fn().mockResolvedValue({
      data: {
        accessToken: "app-access",
        authToken: "app-auth",
        context: {
          appId: "app",
          authLevel: "password",
          dataScope: [],
          deploymentMode: "saas",
          environment: "test",
          permissionScope: [],
          sessionId: "s1",
          tenantId: "t1",
          userId: "u1",
        },
      },
    });
    const backendUsersList = vi.fn();

    const service = createSdkworkIamService({
      appbaseAppClient: {
        auth: {
          sessions: {
            create: appSessionCreate,
          },
        },
      },
      appbaseBackendClient: {
        iam: {
          users: {
            list: backendUsersList,
          },
        },
      },
    });

    await service.auth.sessions.create({ password: "secret", username: "alice" });

    expect(appSessionCreate).toHaveBeenCalledTimes(1);
    expect(backendUsersList).not.toHaveBeenCalled();
  });

  it("routes administrative IAM resources to backend SDK and current user self-service to app SDK", async () => {
    const backendUsersList = vi.fn().mockResolvedValue({ data: [{ id: "u1" }] });
    const appCurrentUserRetrieve = vi.fn().mockResolvedValue({
      data: {
        displayName: "Alice",
        id: "u1",
      },
    });
    const service = createSdkworkIamService({
      appbaseAppClient: {
        iam: {
          users: {
            current: {
              retrieve: appCurrentUserRetrieve,
            },
          },
        },
      },
      appbaseBackendClient: {
        iam: {
          users: {
            list: backendUsersList,
          },
        },
      },
    });

    await expect(service.iam.users.list()).resolves.toEqual([{ id: "u1" }]);
    await expect(service.iam.users.current.retrieve()).resolves.toEqual({
      displayName: "Alice",
      id: "u1",
    });

    expect(backendUsersList).toHaveBeenCalledTimes(1);
    expect(appCurrentUserRetrieve).toHaveBeenCalledTimes(1);
  });

  it("does not fall back administrative IAM resources to app SDK self-service clients", async () => {
    const appUsersList = vi.fn().mockResolvedValue({ data: [{ id: "app-user" }] });
    const service = createSdkworkIamService({
      appbaseAppClient: ({
        iam: {
          users: {
            current: {
              retrieve: vi.fn(),
            },
            list: appUsersList,
          },
        },
      }) as unknown as Parameters<typeof createSdkworkIamService>[0]["appbaseAppClient"],
    });

    await expect(service.iam.users.list()).rejects.toThrow("Missing SDKWork IAM SDK resource: iam.users.list");
    expect(appUsersList).not.toHaveBeenCalled();
  });

  it("covers every generated IAM resource port through the common service facade", async () => {
    const backendClient = {
      iam: {
        apiKeys: {
          list: vi.fn().mockResolvedValue({ data: ["api-key"] }),
          revoke: vi.fn().mockResolvedValue({ data: "api-key-revoked" }),
        },
        auditEvents: {
          list: vi.fn().mockResolvedValue({ data: ["audit-event"] }),
        },
        organizations: {
          create: vi.fn().mockResolvedValue({ data: "organization-created" }),
          delete: vi.fn().mockResolvedValue({ data: "organization-deleted" }),
          retrieve: vi.fn().mockResolvedValue({ data: "organization-retrieved" }),
          update: vi.fn().mockResolvedValue({ data: "organization-updated" }),
        },
        organizationMemberships: {
          create: vi.fn().mockResolvedValue({ data: "organization-membership-created" }),
          update: vi.fn().mockResolvedValue({ data: "organization-membership-updated" }),
        },
        departments: {
          create: vi.fn().mockResolvedValue({ data: "department-created" }),
          delete: vi.fn().mockResolvedValue({ data: "department-deleted" }),
          retrieve: vi.fn().mockResolvedValue({ data: "department-retrieved" }),
          update: vi.fn().mockResolvedValue({ data: "department-updated" }),
        },
        departmentAssignments: {
          create: vi.fn().mockResolvedValue({ data: "department-assignment-created" }),
          update: vi.fn().mockResolvedValue({ data: "department-assignment-updated" }),
        },
        permissions: {
          create: vi.fn().mockResolvedValue({ data: "permission-created" }),
          delete: vi.fn().mockResolvedValue({ data: "permission-deleted" }),
          list: vi.fn().mockResolvedValue({ data: ["permission"] }),
          retrieve: vi.fn().mockResolvedValue({ data: "permission-retrieved" }),
          update: vi.fn().mockResolvedValue({ data: "permission-updated" }),
        },
        policies: {
          create: vi.fn().mockResolvedValue({ data: "policy-created" }),
          delete: vi.fn().mockResolvedValue({ data: "policy-deleted" }),
          list: vi.fn().mockResolvedValue({ data: ["policy"] }),
          retrieve: vi.fn().mockResolvedValue({ data: "policy-retrieved" }),
          update: vi.fn().mockResolvedValue({ data: "policy-updated" }),
        },
        positions: {
          create: vi.fn().mockResolvedValue({ data: "position-created" }),
          delete: vi.fn().mockResolvedValue({ data: "position-deleted" }),
          update: vi.fn().mockResolvedValue({ data: "position-updated" }),
        },
        positionAssignments: {
          create: vi.fn().mockResolvedValue({ data: "position-assignment-created" }),
          update: vi.fn().mockResolvedValue({ data: "position-assignment-updated" }),
        },
        roles: {
          create: vi.fn().mockResolvedValue({ data: "role-created" }),
          delete: vi.fn().mockResolvedValue({ data: "role-deleted" }),
          list: vi.fn().mockResolvedValue({ data: ["role"] }),
          retrieve: vi.fn().mockResolvedValue({ data: "role-retrieved" }),
          update: vi.fn().mockResolvedValue({ data: "role-updated" }),
          permissions: {
            create: vi.fn().mockResolvedValue({ data: "role-permission-created" }),
            delete: vi.fn().mockResolvedValue({ data: "role-permission-deleted" }),
            list: vi.fn().mockResolvedValue({ data: ["role-permission"] }),
          },
        },
        roleBindings: {
          create: vi.fn().mockResolvedValue({ data: "role-binding-created" }),
          delete: vi.fn().mockResolvedValue({ data: "role-binding-deleted" }),
        },
        securityEvents: {
          list: vi.fn().mockResolvedValue({ data: ["security-event"] }),
        },
        tenants: {
          create: vi.fn().mockResolvedValue({ data: "tenant-created" }),
          delete: vi.fn().mockResolvedValue({ data: "tenant-deleted" }),
          list: vi.fn().mockResolvedValue({ data: ["tenant"] }),
          retrieve: vi.fn().mockResolvedValue({ data: "tenant-retrieved" }),
          update: vi.fn().mockResolvedValue({ data: "tenant-updated" }),
          members: {
            create: vi.fn().mockResolvedValue({ data: "tenant-member-created" }),
            delete: vi.fn().mockResolvedValue({ data: "tenant-member-deleted" }),
            list: vi.fn().mockResolvedValue({ data: ["tenant-member"] }),
            update: vi.fn().mockResolvedValue({ data: "tenant-member-updated" }),
          },
        },
        users: {
          create: vi.fn().mockResolvedValue({ data: "user-created" }),
          delete: vi.fn().mockResolvedValue({ data: "user-deleted" }),
          list: vi.fn().mockResolvedValue({ data: ["user"] }),
          retrieve: vi.fn().mockResolvedValue({ data: { displayName: "Bob", id: "u1" } }),
          update: vi.fn().mockResolvedValue({ data: "user-updated" }),
        },
      },
    };
    const service = createSdkworkIamService({
      appbaseAppClient: {
        iam: {
          organizations: {
            list: vi.fn().mockResolvedValue({ data: ["organization"] }),
            tree: {
              retrieve: vi.fn().mockResolvedValue({ data: ["organization-tree"] }),
            },
          },
          organizationMemberships: {
            list: vi.fn().mockResolvedValue({ data: ["organization-membership"] }),
          },
          departments: {
            list: vi.fn().mockResolvedValue({ data: ["department"] }),
            tree: {
              retrieve: vi.fn().mockResolvedValue({ data: ["department-tree"] }),
            },
          },
          departmentAssignments: {
            list: vi.fn().mockResolvedValue({ data: ["department-assignment"] }),
          },
          positions: {
            list: vi.fn().mockResolvedValue({ data: ["position"] }),
          },
          positionAssignments: {
            list: vi.fn().mockResolvedValue({ data: ["position-assignment"] }),
          },
          roleBindings: {
            list: vi.fn().mockResolvedValue({ data: ["role-binding"] }),
          },
          users: {
            current: {
              retrieve: vi.fn().mockResolvedValue({ data: { displayName: "Alice", id: "current-user" } }),
            },
          },
        },
      },
      appbaseBackendClient: backendClient,
    });

    await expect(service.iam.apiKeys.list({ page: 1 })).resolves.toEqual(["api-key"]);
    await expect(service.iam.apiKeys.revoke("ak1")).resolves.toBe("api-key-revoked");
    await expect(service.iam.auditEvents.list({ tenantId: "t1" })).resolves.toEqual(["audit-event"]);
    await expect(service.iam.organizations.create({ name: "Org" })).resolves.toBe("organization-created");
    await expect(service.iam.organizations.delete("o1")).resolves.toBe("organization-deleted");
    await expect(service.iam.organizations.list()).resolves.toEqual(["organization"]);
    await expect(service.iam.organizations.retrieve("o1")).resolves.toBe("organization-retrieved");
    await expect(service.iam.organizations.tree.retrieve({ q: "Org" })).resolves.toEqual(["organization-tree"]);
    await expect(service.iam.organizations.update("o1", { name: "Updated Org" })).resolves.toBe("organization-updated");
    await expect(service.iam.organizationMemberships.create({ organizationId: "o1", userId: "u1" })).resolves.toBe("organization-membership-created");
    await expect(service.iam.organizationMemberships.list({ organizationId: "o1" })).resolves.toEqual(["organization-membership"]);
    await expect(service.iam.organizationMemberships.update("m1", { status: "active" })).resolves.toBe("organization-membership-updated");
    await expect(service.iam.departments.create({ organizationId: "o1", name: "Product" })).resolves.toBe("department-created");
    await expect(service.iam.departments.delete("d1")).resolves.toBe("department-deleted");
    await expect(service.iam.departments.list({ organizationId: "o1" })).resolves.toEqual(["department"]);
    await expect(service.iam.departments.retrieve("d1")).resolves.toBe("department-retrieved");
    await expect(service.iam.departments.tree.retrieve({ organizationId: "o1" })).resolves.toEqual(["department-tree"]);
    await expect(service.iam.departments.update("d1", { name: "Product Platform" })).resolves.toBe("department-updated");
    await expect(service.iam.departmentAssignments.create({ departmentId: "d1", organizationMembershipId: "m1" })).resolves.toBe("department-assignment-created");
    await expect(service.iam.departmentAssignments.list({ departmentId: "d1" })).resolves.toEqual(["department-assignment"]);
    await expect(service.iam.departmentAssignments.update("da1", { isPrimary: true })).resolves.toBe("department-assignment-updated");
    expect(Object.prototype.hasOwnProperty.call(service.iam.organizations, "members")).toBe(false);
    await expect(service.iam.permissions.create({ code: "iam.users.read" })).resolves.toBe("permission-created");
    await expect(service.iam.permissions.delete("p1")).resolves.toBe("permission-deleted");
    await expect(service.iam.permissions.list()).resolves.toEqual(["permission"]);
    await expect(service.iam.permissions.retrieve("p1")).resolves.toBe("permission-retrieved");
    await expect(service.iam.permissions.update("p1", { name: "Read users" })).resolves.toBe("permission-updated");
    await expect(service.iam.policies.create({ code: "policy" })).resolves.toBe("policy-created");
    await expect(service.iam.policies.delete("po1")).resolves.toBe("policy-deleted");
    await expect(service.iam.policies.list()).resolves.toEqual(["policy"]);
    await expect(service.iam.policies.retrieve("po1")).resolves.toBe("policy-retrieved");
    await expect(service.iam.policies.update("po1", { name: "Policy" })).resolves.toBe("policy-updated");
    await expect(service.iam.positions.create({ name: "Product Owner" })).resolves.toBe("position-created");
    await expect(service.iam.positions.delete("pos1")).resolves.toBe("position-deleted");
    await expect(service.iam.positions.list({ departmentId: "d1" })).resolves.toEqual(["position"]);
    await expect(service.iam.positions.update("pos1", { name: "Senior Product Owner" })).resolves.toBe("position-updated");
    await expect(service.iam.positionAssignments.create({ departmentAssignmentId: "da1", positionId: "pos1" })).resolves.toBe("position-assignment-created");
    await expect(service.iam.positionAssignments.list({ departmentAssignmentId: "da1" })).resolves.toEqual(["position-assignment"]);
    await expect(service.iam.positionAssignments.update("pa1", { isPrimary: true })).resolves.toBe("position-assignment-updated");
    await expect(service.iam.roles.create({ code: "admin" })).resolves.toBe("role-created");
    await expect(service.iam.roles.delete("r1")).resolves.toBe("role-deleted");
    await expect(service.iam.roles.list()).resolves.toEqual(["role"]);
    await expect(service.iam.roles.retrieve("r1")).resolves.toBe("role-retrieved");
    await expect(service.iam.roles.update("r1", { name: "Admin" })).resolves.toBe("role-updated");
    await expect(service.iam.roles.permissions.create("r1", "p1")).resolves.toBe("role-permission-created");
    await expect(service.iam.roles.permissions.delete("r1", "p1")).resolves.toBe("role-permission-deleted");
    await expect(service.iam.roles.permissions.list("r1")).resolves.toEqual(["role-permission"]);
    await expect(service.iam.roleBindings.create({ roleId: "r1", scopeKind: "organization", scopeId: "o1" })).resolves.toBe("role-binding-created");
    await expect(service.iam.roleBindings.delete("rb1")).resolves.toBe("role-binding-deleted");
    await expect(service.iam.roleBindings.list({ scopeId: "o1" })).resolves.toEqual(["role-binding"]);
    await expect(service.iam.securityEvents.list()).resolves.toEqual(["security-event"]);
    await expect(service.iam.tenants.create({ name: "Tenant" })).resolves.toBe("tenant-created");
    await expect(service.iam.tenants.delete("t1")).resolves.toBe("tenant-deleted");
    await expect(service.iam.tenants.list()).resolves.toEqual(["tenant"]);
    await expect(service.iam.tenants.retrieve("t1")).resolves.toBe("tenant-retrieved");
    await expect(service.iam.tenants.update("t1", { name: "Updated Tenant" })).resolves.toBe("tenant-updated");
    await expect(service.iam.tenants.members.create("t1", { userId: "u1" })).resolves.toBe("tenant-member-created");
    await expect(service.iam.tenants.members.delete("t1", "u1")).resolves.toBe("tenant-member-deleted");
    await expect(service.iam.tenants.members.list("t1")).resolves.toEqual(["tenant-member"]);
    await expect(service.iam.tenants.members.update("t1", "u1", { status: "active" })).resolves.toBe("tenant-member-updated");
    await expect(service.iam.users.current.retrieve()).resolves.toEqual({
      displayName: "Alice",
      id: "current-user",
    });
    await expect(service.iam.users.create({ username: "bob" })).resolves.toBe("user-created");
    await expect(service.iam.users.delete("u1")).resolves.toBe("user-deleted");
    await expect(service.iam.users.list()).resolves.toEqual(["user"]);
    await expect(service.iam.users.retrieve("u1")).resolves.toEqual({
      displayName: "Bob",
      id: "u1",
    });
    await expect(service.iam.users.update("u1", { displayName: "Bob" })).resolves.toBe("user-updated");
    expect(Object.prototype.hasOwnProperty.call(service.iam.users, "roles")).toBe(false);

    expect(backendClient.iam.organizations.create).toHaveBeenCalledWith({ name: "Org" });
    expect(backendClient.iam.organizations.delete).toHaveBeenCalledWith("o1");
    expect(backendClient.iam.organizations.retrieve).toHaveBeenCalledWith("o1");
    expect(backendClient.iam.organizations.update).toHaveBeenCalledWith("o1", { name: "Updated Org" });
    expect(backendClient.iam.organizationMemberships.create).toHaveBeenCalledWith({ organizationId: "o1", userId: "u1" });
    expect(backendClient.iam.organizationMemberships.update).toHaveBeenCalledWith("m1", { status: "active" });
    expect(backendClient.iam.departments.create).toHaveBeenCalledWith({ organizationId: "o1", name: "Product" });
    expect(backendClient.iam.departments.delete).toHaveBeenCalledWith("d1");
    expect(backendClient.iam.departments.retrieve).toHaveBeenCalledWith("d1");
    expect(backendClient.iam.departments.update).toHaveBeenCalledWith("d1", { name: "Product Platform" });
    expect(backendClient.iam.departmentAssignments.create).toHaveBeenCalledWith({ departmentId: "d1", organizationMembershipId: "m1" });
    expect(backendClient.iam.departmentAssignments.update).toHaveBeenCalledWith("da1", { isPrimary: true });
    expect(Object.prototype.hasOwnProperty.call(backendClient.iam.organizations, "list")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(backendClient.iam.organizations, "tree")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(backendClient.iam.organizations, "members")).toBe(false);
    expect(backendClient.iam.permissions.update).toHaveBeenCalledWith("p1", { name: "Read users" });
    expect(backendClient.iam.positions.create).toHaveBeenCalledWith({ name: "Product Owner" });
    expect(backendClient.iam.positions.delete).toHaveBeenCalledWith("pos1");
    expect(backendClient.iam.positions.update).toHaveBeenCalledWith("pos1", { name: "Senior Product Owner" });
    expect(backendClient.iam.positionAssignments.create).toHaveBeenCalledWith({ departmentAssignmentId: "da1", positionId: "pos1" });
    expect(backendClient.iam.positionAssignments.update).toHaveBeenCalledWith("pa1", { isPrimary: true });
    expect(backendClient.iam.roles.update).toHaveBeenCalledWith("r1", { name: "Admin" });
    expect(backendClient.iam.roleBindings.create).toHaveBeenCalledWith({ roleId: "r1", scopeKind: "organization", scopeId: "o1" });
    expect(backendClient.iam.roleBindings.delete).toHaveBeenCalledWith("rb1");
    expect(backendClient.iam.tenants.members.create).toHaveBeenCalledWith("t1", { userId: "u1" });
    expect(backendClient.iam.tenants.members.delete).toHaveBeenCalledWith("t1", "u1");
    expect(backendClient.iam.tenants.members.update).toHaveBeenCalledWith("t1", "u1", { status: "active" });
    expect(backendClient.iam.tenants.members.list).toHaveBeenCalledWith("t1", undefined);
    expect(backendClient.iam.users.create).toHaveBeenCalledWith({ username: "bob" });
    expect(backendClient.iam.users.delete).toHaveBeenCalledWith("u1");
    expect(backendClient.iam.users.retrieve).toHaveBeenCalledWith("u1");
    expect(backendClient.iam.users.update).toHaveBeenCalledWith("u1", { displayName: "Bob" });
    expect(service.iam.organizations.list).toBeDefined();
  });

  it("covers every generated app auth resource through the common service facade", async () => {
    const appClient = {
      oauth: {
        authorizationUrls: {
          create: vi.fn().mockResolvedValue({ data: { url: "https://auth.sdkwork.local/oauth" } }),
        },
        sessions: {
          create: vi.fn().mockResolvedValue({
            data: {
              accessToken: "oauth-access",
              authToken: "oauth-auth",
            },
          }),
        },
      },
      auth: {
        passwordResetRequests: {
          create: vi.fn().mockResolvedValue({ data: { requestId: "reset-request-1" } }),
        },
        passwordResets: {
          create: vi.fn().mockResolvedValue({ data: { reset: true } }),
        },
        registrations: {
          create: vi.fn().mockResolvedValue({
            data: {
              accessToken: "registered-access",
              authToken: "registered-auth",
              user: {
                displayName: "Registered User",
                id: "registered-user",
              },
            },
          }),
        },
        sessions: {
          create: vi.fn().mockResolvedValue({
            data: {
              accessToken: "session-access",
              authToken: "session-auth",
            },
          }),
          current: {
            delete: vi.fn().mockResolvedValue({ data: undefined }),
            retrieve: vi.fn().mockResolvedValue({
              data: {
                accessToken: "current-access",
                authToken: "current-auth",
              },
            }),
            update: vi.fn().mockResolvedValue({
              data: {
                accessToken: "updated-access",
                authToken: "updated-auth",
              },
            }),
          },
          refresh: vi.fn().mockResolvedValue({
            data: {
              accessToken: "refreshed-access",
              authToken: "refreshed-auth",
            },
          }),
        },
      },
      system: {
        iam: {
          runtime: {
            retrieve: vi.fn().mockResolvedValue({
              data: {
                loginMethods: ["password", "emailCode"],
                verificationPolicy: {
                  emailCodeLoginEnabled: true,
                  emailRegistrationVerificationRequired: true,
                  phoneCodeLoginEnabled: false,
                  phoneRegistrationVerificationRequired: false,
                },
              },
            }),
          },
          verificationPolicy: {
            retrieve: vi.fn().mockResolvedValue({
              data: {
                emailCodeLoginEnabled: true,
                emailRegisterVerificationRequired: true,
                phoneCodeLoginEnabled: false,
                phoneRegisterVerificationRequired: false,
              },
            }),
          },
        },
      },
    };
    const service = createSdkworkIamService({ appbaseAppClient: appClient });

    await expect(service.oauth.authorizationUrls.create({ provider: "github" })).resolves.toEqual({
      url: "https://auth.sdkwork.local/oauth",
    });
    await expect(service.oauth.sessions.create({ code: "oauth-code", provider: "github" })).resolves.toMatchObject({
      accessToken: "oauth-access",
      authToken: "oauth-auth",
    });
    await expect(service.auth.passwordResetRequests.create({ email: "a@example.com" })).resolves.toEqual({
      requestId: "reset-request-1",
    });
    await expect(service.auth.passwordResets.create({ password: "new-secret", token: "token" })).resolves.toEqual({
      reset: true,
    });
    await expect(service.auth.registrations.create({
      password: "secret",
      username: "new-user",
      verificationCode: "123456",
    })).resolves.toMatchObject({
      accessToken: "registered-access",
      authToken: "registered-auth",
      user: {
        displayName: "Registered User",
        id: "registered-user",
      },
    });
    await expect(service.system.iam.runtime.retrieve({ tenantCode: "default" })).resolves.toEqual({
      loginMethods: ["password", "emailCode"],
      verificationPolicy: {
        emailCodeLoginEnabled: true,
        emailRegistrationVerificationRequired: true,
        phoneCodeLoginEnabled: false,
        phoneRegistrationVerificationRequired: false,
      },
    });
    await expect(service.system.iam.verificationPolicy.retrieve()).resolves.toEqual({
      emailCodeLoginEnabled: true,
      emailRegisterVerificationRequired: true,
      phoneCodeLoginEnabled: false,
      phoneRegisterVerificationRequired: false,
    });
    expect(appClient.oauth.authorizationUrls.create).toHaveBeenCalledWith({ provider: "github" });
    expect(appClient.oauth.sessions.create).toHaveBeenCalledWith({ code: "oauth-code", provider: "github" });
    expect(appClient.auth.registrations.create).toHaveBeenCalledWith({
      password: "secret",
      username: "new-user",
      verificationCode: "123456",
    });
    expect(appClient.system.iam.runtime.retrieve).toHaveBeenCalledWith({ tenantCode: "default" });
    expect(appClient.system.iam.verificationPolicy.retrieve).toHaveBeenCalledTimes(1);
  });

  it("routes OAuth device authorization resources to the generated app SDK", async () => {
    const appClient = {
      oauth: {
        deviceAuthorizations: {
          create: vi.fn().mockResolvedValue({
            data: {
              deviceAuthorizationId: "device-authorization-1",
            },
          }),
          retrieve: vi.fn().mockResolvedValue({
            data: {
              deviceAuthorizationId: "device-authorization-1",
              status: "pending",
            },
          }),
          scans: {
            create: vi.fn().mockResolvedValue({
              data: {
                status: "scanned",
              },
            }),
          },
          passwordCompletions: {
            create: vi.fn().mockResolvedValue({
              data: {
                status: "confirmed",
              },
            }),
          },
          sessionExchanges: {
            create: vi.fn().mockResolvedValue({
              data: {
                status: "exchanged",
              },
            }),
          },
        },
      },
    };
    const service = createSdkworkIamService({ appbaseAppClient: appClient });

    await expect(service.oauth.deviceAuthorizations.create({ purpose: "login" })).resolves.toEqual({
      deviceAuthorizationId: "device-authorization-1",
    });
    await expect(service.oauth.deviceAuthorizations.retrieve("device-authorization-1")).resolves.toEqual({
      deviceAuthorizationId: "device-authorization-1",
      status: "pending",
    });
    await expect(service.oauth.deviceAuthorizations.scans.create("device-authorization-1", { scanSource: "browser" })).resolves.toEqual({
      status: "scanned",
    });
    await expect(service.oauth.deviceAuthorizations.passwordCompletions.create("device-authorization-1", {
      password: "secret",
      username: "alice",
    })).resolves.toEqual({
      status: "confirmed",
    });
    await expect(service.oauth.deviceAuthorizations.sessionExchanges.create("device-authorization-1", {
      sessionKey: "qr-session-key",
    })).resolves.toEqual({
      status: "exchanged",
    });

    expect(appClient.oauth.deviceAuthorizations.create).toHaveBeenCalledWith({ purpose: "login" });
    expect(appClient.oauth.deviceAuthorizations.retrieve).toHaveBeenCalledWith("device-authorization-1");
    expect(appClient.oauth.deviceAuthorizations.scans.create).toHaveBeenCalledWith("device-authorization-1", { scanSource: "browser" });
    expect(appClient.oauth.deviceAuthorizations.passwordCompletions.create).toHaveBeenCalledWith("device-authorization-1", {
      password: "secret",
      username: "alice",
    });
    expect(appClient.oauth.deviceAuthorizations.sessionExchanges.create).toHaveBeenCalledWith("device-authorization-1", {
      sessionKey: "qr-session-key",
    });
  });

  it("keeps OAuth authorization URL service calls object-shaped while adapting positional generated SDK methods", async () => {
    const calls: unknown[][] = [];
    async function create(
      provider: string,
      redirectUri: string,
      state?: string,
      scope?: string,
    ) {
      calls.push([provider, redirectUri, state, scope]);
      return {
        data: {
          url: "https://auth.sdkwork.local/oauth/github",
        },
      };
    }
    const service = createSdkworkIamService({
      appbaseAppClient: {
        oauth: {
          authorizationUrls: {
            create,
          },
        },
      },
    });

    await expect(service.oauth.authorizationUrls.create({
      provider: "GITHUB",
      redirectUri: "https://app.sdkwork.local/oauth/callback",
      scope: "profile email",
      state: "state-1",
    })).resolves.toEqual({
      url: "https://auth.sdkwork.local/oauth/github",
    });

    expect(calls).toEqual([[
      "GITHUB",
      "https://app.sdkwork.local/oauth/callback",
      "state-1",
      "profile email",
    ]]);
  });

  it("calls generated SDK class resource methods with their owning resource as this", async () => {
    class GeneratedAuthSessionsResource {
      client = {
        post: vi.fn().mockResolvedValue({
          data: {
            accessToken: "bound-access",
            authToken: "bound-auth",
          },
        }),
      };

      async create(body: Record<string, unknown>) {
        return this.client.post("/auth/sessions", body);
      }
    }

    const sessions = new GeneratedAuthSessionsResource();
    const service = createSdkworkIamService({
      appbaseAppClient: {
        auth: {
          sessions,
        },
      },
    });

    await expect(service.auth.sessions.create({
      password: "secret",
      username: "alice",
    })).resolves.toMatchObject({
      accessToken: "bound-access",
      authToken: "bound-auth",
    });
    expect(sessions.client.post).toHaveBeenCalledWith("/auth/sessions", {
      password: "secret",
      username: "alice",
    });
  });

  it("allows registration without verificationCode so backend policy decides whether it is required", async () => {
    const create = vi.fn().mockResolvedValue({
      data: {
        accessToken: "registered-access",
        authToken: "registered-auth",
      },
    });
    const service = createSdkworkIamService({
      appbaseAppClient: {
        auth: {
          registrations: {
            create,
          },
        },
      },
    });

    await expect(service.auth.registrations.create({
      password: "secret",
      username: "new-user",
    })).resolves.toMatchObject({
      accessToken: "registered-access",
      authToken: "registered-auth",
    });
    expect(create).toHaveBeenCalledWith({
      password: "secret",
      username: "new-user",
    });
  });
});
