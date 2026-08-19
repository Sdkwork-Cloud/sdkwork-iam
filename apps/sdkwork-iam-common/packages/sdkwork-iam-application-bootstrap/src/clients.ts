import { unwrapIamSdkResponse } from "@sdkwork/iam-sdk-adapter";
import type { IamBackendSdkClient } from "@sdkwork/iam-sdk-ports";
import type { SdkworkIamService } from "@sdkwork/iam-service";

import { createIamApplicationBootstrap } from "./bootstrap.ts";
import {
  createFetchIamApplicationBootstrapClient,
  type CreateFetchIamApplicationBootstrapClientOptions,
} from "./fetch-client.ts";
import type {
  EnabledTenantApplicationResult,
  IamApplicationBootstrapClient,
  IssuedAccessCredentialResult,
  ProvisionedTenantApplicationResult,
  RegisteredApplicationTemplateResult,
} from "./types.ts";

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
        await backend.iam?.tenantApplications?.create?.(body),
        "iam.tenantApplications.create failed",
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

/**
 * CLI convenience adapter. Local tooling uses the fetch transport so start/build
 * does not require the generated backend SDK to be materialized.
 * @param config - backend origin (`baseUrl`) and optional fetch override
 * @returns an {@link IamApplicationBootstrapClient}
 */
export function createIamApplicationBootstrapClientFromAppbaseBackendSdk(
  config: CreateFetchIamApplicationBootstrapClientOptions,
): IamApplicationBootstrapClient {
  return createFetchIamApplicationBootstrapClient(config);
}

/**
 * Bootstrap-only backend SDK binding. Uses the four IAM bootstrap operations
 * directly so application bootstrap does not depend on the full generated SDK
 * surface matching {@link createIamBackendSdkAdapter}.
 */
export function createIamApplicationBootstrapClientFromGeneratedBackendSdk(
  client: {
    iam?: {
      applications?: { register?: (body: Record<string, unknown>) => Promise<unknown> };
      tenantApplications?: {
        create?: (body: Record<string, unknown>) => Promise<unknown>;
        enable?: (tenantApplicationId: string, body?: Record<string, unknown>) => Promise<unknown>;
        update?: (tenantApplicationId: string, body?: Record<string, unknown>) => Promise<unknown>;
      };
      accessCredentials?: { create?: (body: Record<string, unknown>) => Promise<unknown> };
    };
  },
): IamApplicationBootstrapClient {
  const iam = client.iam;
  return {
    async registerApplication(body) {
      return unwrapIamSdkResponse<RegisteredApplicationTemplateResult>(
        await iam?.applications?.register?.(body),
        "iam.applications.register failed",
      );
    },
    async provisionTenantApplication(body) {
      return unwrapIamSdkResponse<ProvisionedTenantApplicationResult>(
        await iam?.tenantApplications?.create?.(body),
        "iam.tenantApplications.create failed",
      );
    },
    async enableTenantApplication(tenantApplicationId, body) {
      return unwrapIamSdkResponse<EnabledTenantApplicationResult>(
        await iam?.tenantApplications?.enable?.(tenantApplicationId, body),
        "iam.tenantApplications.enable failed",
      );
    },
    async createAccessCredential(body) {
      return unwrapIamSdkResponse<IssuedAccessCredentialResult>(
        await iam?.accessCredentials?.create?.(body),
        "iam.accessCredentials.create failed",
      );
    },
    async updateTenantApplication(tenantApplicationId, body) {
      return unwrapIamSdkResponse<ProvisionedTenantApplicationResult>(
        await iam?.tenantApplications?.update?.(tenantApplicationId, body),
        "iam.tenantApplications.update failed",
      );
    },
  };
}

export function createIamApplicationBootstrapClientFromIamService(
  service: SdkworkIamService,
): IamApplicationBootstrapClient {
  return {
    registerApplication: (body) => service.iam.applications.register(body) as Promise<RegisteredApplicationTemplateResult>,
    provisionTenantApplication: (body) =>
      service.iam.tenantApplications.create(body) as Promise<ProvisionedTenantApplicationResult>,
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
