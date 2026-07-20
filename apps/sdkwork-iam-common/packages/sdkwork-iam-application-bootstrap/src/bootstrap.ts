import { mergeBootstrapAuth } from "./auth.ts";
import {
  manifestToProvisionCommand,
  manifestToRegisterCommand,
  validateBootstrapEnvironment,
  validateManifestForBootstrap,
} from "./manifest.ts";
import { assertSdkworkJwtCredential } from "@sdkwork/runtime-bootstrap";
import type {
  ApplicationBootstrapEnvWriterInput,
  ApplicationBootstrapFromManifestInput,
  ApplicationBootstrapResult,
  CreateIamApplicationBootstrapInput,
  IamApplicationBootstrapAuth,
  IamApplicationBootstrapModule,
  IamApplicationBootstrapProfile,
} from "./types.ts";

export interface BootstrapApplicationFromManifestOptions extends ApplicationBootstrapFromManifestInput {
  profile?: IamApplicationBootstrapProfile | null;
}

export async function bootstrapApplicationFromManifest(
  input: BootstrapApplicationFromManifestOptions,
): Promise<ApplicationBootstrapResult> {
  validateManifestForBootstrap(input.manifest);
  validateBootstrapEnvironment(input.environment);

  const manifestHash = input.manifestHash ?? "unspecified";
  const registerBase = manifestToRegisterCommand(input.manifest, manifestHash);

  const registered = await input.client.registerApplication(
    mergeBootstrapAuth({ ...registerBase }, input.auth, input.profile),
  );

  const provisionBase = manifestToProvisionCommand(input.manifest, input.environment, registered);
  const provisioned = await input.client.provisionTenantApplication(
    mergeBootstrapAuth({ ...provisionBase }, input.auth, input.profile),
  );

  const tenantApplicationId = String(provisioned.tenantApplicationId ?? "");
  if (!tenantApplicationId) {
    throw new Error("tenantApplications.create did not return tenantApplicationId");
  }

  const enabled = await input.client.enableTenantApplication(
    tenantApplicationId,
    mergeBootstrapAuth(
      {
        tenantId: provisionBase.tenantId,
      },
      input.auth,
      input.profile,
    ),
  );

  const issued = await input.client.createAccessCredential(
    mergeBootstrapAuth(
      {
        tenantId: provisionBase.tenantId,
        organizationId: provisionBase.organizationId,
        tenantApplicationId: enabled.tenantApplicationId ?? provisioned.tenantApplicationId,
      },
      input.auth,
      input.profile,
    ),
  );

  const result: ApplicationBootstrapResult = {
    registered,
    provisioned,
    enabled,
    issued,
    templateId: registered.templateId,
    tenantApplicationId: issued.tenantApplicationId ?? enabled.tenantApplicationId ?? provisioned.tenantApplicationId,
    appId: issued.appId ?? enabled.appId ?? provisioned.appId,
    version: registered.version ?? registerBase.version,
    authToken: issued.authToken,
    accessCredential: issued.accessCredential ?? issued.accessToken,
    env: {},
  };

  result.env = buildBootstrapEnvRecord({ result, primaryDomain: input.environment.primaryDomain });
  return result;
}

export function buildBootstrapEnvRecord(input: ApplicationBootstrapEnvWriterInput): Record<string, string> {
  const { result, primaryDomain } = input;
  const provisionTenantId = result.provisioned.tenantId;
  const provisionOrganizationId = result.provisioned.organizationId;
  const accessCredential = String(result.issued.accessCredential ?? result.issued.accessToken ?? "");
  if (accessCredential) {
    assertSdkworkJwtCredential(accessCredential, "SDKWORK_ACCESS_TOKEN");
  }

  return {
    SDKWORK_TENANT_ID: String(result.issued.tenantId ?? provisionTenantId ?? ""),
    SDKWORK_ORGANIZATION_ID: String(result.issued.organizationId ?? provisionOrganizationId ?? ""),
    SDKWORK_TENANT_APPLICATION_ID: String(
      result.issued.tenantApplicationId ?? result.enabled.tenantApplicationId ?? result.provisioned.tenantApplicationId ?? "",
    ),
    SDKWORK_APP_ID: String(result.issued.appId ?? result.enabled.appId ?? result.provisioned.appId ?? ""),
    SDKWORK_APP_DOMAIN: primaryDomain ?? "",
    SDKWORK_ACCESS_TOKEN: accessCredential,
    ...(input.env ?? {}),
  };
}

export function formatBootstrapEnvFile(input: ApplicationBootstrapEnvWriterInput): string {
  const lines = Object.entries(buildBootstrapEnvRecord(input)).map(([key, value]) => `${key}=${value}`);
  return `${lines.join("\n")}\n`;
}

export function createIamApplicationBootstrap(
  input: CreateIamApplicationBootstrapInput,
): IamApplicationBootstrapModule {
  return {
    name: "@sdkwork/iam-application-bootstrap",
    version: "0.1.0",
    registerApplication: (body) => input.client.registerApplication(body),
    provisionTenantApplication: (body) => input.client.provisionTenantApplication(body),
    enableTenantApplication: (tenantApplicationId, body) =>
      input.client.enableTenantApplication(tenantApplicationId, body),
    createAccessCredential: (body) => input.client.createAccessCredential(body),
    updateTenantApplication: (tenantApplicationId, body) => {
      if (!input.client.updateTenantApplication) {
        throw new Error("iam.tenantApplications.update is not available on the bootstrap client");
      }
      return input.client.updateTenantApplication(tenantApplicationId, body);
    },
    bootstrapFromManifest: (options) => bootstrapApplicationFromManifest({ ...options, client: input.client }),
  };
}

export type { IamApplicationBootstrapAuth };
