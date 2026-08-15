import { useState } from "react";
import {
  Button,
  Checkbox,
  Label,
  SettingsSection,
  StatusNotice,
} from "@sdkwork/ui-pc-react";
import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";

import type {
  SdkworkIamOauthAdminSectionProps,
  SdkworkIamOauthClientDraft,
  SdkworkIamOauthIntegrationDraft,
  SdkworkIamOauthProviderCatalogDraft,
  SdkworkIamOauthSecretDraft,
} from "../types/oauth-admin-types";
import {
  canSubmitClient,
  canSubmitProviderCatalog,
  canSubmitProviderConnection,
  canSubmitSecret,
  extractProviderCodes,
  findProviderCatalogId,
  buildStandardCallbackUri,
  providerDisplayName,
  templateMessage,
} from "../utils/oauth-admin-utils";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import {
  ClientResourceList,
  IntegrationResourceList,
  ProviderCatalogResourceList,
  SecretResourceList,
} from "./OauthAdminResourceList";
import {
  OauthAdminField,
  OauthAdminSelectField,
  OauthResourceDrawer,
} from "./oauth-admin-ui";

const EMPTY_INTEGRATION_DRAFT = (): SdkworkIamOauthIntegrationDraft => ({
  appId: "",
  displayName: "",
  enabled: true,
  integrationCode: "",
  providerCatalogId: "",
  providerClientId: "",
  providerClientSecret: "",
  providerCode: "",
  providerTenantId: "",
  redirectUri: "",
  surfaceKind: "web",
});

const EMPTY_PROVIDER_CATALOG_DRAFT = (): SdkworkIamOauthProviderCatalogDraft => ({
  providerCode: "",
  providerDisplayName: "",
  providerName: "",
});

const EMPTY_CLIENT_DRAFT = (): SdkworkIamOauthClientDraft => ({
  clientCode: "",
  displayName: "",
  integrationId: "",
  providerClientId: "",
  providerCode: "",
  providerTenantId: "",
});

const EMPTY_SECRET_DRAFT = (): SdkworkIamOauthSecretDraft => ({
  secretKind: "client_secret",
  secretOwnerId: "",
  secretOwnerKind: "oauth_client",
  secretValue: "",
});

export function OauthIntegrationSection({
  controller,
  disabled,
  integrations,
  listPageInfo,
  onChanged,
  status,
}: SdkworkIamOauthAdminSectionProps & {
  integrations: unknown[];
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthIntegrationDraft>(EMPTY_INTEGRATION_DRAFT);
  const [webDomainState, setWebDomainState] = useState("");
  const catalogProviderCodes = extractProviderCodes(
    (controller.getState().providerCatalog as unknown[]) ?? [],
  );
  const providerClientIdLabel = (providerCode: string): string => {
    if (providerCode === "wechat" || providerCode === "qq") {
      return messages.integrations.appIdLabel;
    }
    if (providerCode === "douyin" || providerCode === "tiktok") {
      return messages.integrations.clientKeyLabel;
    }
    return messages.integrations.clientIdLabel;
  };
  return (
    <SettingsSection description={messages.integrations.description} title={messages.integrations.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.integrations.listLabelTemplate, { count: String(integrations.length) })}
        </Label>
        <IntegrationResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.integrations.emptyLabel}
          integrations={integrations}
          onChanged={onChanged}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitProviderConnection(draft)}
        confirmLabel={messages.integrations.saveButton}
        confirmLoading={status === "saving"}
        description={messages.integrations.addDescription}
        onCancel={() => setWebDomainState("")}
        onConfirm={() => {
          void controller.createIntegration(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_INTEGRATION_DRAFT());
          setWebDomainState("");
        }}
        triggerLabel={messages.integrations.addTrigger}
      >
        <OauthAdminSelectField
          label={messages.integrations.providerCodeLabel}
          onChange={(providerCode) => {
            setDraft((current) => ({
              ...current,
              displayName: providerCode
                ? templateMessage(messages.integrations.autoDisplayNameTemplate, {
                  providerName: providerDisplayName(providerCode),
                })
                : "",
              integrationCode: providerCode
                ? templateMessage(messages.integrations.autoIntegrationCodeTemplate, { providerCode })
                : "",
              providerCatalogId: findProviderCatalogId(
                (controller.getState().providerCatalog as unknown[]) ?? [],
                providerCode,
              ),
              providerCode,
            }));
          }}
          options={[
            { label: messages.integrations.providerSelectPlaceholder, value: "" },
            ...catalogProviderCodes.map((providerCode) => ({
              label: `${providerDisplayName(providerCode)} (${providerCode})`,
              value: providerCode,
            })),
          ]}
          value={draft.providerCode}
        />
        <OauthAdminField
          label={messages.integrations.integrationCodeLabel}
          onChange={(integrationCode) => setDraft((current) => ({ ...current, integrationCode }))}
          placeholder={messages.integrations.integrationCodePlaceholder}
          value={draft.integrationCode}
        />
        <OauthAdminField
          label={messages.integrations.displayNameLabel}
          onChange={(displayName) => setDraft((current) => ({ ...current, displayName }))}
          placeholder={messages.integrations.displayNamePlaceholder}
          value={draft.displayName}
        />
        <OauthAdminField
          label={messages.integrations.appIdLabel}
          onChange={(appId) => setDraft((current) => ({ ...current, appId }))}
          placeholder={messages.integrations.appIdPlaceholder}
          value={draft.appId ?? ""}
        />
        <OauthAdminField
          label={providerClientIdLabel(draft.providerCode)}
          onChange={(providerClientId) => setDraft((current) => ({ ...current, providerClientId }))}
          value={draft.providerClientId ?? ""}
        />
        <OauthAdminField
          label={messages.integrations.clientSecretLabel}
          onChange={(providerClientSecret) => setDraft((current) => ({ ...current, providerClientSecret }))}
          type="password"
          value={draft.providerClientSecret ?? ""}
        />
        <OauthAdminField
          label={messages.integrations.providerTenantIdLabel}
          onChange={(providerTenantId) => setDraft((current) => ({ ...current, providerTenantId }))}
          value={draft.providerTenantId ?? ""}
        />
        <OauthAdminField
          label={messages.integrations.webDomainLabel}
          onChange={(webDomain) => {
            const previousAuto = webDomainState
              ? buildStandardCallbackUri(webDomainState)
              : "";
            setWebDomainState(webDomain);
            const autoUri = buildStandardCallbackUri(webDomain);
            if (autoUri && (!draft.redirectUri?.trim() || draft.redirectUri === previousAuto)) {
              setDraft((current) => ({ ...current, redirectUri: autoUri }));
            }
          }}
          placeholder={messages.integrations.webDomainPlaceholder}
          value={webDomainState}
        />
        <OauthAdminField
          label={messages.integrations.redirectUriLabel}
          onChange={(redirectUri) => setDraft((current) => ({ ...current, redirectUri }))}
          placeholder={messages.integrations.redirectUriPlaceholder}
          type="url"
          value={draft.redirectUri ?? ""}
        />
        <OauthAdminSelectField
          label={messages.integrations.surfaceLabel}
          onChange={(surfaceKind) => setDraft((current) => ({ ...current, surfaceKind }))}
          options={[
            { label: messages.integrations.surfaceOptions.web, value: "web" },
            { label: messages.integrations.surfaceOptions.h5, value: "h5" },
            { label: messages.integrations.surfaceOptions.desktop, value: "desktop" },
            { label: messages.integrations.surfaceOptions.ios, value: "ios" },
            { label: messages.integrations.surfaceOptions.android, value: "android" },
          ]}
          value={draft.surfaceKind ?? "web"}
        />
        <label className="flex items-center gap-2 text-sm" htmlFor="oauth-provider-enabled">
          <Checkbox
            checked={draft.enabled ?? true}
            id="oauth-provider-enabled"
            onCheckedChange={(checked) => setDraft((current) => ({ ...current, enabled: checked === true }))}
          />
          {messages.integrations.enabledLabel}
        </label>
        <StatusNotice tone="default">
          {messages.integrations.secretNotice}
        </StatusNotice>
      </OauthResourceDrawer>
    </SettingsSection>
  );
}

export function OauthProviderCatalogSection({
  controller,
  disabled,
  listPageInfo,
  onChanged,
  providerCatalog,
  status,
}: SdkworkIamOauthAdminSectionProps & { providerCatalog: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthProviderCatalogDraft>(EMPTY_PROVIDER_CATALOG_DRAFT);
  return (
    <SettingsSection description={messages.providerCatalog.description} title={messages.providerCatalog.title}>
      <div className="space-y-3">
        <OauthAdminField
          label={messages.providerCatalog.providerCodeLabel}
          onChange={(providerCode) => setDraft((current) => ({ ...current, providerCode }))}
          placeholder={messages.providerCatalog.providerCodePlaceholder}
          value={draft.providerCode}
        />
        <OauthAdminField
          label={messages.providerCatalog.providerNameLabel}
          onChange={(providerName) => setDraft((current) => ({ ...current, providerName }))}
          placeholder={messages.providerCatalog.providerNamePlaceholder}
          value={draft.providerName}
        />
        <OauthAdminField
          label={messages.providerCatalog.displayNameLabel}
          onChange={(providerDisplayName) => setDraft((current) => ({ ...current, providerDisplayName }))}
          placeholder={messages.providerCatalog.displayNamePlaceholder}
          value={draft.providerDisplayName}
        />
        <Button
          disabled={disabled || !canSubmitProviderCatalog(draft)}
          loading={status === "saving"}
          onClick={() => {
            void controller.createProviderCatalog(draft).then(onChanged).catch(onChanged);
            setDraft(EMPTY_PROVIDER_CATALOG_DRAFT());
          }}
          type="button"
        >
          {messages.providerCatalog.addButton}
        </Button>
        <Label>
          {templateMessage(messages.providerCatalog.listLabelTemplate, { count: String(providerCatalog.length) })}
        </Label>
        <ProviderCatalogResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.providerCatalog.emptyLabel}
          onChanged={onChanged}
          providerCatalog={providerCatalog}
        />
      </div>
    </SettingsSection>
  );
}

export function OauthClientSection({
  clients,
  controller,
  disabled,
  listPageInfo,
  onChanged,
  status,
}: SdkworkIamOauthAdminSectionProps & { clients: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthClientDraft>(EMPTY_CLIENT_DRAFT);
  return (
    <SettingsSection description={messages.clients.description} title={messages.clients.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.clients.listLabelTemplate, { count: String(clients.length) })}
        </Label>
        <ClientResourceList
          clients={clients}
          controller={controller}
          disabled={disabled}
          emptyLabel={messages.clients.emptyLabel}
          onChanged={onChanged}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitClient(draft)}
        confirmLabel={messages.clients.addButton}
        confirmLoading={status === "saving"}
        description={messages.clients.addDescription}
        onConfirm={() => {
          void controller.createClient(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_CLIENT_DRAFT());
        }}
        triggerLabel={messages.clients.addTrigger}
      >
        <OauthAdminField
          label={messages.clients.fields.integrationId}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          placeholder={messages.clients.fields.integrationIdPlaceholder}
          value={draft.integrationId}
        />
        <OauthAdminField
          label={messages.clients.fields.providerCode}
          onChange={(providerCode) => setDraft((current) => ({ ...current, providerCode }))}
          placeholder={messages.clients.fields.providerCodePlaceholder}
          value={draft.providerCode}
        />
        <OauthAdminField
          label={messages.clients.fields.clientCode}
          onChange={(clientCode) => setDraft((current) => ({ ...current, clientCode }))}
          placeholder={messages.clients.fields.clientCodePlaceholder}
          value={draft.clientCode}
        />
        <OauthAdminField
          label={messages.clients.fields.providerClientId}
          onChange={(providerClientId) => setDraft((current) => ({ ...current, providerClientId }))}
          placeholder={messages.clients.fields.providerClientIdPlaceholder}
          value={draft.providerClientId}
        />
        <OauthAdminField
          label={messages.clients.fields.displayName}
          onChange={(displayName) => setDraft((current) => ({ ...current, displayName }))}
          placeholder={messages.clients.fields.displayNamePlaceholder}
          value={draft.displayName}
        />
        <OauthAdminField
          label={messages.clients.fields.providerTenantId}
          onChange={(providerTenantId) => setDraft((current) => ({ ...current, providerTenantId }))}
          placeholder={messages.clients.fields.providerTenantIdPlaceholder}
          value={draft.providerTenantId}
        />
      </OauthResourceDrawer>
    </SettingsSection>
  );
}

export function OauthSecretSection({
  controller,
  disabled,
  listPageInfo,
  onChanged,
  secrets,
  status,
}: SdkworkIamOauthAdminSectionProps & { secrets: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthSecretDraft>(EMPTY_SECRET_DRAFT);
  return (
    <SettingsSection description={messages.secrets.description} title={messages.secrets.title}>
      <StatusNotice tone="default">
        {messages.secrets.notice}
      </StatusNotice>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.secrets.listLabelTemplate, { count: String(secrets.length) })}
        </Label>
        <SecretResourceList
          controller={controller}
          disabled={disabled}
          emptyLabel={messages.secrets.emptyLabel}
          onChanged={onChanged}
          secrets={secrets}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitSecret(draft)}
        confirmLabel={messages.secrets.registerButton}
        confirmLoading={status === "saving"}
        description={messages.secrets.addDescription}
        onConfirm={() => {
          void controller.createSecret(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_SECRET_DRAFT());
        }}
        triggerLabel={messages.secrets.addTrigger}
      >
        <OauthAdminField
          label={messages.secrets.fields.secretOwnerKind}
          onChange={(secretOwnerKind) => setDraft((current) => ({ ...current, secretOwnerKind }))}
          placeholder={messages.secrets.fields.secretOwnerKindPlaceholder}
          value={draft.secretOwnerKind}
        />
        <OauthAdminField
          label={messages.secrets.fields.secretOwnerId}
          onChange={(secretOwnerId) => setDraft((current) => ({ ...current, secretOwnerId }))}
          placeholder={messages.secrets.fields.secretOwnerIdPlaceholder}
          value={draft.secretOwnerId}
        />
        <OauthAdminField
          label={messages.secrets.fields.secretKind}
          onChange={(secretKind) => setDraft((current) => ({ ...current, secretKind }))}
          placeholder={messages.secrets.fields.secretKindPlaceholder}
          value={draft.secretKind}
        />
        <OauthAdminField
          label={messages.secrets.fields.secretValue}
          onChange={(secretValue) => setDraft((current) => ({ ...current, secretValue }))}
          type="password"
          value={draft.secretValue}
        />
      </OauthResourceDrawer>
    </SettingsSection>
  );
}
