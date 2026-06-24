import { useEffect, useState } from "react";
import {
  Button,
  Label,
  SettingsSection,
  StatusNotice,
  Switch,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamAccountBindingSettingsProps,
  SdkworkIamContactBindingPolicy,
  SdkworkIamOauthBindingPolicy,
  SdkworkIamOauthLoginPolicy,
} from "../types/account-binding-admin-types";

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
