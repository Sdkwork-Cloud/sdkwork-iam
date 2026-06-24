import type { SdkworkIamService } from "@sdkwork/iam-service";

import type {
  CreateSdkworkIamAccountBindingControllerInput,
  SdkworkIamAccountBindingController,
  SdkworkIamAccountBindingPolicy,
  SdkworkIamAccountBindingPolicyState,
} from "../types/account-binding-admin-types";
import { DEFAULT_ACCOUNT_BINDING_POLICY } from "../types/account-binding-admin-types";

export function createSdkworkIamAccountBindingController(
  input: SdkworkIamService | CreateSdkworkIamAccountBindingControllerInput,
): SdkworkIamAccountBindingController {
  const service = "service" in input ? input.service : input;
  let state: SdkworkIamAccountBindingPolicyState = {
    policy: DEFAULT_ACCOUNT_BINDING_POLICY,
    status: "idle",
  };

  const setState = (patch: Partial<SdkworkIamAccountBindingPolicyState>) => {
    state = {
      ...state,
      ...patch,
      policy: patch.policy ? { ...patch.policy } : state.policy,
    };
  };

  return {
    getState() {
      return {
        ...state,
        policy: {
          contactBinding: { ...state.policy.contactBinding },
          oauthLogin: {
            ...state.policy.oauthLogin,
            allowedProviders: [...state.policy.oauthLogin.allowedProviders],
          },
          oauthBinding: {
            ...state.policy.oauthBinding,
            allowedProviders: [...state.policy.oauthBinding.allowedProviders],
          },
        },
      };
    },
    async load() {
      setState({ status: "loading", lastError: undefined });
      try {
        const policy = normalizePolicy(await service.iam.accountBindingPolicy.retrieve());
        setState({ policy, status: "ready" });
        return policy;
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error ? error.message : "Failed to load account binding policy",
        });
        throw error;
      }
    },
    async save(policy) {
      setState({ status: "saving", lastError: undefined });
      try {
        const saved = normalizePolicy(
          await service.iam.accountBindingPolicy.update(toRemotePolicy(policy)),
        );
        setState({ policy: saved, status: "ready" });
        return saved;
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error ? error.message : "Failed to save account binding policy",
        });
        throw error;
      }
    },
  };
}

function normalizePolicy(value: unknown): SdkworkIamAccountBindingPolicy {
  const record = toRecord(value);
  const contactBinding = toRecord(record.contactBinding ?? record.contact_binding);
  const oauthLogin = toRecord(record.oauthLogin ?? record.oauth_login);
  const oauthBinding = toRecord(record.oauthBinding ?? record.oauth_binding);
  const loginAllowedProviders = oauthLogin.allowedProviders ?? oauthLogin.allowed_providers;
  const allowedProviders = oauthBinding.allowedProviders ?? oauthBinding.allowed_providers;

  return {
    contactBinding: {
      enabled: readBoolean(contactBinding.enabled, DEFAULT_ACCOUNT_BINDING_POLICY.contactBinding.enabled),
      emailEnabled: readBoolean(contactBinding.emailEnabled ?? contactBinding.email_enabled, DEFAULT_ACCOUNT_BINDING_POLICY.contactBinding.emailEnabled),
      phoneEnabled: readBoolean(contactBinding.phoneEnabled ?? contactBinding.phone_enabled, DEFAULT_ACCOUNT_BINDING_POLICY.contactBinding.phoneEnabled),
      emailChangeEnabled: readBoolean(contactBinding.emailChangeEnabled ?? contactBinding.email_change_enabled, DEFAULT_ACCOUNT_BINDING_POLICY.contactBinding.emailChangeEnabled),
      phoneChangeEnabled: readBoolean(contactBinding.phoneChangeEnabled ?? contactBinding.phone_change_enabled, DEFAULT_ACCOUNT_BINDING_POLICY.contactBinding.phoneChangeEnabled),
      emailUnbindEnabled: readBoolean(contactBinding.emailUnbindEnabled ?? contactBinding.email_unbind_enabled, DEFAULT_ACCOUNT_BINDING_POLICY.contactBinding.emailUnbindEnabled),
      phoneUnbindEnabled: readBoolean(contactBinding.phoneUnbindEnabled ?? contactBinding.phone_unbind_enabled, DEFAULT_ACCOUNT_BINDING_POLICY.contactBinding.phoneUnbindEnabled),
      requireVerification: readBoolean(contactBinding.requireVerification ?? contactBinding.require_verification, DEFAULT_ACCOUNT_BINDING_POLICY.contactBinding.requireVerification),
    },
    oauthLogin: {
      allowedProviders: Array.isArray(loginAllowedProviders)
        ? loginAllowedProviders.map((entry) => String(entry).trim()).filter(Boolean)
        : [],
      autoRegistrationEnabled: readBoolean(
        oauthLogin.autoRegistrationEnabled ?? oauthLogin.auto_registration_enabled,
        DEFAULT_ACCOUNT_BINDING_POLICY.oauthLogin.autoRegistrationEnabled,
      ),
      enabled: readBoolean(oauthLogin.enabled, DEFAULT_ACCOUNT_BINDING_POLICY.oauthLogin.enabled),
    },
    oauthBinding: {
      allowedProviders: Array.isArray(allowedProviders)
        ? allowedProviders.map((entry) => String(entry).trim()).filter(Boolean)
        : [],
      enabled: readBoolean(oauthBinding.enabled, DEFAULT_ACCOUNT_BINDING_POLICY.oauthBinding.enabled),
      selfServiceLinkEnabled: readBoolean(
        oauthBinding.selfServiceLinkEnabled ?? oauthBinding.self_service_link_enabled,
        DEFAULT_ACCOUNT_BINDING_POLICY.oauthBinding.selfServiceLinkEnabled,
      ),
      selfServiceUnlinkEnabled: readBoolean(
        oauthBinding.selfServiceUnlinkEnabled ?? oauthBinding.self_service_unlink_enabled,
        DEFAULT_ACCOUNT_BINDING_POLICY.oauthBinding.selfServiceUnlinkEnabled,
      ),
    },
  };
}

function toRemotePolicy(policy: SdkworkIamAccountBindingPolicy): Record<string, unknown> {
  return {
    contactBinding: { ...policy.contactBinding },
    oauthLogin: {
      ...policy.oauthLogin,
      allowedProviders: [...policy.oauthLogin.allowedProviders],
    },
    oauthBinding: {
      ...policy.oauthBinding,
      allowedProviders: [...policy.oauthBinding.allowedProviders],
    },
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}
