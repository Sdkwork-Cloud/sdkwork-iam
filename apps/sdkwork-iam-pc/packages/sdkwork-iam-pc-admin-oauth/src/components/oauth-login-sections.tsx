import { useMemo, useState } from "react";
import {
  Button,
  Label,
  SettingsSection,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthAdminController,
  SdkworkIamOauthAdminState,
  SdkworkIamOauthClaimMappingDraft,
  SdkworkIamOauthFlowConfigDraft,
  SdkworkIamOauthScopeProfileDraft,
  SdkworkIamOauthSurfaceDraft,
  SdkworkIamOauthWebhookConfigDraft,
} from "../types/oauth-admin-types";
import {
  canSubmitClaimMapping,
  canSubmitFlowConfig,
  canSubmitScopeProfile,
  canSubmitSurface,
  canSubmitWebhookConfig,
  readDisplayName,
  readIntegrationId,
  readProviderCode,
  readResourceAccountId,
  readResourceAccountKind,
  readWebhookConfigId,
  templateMessage,
} from "../utils/oauth-admin-utils";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import {
  ClaimMappingResourceList,
  FlowConfigResourceList,
  ScopeProfileResourceList,
  SurfaceResourceList,
  WebhookConfigResourceList,
} from "./OauthAdminResourceList";
import { OauthAdminField, OauthAdminSelectField, OauthResourceDrawer } from "./oauth-admin-ui";
import type { SdkworkIamOauthAdminSectionProps } from "../types/oauth-admin-types";

const EMPTY_SCOPE_PROFILE_DRAFT = (): SdkworkIamOauthScopeProfileDraft => ({
  displayName: "",
  integrationId: "",
  providerCode: "",
  purpose: "login",
  scopeProfileCode: "",
});

const EMPTY_CLAIM_MAPPING_DRAFT = (): SdkworkIamOauthClaimMappingDraft => ({
  externalClaim: "",
  integrationId: "",
  providerCode: "",
  targetField: "",
  targetKind: "profile",
});

const EMPTY_WEBHOOK_DRAFT = (): SdkworkIamOauthWebhookConfigDraft => ({
  callbackUrl: "",
  displayName: "",
  integrationId: "",
  providerCode: "",
  webhookCode: "",
  webhookKind: "provider_callback",
});

const EMPTY_FLOW_DRAFT = (): SdkworkIamOauthFlowConfigDraft => ({
  flowKind: "authorization_code",
  flowPurpose: "login",
  integrationId: "",
  oauthClientId: "",
});

const EMPTY_SURFACE_DRAFT = (): SdkworkIamOauthSurfaceDraft => ({
  displayName: "",
  integrationId: "",
  oauthClientId: "",
  redirectUri: "",
  surfaceCode: "",
  surfaceKind: "web",
});

export function OauthScopeProfileSection({
  controller,
  disabled,
  listPageInfo,
  onChanged,
  scopeProfiles,
  status,
}: SdkworkIamOauthAdminSectionProps & { scopeProfiles: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthScopeProfileDraft>(EMPTY_SCOPE_PROFILE_DRAFT);
  return (
    <SettingsSection description={messages.scopeProfiles.description} title={messages.scopeProfiles.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.scopeProfiles.listLabelTemplate, { count: String(scopeProfiles.length) })}
        </Label>
        <ScopeProfileResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.scopeProfiles.emptyLabel}
          onChanged={onChanged}
          scopeProfiles={scopeProfiles}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitScopeProfile(draft)}
        confirmLabel={messages.scopeProfiles.addButton}
        confirmLoading={status === "saving"}
        description={messages.scopeProfiles.addDescription}
        onConfirm={() => {
          void controller.createScopeProfile(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_SCOPE_PROFILE_DRAFT());
        }}
        triggerLabel={messages.scopeProfiles.addTrigger}
      >
        <OauthAdminField
          label={messages.scopeProfiles.fields.integrationId}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          placeholder={messages.scopeProfiles.fields.integrationIdPlaceholder}
          value={draft.integrationId}
        />
        <OauthAdminField
          label={messages.scopeProfiles.fields.providerCode}
          onChange={(providerCode) => setDraft((current) => ({ ...current, providerCode }))}
          placeholder={messages.scopeProfiles.fields.providerCodePlaceholder}
          value={draft.providerCode}
        />
        <OauthAdminField
          label={messages.scopeProfiles.fields.scopeProfileCode}
          onChange={(scopeProfileCode) => setDraft((current) => ({ ...current, scopeProfileCode }))}
          placeholder={messages.scopeProfiles.fields.scopeProfileCodePlaceholder}
          value={draft.scopeProfileCode}
        />
        <OauthAdminField
          label={messages.scopeProfiles.fields.purpose}
          onChange={(purpose) => setDraft((current) => ({ ...current, purpose }))}
          placeholder={messages.scopeProfiles.fields.purposePlaceholder}
          value={draft.purpose}
        />
        <OauthAdminField
          label={messages.scopeProfiles.fields.displayName}
          onChange={(displayName) => setDraft((current) => ({ ...current, displayName }))}
          placeholder={messages.scopeProfiles.fields.displayNamePlaceholder}
          value={draft.displayName}
        />
      </OauthResourceDrawer>
    </SettingsSection>
  );
}

export function OauthClaimMappingSection({
  claimMappings,
  controller,
  disabled,
  listPageInfo,
  onChanged,
  status,
}: SdkworkIamOauthAdminSectionProps & { claimMappings: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthClaimMappingDraft>(EMPTY_CLAIM_MAPPING_DRAFT);
  return (
    <SettingsSection description={messages.claimMappings.description} title={messages.claimMappings.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.claimMappings.listLabelTemplate, { count: String(claimMappings.length) })}
        </Label>
        <ClaimMappingResourceList
          claimMappings={claimMappings}
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.claimMappings.emptyLabel}
          onChanged={onChanged}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitClaimMapping(draft)}
        confirmLabel={messages.claimMappings.addButton}
        confirmLoading={status === "saving"}
        description={messages.claimMappings.addDescription}
        onConfirm={() => {
          void controller.createClaimMapping(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_CLAIM_MAPPING_DRAFT());
        }}
        triggerLabel={messages.claimMappings.addTrigger}
      >
        <OauthAdminField
          label={messages.claimMappings.fields.integrationId}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          placeholder={messages.claimMappings.fields.integrationIdPlaceholder}
          value={draft.integrationId}
        />
        <OauthAdminField
          label={messages.claimMappings.fields.providerCode}
          onChange={(providerCode) => setDraft((current) => ({ ...current, providerCode }))}
          placeholder={messages.claimMappings.fields.providerCodePlaceholder}
          value={draft.providerCode}
        />
        <OauthAdminField
          label={messages.claimMappings.fields.externalClaim}
          onChange={(externalClaim) => setDraft((current) => ({ ...current, externalClaim }))}
          placeholder={messages.claimMappings.fields.externalClaimPlaceholder}
          value={draft.externalClaim}
        />
        <OauthAdminField
          label={messages.claimMappings.fields.targetKind}
          onChange={(targetKind) => setDraft((current) => ({ ...current, targetKind }))}
          placeholder={messages.claimMappings.fields.targetKindPlaceholder}
          value={draft.targetKind}
        />
        <OauthAdminField
          label={messages.claimMappings.fields.targetField}
          onChange={(targetField) => setDraft((current) => ({ ...current, targetField }))}
          placeholder={messages.claimMappings.fields.targetFieldPlaceholder}
          value={draft.targetField}
        />
      </OauthResourceDrawer>
    </SettingsSection>
  );
}

export function OauthWebhookConfigSection({
  controller,
  disabled,
  listPageInfo,
  onChanged,
  resourceAccounts = [],
  status,
  webhookConfigs,
}: SdkworkIamOauthAdminSectionProps & {
  resourceAccounts?: unknown[];
  webhookConfigs: unknown[];
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthWebhookConfigDraft>(EMPTY_WEBHOOK_DRAFT);
  const [editingWebhook, setEditingWebhook] = useState<unknown>();
  const [editDraft, setEditDraft] = useState<SdkworkIamOauthWebhookConfigDraft>(EMPTY_WEBHOOK_DRAFT);
  // Official accounts the operator can bind a message-push webhook to.
  const officialAccounts = useMemo(
    () => resourceAccounts.filter((item) => readResourceAccountKind(item) === "official_account"),
    [resourceAccounts],
  );

  const openEdit = (webhookConfigId: string) => {
    const row = webhookConfigs.find((item) => readWebhookConfigId(item) === webhookConfigId);
    if (!row) {
      return;
    }
    const record = row as Record<string, unknown>;
    setEditingWebhook(row);
    setEditDraft({
      callbackUrl: String(record.callbackUrl ?? record.callback_url ?? ""),
      displayName: readDisplayName(row),
      integrationId: readIntegrationId(row),
      providerCode: readProviderCode(row),
      resourceAccountId: String(record.resourceAccountId ?? record.resource_account_id ?? ""),
      webhookCode: String(record.webhookCode ?? record.webhook_code ?? ""),
      webhookKind: String(record.webhookKind ?? record.webhook_kind ?? "provider_callback"),
    });
  };

  const saveEdit = () => {
    if (!editingWebhook) {
      return;
    }
    void controller.updateWebhookConfigSetup(readWebhookConfigId(editingWebhook), editDraft)
      .then(onChanged)
      .catch(onChanged)
      .then(() => {
        if (controller.getState().status !== "error") {
          setEditingWebhook(undefined);
        }
      });
  };

  const accountOptions = [
    { label: messages.webhookConfigs.accountUnbound, value: "" },
    ...officialAccounts.map((account) => ({
      label: readDisplayName(account) || readResourceAccountId(account),
      value: readResourceAccountId(account),
    })),
  ];
  const accountSelect = (value: string, onChange: (value: string) => void) => (
    <OauthAdminSelectField
      label={messages.webhookConfigs.accountLabel}
      onChange={onChange}
      options={accountOptions}
      value={value}
    />
  );

  return (
    <SettingsSection description={messages.webhookConfigs.description} title={messages.webhookConfigs.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.webhookConfigs.listLabelTemplate, { count: String(webhookConfigs.length) })}
        </Label>
        <WebhookConfigResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.webhookConfigs.emptyLabel}
          onChanged={onChanged}
          onDelete={(id) => controller.deleteWebhookConfig(id)}
          onEdit={openEdit}
          webhookConfigs={webhookConfigs}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitWebhookConfig(draft)}
        confirmLabel={messages.webhookConfigs.addButton}
        confirmLoading={status === "saving"}
        description={messages.webhookConfigs.addDescription}
        onConfirm={() => {
          void controller.createWebhookConfig(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_WEBHOOK_DRAFT());
        }}
        triggerLabel={messages.webhookConfigs.addTrigger}
      >
        <OauthAdminField
          label={messages.webhookConfigs.fields.integrationId}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          placeholder={messages.webhookConfigs.fields.integrationIdPlaceholder}
          value={draft.integrationId}
        />
        <OauthAdminField
          label={messages.webhookConfigs.fields.providerCode}
          onChange={(providerCode) => setDraft((current) => ({ ...current, providerCode }))}
          placeholder={messages.webhookConfigs.fields.providerCodePlaceholder}
          value={draft.providerCode}
        />
        <OauthAdminField
          label={messages.webhookConfigs.fields.webhookCode}
          onChange={(webhookCode) => setDraft((current) => ({ ...current, webhookCode }))}
          placeholder={messages.webhookConfigs.fields.webhookCodePlaceholder}
          value={draft.webhookCode}
        />
        <OauthAdminField
          label={messages.webhookConfigs.fields.webhookKind}
          onChange={(webhookKind) => setDraft((current) => ({ ...current, webhookKind }))}
          placeholder={messages.webhookConfigs.fields.webhookKindPlaceholder}
          value={draft.webhookKind}
        />
        <OauthAdminField
          label={messages.webhookConfigs.fields.callbackUrl}
          onChange={(callbackUrl) => setDraft((current) => ({ ...current, callbackUrl }))}
          placeholder={messages.webhookConfigs.fields.callbackUrlPlaceholder}
          value={draft.callbackUrl}
        />
        <OauthAdminField
          label={messages.webhookConfigs.fields.displayName}
          onChange={(displayName) => setDraft((current) => ({ ...current, displayName }))}
          placeholder={messages.webhookConfigs.fields.displayNamePlaceholder}
          value={draft.displayName}
        />
        {accountSelect(draft.resourceAccountId ?? "", (resourceAccountId) =>
          setDraft((current) => ({ ...current, resourceAccountId })))}
      </OauthResourceDrawer>

      <OauthResourceDrawer
        confirmDisabled={disabled || !editDraft.callbackUrl.trim()}
        confirmLabel={messages.webhookConfigs.saveButton}
        confirmLoading={status === "saving"}
        description={messages.webhookConfigs.editDescription}
        onConfirm={saveEdit}
        onOpenChange={(open) => { if (!open) setEditingWebhook(undefined); }}
        open={Boolean(editingWebhook)}
        triggerLabel={messages.webhookConfigs.editTitle}
      >
        <OauthAdminField
          label={messages.webhookConfigs.fields.callbackUrl}
          onChange={(callbackUrl) => setEditDraft((current) => ({ ...current, callbackUrl }))}
          placeholder={messages.webhookConfigs.fields.callbackUrlPlaceholder}
          value={editDraft.callbackUrl}
        />
        <OauthAdminField
          label={messages.webhookConfigs.fields.displayName}
          onChange={(displayName) => setEditDraft((current) => ({ ...current, displayName }))}
          placeholder={messages.webhookConfigs.fields.displayNamePlaceholder}
          value={editDraft.displayName}
        />
        {accountSelect(editDraft.resourceAccountId ?? "", (resourceAccountId) =>
          setEditDraft((current) => ({ ...current, resourceAccountId })))}
      </OauthResourceDrawer>
    </SettingsSection>
  );
}

export function OauthFlowConfigSection({
  controller,
  disabled,
  flowConfigs,
  listPageInfo,
  onChanged,
  status,
}: SdkworkIamOauthAdminSectionProps & { flowConfigs: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthFlowConfigDraft>(EMPTY_FLOW_DRAFT);
  return (
    <SettingsSection description={messages.flowConfigs.description} title={messages.flowConfigs.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.flowConfigs.listLabelTemplate, { count: String(flowConfigs.length) })}
        </Label>
        <FlowConfigResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.flowConfigs.emptyLabel}
          flowConfigs={flowConfigs}
          onChanged={onChanged}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitFlowConfig(draft)}
        confirmLabel={messages.flowConfigs.addButton}
        confirmLoading={status === "saving"}
        description={messages.flowConfigs.addDescription}
        onConfirm={() => {
          void controller.createFlowConfig(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_FLOW_DRAFT());
        }}
        triggerLabel={messages.flowConfigs.addTrigger}
      >
        <OauthAdminField
          label={messages.flowConfigs.fields.integrationId}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          placeholder={messages.flowConfigs.fields.integrationIdPlaceholder}
          value={draft.integrationId}
        />
        <OauthAdminField
          label={messages.flowConfigs.fields.oauthClientId}
          onChange={(oauthClientId) => setDraft((current) => ({ ...current, oauthClientId }))}
          placeholder={messages.flowConfigs.fields.oauthClientIdPlaceholder}
          value={draft.oauthClientId}
        />
        <OauthAdminField
          label={messages.flowConfigs.fields.flowKind}
          onChange={(flowKind) => setDraft((current) => ({ ...current, flowKind }))}
          placeholder={messages.flowConfigs.fields.flowKindPlaceholder}
          value={draft.flowKind}
        />
        <OauthAdminField
          label={messages.flowConfigs.fields.flowPurpose}
          onChange={(flowPurpose) => setDraft((current) => ({ ...current, flowPurpose }))}
          placeholder={messages.flowConfigs.fields.flowPurposePlaceholder}
          value={draft.flowPurpose}
        />
      </OauthResourceDrawer>
    </SettingsSection>
  );
}

export function OauthSurfaceSection({
  controller,
  disabled,
  listPageInfo,
  onChanged,
  status,
  surfaces,
}: SdkworkIamOauthAdminSectionProps & { surfaces: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthSurfaceDraft>(EMPTY_SURFACE_DRAFT);
  return (
    <SettingsSection description={messages.surfaces.description} title={messages.surfaces.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.surfaces.listLabelTemplate, { count: String(surfaces.length) })}
        </Label>
        <SurfaceResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.surfaces.emptyLabel}
          onChanged={onChanged}
          surfaces={surfaces}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitSurface(draft)}
        confirmLabel={messages.surfaces.addButton}
        confirmLoading={status === "saving"}
        description={messages.surfaces.addDescription}
        onConfirm={() => {
          void controller.createSurface(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_SURFACE_DRAFT());
        }}
        triggerLabel={messages.surfaces.addTrigger}
      >
        <OauthAdminField
          label={messages.surfaces.fields.integrationId}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          placeholder={messages.surfaces.fields.integrationIdPlaceholder}
          value={draft.integrationId}
        />
        <OauthAdminField
          label={messages.surfaces.fields.oauthClientId}
          onChange={(oauthClientId) => setDraft((current) => ({ ...current, oauthClientId }))}
          placeholder={messages.surfaces.fields.oauthClientIdPlaceholder}
          value={draft.oauthClientId}
        />
        <OauthAdminField
          label={messages.surfaces.fields.surfaceCode}
          onChange={(surfaceCode) => setDraft((current) => ({ ...current, surfaceCode }))}
          placeholder={messages.surfaces.fields.surfaceCodePlaceholder}
          value={draft.surfaceCode}
        />
        <OauthAdminField
          label={messages.surfaces.fields.surfaceKind}
          onChange={(surfaceKind) => setDraft((current) => ({ ...current, surfaceKind }))}
          placeholder={messages.surfaces.fields.surfaceKindPlaceholder}
          value={draft.surfaceKind}
        />
        <OauthAdminField
          label={messages.surfaces.fields.displayName}
          onChange={(displayName) => setDraft((current) => ({ ...current, displayName }))}
          placeholder={messages.surfaces.fields.displayNamePlaceholder}
          value={draft.displayName}
        />
        <OauthAdminField
          label={messages.surfaces.fields.redirectUri}
          onChange={(redirectUri) => setDraft((current) => ({ ...current, redirectUri }))}
          type="url"
          value={draft.redirectUri}
        />
      </OauthResourceDrawer>
    </SettingsSection>
  );
}
