import { useMemo, useState } from "react";
import {
  AtSign,
  GitBranch,
  Globe,
  MessageCircle,
  Music2,
  Plus,
  ShieldCheck,
  ThumbsUp,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  IconButton,
  Label,
  StatusBadge,
  StatusNotice,
  Switch,
} from "@sdkwork/ui-pc-react";
import { useSdkworkI18n } from "@sdkwork/i18n-pc-react";

import type {
  SdkworkIamOauthAdminController,
  SdkworkIamOauthIntegrationDraft,
} from "../types/oauth-admin-types";
import { useOauthAdminPageState } from "../hooks/use-oauth-admin-page-state";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import {
  OauthAdminField,
  OauthAdminSelectField,
  OauthResourceDrawer,
} from "../components/oauth-admin-ui";

import {
  buildProviderPlatforms,
  findProviderCatalogId,
  providerDisplayName,
  templateMessage,
  type SdkworkIamOauthProviderConnectionRow,
  type SdkworkIamOauthProviderPlatform,
} from "../utils/oauth-admin-utils";

function resolveProviderIcon(providerCode: string): LucideIcon {
  if (providerCode === "google" || providerCode === "apple" || providerCode === "microsoft") {
    return Globe;
  }
  if (providerCode === "github") {
    return GitBranch;
  }
  if (providerCode === "wechat" || providerCode === "wechat_mini_program" || providerCode === "wechat_open" || providerCode === "qq" || providerCode === "line") {
    return MessageCircle;
  }
  if (providerCode === "douyin" || providerCode === "tiktok") {
    return Music2;
  }
  if (providerCode === "weibo" || providerCode === "twitter" || providerCode === "x") {
    return AtSign;
  }
  if (providerCode === "facebook") {
    return ThumbsUp;
  }
  return ShieldCheck;
}

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

/**
 * Third-party platform login.
 *
 * Only platforms the operator has added are shown, one row per platform.
 * Adding a platform opens a drawer that lists every catalog platform not yet
 * added (the catalog keeps growing, so the picker grows with it); the operator
 * enters the provider credentials and the row appears in the list. Each row
 * carries an enable/disable switch: enabling an `iam_oauth_integration` makes
 * `oauth.providers.list` return the provider and the login page renders the
 * OAuth entry immediately.
 */
export function SdkworkIamOauthProviderConnectionsPage({
  controller,
}: {
  controller: SdkworkIamOauthAdminController;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const i18nContext = useSdkworkI18n();
  const locale = i18nContext?.locale ?? "zh-CN";
  const { data, disabled, error, status, sync } = useOauthAdminPageState(controller, [
    "integrations",
    "providerCatalog",
  ]);
  const [draft, setDraft] = useState<SdkworkIamOauthIntegrationDraft>(EMPTY_INTEGRATION_DRAFT);
  const [selectedProvider, setSelectedProvider] = useState<string>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SdkworkIamOauthProviderConnectionRow>();
  const platforms = useMemo(
    () => buildProviderPlatforms(data.providerCatalog, data.integrations, locale),
    [data.integrations, data.providerCatalog, locale],
  );
  const quick = messages.quickSetup.providerConnections;

  const configuredPlatforms = useMemo(
    () => platforms.filter((platform) => platform.integrations.length > 0),
    [platforms],
  );
  const availablePlatforms = useMemo(
    () => platforms.filter((platform) => platform.integrations.length === 0),
    [platforms],
  );

  const activeIntegrationOf = (platform: SdkworkIamOauthProviderPlatform) =>
    platform.integrations.find((row) => row.enabled === true) ?? platform.integrations[0];

  const selectPlatform = (providerCode: string) => {
    if (!providerCode) {
      setSelectedProvider(undefined);
      setDraft(EMPTY_INTEGRATION_DRAFT());
      return;
    }
    setDraft({
      ...EMPTY_INTEGRATION_DRAFT(),
      displayName: templateMessage(messages.integrations.autoDisplayNameTemplate, {
        providerName: providerDisplayName(providerCode),
      }),
      integrationCode: templateMessage(messages.integrations.autoIntegrationCodeTemplate, { providerCode }),
      providerCatalogId: findProviderCatalogId(data.providerCatalog, providerCode),
      providerCode,
    });
    setSelectedProvider(providerCode);
  };

  const toggleEnabled = (integrationId: string, enabled: boolean) => {
    void controller.updateIntegration(integrationId, enabled).then(sync).catch(sync);
  };

  const columns = useMemo<DataTableColumn<SdkworkIamOauthProviderPlatform>[]>(() => [
    {
      id: "platform",
      header: quick.platformLabel,
      cell: (platform) => {
        const Icon = resolveProviderIcon(platform.providerCode);
        return (
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--sdk-color-surface-panel-muted)] text-[var(--sdk-color-text-secondary)]">
              <Icon aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[var(--sdk-color-text-primary)]">
                {platform.displayName}
              </span>
              <code className="block truncate text-xs text-[var(--sdk-color-text-muted)]">
                {platform.providerCode}
              </code>
            </span>
          </span>
        );
      },
    },
    {
      id: "status",
      header: messages.common.status,
      cell: (platform) => {
        const activeIntegration = activeIntegrationOf(platform);
        const isEnabled = Boolean(activeIntegration?.enabled);
        return (
          <StatusBadge
            label={isEnabled ? quick.enabled : quick.disabled}
            showIcon
            status={isEnabled ? "enabled" : "disabled"}
          />
        );
      },
    },
  ], [messages, quick]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}

      <DataTable
        className="min-h-0 flex-1"
        columns={columns}
        emptyDescription={quick.emptyDescription}
        emptyTitle={quick.emptyTitle}
        getRowId={(platform) => platform.providerCode}
        loading={disabled}
        rowActions={(platform) => {
          const activeIntegration = activeIntegrationOf(platform);
          const isEnabled = Boolean(activeIntegration?.enabled);
          if (!activeIntegration?.integrationId) {
            return null;
          }
          return (
            <span className="flex items-center gap-2">
              <Switch
                aria-label={isEnabled ? quick.disable : quick.enable}
                checked={isEnabled}
                disabled={disabled}
                onCheckedChange={(checked) => toggleEnabled(activeIntegration.integrationId, checked)}
                title={isEnabled ? quick.disable : quick.enable}
              />
              <IconButton
                aria-label={messages.common.delete}
                disabled={disabled}
                onClick={() => setDeleteTarget(activeIntegration)}
                title={messages.common.delete}
                variant="ghost"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4 text-[var(--sdk-color-state-danger)]" />
              </IconButton>
            </span>
          );
        }}
        rowActionsLabel={quick.actions}
        rows={configuredPlatforms}
        slotProps={{
          surface: { className: "flex min-h-0 flex-col" },
          viewport: { className: "min-h-0 flex-1" },
        }}
        stickyHeader
        title={templateMessage(quick.configuredListTitle, { count: String(configuredPlatforms.length) })}
        toolbar={(
          <Button
            disabled={disabled}
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            {quick.addPlatform}
          </Button>
        )}
      />

      <OauthResourceDrawer
        confirmDisabled={disabled || !selectedProvider || !draft.providerClientId?.trim() || !draft.providerClientSecret?.trim() || !draft.redirectUri?.trim()}
        confirmLabel={quick.saveAndEnable}
        confirmLoading={status === "saving"}
        description={quick.addDescription}
        onConfirm={() => {
          if (!selectedProvider) {
            return;
          }
          void controller.createIntegration(draft).then(sync).catch(sync);
          setDrawerOpen(false);
          setSelectedProvider(undefined);
        }}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        triggerLabel={quick.addPlatform}
      >
        {availablePlatforms.length === 0 ? (
          <StatusNotice tone="default">{quick.allPlatformsAdded}</StatusNotice>
        ) : (
          <OauthAdminSelectField
            label={quick.platformLabel}
            onChange={selectPlatform}
            options={[
              { label: quick.platformPlaceholder, value: "" },
              ...availablePlatforms.map((platform) => ({
                label: `${platform.displayName} (${platform.providerCode})`,
                value: platform.providerCode,
              })),
            ]}
            value={selectedProvider ?? ""}
          />
        )}
        {selectedProvider ? (
          <>
            <div className="space-y-1.5">
              <Label>{messages.integrations.providerCodeLabel}</Label>
              <div className="rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-muted)] px-3 py-2 text-sm">
                {draft.providerCode}
              </div>
            </div>
            <OauthAdminField
              label={messages.integrations.clientIdLabel}
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
              label={messages.integrations.redirectUriLabel}
              onChange={(redirectUri) => setDraft((current) => ({ ...current, redirectUri }))}
              placeholder={messages.integrations.redirectUriPlaceholder}
              type="url"
              value={draft.redirectUri ?? ""}
            />
            <OauthAdminField
              label={messages.integrations.appIdLabel}
              onChange={(appId) => setDraft((current) => ({ ...current, appId }))}
              placeholder={messages.integrations.appIdPlaceholder}
              value={draft.appId ?? ""}
            />
            <OauthAdminField
              label={messages.integrations.providerTenantIdLabel}
              onChange={(providerTenantId) => setDraft((current) => ({ ...current, providerTenantId }))}
              value={draft.providerTenantId ?? ""}
            />
          </>
        ) : null}
      </OauthResourceDrawer>

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={messages.common.delete}
        confirmLoading={status === "saving"}
        description={quick.deleteConfirm}
        onConfirm={() => {
          if (!deleteTarget?.integrationId) {
            return;
          }
          void controller.deleteIntegration(deleteTarget.integrationId)
            .then(sync)
            .catch(sync)
            .finally(() => setDeleteTarget(undefined));
        }}
        onOpenChange={(open) => { if (!open && status !== "saving") setDeleteTarget(undefined); }}
        open={Boolean(deleteTarget)}
        title={messages.common.delete}
        tone="danger"
      />
    </div>
  );
}
