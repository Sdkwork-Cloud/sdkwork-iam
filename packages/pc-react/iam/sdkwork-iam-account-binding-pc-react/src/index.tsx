import { useEffect, useState } from "react";
import type { SdkworkIamService } from "@sdkwork/iam-service";
import {
  Button,
  Label,
  SettingsSection,
  StatusNotice,
  Switch,
} from "@sdkwork/ui-pc-react";

export interface SdkworkIamContactBindingPolicy {
  enabled: boolean;
  emailEnabled: boolean;
  phoneEnabled: boolean;
  emailChangeEnabled: boolean;
  phoneChangeEnabled: boolean;
  emailUnbindEnabled: boolean;
  phoneUnbindEnabled: boolean;
  requireVerification: boolean;
}

export interface SdkworkIamOauthLoginPolicy {
  allowedProviders: readonly string[];
  autoRegistrationEnabled: boolean;
  enabled: boolean;
}

export interface SdkworkIamOauthBindingPolicy {
  allowedProviders: readonly string[];
  enabled: boolean;
  selfServiceLinkEnabled: boolean;
  selfServiceUnlinkEnabled: boolean;
}

export interface SdkworkIamAccountBindingPolicy {
  contactBinding: SdkworkIamContactBindingPolicy;
  oauthLogin: SdkworkIamOauthLoginPolicy;
  oauthBinding: SdkworkIamOauthBindingPolicy;
}

export interface SdkworkIamAccountBindingPolicyState {
  policy: SdkworkIamAccountBindingPolicy;
  status: "idle" | "loading" | "ready" | "saving" | "error";
  lastError?: string;
}

export interface CreateSdkworkIamAccountBindingControllerInput {
  service: SdkworkIamService;
}

export interface SdkworkIamAccountBindingController {
  getState(): SdkworkIamAccountBindingPolicyState;
  load(): Promise<SdkworkIamAccountBindingPolicy>;
  save(policy: SdkworkIamAccountBindingPolicy): Promise<SdkworkIamAccountBindingPolicy>;
}

const DEFAULT_POLICY: SdkworkIamAccountBindingPolicy = {
  contactBinding: {
    enabled: true,
    emailEnabled: true,
    phoneEnabled: true,
    emailChangeEnabled: true,
    phoneChangeEnabled: true,
    emailUnbindEnabled: false,
    phoneUnbindEnabled: false,
    requireVerification: true,
  },
  oauthLogin: {
    allowedProviders: [],
    autoRegistrationEnabled: true,
    enabled: false,
  },
  oauthBinding: {
    allowedProviders: [],
    enabled: false,
    selfServiceLinkEnabled: false,
    selfServiceUnlinkEnabled: false,
  },
};

export function createSdkworkIamAccountBindingController(
  input: SdkworkIamService | CreateSdkworkIamAccountBindingControllerInput,
): SdkworkIamAccountBindingController {
  const service = "service" in input ? input.service : input;
  let state: SdkworkIamAccountBindingPolicyState = {
    policy: DEFAULT_POLICY,
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

export interface SdkworkIamAccountBindingSettingsProps {
  controller: SdkworkIamAccountBindingController;
  description?: string;
  title?: string;
}

export function SdkworkIamAccountBindingSettings({
  controller,
  description = "Configure whether end users can bind or unbind email, phone, and OAuth identities.",
  title = "Account binding policy",
}: SdkworkIamAccountBindingSettingsProps) {
  const [draft, setDraft] = useState(controller.getState().policy);
  const [status, setStatus] = useState(controller.getState().status);
  const [error, setError] = useState<string | undefined>(controller.getState().lastError);

  useEffect(() => {
    void controller.load().then((policy) => {
      setDraft(policy);
      setStatus(controller.getState().status);
      setError(controller.getState().lastError);
    }).catch(() => {
      setStatus(controller.getState().status);
      setError(controller.getState().lastError);
    });
  }, [controller]);

  const updateContact = (patch: Partial<SdkworkIamContactBindingPolicy>) => {
    setDraft((current) => ({
      ...current,
      contactBinding: {
        ...current.contactBinding,
        ...patch,
      },
    }));
  };

  const updateOauthLogin = (patch: Partial<SdkworkIamOauthLoginPolicy>) => {
    setDraft((current) => ({
      ...current,
      oauthLogin: {
        ...current.oauthLogin,
        ...patch,
      },
    }));
  };

  const updateOauth = (patch: Partial<SdkworkIamOauthBindingPolicy>) => {
    setDraft((current) => ({
      ...current,
      oauthBinding: {
        ...current.oauthBinding,
        ...patch,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <SettingsSection description={description} title={title}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        <div className="space-y-4">
          <PolicyToggle
            checked={draft.contactBinding.enabled}
            label="Enable contact binding"
            onCheckedChange={(enabled) => updateContact({ enabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.emailEnabled}
            disabled={!draft.contactBinding.enabled}
            label="Allow email binding"
            onCheckedChange={(emailEnabled) => updateContact({ emailEnabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.phoneEnabled}
            disabled={!draft.contactBinding.enabled}
            label="Allow phone binding"
            onCheckedChange={(phoneEnabled) => updateContact({ phoneEnabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.emailChangeEnabled}
            disabled={!draft.contactBinding.enabled || !draft.contactBinding.emailEnabled}
            label="Allow email change"
            onCheckedChange={(emailChangeEnabled) => updateContact({ emailChangeEnabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.phoneChangeEnabled}
            disabled={!draft.contactBinding.enabled || !draft.contactBinding.phoneEnabled}
            label="Allow phone change"
            onCheckedChange={(phoneChangeEnabled) => updateContact({ phoneChangeEnabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.emailUnbindEnabled}
            disabled={!draft.contactBinding.enabled || !draft.contactBinding.emailEnabled}
            label="Allow email unbind"
            onCheckedChange={(emailUnbindEnabled) => updateContact({ emailUnbindEnabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.phoneUnbindEnabled}
            disabled={!draft.contactBinding.enabled || !draft.contactBinding.phoneEnabled}
            label="Allow phone unbind"
            onCheckedChange={(phoneUnbindEnabled) => updateContact({ phoneUnbindEnabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.requireVerification}
            disabled={!draft.contactBinding.enabled}
            label="Require verification code for bind/change"
            onCheckedChange={(requireVerification) => updateContact({ requireVerification })}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        description="OAuth login exposes third-party sign-in buttons on the auth page. Providers must also be configured in IAM OAuth integrations or local OAuth env."
        title="OAuth login"
      >
        <div className="space-y-4">
          <PolicyToggle
            checked={draft.oauthLogin.enabled}
            label="Enable OAuth login"
            onCheckedChange={(enabled) => updateOauthLogin({ enabled })}
          />
          <PolicyToggle
            checked={draft.oauthLogin.autoRegistrationEnabled}
            disabled={!draft.oauthLogin.enabled}
            label="Allow auto registration for new OAuth users"
            onCheckedChange={(autoRegistrationEnabled) => updateOauthLogin({ autoRegistrationEnabled })}
          />
          <div className="space-y-2">
            <Label htmlFor="oauth-login-providers">Allowed login provider codes</Label>
            <input
              className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
              disabled={!draft.oauthLogin.enabled}
              id="oauth-login-providers"
              onChange={(event) => updateOauthLogin({
                allowedProviders: event.target.value
                  .split(/[,\s;]+/)
                  .map((value) => value.trim())
                  .filter(Boolean),
              })}
              placeholder="wechat, google, twitter (empty = all configured providers)"
              value={draft.oauthLogin.allowedProviders.join(", ")}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        description="OAuth linking uses provider authorization flows. Users can list linked accounts when OAuth binding is enabled."
        title="OAuth binding"
      >
        <div className="space-y-4">
          <PolicyToggle
            checked={draft.oauthBinding.enabled}
            label="Enable OAuth account binding"
            onCheckedChange={(enabled) => updateOauth({ enabled })}
          />
          <PolicyToggle
            checked={draft.oauthBinding.selfServiceLinkEnabled}
            disabled={!draft.oauthBinding.enabled}
            label="Allow self-service OAuth link"
            onCheckedChange={(selfServiceLinkEnabled) => updateOauth({ selfServiceLinkEnabled })}
          />
          <PolicyToggle
            checked={draft.oauthBinding.selfServiceUnlinkEnabled}
            disabled={!draft.oauthBinding.enabled}
            label="Allow self-service OAuth unlink"
            onCheckedChange={(selfServiceUnlinkEnabled) => updateOauth({ selfServiceUnlinkEnabled })}
          />
          <div className="space-y-2">
            <Label htmlFor="allowed-providers">Allowed provider codes</Label>
            <input
              className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
              disabled={!draft.oauthBinding.enabled}
              id="allowed-providers"
              onChange={(event) => updateOauth({
                allowedProviders: event.target.value
                  .split(/[,\s;]+/)
                  .map((value) => value.trim())
                  .filter(Boolean),
              })}
              placeholder="github, wechat, google"
              value={draft.oauthBinding.allowedProviders.join(", ")}
            />
          </div>
        </div>
      </SettingsSection>

      <Button
        disabled={status === "loading" || status === "saving"}
        loading={status === "saving"}
        onClick={() => {
          void controller.save(draft).then((saved) => {
            setDraft(saved);
            setStatus(controller.getState().status);
            setError(controller.getState().lastError);
          }).catch(() => {
            setStatus(controller.getState().status);
            setError(controller.getState().lastError);
          });
        }}
        type="button"
      >
        Save policy
      </Button>
    </div>
  );
}

function PolicyToggle({
  checked,
  disabled,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange(checked: boolean): void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label>{label}</Label>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  );
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
      enabled: readBoolean(contactBinding.enabled, DEFAULT_POLICY.contactBinding.enabled),
      emailEnabled: readBoolean(contactBinding.emailEnabled ?? contactBinding.email_enabled, DEFAULT_POLICY.contactBinding.emailEnabled),
      phoneEnabled: readBoolean(contactBinding.phoneEnabled ?? contactBinding.phone_enabled, DEFAULT_POLICY.contactBinding.phoneEnabled),
      emailChangeEnabled: readBoolean(contactBinding.emailChangeEnabled ?? contactBinding.email_change_enabled, DEFAULT_POLICY.contactBinding.emailChangeEnabled),
      phoneChangeEnabled: readBoolean(contactBinding.phoneChangeEnabled ?? contactBinding.phone_change_enabled, DEFAULT_POLICY.contactBinding.phoneChangeEnabled),
      emailUnbindEnabled: readBoolean(contactBinding.emailUnbindEnabled ?? contactBinding.email_unbind_enabled, DEFAULT_POLICY.contactBinding.emailUnbindEnabled),
      phoneUnbindEnabled: readBoolean(contactBinding.phoneUnbindEnabled ?? contactBinding.phone_unbind_enabled, DEFAULT_POLICY.contactBinding.phoneUnbindEnabled),
      requireVerification: readBoolean(contactBinding.requireVerification ?? contactBinding.require_verification, DEFAULT_POLICY.contactBinding.requireVerification),
    },
    oauthLogin: {
      allowedProviders: Array.isArray(loginAllowedProviders)
        ? loginAllowedProviders.map((entry) => String(entry).trim()).filter(Boolean)
        : [],
      autoRegistrationEnabled: readBoolean(
        oauthLogin.autoRegistrationEnabled ?? oauthLogin.auto_registration_enabled,
        DEFAULT_POLICY.oauthLogin.autoRegistrationEnabled,
      ),
      enabled: readBoolean(oauthLogin.enabled, DEFAULT_POLICY.oauthLogin.enabled),
    },
    oauthBinding: {
      allowedProviders: Array.isArray(allowedProviders)
        ? allowedProviders.map((entry) => String(entry).trim()).filter(Boolean)
        : [],
      enabled: readBoolean(oauthBinding.enabled, DEFAULT_POLICY.oauthBinding.enabled),
      selfServiceLinkEnabled: readBoolean(
        oauthBinding.selfServiceLinkEnabled ?? oauthBinding.self_service_link_enabled,
        DEFAULT_POLICY.oauthBinding.selfServiceLinkEnabled,
      ),
      selfServiceUnlinkEnabled: readBoolean(
        oauthBinding.selfServiceUnlinkEnabled ?? oauthBinding.self_service_unlink_enabled,
        DEFAULT_POLICY.oauthBinding.selfServiceUnlinkEnabled,
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
