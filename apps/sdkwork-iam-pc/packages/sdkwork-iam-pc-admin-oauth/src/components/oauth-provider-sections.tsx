import { useState } from "react";
import {
  Button,
  Label,
  SettingsSection,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthRelyingPartyDraft,
} from "../types/oauth-admin-types";
import { canSubmitRelyingParty, templateMessage } from "../utils/oauth-admin-utils";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import {
  AccountLinkResourceList,
  GrantResourceList,
} from "./OauthAdminResourceList";
import {
  OauthAdminField,
  OauthAdminMultilineField,
  OauthAdminSelectField,
} from "./oauth-admin-ui";
import type { SdkworkIamOauthAdminSectionProps } from "../types/oauth-admin-types";

const EMPTY_RELYING_PARTY_DRAFT = (): SdkworkIamOauthRelyingPartyDraft => ({
  allowedScopesText: "openid\nprofile\nemail",
  clientIdHint: "",
  clientSecretHash: "",
  confidential: true,
  enabled: true,
  hasExistingSecret: false,
  redirectUrisText: "",
  tenantApplicationId: "",
  tenantId: "",
});

export function OauthRelyingPartySection({
  controller,
  disabled,
  status,
}: Pick<SdkworkIamOauthAdminSectionProps, "controller" | "disabled" | "status">) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthRelyingPartyDraft>(EMPTY_RELYING_PARTY_DRAFT);
  return (
    <SettingsSection description={messages.relyingParty.description} title={messages.relyingParty.title}>
      <StatusNotice tone="default">
        {messages.relyingParty.notice}
      </StatusNotice>
      <div className="mt-4 space-y-3">
        <OauthAdminField
          label={messages.relyingParty.fields.tenantId}
          onChange={(tenantId) => setDraft((current) => ({ ...current, tenantId }))}
          placeholder={messages.relyingParty.fields.tenantIdPlaceholder}
          value={draft.tenantId}
        />
        <OauthAdminField
          label={messages.relyingParty.fields.tenantApplicationId}
          onChange={(tenantApplicationId) => setDraft((current) => ({ ...current, tenantApplicationId }))}
          placeholder={messages.relyingParty.fields.tenantApplicationIdPlaceholder}
          value={draft.tenantApplicationId}
        />
        {draft.clientIdHint ? (
          <StatusNotice tone="default">
            {templateMessage(messages.relyingParty.clientIdNoticeTemplate, { value: draft.clientIdHint })}
          </StatusNotice>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={disabled || !draft.tenantId.trim() || !draft.tenantApplicationId.trim()}
            loading={status === "saving"}
            onClick={() => {
              void controller.loadRelyingPartyConfig(draft.tenantId, draft.tenantApplicationId)
                .then(setDraft)
                .catch(() => undefined);
            }}
            type="button"
            variant="secondary"
          >
            {messages.relyingParty.loadButton}
          </Button>
        </div>
        <OauthAdminSelectField
          label={messages.relyingParty.enabledLabel}
          onChange={(enabled) => setDraft((current) => ({ ...current, enabled: enabled === "true" }))}
          options={[
            { label: messages.common.booleanTrue, value: "true" },
            { label: messages.common.booleanFalse, value: "false" },
          ]}
          value={draft.enabled ? "true" : "false"}
        />
        <OauthAdminMultilineField
          label={messages.relyingParty.fields.redirectUris}
          onChange={(redirectUrisText) => setDraft((current) => ({ ...current, redirectUrisText }))}
          placeholder={messages.relyingParty.fields.redirectUrisPlaceholder}
          value={draft.redirectUrisText}
        />
        <OauthAdminMultilineField
          label={messages.relyingParty.fields.allowedScopes}
          onChange={(allowedScopesText) => setDraft((current) => ({ ...current, allowedScopesText }))}
          placeholder={messages.relyingParty.fields.allowedScopesPlaceholder}
          value={draft.allowedScopesText}
        />
        <OauthAdminSelectField
          label={messages.relyingParty.confidentialLabel}
          onChange={(confidential) => setDraft((current) => ({ ...current, confidential: confidential === "true" }))}
          options={[
            { label: messages.common.booleanTrue, value: "true" },
            { label: messages.common.booleanFalse, value: "false" },
          ]}
          value={draft.confidential ? "true" : "false"}
        />
        {draft.confidential ? (
          <>
            <OauthAdminField
              label={messages.relyingParty.fields.clientSecretHash}
              onChange={(clientSecretHash) => setDraft((current) => ({ ...current, clientSecretHash }))}
              placeholder={draft.hasExistingSecret ? messages.relyingParty.preserveHashPlaceholder : undefined}
              type="password"
              value={draft.clientSecretHash}
            />
            {draft.hasExistingSecret ? (
              <StatusNotice tone="default">
                {messages.relyingParty.preserveHashNotice}
              </StatusNotice>
            ) : null}
          </>
        ) : null}
        <Button
          disabled={disabled || !canSubmitRelyingParty(draft)}
          loading={status === "saving"}
          onClick={() => {
            void controller.updateRelyingParty(draft).then(() => {
              setDraft((current) => ({
                ...current,
                clientSecretHash: "",
                hasExistingSecret: current.hasExistingSecret || Boolean(current.clientSecretHash.trim()),
              }));
            }).catch(() => undefined);
          }}
          type="button"
        >
          {messages.relyingParty.saveButton}
        </Button>
      </div>
    </SettingsSection>
  );
}

export function OauthAccountLinkSection({
  accountLinks,
  controller,
  disabled,
  listPageInfo,
  onChanged,
}: SdkworkIamOauthAdminSectionProps & { accountLinks: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <SettingsSection description={messages.accountLinks.description} title={messages.accountLinks.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.accountLinks.listLabelTemplate, { count: String(accountLinks.length) })}
        </Label>
        <AccountLinkResourceList
          accountLinks={accountLinks}
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.accountLinks.emptyLabel}
          onChanged={onChanged}
        />
      </div>
      <StatusNotice tone="default">
        {messages.accountLinks.notice}
      </StatusNotice>
    </SettingsSection>
  );
}

export function OauthGrantSection({
  controller,
  disabled,
  grants,
  listPageInfo,
  onRevoked,
}: Omit<SdkworkIamOauthAdminSectionProps, "onChanged" | "status"> & { grants: unknown[]; onRevoked: () => void }) {
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <SettingsSection description={messages.grants.description} title={messages.grants.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.grants.listLabelTemplate, { count: String(grants.length) })}
        </Label>
        <GrantResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.grants.emptyLabel}
          grants={grants}
          onRevoked={onRevoked}
        />
      </div>
    </SettingsSection>
  );
}
