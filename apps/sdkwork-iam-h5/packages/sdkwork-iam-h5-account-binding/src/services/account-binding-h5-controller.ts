import type { SdkworkIamService } from "@sdkwork/iam-service";

import type {
  CreateSdkworkIamH5AccountBindingControllerInput,
  SdkworkIamH5AccountBindingController,
  SdkworkIamH5AccountBindingPolicy,
  SdkworkIamH5AccountBindingState,
  SdkworkIamH5OAuthAccountLink,
} from "../types/account-binding-h5-types";
import { DEFAULT_H5_ACCOUNT_BINDING_POLICY as defaultPolicy } from "../types/account-binding-h5-types";

export function createSdkworkIamH5AccountBindingController(
  input: SdkworkIamService | CreateSdkworkIamH5AccountBindingControllerInput,
): SdkworkIamH5AccountBindingController {
  const service = "service" in input ? input.service : input;
  let state: SdkworkIamH5AccountBindingState = {
    accountLinks: [],
    status: "idle",
  };

  const setState = (patch: Partial<SdkworkIamH5AccountBindingState>) => {
    state = { ...state, ...patch };
  };

  return {
    bindEmail: async (body) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const result = await service.iam.users.current.emailBindings.create(body);
        setState({ status: "ready" });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Email binding failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    getState: () => ({
      ...state,
      accountLinks: [...state.accountLinks],
      policy: state.policy ? { ...state.policy, contactBinding: { ...state.policy.contactBinding }, oauthBinding: { ...state.policy.oauthBinding } } : undefined,
    }),
    listAccountLinks: async (params) => {
      setState({ status: "loading" });
      try {
        const accountLinks = extractList(await service.oauth.accountLinks.list(params))
          .map(toAccountLink)
          .filter(Boolean) as SdkworkIamH5OAuthAccountLink[];
        setState({ accountLinks, status: "ready" });
        return accountLinks;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load account links";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    loadPolicy: async () => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const policy = normalizePolicy(await service.system.iam.accountBindingPolicy.retrieve());
        setState({ policy, status: "ready" });
        return policy;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load account binding policy";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    unbindEmail: async (body) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const result = await service.iam.users.current.emailBindings.delete(body);
        setState({ status: "ready" });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Email unbind failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
  };
}

function normalizePolicy(value: unknown): SdkworkIamH5AccountBindingPolicy {
  const record = toRecord(value);
  const contactBinding = toRecord(record.contactBinding ?? record.contact_binding);
  const oauthBinding = toRecord(record.oauthBinding ?? record.oauth_binding);
  return {
    contactBinding: {
      emailChangeEnabled: readBoolean(contactBinding.emailChangeEnabled ?? contactBinding.email_change_enabled, defaultPolicy.contactBinding.emailChangeEnabled),
      emailEnabled: readBoolean(contactBinding.emailEnabled ?? contactBinding.email_enabled, defaultPolicy.contactBinding.emailEnabled),
      enabled: readBoolean(contactBinding.enabled, defaultPolicy.contactBinding.enabled),
      phoneChangeEnabled: readBoolean(contactBinding.phoneChangeEnabled ?? contactBinding.phone_change_enabled, defaultPolicy.contactBinding.phoneChangeEnabled),
      phoneEnabled: readBoolean(contactBinding.phoneEnabled ?? contactBinding.phone_enabled, defaultPolicy.contactBinding.phoneEnabled),
    },
    oauthBinding: {
      enabled: readBoolean(oauthBinding.enabled, defaultPolicy.oauthBinding.enabled),
      selfServiceLinkEnabled: readBoolean(oauthBinding.selfServiceLinkEnabled ?? oauthBinding.self_service_link_enabled, defaultPolicy.oauthBinding.selfServiceLinkEnabled),
      selfServiceUnlinkEnabled: readBoolean(oauthBinding.selfServiceUnlinkEnabled ?? oauthBinding.self_service_unlink_enabled, defaultPolicy.oauthBinding.selfServiceUnlinkEnabled),
    },
  };
}

function toAccountLink(value: unknown): SdkworkIamH5OAuthAccountLink | undefined {
  const record = toRecord(value);
  const accountLinkId = optionalString(record.accountLinkId) || optionalString(record.account_link_id) || optionalString(record.id);
  if (!accountLinkId) {
    return undefined;
  }
  return {
    accountLinkId,
    id: optionalString(record.id) || accountLinkId,
    provider: optionalString(record.provider),
    providerUserId: optionalString(record.providerUserId) || optionalString(record.provider_user_id),
  };
}

function extractList(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value || typeof value !== "object") {
    return [];
  }
  const record = value as Record<string, unknown>;
  for (const key of ["records", "items", "list", "rows", "content", "data"]) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return nested;
    }
  }
  return [];
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }
    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }
  return fallback;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function optionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : value === undefined || value === null ? "" : String(value).trim();
  return normalized || undefined;
}
