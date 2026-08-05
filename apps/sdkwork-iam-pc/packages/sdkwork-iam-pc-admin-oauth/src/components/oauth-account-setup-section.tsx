import { useEffect, useMemo, useState } from "react";
import { Clipboard, Download, Pencil, Plus } from "lucide-react";
import {
  Button,
  DataTable,
  type DataTableColumn,
  IconButton,
  Label,
  StatusBadge,
  StatusNotice,
  Switch,
  TagInput,
} from "@sdkwork/ui-pc-react";
import { CatalogPagination } from "@sdkwork/iam-pc-admin-core";
import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";

import type {
  SdkworkIamOauthAccountConfig,
  SdkworkIamOauthAccountKind,
  SdkworkIamOauthAccountSetupDraft,
  SdkworkIamOauthAdminController,
} from "../types/oauth-admin-types";
import type { SdkworkIamOauthAdminMessages } from "../types/oauth-admin-messages";
import {
  buildStandardCallbackUri,
  readAccountConfig,
  readAccountIntegrationId,
  readDisplayName,
  readDomainVerifyStatus,
  readEnabled,
  readProviderClientId,
  readResourceAccountId,
  templateMessage,
} from "../utils/oauth-admin-utils";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import {
  OauthAdminField,
  OauthAdminMultilineField,
  OauthAdminSelectField,
  OauthResourceDrawer,
} from "./oauth-admin-ui";

type AccountCopy = SdkworkIamOauthAdminMessages["quickSetup"]["miniProgramAccounts"];
type AccountConfigCopy = SdkworkIamOauthAdminMessages["quickSetup"]["accountConfig"];
type AccountSwitchCopy = SdkworkIamOauthAdminMessages["quickSetup"]["accountSwitch"];
type CommonCopy = SdkworkIamOauthAdminMessages["common"];

type AccountRow = {
  accountId: string;
  appId: string;
  config?: SdkworkIamOauthAccountConfig;
  enabled?: boolean;
  integrationId: string;
  label: string;
  verifyStatus?: string;
};

const EMPTY_DRAFT = (): SdkworkIamOauthAccountSetupDraft => ({
  appId: "",
  appSecret: "",
  displayName: "",
  enabled: true,
  redirectUri: "",
});

const EMPTY_CONFIG = (): SdkworkIamOauthAccountConfig => ({});

const DOMAIN_KEYS = ["request", "socket", "uploadFile", "downloadFile", "business"] as const;
type DomainKey = typeof DOMAIN_KEYS[number];

/**
 * Shared mini program / official account list surface.
 *
 * Renders a fill-height account list with the add action in the header row:
 * the operator registers accounts through the drawer and every added account
 * shows up as a row with an enable/disable switch. Each row opens the full
 * developer configuration drawer (custom domains, WeChat domain verification
 * file, message notification push settings) mirroring the WeChat console.
 */
export function OauthAccountSetupSection({
  accounts,
  common,
  controller,
  disabled,
  kind,
  listPageInfo,
  messages,
  onChanged,
  onPageChange,
  onPageSizeChange,
  status,
  switchMessages,
}: {
  accounts: unknown[];
  common: CommonCopy;
  controller: SdkworkIamOauthAdminController;
  disabled: boolean;
  kind: SdkworkIamOauthAccountKind;
  listPageInfo?: SdkWorkPageInfo;
  messages: AccountCopy;
  onChanged: () => void;
  onPageChange?: (page: number, pageSize: number) => void | Promise<void>;
  onPageSizeChange?: (pageSize: number) => void | Promise<void>;
  status: string;
  switchMessages: AccountSwitchCopy;
}) {
  const [draft, setDraft] = useState<SdkworkIamOauthAccountSetupDraft>(EMPTY_DRAFT);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AccountRow>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const paginationMessages = useSdkworkIamOauthAdminMessages();
  const rows = useMemo<AccountRow[]>(() => accounts.map((item) => ({
    accountId: readResourceAccountId(item),
    appId: readProviderClientId(item),
    config: readAccountConfig(item),
    enabled: readEnabled(item),
    integrationId: readAccountIntegrationId(item),
    label: readDisplayName(item),
    verifyStatus: readDomainVerifyStatus(item),
  })), [accounts]);
  const columns = useMemo<DataTableColumn<AccountRow>[]>(() => [
    {
      id: "account",
      header: messages.fields.displayName,
      cell: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-[var(--sdk-color-text-primary)]">{row.label}</span>
          {row.appId ? (
            <code className="mt-0.5 text-xs text-[var(--sdk-color-text-muted)]">{row.appId}</code>
          ) : null}
        </span>
      ),
    },
    {
      id: "status",
      header: common.status,
      cell: (row) => {
        const enabled = row.enabled ?? false;
        return (
          <StatusBadge
            label={enabled ? switchMessages.enabled : switchMessages.notEnabled}
            showIcon
            status={enabled ? "enabled" : "disabled"}
          />
        );
      },
    },
  ], [common.status, messages.fields.displayName, switchMessages.enabled, switchMessages.notEnabled]);

  const canSubmit = Boolean(
    draft.displayName.trim() && draft.appId.trim() && draft.appSecret.trim()
    && (draft.redirectUri.trim() || Boolean(draft.config?.webDomain?.trim())),
  );

  const toggleEnabled = (row: AccountRow, enabled: boolean) => {
    if (!row.accountId) {
      return;
    }
    void controller.setResourceAccountEnabled(row.accountId, row.integrationId, enabled)
      .then(onChanged)
      .catch(onChanged);
  };

  // Derive the standardized callback URL from the primary domain. The
  // previous auto-derived value is replaced; a manually edited URL is kept.
  const updateWebDomain = (current: SdkworkIamOauthAccountConfig, webDomain: string) => {
    const previousAuto = current.webDomain
      ? buildStandardCallbackUri(current.webDomain)
      : "";
    const next = { ...current, webDomain };
    const autoUri = buildStandardCallbackUri(webDomain);
    if (autoUri && (!next.redirectUri || next.redirectUri === previousAuto)) {
      next.redirectUri = autoUri;
    }
    return next;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-[var(--sdk-color-text-primary)]">
            {messages.title}
          </h2>
          <p className="mt-0.5 truncate text-sm text-[var(--sdk-color-text-muted)]">
            {messages.description}
          </p>
        </div>
        <Button disabled={disabled} onClick={() => setDrawerOpen(true)} type="button">
          <Plus aria-hidden="true" className="h-4 w-4" />
          {messages.addButton}
        </Button>
      </div>

      <DataTable
        className="min-h-0 flex-1"
        columns={columns}
        emptyDescription={messages.emptyLabel}
        emptyTitle={messages.title}
        footer={(
          <CatalogPagination
            busy={disabled}
            copy={{
              next: paginationMessages.pagination.next,
              pageSize: paginationMessages.pagination.pageSize,
              previous: paginationMessages.pagination.previous,
              total: paginationMessages.pagination.total,
            }}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              void onPageChange?.(nextPage, pageSize);
            }}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
              void onPageSizeChange?.(nextPageSize);
            }}
            pageInfo={listPageInfo}
          />
        )}
        getRowId={(row) => row.accountId || row.label}
        loading={disabled}
        rowActions={(row) => {
          const enabled = row.enabled ?? false;
          return (
            <span className="flex items-center gap-2">
              <Switch
                aria-label={enabled ? common.disable : common.enable}
                checked={enabled}
                disabled={disabled || !row.accountId || row.enabled === undefined}
                onCheckedChange={(checked) => toggleEnabled(row, checked)}
                title={enabled ? common.disable : common.enable}
              />
              <IconButton
                aria-label={messages.actions}
                disabled={disabled || !row.accountId}
                onClick={() => setEditingRow(row)}
                title={messages.actions}
                variant="ghost"
              >
                <Pencil aria-hidden="true" className="h-4 w-4" />
              </IconButton>
            </span>
          );
        }}
        rowActionsLabel={messages.actions}
        rows={rows}
        slotProps={{
          surface: { className: "flex min-h-0 flex-1 flex-col" },
          viewport: { className: "min-h-0 flex-1" },
          footer: { className: "shrink-0" },
        }}
        stickyHeader
        title={templateMessage(messages.listLabelTemplate, { count: String(accounts.length) })}
      />

      <AccountConfigDrawer
        configCopy={paginationMessages.quickSetup.accountConfig}
        controller={controller}
        disabled={disabled}
        messages={messages}
        onChanged={onChanged}
        row={editingRow}
        status={status}
        onClose={() => setEditingRow(undefined)}
      />

      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmit}
        confirmLabel={messages.addButton}
        confirmLoading={status === "saving"}
        description={messages.addDescription}
        onCancel={() => setDraft(EMPTY_DRAFT())}
        onConfirm={() => {
          void controller.createAccountSetup(kind, draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_DRAFT());
        }}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        triggerLabel={messages.addButton}
      >
        <OauthAdminField
          label={messages.fields.displayName}
          onChange={(displayName) => setDraft((current) => ({ ...current, displayName }))}
          placeholder={messages.fields.displayNamePlaceholder}
          value={draft.displayName}
        />
        <OauthAdminField
          label={messages.fields.appId}
          onChange={(appId) => setDraft((current) => ({ ...current, appId }))}
          placeholder={messages.fields.appIdPlaceholder}
          value={draft.appId}
        />
        <OauthAdminField
          label={messages.fields.appSecret}
          onChange={(appSecret) => setDraft((current) => ({ ...current, appSecret }))}
          placeholder={messages.fields.appSecretPlaceholder}
          type="password"
          value={draft.appSecret}
        />
        <OauthAdminField
          label={paginationMessages.quickSetup.accountConfig.basic.webDomain}
          onChange={(webDomain) => setDraft((current) => ({
            ...current,
            config: updateWebDomain(current.config ?? EMPTY_CONFIG(), webDomain),
          }))}
          placeholder={paginationMessages.quickSetup.accountConfig.basic.webDomainPlaceholder}
          value={draft.config?.webDomain ?? ""}
        />
        <OauthAdminField
          label={messages.fields.redirectUri}
          onChange={(redirectUri) => setDraft((current) => ({ ...current, redirectUri }))}
          placeholder={messages.fields.redirectUriPlaceholder}
          type="url"
          value={draft.redirectUri}
        />
        <label className="flex items-center gap-2 text-sm" htmlFor={`oauth-account-enabled-${kind}`}>
          <input
            checked={draft.enabled}
            id={`oauth-account-enabled-${kind}`}
            onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))}
            type="checkbox"
          />
          {switchMessages.enable}
        </label>
        <StatusNotice tone="default">
          {switchMessages.enableHint}
        </StatusNotice>
      </OauthResourceDrawer>
    </div>
  );
}

function AccountConfigDrawer({
  configCopy,
  controller,
  disabled,
  messages,
  onChanged,
  onClose,
  row,
  status,
}: {
  configCopy: AccountConfigCopy;
  controller: SdkworkIamOauthAdminController;
  disabled: boolean;
  messages: AccountCopy;
  onChanged: () => void;
  onClose: () => void;
  row?: AccountRow;
  status: string;
}) {
  const [config, setConfig] = useState<SdkworkIamOauthAccountConfig>(EMPTY_CONFIG);
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();

  const open = Boolean(row);

  useEffect(() => {
    if (!row) {
      return;
    }
    setConfig(row.config ? { ...row.config } : EMPTY_CONFIG());
    setNotice(undefined);
    setError(undefined);
  }, [row?.accountId]);

  const setDomains = (key: DomainKey, values: string[]) => {
    setConfig((current) => ({
      ...current,
      domains: { ...current.domains, [key]: values },
    }));
  };

  const setNotify = (patch: Partial<NonNullable<SdkworkIamOauthAccountConfig["notify"]>>) => {
    setConfig((current) => ({
      ...current,
      notify: { ...current.notify, ...patch },
    }));
  };

  const setVerifyFile = (patch: Partial<NonNullable<SdkworkIamOauthAccountConfig["verifyFile"]>>) => {
    setConfig((current) => ({
      ...current,
      verifyFile: { ...current.verifyFile, ...patch },
    }));
  };

  const save = () => {
    if (!row?.accountId) {
      return;
    }
    setError(undefined);
    setNotice(undefined);
    void controller.updateAccountConfig(row.accountId, config)
      .then(() => {
        setNotice(configCopy.notices.saveSuccess);
        onChanged();
      })
      .catch(() => setError(configCopy.notices.saveError));
  };

  const verify = () => {
    if (!row?.accountId) {
      return;
    }
    setError(undefined);
    setNotice(undefined);
    void controller.runResourceAccountVerification(row.accountId)
      .then(() => {
        setNotice(configCopy.notices.verifyQueued);
        onChanged();
      })
      .catch(() => setError(configCopy.notices.saveError));
  };

  const copyVerifyContent = () => {
    if (!config.verifyFile?.content) {
      return;
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(config.verifyFile.content)
        .then(() => setNotice(configCopy.notices.copied))
        .catch(() => undefined);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = config.verifyFile.content;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    setNotice(configCopy.notices.copied);
  };

  const downloadVerifyFile = () => {
    const fileName = config.verifyFile?.fileName?.trim() || "MP_verify.txt";
    const content = config.verifyFile?.content ?? "";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const verifyStatus = row?.verifyStatus;
  const verifyStatusMeta = verifyStatusMetaOf(configCopy.verifyFile, verifyStatus);

  return (
    <OauthResourceDrawer
      confirmDisabled={disabled || !row?.accountId}
      confirmLabel={configCopy.save}
      confirmLoading={status === "saving"}
      description={configCopy.editDescription}
      onConfirm={save}
      onCancel={() => setConfig(EMPTY_CONFIG())}
      onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}
      open={open}
      triggerLabel={configCopy.editTitle}
    >
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
          {messages.title}
        </h3>
        <OauthAdminField
          disabled
          label={configCopy.basic.appId}
          onChange={() => undefined}
          value={row?.appId ?? ""}
        />
        <OauthAdminField
          disabled
          label={configCopy.basic.displayName}
          onChange={() => undefined}
          value={row?.label ?? ""}
        />
        <OauthAdminField
          label={configCopy.basic.webDomain}
          onChange={(webDomain) => setConfig((current) => {
            const previousAuto = current.webDomain ? buildStandardCallbackUri(current.webDomain) : "";
            const next = { ...current, webDomain };
            const autoUri = buildStandardCallbackUri(webDomain);
            if (autoUri && (!next.redirectUri || next.redirectUri === previousAuto)) {
              next.redirectUri = autoUri;
            }
            return next;
          })}
          placeholder={configCopy.basic.webDomainPlaceholder}
          value={config.webDomain ?? ""}
        />
        <OauthAdminField
          label={configCopy.basic.callbackUrl}
          onChange={(redirectUri) => setConfig((current) => ({ ...current, redirectUri }))}
          type="url"
          value={config.redirectUri ?? ""}
        />
        <StatusNotice tone="default">{configCopy.basic.callbackUrlHint}</StatusNotice>
      </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
            {configCopy.domains.title}
          </h3>
          <StatusNotice tone="default">{configCopy.domains.description}</StatusNotice>
          <DomainTagField
            hint={configCopy.domains.requestHint}
            label={configCopy.domains.request}
            onChange={(values) => setDomains("request", values)}
            value={config.domains?.request ?? []}
          />
          <DomainTagField
            label={configCopy.domains.socket}
            onChange={(values) => setDomains("socket", values)}
            value={config.domains?.socket ?? []}
          />
          <DomainTagField
            label={configCopy.domains.uploadFile}
            onChange={(values) => setDomains("uploadFile", values)}
            value={config.domains?.uploadFile ?? []}
          />
          <DomainTagField
            label={configCopy.domains.downloadFile}
            onChange={(values) => setDomains("downloadFile", values)}
            value={config.domains?.downloadFile ?? []}
          />
          <DomainTagField
            hint={configCopy.domains.businessHint}
            label={configCopy.domains.business}
            onChange={(values) => setDomains("business", values)}
            value={config.domains?.business ?? []}
          />
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
            {configCopy.verifyFile.title}
          </h3>
          <StatusNotice tone="default">{configCopy.verifyFile.description}</StatusNotice>
          <OauthAdminField
            label={configCopy.verifyFile.fileName}
            onChange={(fileName) => setVerifyFile({ fileName })}
            placeholder={configCopy.verifyFile.fileNamePlaceholder}
            value={config.verifyFile?.fileName ?? ""}
          />
          <OauthAdminMultilineField
            label={configCopy.verifyFile.content}
            onChange={(content) => setVerifyFile({ content })}
            placeholder={configCopy.verifyFile.contentPlaceholder}
            value={config.verifyFile?.content ?? ""}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={!config.verifyFile?.content} onClick={copyVerifyContent} size="sm" type="button" variant="outline">
              <Clipboard aria-hidden="true" className="h-4 w-4" />
              {configCopy.verifyFile.copyContent}
            </Button>
            <Button disabled={!config.verifyFile?.content} onClick={downloadVerifyFile} size="sm" type="button" variant="outline">
              <Download aria-hidden="true" className="h-4 w-4" />
              {configCopy.verifyFile.download}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Label>{configCopy.verifyFile.status}</Label>
            <StatusBadge label={verifyStatusMeta.label} showIcon status={verifyStatusMeta.status} />
            <Button disabled={disabled || !row?.accountId} onClick={verify} size="sm" type="button" variant="outline">
              {configCopy.verifyFile.verify}
            </Button>
          </div>
          <StatusNotice tone="default">{configCopy.verifyFile.deployHint}</StatusNotice>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
            {configCopy.notify.title}
          </h3>
          <StatusNotice tone="default">{configCopy.notify.description}</StatusNotice>
          <OauthAdminField
            label={configCopy.notify.url}
            onChange={(url) => setNotify({ url })}
            placeholder={configCopy.notify.urlPlaceholder}
            type="url"
            value={config.notify?.url ?? ""}
          />
          <OauthAdminField
            label={configCopy.notify.token}
            onChange={(token) => setNotify({ token })}
            placeholder={configCopy.notify.tokenPlaceholder}
            value={config.notify?.token ?? ""}
          />
          <OauthAdminField
            label={configCopy.notify.encodingAesKey}
            onChange={(encodingAesKey) => setNotify({ encodingAesKey })}
            placeholder={configCopy.notify.encodingAesKeyPlaceholder}
            value={config.notify?.encodingAesKey ?? ""}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <OauthAdminSelectField
              label={configCopy.notify.encryptMode}
              onChange={(encryptMode) => setNotify({ encryptMode: encryptMode as NonNullable<SdkworkIamOauthAccountConfig["notify"]>["encryptMode"] })}
              options={[
                { label: configCopy.notify.encryptModePlain, value: "plain" },
                { label: configCopy.notify.encryptModeCompatible, value: "compatible" },
                { label: configCopy.notify.encryptModeSafe, value: "safe" },
              ]}
              value={config.notify?.encryptMode ?? "safe"}
            />
            <OauthAdminSelectField
              label={configCopy.notify.dataFormat}
              onChange={(dataFormat) => setNotify({ dataFormat: dataFormat as "json" | "xml" })}
              options={[
                { label: configCopy.notify.dataFormatXml, value: "xml" },
                { label: configCopy.notify.dataFormatJson, value: "json" },
              ]}
              value={config.notify?.dataFormat ?? "json"}
            />
          </div>
          <StatusNotice tone="default">{configCopy.notify.syncHint}</StatusNotice>
        </section>
    </OauthResourceDrawer>
  );
}

function DomainTagField({ hint, label, onChange, value }: { hint?: string; label: string; onChange: (values: string[]) => void; value: string[] }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--sdk-color-text-primary)]">{label}</span>
      <TagInput aria-label={label} onValueChange={onChange} value={value} />
      {hint ? <span className="block text-xs leading-5 text-[var(--sdk-color-text-muted)]">{hint}</span> : null}
    </label>
  );
}

function verifyStatusMetaOf(
  copy: AccountConfigCopy["verifyFile"],
  value: string | undefined,
): { label: string; status: "success" | "warning" | "danger" | "secondary" } {
  switch (value) {
    case "verified":
      return { label: copy.statusVerified, status: "success" };
    case "failed":
      return { label: copy.statusFailed, status: "danger" };
    case "pending":
      return { label: copy.statusPending, status: "warning" };
    default:
      return { label: copy.statusUnknown, status: "secondary" };
  }
}
