import { createClient, type SdkworkBackendConfig } from "@sdkwork/appbase-backend-sdk";
import { createIamBackendSdkAdapter, unwrapIamSdkResponse } from "@sdkwork/iam-sdk-adapter";
import type { IamBackendSdkClient } from "@sdkwork/iam-sdk-ports";
import type { SdkworkIamService } from "@sdkwork/iam-service";

import { createIamApplicationBootstrap } from "./bootstrap.ts";
import type {
  EnabledTenantApplicationResult,
  IamApplicationBootstrapClient,
  IssuedAccessCredentialResult,
  ProvisionedTenantApplicationResult,
  RegisteredApplicationTemplateResult,
} from "./types.ts";

function resolveBackendOrigin(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/u, "");
  if (trimmed.endsWith("/backend/v3/api")) {
    return trimmed.slice(0, -"/backend/v3/api".length);
  }
  return trimmed;
}

function resolveBackendSdkConfig(config: SdkworkBackendConfig): SdkworkBackendConfig {
  return {
    ...config,
    baseUrl: resolveBackendOrigin(config.baseUrl),
  };
}

export function createIamApplicationBootstrapClientFromBackend(
  backend: IamBackendSdkClient,
): IamApplicationBootstrapClient {
  return {
    async registerApplication(body) {
      return unwrapIamSdkResponse<RegisteredApplicationTemplateResult>(
        await backend.iam?.applications?.register?.(body),
        "iam.applications.register failed",
      );
    },
    async provisionTenantApplication(body) {
      return unwrapIamSdkResponse<ProvisionedTenantApplicationResult>(
        await backend.iam?.tenantApplications?.provision?.(body),
        "iam.tenantApplications.provision failed",
      );
    },
    async enableTenantApplication(tenantApplicationId, body) {
      return unwrapIamSdkResponse<EnabledTenantApplicationResult>(
        await backend.iam?.tenantApplications?.enable?.(tenantApplicationId, body),
        "iam.tenantApplications.enable failed",
      );
    },
    async createAccessCredential(body) {
      return unwrapIamSdkResponse<IssuedAccessCredentialResult>(
        await backend.iam?.accessCredentials?.create?.(body),
        "iam.accessCredentials.create failed",
      );
    },
    async updateTenantApplication(tenantApplicationId, body) {
      return unwrapIamSdkResponse<ProvisionedTenantApplicationResult>(
        await backend.iam?.tenantApplications?.update?.(tenantApplicationId, body),
        "iam.tenantApplications.update failed",
      );
    },
  };
}

export function createIamApplicationBootstrapClientFromAppbaseBackendSdk(
  config: SdkworkBackendConfig,
): IamApplicationBootstrapClient {
  const client = createClient(resolveBackendSdkConfig(config));
  return createIamApplicationBootstrapClientFromBackend(createIamBackendSdkAdapter(client));
}

export function createIamApplicationBootstrapClientFromIamService(
  service: SdkworkIamService,
): IamApplicationBootstrapClient {
  return {
    registerApplication: (body) => service.iam.applications.register(body) as Promise<RegisteredApplicationTemplateResult>,
    provisionTenantApplication: (body) =>
      service.iam.tenantApplications.provision(body) as Promise<ProvisionedTenantApplicationResult>,
    enableTenantApplication: (tenantApplicationId, body) =>
      service.iam.tenantApplications.enable(tenantApplicationId, body) as Promise<EnabledTenantApplicationResult>,
    createAccessCredential: (body) =>
      service.iam.accessCredentials.create(body) as Promise<IssuedAccessCredentialResult>,
    updateTenantApplication: (tenantApplicationId, body) =>
      service.iam.tenantApplications.update(tenantApplicationId, body) as Promise<ProvisionedTenantApplicationResult>,
  };
}

export interface IamRuntimeBootstrapSource {
  service: SdkworkIamService;
}

export function createIamApplicationBootstrapFromIamService(
  service: SdkworkIamService,
): import("./types.ts").IamApplicationBootstrapModule {
  return createIamApplicationBootstrap({
    client: createIamApplicationBootstrapClientFromIamService(service),
  });
}

export function createIamApplicationBootstrapFromIamRuntime(
  runtime: IamRuntimeBootstrapSource,
): import("./types.ts").IamApplicationBootstrapModule {
  return createIamApplicationBootstrapFromIamService(runtime.service);
}
