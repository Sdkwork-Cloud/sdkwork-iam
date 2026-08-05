import { useState } from "react";
import {
  Button,
  Label,
  SettingsSection,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthOperationalResourceDraft,
  SdkworkIamOauthOperatorPlatformDraft,
  SdkworkIamOauthPolicyDraft,
  SdkworkIamOauthResourceAccountDraft,
  SdkworkIamOauthResourceAuthorizationDraft,
  SdkworkIamOauthTenantBindingDraft,
} from "../types/oauth-admin-types";
import {
  canSubmitOperationalResource,
  canSubmitOperatorPlatform,
  canSubmitPolicy,
  canSubmitResourceAccount,
  canSubmitResourceAuthorization,
  canSubmitTenantBinding,
  templateMessage,
} from "../utils/oauth-admin-utils";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import {
  OperationalResourceList,
  OperatorPlatformResourceList,
  PolicyResourceList,
  ResourceAccountResourceList,
  ResourceAuthorizationResourceList,
  TenantBindingResourceList,
} from "./OauthAdminResourceList";
import { OauthAdminField, OauthResourceDrawer } from "./oauth-admin-ui";
import type { SdkworkIamOauthAdminSectionProps } from "../types/oauth-admin-types";

const EMPTY_POLICY_DRAFT = (): SdkworkIamOauthPolicyDraft => ({
  displayName: "",
  integrationId: "",
  policyCode: "",
});

const EMPTY_TENANT_BINDING_DRAFT = (): SdkworkIamOauthTenantBindingDraft => ({
  bindingKind: "tenant_map",
  integrationId: "",
  providerCode: "",
});

const EMPTY_OPERATOR_PLATFORM_DRAFT = (): SdkworkIamOauthOperatorPlatformDraft => ({
  displayName: "",
  integrationId: "",
  operatorMode: "third_party",
  platformCode: "",
  providerCode: "",
  providerPlatformId: "",
});

const EMPTY_RESOURCE_ACCOUNT_DRAFT = (): SdkworkIamOauthResourceAccountDraft => ({
  accessMode: "operator_managed",
  displayName: "",
  integrationId: "",
  providerAccountId: "",
  providerCode: "",
  resourceAccountCode: "",
  resourceAccountKind: "official_account",
});

const EMPTY_RESOURCE_AUTHORIZATION_DRAFT = (): SdkworkIamOauthResourceAuthorizationDraft => ({
  authorizationMode: "third_party_platform",
  integrationId: "",
  providerCode: "",
  resourceAccountId: "",
});

const EMPTY_OPERATIONAL_RESOURCE_DRAFT = (): SdkworkIamOauthOperationalResourceDraft => ({
  displayName: "",
  integrationId: "",
  providerCode: "",
  resourceAccountId: "",
  resourceCode: "",
  resourceKind: "mini_program_page",
});

export function OauthPolicySection({
  controller,
  disabled,
  listPageInfo,
  onChanged,
  policies,
  status,
}: SdkworkIamOauthAdminSectionProps & { policies: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthPolicyDraft>(EMPTY_POLICY_DRAFT);
  return (
    <SettingsSection description={messages.policies.description} title={messages.policies.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.policies.listLabelTemplate, { count: String(policies.length) })}
        </Label>
        <PolicyResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.policies.emptyLabel}
          onChanged={onChanged}
          policies={policies}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitPolicy(draft)}
        confirmLabel={messages.policies.addButton}
        confirmLoading={status === "saving"}
        description={messages.policies.addDescription}
        onConfirm={() => {
          void controller.createPolicy(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_POLICY_DRAFT());
        }}
        triggerLabel={messages.policies.addTrigger}
      >
        <OauthAdminField
          label={messages.policies.fields.policyCode}
          onChange={(policyCode) => setDraft((current) => ({ ...current, policyCode }))}
          placeholder={messages.policies.fields.policyCodePlaceholder}
          value={draft.policyCode}
        />
        <OauthAdminField
          label={messages.policies.fields.displayName}
          onChange={(displayName) => setDraft((current) => ({ ...current, displayName }))}
          placeholder={messages.policies.fields.displayNamePlaceholder}
          value={draft.displayName}
        />
        <OauthAdminField
          label={messages.policies.fields.integrationId}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          placeholder={messages.policies.fields.integrationIdPlaceholder}
          value={draft.integrationId}
        />
      </OauthResourceDrawer>
    </SettingsSection>
  );
}

export function OauthTenantBindingSection({
  controller,
  disabled,
  listPageInfo,
  onChanged,
  status,
  tenantBindings,
}: SdkworkIamOauthAdminSectionProps & { tenantBindings: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthTenantBindingDraft>(EMPTY_TENANT_BINDING_DRAFT);
  return (
    <SettingsSection description={messages.tenantBindings.description} title={messages.tenantBindings.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.tenantBindings.listLabelTemplate, { count: String(tenantBindings.length) })}
        </Label>
        <TenantBindingResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.tenantBindings.emptyLabel}
          onChanged={onChanged}
          tenantBindings={tenantBindings}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitTenantBinding(draft)}
        confirmLabel={messages.tenantBindings.addButton}
        confirmLoading={status === "saving"}
        description={messages.tenantBindings.addDescription}
        onConfirm={() => {
          void controller.createTenantBinding(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_TENANT_BINDING_DRAFT());
        }}
        triggerLabel={messages.tenantBindings.addTrigger}
      >
        <OauthAdminField
          label={messages.tenantBindings.providerCodeLabel}
          onChange={(providerCode) => setDraft((current) => ({ ...current, providerCode }))}
          value={draft.providerCode}
        />
        <OauthAdminField
          label={messages.tenantBindings.integrationIdLabel}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          value={draft.integrationId}
        />
        <OauthAdminField
          label={messages.tenantBindings.bindingKindLabel}
          onChange={(bindingKind) => setDraft((current) => ({ ...current, bindingKind }))}
          value={draft.bindingKind}
        />
      </OauthResourceDrawer>
    </SettingsSection>
  );
}

export function OauthOperatorPlatformSection({
  controller,
  disabled,
  listPageInfo,
  onChanged,
  operatorPlatforms,
  status,
}: SdkworkIamOauthAdminSectionProps & { operatorPlatforms: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthOperatorPlatformDraft>(EMPTY_OPERATOR_PLATFORM_DRAFT);
  return (
    <SettingsSection description={messages.operatorPlatforms.description} title={messages.operatorPlatforms.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.operatorPlatforms.listLabelTemplate, { count: String(operatorPlatforms.length) })}
        </Label>
        <OperatorPlatformResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.operatorPlatforms.emptyLabel}
          onChanged={onChanged}
          operatorPlatforms={operatorPlatforms}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitOperatorPlatform(draft)}
        confirmLabel={messages.operatorPlatforms.addButton}
        confirmLoading={status === "saving"}
        description={messages.operatorPlatforms.addDescription}
        onConfirm={() => {
          void controller.createOperatorPlatform(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_OPERATOR_PLATFORM_DRAFT());
        }}
        triggerLabel={messages.operatorPlatforms.addTrigger}
      >
        <OauthAdminField
          label={messages.operatorPlatforms.fields.integrationId}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          value={draft.integrationId}
        />
        <OauthAdminField
          label={messages.operatorPlatforms.fields.providerCode}
          onChange={(providerCode) => setDraft((current) => ({ ...current, providerCode }))}
          value={draft.providerCode}
        />
        <OauthAdminField
          label={messages.operatorPlatforms.fields.platformCode}
          onChange={(platformCode) => setDraft((current) => ({ ...current, platformCode }))}
          value={draft.platformCode}
        />
        <OauthAdminField
          label={messages.operatorPlatforms.fields.providerPlatformId}
          onChange={(providerPlatformId) => setDraft((current) => ({ ...current, providerPlatformId }))}
          value={draft.providerPlatformId}
        />
        <OauthAdminField
          label={messages.operatorPlatforms.fields.operatorMode}
          onChange={(operatorMode) => setDraft((current) => ({ ...current, operatorMode }))}
          value={draft.operatorMode}
        />
        <OauthAdminField
          label={messages.operatorPlatforms.fields.displayName}
          onChange={(displayName) => setDraft((current) => ({ ...current, displayName }))}
          value={draft.displayName}
        />
      </OauthResourceDrawer>
    </SettingsSection>
  );
}

export function OauthResourceAccountSection({
  controller,
  disabled,
  listPageInfo,
  onChanged,
  resourceAccounts,
  status,
}: SdkworkIamOauthAdminSectionProps & { resourceAccounts: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthResourceAccountDraft>(EMPTY_RESOURCE_ACCOUNT_DRAFT);
  return (
    <SettingsSection description={messages.resourceAccounts.description} title={messages.resourceAccounts.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.resourceAccounts.listLabelTemplate, { count: String(resourceAccounts.length) })}
        </Label>
        <ResourceAccountResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.resourceAccounts.emptyLabel}
          onChanged={onChanged}
          resourceAccounts={resourceAccounts}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitResourceAccount(draft)}
        confirmLabel={messages.resourceAccounts.addButton}
        confirmLoading={status === "saving"}
        description={messages.resourceAccounts.addDescription}
        onConfirm={() => {
          void controller.createResourceAccount(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_RESOURCE_ACCOUNT_DRAFT());
        }}
        triggerLabel={messages.resourceAccounts.addTrigger}
      >
        <OauthAdminField
          label={messages.resourceAccounts.fields.integrationId}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          value={draft.integrationId}
        />
        <OauthAdminField
          label={messages.resourceAccounts.fields.providerCode}
          onChange={(providerCode) => setDraft((current) => ({ ...current, providerCode }))}
          value={draft.providerCode}
        />
        <OauthAdminField
          label={messages.resourceAccounts.fields.resourceAccountCode}
          onChange={(resourceAccountCode) => setDraft((current) => ({ ...current, resourceAccountCode }))}
          value={draft.resourceAccountCode}
        />
        <OauthAdminField
          label={messages.resourceAccounts.fields.resourceAccountKind}
          onChange={(resourceAccountKind) => setDraft((current) => ({ ...current, resourceAccountKind }))}
          value={draft.resourceAccountKind}
        />
        <OauthAdminField
          label={messages.resourceAccounts.fields.displayName}
          onChange={(displayName) => setDraft((current) => ({ ...current, displayName }))}
          value={draft.displayName}
        />
        <OauthAdminField
          label={messages.resourceAccounts.fields.providerAccountId}
          onChange={(providerAccountId) => setDraft((current) => ({ ...current, providerAccountId }))}
          value={draft.providerAccountId}
        />
        <OauthAdminField
          label={messages.resourceAccounts.fields.accessMode}
          onChange={(accessMode) => setDraft((current) => ({ ...current, accessMode }))}
          value={draft.accessMode}
        />
      </OauthResourceDrawer>
    </SettingsSection>
  );
}

export function OauthResourceAuthorizationSection({
  controller,
  disabled,
  listPageInfo,
  onChanged,
  resourceAuthorizations,
  status,
}: SdkworkIamOauthAdminSectionProps & { resourceAuthorizations: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthResourceAuthorizationDraft>(EMPTY_RESOURCE_AUTHORIZATION_DRAFT);
  return (
    <SettingsSection description={messages.resourceAuthorizations.description} title={messages.resourceAuthorizations.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.resourceAuthorizations.listLabelTemplate, { count: String(resourceAuthorizations.length) })}
        </Label>
        <ResourceAuthorizationResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.resourceAuthorizations.emptyLabel}
          onChanged={onChanged}
          resourceAuthorizations={resourceAuthorizations}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitResourceAuthorization(draft)}
        confirmLabel={messages.resourceAuthorizations.addButton}
        confirmLoading={status === "saving"}
        description={messages.resourceAuthorizations.addDescription}
        onConfirm={() => {
          void controller.createResourceAuthorization(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_RESOURCE_AUTHORIZATION_DRAFT());
        }}
        triggerLabel={messages.resourceAuthorizations.addTrigger}
      >
        <OauthAdminField
          label={messages.resourceAuthorizations.fields.integrationId}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          value={draft.integrationId}
        />
        <OauthAdminField
          label={messages.resourceAuthorizations.fields.resourceAccountId}
          onChange={(resourceAccountId) => setDraft((current) => ({ ...current, resourceAccountId }))}
          value={draft.resourceAccountId}
        />
        <OauthAdminField
          label={messages.resourceAuthorizations.fields.providerCode}
          onChange={(providerCode) => setDraft((current) => ({ ...current, providerCode }))}
          value={draft.providerCode}
        />
        <OauthAdminField
          label={messages.resourceAuthorizations.fields.authorizationMode}
          onChange={(authorizationMode) => setDraft((current) => ({ ...current, authorizationMode }))}
          value={draft.authorizationMode}
        />
      </OauthResourceDrawer>
    </SettingsSection>
  );
}

export function OauthOperationalResourceSection({
  controller,
  disabled,
  listPageInfo,
  onChanged,
  operationalResources,
  status,
}: SdkworkIamOauthAdminSectionProps & { operationalResources: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthOperationalResourceDraft>(EMPTY_OPERATIONAL_RESOURCE_DRAFT);
  return (
    <SettingsSection description={messages.operationalResources.description} title={messages.operationalResources.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.operationalResources.listLabelTemplate, { count: String(operationalResources.length) })}
        </Label>
        <OperationalResourceList
          controller={controller}
          listPageInfo={listPageInfo}
          disabled={disabled}
          emptyLabel={messages.operationalResources.emptyLabel}
          onChanged={onChanged}
          operationalResources={operationalResources}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitOperationalResource(draft)}
        confirmLabel={messages.operationalResources.addButton}
        confirmLoading={status === "saving"}
        description={messages.operationalResources.addDescription}
        onConfirm={() => {
          void controller.createOperationalResource(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_OPERATIONAL_RESOURCE_DRAFT());
        }}
        triggerLabel={messages.operationalResources.addTrigger}
      >
        <OauthAdminField
          label={messages.operationalResources.fields.integrationId}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          value={draft.integrationId}
        />
        <OauthAdminField
          label={messages.operationalResources.fields.resourceAccountId}
          onChange={(resourceAccountId) => setDraft((current) => ({ ...current, resourceAccountId }))}
          value={draft.resourceAccountId}
        />
        <OauthAdminField
          label={messages.operationalResources.fields.providerCode}
          onChange={(providerCode) => setDraft((current) => ({ ...current, providerCode }))}
          value={draft.providerCode}
        />
        <OauthAdminField
          label={messages.operationalResources.fields.resourceKind}
          onChange={(resourceKind) => setDraft((current) => ({ ...current, resourceKind }))}
          value={draft.resourceKind}
        />
        <OauthAdminField
          label={messages.operationalResources.fields.resourceCode}
          onChange={(resourceCode) => setDraft((current) => ({ ...current, resourceCode }))}
          value={draft.resourceCode}
        />
        <OauthAdminField
          label={messages.operationalResources.fields.displayName}
          onChange={(displayName) => setDraft((current) => ({ ...current, displayName }))}
          value={draft.displayName}
        />
      </OauthResourceDrawer>
    </SettingsSection>
  );
}
