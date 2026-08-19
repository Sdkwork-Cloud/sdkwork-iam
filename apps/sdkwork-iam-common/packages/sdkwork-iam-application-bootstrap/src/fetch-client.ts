import { trim } from "@sdkwork/utils";
import { unwrapIamSdkResponse } from "@sdkwork/iam-sdk-adapter";

import type {
  EnabledTenantApplicationResult,
  IamApplicationBootstrapClient,
  IssuedAccessCredentialResult,
  ProvisionedTenantApplicationResult,
  RegisteredApplicationTemplateResult,
} from "./types.ts";

/** Backend API prefix for IAM application-bootstrap operations. */
export const IAM_APPLICATION_BOOTSTRAP_API_PREFIX = "/backend/v3/api";

/** Register application template. */
export const IAM_APPLICATIONS_REGISTER_PATH = "/iam/applications/register";

/** Provision tenant application. */
export const IAM_TENANT_APPLICATIONS_PATH = "/iam/tenant_applications";

/** Issue access credential. */
export const IAM_ACCESS_CREDENTIALS_PATH = "/iam/access_credentials";

/** HTTP config for {@link createFetchIamApplicationBootstrapClient}. */
export interface CreateFetchIamApplicationBootstrapClientOptions {
  /** Backend origin or origin plus `/backend/v3/api`. */
  baseUrl: string;
  /** Override for `globalThis.fetch`; tests inject a stub. */
  fetch?: typeof fetch;
}

/**
 * Strip a trailing `/backend/v3/api` so path constants can be joined once.
 * @param baseUrl - configured backend base URL
 * @returns origin without the API prefix
 */
export function resolveIamBackendApiOrigin(baseUrl: string): string {
  const trimmed = trim(baseUrl).replace(/\/+$/u, "");
  if (trimmed.endsWith(IAM_APPLICATION_BOOTSTRAP_API_PREFIX)) {
    return trimmed.slice(0, -IAM_APPLICATION_BOOTSTRAP_API_PREFIX.length);
  }
  return trimmed;
}

function bootstrapUrl(origin: string, pathname: string): string {
  return `${origin}${IAM_APPLICATION_BOOTSTRAP_API_PREFIX}${pathname}`;
}

function tenantApplicationPath(tenantApplicationId: string): string {
  return `${IAM_TENANT_APPLICATIONS_PATH}/${encodeURIComponent(tenantApplicationId)}`;
}

function unwrapBootstrapResult<T extends Record<string, unknown>>(value: unknown): T {
  const data = unwrapIamSdkResponse<unknown>(value);
  if (data && typeof data === "object" && !Array.isArray(data) && "item" in data) {
    const item = (data as { item: unknown }).item;
    if (item && typeof item === "object") {
      return item as T;
    }
  }
  return data as T;
}

function problemMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as { detail?: unknown; title?: unknown; message?: unknown; msg?: unknown };
  const detail = [record.detail, record.title, record.message, record.msg]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find((value) => value.length > 0);
  return detail || fallback;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`IAM bootstrap response is not JSON (HTTP ${response.status})`);
  }
}

/**
 * CLI/tooling IAM application-bootstrap client. Talks to the canonical
 * bootstrap-body HTTP operations without loading the generated backend SDK.
 * @param options - backend origin and optional fetch implementation
 * @returns an {@link IamApplicationBootstrapClient}
 */
export function createFetchIamApplicationBootstrapClient(
  options: CreateFetchIamApplicationBootstrapClientOptions,
): IamApplicationBootstrapClient {
  const origin = resolveIamBackendApiOrigin(options.baseUrl);
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);

  async function requestJson<T extends Record<string, unknown>>(
    method: string,
    pathname: string,
    body: Record<string, unknown> | undefined,
    fallbackMessage: string,
  ): Promise<T> {
    const response = await fetchImpl(bootstrapUrl(origin, pathname), {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });
    const payload = await parseJson(response);
    if (!response.ok) {
      throw new Error(problemMessage(payload, `${fallbackMessage} (HTTP ${response.status})`));
    }
    return unwrapBootstrapResult<T>(payload);
  }

  return {
    registerApplication(body) {
      return requestJson<RegisteredApplicationTemplateResult>(
        "POST",
        IAM_APPLICATIONS_REGISTER_PATH,
        body,
        "iam.applications.register failed",
      );
    },
    provisionTenantApplication(body) {
      return requestJson<ProvisionedTenantApplicationResult>(
        "POST",
        IAM_TENANT_APPLICATIONS_PATH,
        body,
        "iam.tenantApplications.create failed",
      );
    },
    enableTenantApplication(tenantApplicationId, body) {
      return requestJson<EnabledTenantApplicationResult>(
        "POST",
        `${tenantApplicationPath(tenantApplicationId)}/enable`,
        body,
        "iam.tenantApplications.enable failed",
      );
    },
    createAccessCredential(body) {
      return requestJson<IssuedAccessCredentialResult>(
        "POST",
        IAM_ACCESS_CREDENTIALS_PATH,
        body,
        "iam.accessCredentials.create failed",
      );
    },
    updateTenantApplication(tenantApplicationId, body) {
      return requestJson<ProvisionedTenantApplicationResult>(
        "PATCH",
        tenantApplicationPath(tenantApplicationId),
        body,
        "iam.tenantApplications.update failed",
      );
    },
  };
}
