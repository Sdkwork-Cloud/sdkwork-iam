import { describe, expect, it } from "vitest";

import * as userCenterCore from "../src/index.ts";

function requireExport<T>(name: string): T {
  return (userCenterCore as Record<string, unknown>)[name] as T;
}

describe("user-center deployment contract", () => {
  it("creates canonical app v3 local API routes", () => {
    const createUserCenterLocalApiRoutes = requireExport<
      (basePath?: string) => Record<string, string>
    >("createUserCenterLocalApiRoutes");

    expect(createUserCenterLocalApiRoutes).toBeTypeOf("function");

    const routes = createUserCenterLocalApiRoutes();

    expect(routes).toMatchObject({
      authConfig: "/app/v3/api/auth/config",
      authEmailLogin: "/app/v3/api/auth/sessions",
      authLogin: "/app/v3/api/auth/sessions",
      authLogout: "/app/v3/api/auth/sessions/current",
      authOAuthLogin: "/app/v3/api/oauth/sessions",
      authOAuthUrl: "/app/v3/api/oauth/authorization_urls",
      authPasswordReset: "/app/v3/api/auth/password_resets",
      authPasswordResetRequest: "/app/v3/api/auth/password_reset_requests",
      authPhoneLogin: "/app/v3/api/auth/sessions",
      authQrCallbackPattern: "/app/v3/api/oauth/device_authorizations/:deviceAuthorizationId/scans",
      authQrConfirm: "/app/v3/api/oauth/device_authorizations/:deviceAuthorizationId/password_completions",
      authQrEntryPattern: "/app/v3/api/oauth/device_authorizations/:deviceAuthorizationId/scans",
      authQrGenerate: "/app/v3/api/oauth/device_authorizations",
      authQrStatusPattern: "/app/v3/api/oauth/device_authorizations/:deviceAuthorizationId",
      authRefresh: "/app/v3/api/auth/sessions/refresh",
      authRegister: "/app/v3/api/auth/registrations",
      authSession: "/app/v3/api/auth/sessions/current",
      authSessionExchange: "/app/v3/api/auth/sessions",
      health: "/app/v3/api/health",
      tenantRoot: "/app/v3/api/iam/tenants/current",
      userProfile: "/app/v3/api/iam/users/current",
      userSettings: "/app/v3/api/iam/users/current",
    });
    expect(Object.hasOwn(routes, "authVerifyCheck")).toBe(false);
    expect(Object.hasOwn(routes, "authVerifySend")).toBe(false);
    expect(Object.hasOwn(routes, "account" + "Summary")).toBe(false);
    expect(Object.hasOwn(routes, "account")).toBe(false);
    expect(Object.hasOwn(routes, "membership")).toBe(false);
    expect(Object.hasOwn(routes, "vipInfo")).toBe(false);
    expect(
      Object.values(routes).every((route) => !route.includes("/auth/verification_codes")),
    ).toBe(true);
    expect(
      Object.values(routes).every((route) => !route.includes("/api/app/")),
    ).toBe(true);
    expect(
      Object.values(routes).every((route) => !route.includes("/auth/qr_login_codes")),
    ).toBe(true);
    expect(
      Object.values(routes).every((route) => !route.includes("/" + "billing/vip")),
    ).toBe(true);
  });

  it("does not publish commercial membership routes or capability ownership", () => {
    const createUserCenterLocalApiRoutes = requireExport<
      (basePath?: string) => Record<string, string>
    >("createUserCenterLocalApiRoutes");
    const createUserCenterBridgeConfig = requireExport<
      (options: Record<string, unknown>) => Record<string, unknown>
    >("createUserCenterBridgeConfig");
    const createUserCenterPluginDefinition = requireExport<
      (options: Record<string, unknown>) => Record<string, unknown>
    >("createUserCenterPluginDefinition");
    const createUserCenterServerPluginDefinition = requireExport<
      (options: Record<string, unknown>) => Record<string, unknown>
    >("createUserCenterServerPluginDefinition");

    const localApiRoutes = createUserCenterLocalApiRoutes();
    const bridgeConfig = createUserCenterBridgeConfig({
      namespace: "example-app",
      routes: {
        authBasePath: "/auth",
        userRoutePath: "/user",
      },
    });
    const pluginDefinition = createUserCenterPluginDefinition({
      namespace: "example-app",
      routes: {
        authBasePath: "/auth",
        userRoutePath: "/user",
      },
    });
    const serverPluginDefinition = createUserCenterServerPluginDefinition({
      namespace: "example-app",
      routes: {
        authBasePath: "/auth",
        userRoutePath: "/user",
      },
    });
    const manifests = pluginDefinition.manifests as Record<string, { capability?: string; routePath?: string }>;
    const server = serverPluginDefinition.server as {
      authority: {
        api: { operations: Array<{ operationId: string; routeKey: string }> };
        localAuthority: {
          schema: {
            tables: Array<{
              columns: Array<{ name: string }>;
              standardEntityName: string;
              tableName: string;
            }>;
          };
        };
        repositories: Array<{ entityNames: string[]; id: string }>;
        services: Array<{ id: string; operationIds: string[] }>;
      };
    };

    expect(Object.hasOwn(localApiRoutes, "membership")).toBe(false);
    expect(Object.hasOwn(localApiRoutes, "vipInfo")).toBe(false);
    expect(
      Object.hasOwn(bridgeConfig.routes as Record<string, string>, "membership" + "RoutePath"),
    ).toBe(false);
    expect(Object.hasOwn(bridgeConfig.routes as Record<string, string>, "vipRoutePath")).toBe(
      false,
    );
    expect(pluginDefinition.capabilities).toEqual(["auth", "user"]);
    expect(Object.hasOwn(manifests, "membership")).toBe(false);
    expect(Object.hasOwn(manifests, "vip")).toBe(false);
    expect(server.authority.api.operations).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ routeKey: "membershipCurrentGet" }),
        expect.objectContaining({ routeKey: "membershipCurrentUpdate" }),
      ]),
    );
    expect(server.authority.api.operations).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ operationId: "auth.verify.send" }),
        expect.objectContaining({ operationId: "auth.verify.check" }),
        expect.objectContaining({ routeKey: "authVerifySend" }),
        expect.objectContaining({ routeKey: "authVerifyCheck" }),
      ]),
    );
    expect(server.authority.repositories).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityNames: ["Iam" + "Membership"],
          id: "membership" + "-repository",
        }),
      ]),
    );
    expect(server.authority.services).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "membership-service" }),
      ]),
    );
    expect(server.authority.localAuthority.schema.tables).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          standardEntityName: "Iam" + "Membership",
          tableName: "iam_" + "membership",
        }),
        expect.objectContaining({
          tableName: "iam_" + "verification_code",
        }),
      ]),
    );
    expect(server.authority.localAuthority.schema.tables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          standardEntityName: "IamOrganizationMembership",
          tableName: "iam_organization_membership",
        }),
      ]),
    );
  });

  it("creates canonical identity deployment profiles across builtin-local and cloud providers", () => {
    const createUserCenterBridgeConfig = requireExport<
      (options: Record<string, unknown>) => Record<string, unknown>
    >("createUserCenterBridgeConfig");
    const createUserCenterDeploymentProfiles = requireExport<
      (bridgeConfig: Record<string, unknown>) => Record<string, Record<string, unknown>>
    >("createUserCenterDeploymentProfiles");
    const createIdentityDeploymentProfile = requireExport<
      ((options: {
        profile: Record<string, unknown>;
        surface: "desktop" | "server" | "web";
      }) => Record<string, unknown>)
      | undefined
    >("createIdentityDeploymentProfile");

    expect(createUserCenterBridgeConfig).toBeTypeOf("function");
    expect(createUserCenterDeploymentProfiles).toBeTypeOf("function");
    expect(createIdentityDeploymentProfile).toBeTypeOf("function");

    const localBridgeConfig = createUserCenterBridgeConfig({
      namespace: "example-app",
    });
    const localProfiles = createUserCenterDeploymentProfiles(localBridgeConfig);

    expect(
      createIdentityDeploymentProfile?.({
        profile: localProfiles.builtinLocal,
        surface: "desktop",
      }),
    ).toEqual({
      authorityKind: "embedded",
      bootstrapEnabled: true,
      developmentPrefillEnabled: true,
      identityMode: "desktop-local",
      providerKind: "builtin-local",
      storageKind: "sqlite",
      surface: "desktop",
      transportKind: "local-api",
    });

    const cloudBridgeConfig = createUserCenterBridgeConfig({
      mode: "app-api-hub",
      namespace: "example-app",
      provider: {
        baseUrl: "https://app-api.sdkwork.local/app",
        kind: "sdkwork-cloud-app-api",
        providerKey: "example-app-cloud",
      },
    });
    const cloudProfiles = createUserCenterDeploymentProfiles(cloudBridgeConfig);

    expect(
      createIdentityDeploymentProfile?.({
        profile: cloudProfiles.externalAppApi,
        surface: "web",
      }),
    ).toEqual({
      authorityKind: "upstream",
      bootstrapEnabled: false,
      developmentPrefillEnabled: false,
      identityMode: "cloud-saas",
      providerKind: "sdkwork-cloud-app-api",
      storageKind: "upstream-managed",
      surface: "web",
      transportKind: "remote-http",
    });
  });

  it("uses neutral auth strategy names while keeping the wire access token header standard", () => {
    const createUserCenterBridgeConfig = requireExport<
      (options: Record<string, unknown>) => {
        auth: {
          mode: string;
          tokenHeaders: { accessTokenHeaderName: string };
          validationStrategy: string;
        };
      }
    >("createUserCenterBridgeConfig");
    const USER_CENTER_DEPLOYMENT_VARIABLE_NAMES = requireExport<Record<string, string>>(
      "USER_CENTER_DEPLOYMENT_VARIABLE_NAMES",
    );

    const bridgeConfig = createUserCenterBridgeConfig({
      namespace: "example-app",
    });

    expect(bridgeConfig.auth.mode).toBe("dual-token");
    expect(bridgeConfig.auth.validationStrategy).toBe("dual-token");
    expect(bridgeConfig.auth).not.toHaveProperty("allowAuthorizationFallbackToAccessToken");
    expect(bridgeConfig.auth.tokenHeaders.accessTokenHeaderName).toBe("Access-Token");
    expect(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.accessTokenHeaderName).toBe(
      "USER_CENTER_ACCESS_TOKEN_HEADER_NAME",
    );
    expect(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES).not.toHaveProperty(
      "allowAuthorizationFallbackToAccessToken",
    );
    const brandedPrefix = ["SDK", "WORK_"].join("");
    expect(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.accessTokenHeaderName.startsWith(brandedPrefix)).toBe(
      false,
    );
  });

  it("declares real local and external context inputs without local placeholder defaults", () => {
    const createUserCenterBridgeConfig = requireExport<
      (options: Record<string, unknown>) => Record<string, unknown>
    >("createUserCenterBridgeConfig");
    const createUserCenterDeploymentProfiles = requireExport<
      (bridgeConfig: Record<string, unknown>) => Record<string, Record<string, unknown>>
    >("createUserCenterDeploymentProfiles");
    const USER_CENTER_DEPLOYMENT_VARIABLE_NAMES = requireExport<Record<string, string>>(
      "USER_CENTER_DEPLOYMENT_VARIABLE_NAMES",
    );

    type DeploymentVariable = {
      canonicalName: string;
      defaultValue?: string;
      required: boolean;
      targets: string[];
    };

    const bridgeConfig = createUserCenterBridgeConfig({
      mode: "external-hub",
      namespace: "example-app",
      provider: {
        baseUrl: "https://identity.vendor.local/openapi",
        kind: "external-user-center",
        providerKey: "example-app-external",
      },
    });
    const profiles = createUserCenterDeploymentProfiles(bridgeConfig);
    const builtinLocalVariables = profiles.builtinLocal.variables as DeploymentVariable[];
    const externalVariables = profiles.externalUserCenter?.variables as
      | DeploymentVariable[]
      | undefined;

    const bootstrapTenantVariable = builtinLocalVariables.find(
      (variable) => variable.canonicalName.includes("BOOTSTRAP_TENANT"),
    );
    const bootstrapOrganizationVariable = builtinLocalVariables.find(
      (variable) => variable.canonicalName.includes("BOOTSTRAP_ORGANIZATION"),
    );
    const externalTenantHeaderVariable = externalVariables?.find(
      (variable) =>
        variable.canonicalName ===
        USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.externalTenantHeaderName,
    );
    const externalOrganizationHeaderVariable = externalVariables?.find(
      (variable) =>
        variable.canonicalName ===
        USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.externalOrganizationHeaderName,
    );

    expect(bootstrapTenantVariable).toBeUndefined();
    expect(bootstrapOrganizationVariable).toBeUndefined();
    expect(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.externalTenantHeaderName).toBe(
      "SDKWORK_USER_CENTER_EXTERNAL_TENANT_HEADER",
    );
    expect(USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.externalOrganizationHeaderName).toBe(
      "SDKWORK_USER_CENTER_EXTERNAL_ORGANIZATION_HEADER",
    );
    expect(externalTenantHeaderVariable).toMatchObject({
      defaultValue: "x-sdkwork-tenant-id",
      required: false,
      targets: ["external-authority-bridge"],
    });
    expect(externalOrganizationHeaderVariable).toMatchObject({
      defaultValue: "x-sdkwork-organization-id",
      required: false,
      targets: ["external-authority-bridge"],
    });
  });

  it("generates environment artifacts directly from a canonical deployment profile", () => {
    const createUserCenterBridgeConfig = requireExport<
      (options: Record<string, unknown>) => Record<string, unknown>
    >("createUserCenterBridgeConfig");
    const createUserCenterDeploymentProfiles = requireExport<
      (bridgeConfig: Record<string, unknown>) => Record<string, Record<string, unknown>>
    >("createUserCenterDeploymentProfiles");
    const createUserCenterDeploymentEnvArtifactForProfile = requireExport<
      ((options: {
        audience: "application-runtime" | "gateway-runtime" | "service-runtime";
        envPrefix: string;
        fileName: string;
        profile: Record<string, unknown>;
        purpose: string;
        targets:
          | readonly [
              "application-runtime"
              | "external-authority-bridge"
              | "local-authority"
              | "upstream-bridge",
              ...(
                | "application-runtime"
                | "external-authority-bridge"
                | "local-authority"
                | "upstream-bridge"
              )[],
            ]
          | [
              "application-runtime"
              | "external-authority-bridge"
              | "local-authority"
              | "upstream-bridge",
              ...(
                | "application-runtime"
                | "external-authority-bridge"
                | "local-authority"
                | "upstream-bridge"
              )[],
            ];
      }) => {
        content: string;
        fileName: string;
        variables: Array<{ canonicalName?: string; envName: string }>;
      })
      | undefined
    >("createUserCenterDeploymentEnvArtifactForProfile");

    expect(createUserCenterDeploymentEnvArtifactForProfile).toBeTypeOf("function");

    const bridgeConfig = createUserCenterBridgeConfig({
      namespace: "example-app",
    });
    const profiles = createUserCenterDeploymentProfiles(bridgeConfig);
    const artifact = createUserCenterDeploymentEnvArtifactForProfile?.({
      audience: "application-runtime",
      envPrefix: "VITE_EXAMPLE_APP_",
      fileName: ".env.desktop-local",
      profile: profiles.builtinLocal,
      purpose: "Example app desktop-local runtime contract",
      targets: ["application-runtime", "local-authority"],
    });

    expect(artifact).toMatchObject({
      fileName: ".env.desktop-local",
    });
    expect(artifact?.variables.some((variable) => variable.envName === "VITE_EXAMPLE_APP_MODE")).toBe(
      true,
    );
    expect(
      artifact?.variables.some(
        (variable) => variable.canonicalName === "SDKWORK_USER_CENTER_LOCAL_API_BASE_PATH",
      ),
    ).toBe(true);
    expect(artifact?.content).toContain("VITE_EXAMPLE_APP_MODE=builtin-local");
    expect(artifact?.content).toContain("VITE_EXAMPLE_APP_LOCAL_API_BASE_PATH=/app/v3/api");
  });
});
