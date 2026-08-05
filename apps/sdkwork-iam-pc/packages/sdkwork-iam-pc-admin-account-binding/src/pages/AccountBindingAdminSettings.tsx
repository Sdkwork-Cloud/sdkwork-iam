import { useEffect, useState } from "react";
import {
  Button,
  Label,
  SettingsSection,
  StatusNotice,
  Switch,
} from "@sdkwork/ui-pc-react";

import { useSdkworkIamAccountBindingAdminMessages } from "../i18n";
import type {
  SdkworkIamAccountBindingSettingsProps,
  SdkworkIamContactBindingPolicy,
  SdkworkIamOauthBindingPolicy,
  SdkworkIamOauthLoginPolicy,
} from "../types/account-binding-admin-types";

export function SdkworkIamAccountBindingSettings({
  controller,
}: SdkworkIamAccountBindingSettingsProps) {
  const messages = useSdkworkIamAccountBindingAdminMessages();
  const [draft, setDraft] = useState(controller.getState().policy);
  const [status, setStatus] = useState(controller.getState().status);
  const [error, setError] = useState<string | undefined>(controller.getState().lastError);

  useEffect(() => {
    void controller.load().then((policy) => {
      setDraft(policy);
      setStatus(controller.getState().status);
      setError(controller.getState().lastError);
    }).catch((loadError) => {
      setStatus(controller.getState().status);
      setError(toErrorMessage(loadError, messages.common.loadError));
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
      <SettingsSection
        description={messages.contactBinding.description}
        title={messages.contactBinding.title}
      >
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        <div className="space-y-4">
          <PolicyToggle
            checked={draft.contactBinding.enabled}
            label={messages.contactBinding.enableContactBinding}
            onCheckedChange={(enabled) => updateContact({ enabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.emailEnabled}
            disabled={!draft.contactBinding.enabled}
            label={messages.contactBinding.allowEmailBinding}
            onCheckedChange={(emailEnabled) => updateContact({ emailEnabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.phoneEnabled}
            disabled={!draft.contactBinding.enabled}
            label={messages.contactBinding.allowPhoneBinding}
            onCheckedChange={(phoneEnabled) => updateContact({ phoneEnabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.emailChangeEnabled}
            disabled={!draft.contactBinding.enabled || !draft.contactBinding.emailEnabled}
            label={messages.contactBinding.allowEmailChange}
            onCheckedChange={(emailChangeEnabled) => updateContact({ emailChangeEnabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.phoneChangeEnabled}
            disabled={!draft.contactBinding.enabled || !draft.contactBinding.phoneEnabled}
            label={messages.contactBinding.allowPhoneChange}
            onCheckedChange={(phoneChangeEnabled) => updateContact({ phoneChangeEnabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.emailUnbindEnabled}
            disabled={!draft.contactBinding.enabled || !draft.contactBinding.emailEnabled}
            label={messages.contactBinding.allowEmailUnbind}
            onCheckedChange={(emailUnbindEnabled) => updateContact({ emailUnbindEnabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.phoneUnbindEnabled}
            disabled={!draft.contactBinding.enabled || !draft.contactBinding.phoneEnabled}
            label={messages.contactBinding.allowPhoneUnbind}
            onCheckedChange={(phoneUnbindEnabled) => updateContact({ phoneUnbindEnabled })}
          />
          <PolicyToggle
            checked={draft.contactBinding.requireVerification}
            disabled={!draft.contactBinding.enabled}
            label={messages.contactBinding.requireVerification}
            onCheckedChange={(requireVerification) => updateContact({ requireVerification })}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        description={messages.oauthLogin.description}
        title={messages.oauthLogin.title}
      >
        <div className="space-y-4">
          <PolicyToggle
            checked={draft.oauthLogin.enabled}
            label={messages.oauthLogin.enableOauthLogin}
            onCheckedChange={(enabled) => updateOauthLogin({ enabled })}
          />
          <PolicyToggle
            checked={draft.oauthLogin.autoRegistrationEnabled}
            disabled={!draft.oauthLogin.enabled}
            label={messages.oauthLogin.allowAutoRegistration}
            onCheckedChange={(autoRegistrationEnabled) => updateOauthLogin({ autoRegistrationEnabled })}
          />
          <div className="space-y-2">
            <Label htmlFor="oauth-login-providers">{messages.oauthLogin.allowedProvidersLabel}</Label>
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
              placeholder={messages.oauthLogin.allowedProvidersPlaceholder}
              value={draft.oauthLogin.allowedProviders.join(", ")}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        description={messages.oauthBinding.description}
        title={messages.oauthBinding.title}
      >
        <div className="space-y-4">
          <PolicyToggle
            checked={draft.oauthBinding.enabled}
            label={messages.oauthBinding.enableOauthBinding}
            onCheckedChange={(enabled) => updateOauth({ enabled })}
          />
          <PolicyToggle
            checked={draft.oauthBinding.selfServiceLinkEnabled}
            disabled={!draft.oauthBinding.enabled}
            label={messages.oauthBinding.allowSelfServiceLink}
            onCheckedChange={(selfServiceLinkEnabled) => updateOauth({ selfServiceLinkEnabled })}
          />
          <PolicyToggle
            checked={draft.oauthBinding.selfServiceUnlinkEnabled}
            disabled={!draft.oauthBinding.enabled}
            label={messages.oauthBinding.allowSelfServiceUnlink}
            onCheckedChange={(selfServiceUnlinkEnabled) => updateOauth({ selfServiceUnlinkEnabled })}
          />
          <div className="space-y-2">
            <Label htmlFor="allowed-providers">{messages.oauthBinding.allowedProvidersLabel}</Label>
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
              placeholder={messages.oauthBinding.allowedProvidersPlaceholder}
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
          }).catch((saveError) => {
            setStatus(controller.getState().status);
            setError(toErrorMessage(saveError, messages.common.saveError));
          });
        }}
        type="button"
      >
        {messages.common.savePolicy}
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

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
