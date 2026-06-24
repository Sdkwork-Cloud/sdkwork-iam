import { describe, expect, it, vi } from "vitest";

import { createTestJwt } from "@sdkwork/runtime-bootstrap";
import {
  bootstrapApplicationFromManifest,
  buildBootstrapEnvRecord,
  createIamApplicationBootstrap,
  formatBootstrapEnvFile,
  manifestToRegisterCommand,
  mergeBootstrapAuth,
  resolveBootstrapEnvironmentFromEnv,
  validateManifestForBootstrap,
} from "../src/index";

const TEST_ACCESS_CREDENTIAL = createTestJwt({
  tenant_id: "100001",
  organization_id: "0",
  app_id: "app-1",
  environment: "dev",
  deployment_mode: "saas",
});
const TEST_AUTH_TOKEN = createTestJwt({
  tenant_id: "100001",
  user_id: "admin",
  session_id: "session-1",
  app_id: "app-1",
  auth_level: "system",
});

describe("@sdkwork/iam-application-bootstrap", () => {
  const manifest = {
    app: {
      key: "demo-app",
      name: "Demo App",
      appType: "web",
    },
    backend: {
      accessTokenPermissionScope: ["iam.users.read"],
      tenantId: "100001",
      organizationId: "0",
    },
  };

  it("resolves canonical tenant scope from env when overrides are absent", () => {
    expect(resolveBootstrapEnvironmentFromEnv({}, {})).toMatchObject({
      tenantId: "100001",
      organizationId: "0",
    });
  });

  it("validates manifest permission scope before bootstrap", () => {
    expect(() =>
      validateManifestForBootstrap({
        app: { key: "demo", name: "Demo", appType: "web" },
        backend: {},
      }),
    ).toThrow(/accessTokenPermissionScope/);
  });

  it("merges bootstrap auth from profile when password-only auth is supplied", () => {
    expect(
      mergeBootstrapAuth(
        { appKey: "demo" },
        { password: "secret" },
        { email: "admin@example.com" },
      ),
    ).toEqual({
      appKey: "demo",
      password: "secret",
      username: "admin@example.com",
    });
  });

  it("runs register → provision → enable → access credential through an injected client", async () => {
    const client = {
      registerApplication: vi.fn().mockResolvedValue({ templateId: "tpl-1", version: "1.0.0" }),
      provisionTenantApplication: vi.fn().mockResolvedValue({ tenantApplicationId: "ta-1", appId: "app-1" }),
      enableTenantApplication: vi.fn().mockResolvedValue({ tenantApplicationId: "ta-1", appId: "app-1", status: "enabled" }),
      createAccessCredential: vi.fn().mockResolvedValue({
        tenantApplicationId: "ta-1",
        appId: "app-1",
        accessCredential: TEST_ACCESS_CREDENTIAL,
        authToken: TEST_AUTH_TOKEN,
        tenantId: "100001",
        organizationId: "0",
      }),
    };

    const module = createIamApplicationBootstrap({ client });
    const result = await module.bootstrapFromManifest({
      client,
      manifest,
      manifestHash: "abc",
      auth: { username: "admin", password: "secret" },
      environment: {
        backendApiBaseUrl: "http://127.0.0.1:8080",
        environment: "dev",
        primaryDomain: "demo.local",
        instanceKey: "dev",
      },
    });

    expect(client.registerApplication).toHaveBeenCalledOnce();
    expect(client.provisionTenantApplication).toHaveBeenCalledOnce();
    expect(client.enableTenantApplication).toHaveBeenCalledWith("ta-1", expect.objectContaining({ tenantId: "100001" }));
    expect(client.createAccessCredential).toHaveBeenCalledOnce();
    expect(result.tenantApplicationId).toBe("ta-1");
    expect(result.env.SDKWORK_ACCESS_TOKEN).toBe(TEST_ACCESS_CREDENTIAL);
  });

  it("formats bootstrap env output for local runtime handoff", () => {
    const envFile = formatBootstrapEnvFile({
      primaryDomain: "demo.local",
      result: {
        registered: { templateId: "tpl-1", version: "1.0.0" },
        provisioned: { tenantApplicationId: "ta-1", tenantId: "100001", organizationId: "0" },
        enabled: { tenantApplicationId: "ta-1", appId: "app-1" },
        issued: {
          tenantApplicationId: "ta-1",
          appId: "app-1",
          accessCredential: TEST_ACCESS_CREDENTIAL,
          authToken: TEST_AUTH_TOKEN,
          tenantId: "100001",
          organizationId: "0",
        },
        env: buildBootstrapEnvRecord({
          primaryDomain: "demo.local",
          result: {
            registered: {},
            provisioned: { tenantApplicationId: "ta-1" },
            enabled: { tenantApplicationId: "ta-1" },
            issued: { accessCredential: TEST_ACCESS_CREDENTIAL, authToken: TEST_AUTH_TOKEN },
            env: {},
          },
        }),
      },
    });

    expect(envFile).toContain("SDKWORK_APP_DOMAIN=demo.local");
    expect(envFile).toContain(`SDKWORK_ACCESS_TOKEN=${TEST_ACCESS_CREDENTIAL}`);
    expect(envFile).not.toContain("SDKWORK_AUTH_TOKEN=");
    expect(envFile).not.toContain("SDKWORK_APP_ACCESS_CREDENTIAL=");
  });

  it("wires backend sdk ports through the bootstrap client adapter", async () => {
    const client = {
      registerApplication: vi.fn().mockResolvedValue({ templateId: "tpl-1", version: "1.0.0" }),
      provisionTenantApplication: vi.fn().mockResolvedValue({ tenantApplicationId: "ta-1", appId: "app-1" }),
      enableTenantApplication: vi.fn().mockResolvedValue({ tenantApplicationId: "ta-1", status: "enabled" }),
      createAccessCredential: vi.fn().mockResolvedValue({
        tenantApplicationId: "ta-1",
        appId: "app-1",
        accessCredential: TEST_ACCESS_CREDENTIAL,
        authToken: TEST_AUTH_TOKEN,
      }),
    };

    const register = manifestToRegisterCommand(manifest, "hash");
    await bootstrapApplicationFromManifest({
      client,
      manifest,
      manifestHash: "hash",
      auth: { username: "admin", password: "secret" },
      environment: {
        backendApiBaseUrl: "http://127.0.0.1:8080",
        environment: "dev",
        primaryDomain: "demo.local",
      },
    });

    expect(client.registerApplication).toHaveBeenCalled();
    expect(register.defaultAccessPermissions).toEqual(["iam.users.read"]);
  });
});
