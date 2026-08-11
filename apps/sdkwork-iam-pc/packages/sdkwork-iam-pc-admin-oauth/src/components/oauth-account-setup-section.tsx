import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Image as ImageIcon, ListTree, MessageCircle, Pencil, Plus, QrCode, Trash2, Upload, X } from "lucide-react";
import {
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  IconButton,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  StatusBadge,
  StatusNotice,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sdkwork/ui-pc-react";
import { CatalogPagination } from "@sdkwork/iam-pc-admin-core";
import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";

import type {
  SdkworkIamOauthAccountConfig,
  SdkworkIamOauthAccountDomainVerifyFile,
  SdkworkIamOauthAccountFollowQrCode,
  SdkworkIamOauthAccountKind,
  SdkworkIamOauthAdminController,
} from "../types/oauth-admin-types";
import type { SdkworkIamOauthAdminMessages } from "../types/oauth-admin-messages";
import {
  buildStandardCallbackUri,
  readAccountConfig,
  readAccountIntegrationId,
  readAccountOriginalId,
  readAccountType,
  readAuthorizationStatus,
  readDisplayName,
  readDomainVerifyStatus,
  readEnabled,
  readProviderClientId,
  readProviderClientSecret,
  readResourceAccountId,
  readResourceAccountKind,
  readWebhookVerifyStatus,
  templateMessage,
} from "../utils/oauth-admin-utils";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import {
  OauthAdminField,
  OauthAdminSelectField,
  OauthResourceDrawer,
} from "./oauth-admin-ui";

type AccountCopy = SdkworkIamOauthAdminMessages["quickSetup"]["miniProgramAccounts"];
type AccountConfigCopy = SdkworkIamOauthAdminMessages["quickSetup"]["accountConfig"];
type AccountSwitchCopy = SdkworkIamOauthAdminMessages["quickSetup"]["accountSwitch"];
type AccountFollowQrCodeCopy = SdkworkIamOauthAdminMessages["quickSetup"]["officialAccounts"]["followQrCode"];
type CommonCopy = SdkworkIamOauthAdminMessages["common"];

type AccountRow = {
  accountId: string;
  accountType?: string;
  appId: string;
  appSecret?: string;
  authorizationStatus?: string;
  config?: SdkworkIamOauthAccountConfig;
  enabled?: boolean;
  integrationId: string;
  kind: string;
  label: string;
  logoUrl?: string;
  originalId?: string;
  verifyStatus?: string;
  webhookVerifyStatus?: string;
};

function accountTypeLabel(
  messages: SdkworkIamOauthAdminMessages,
  value: string,
  kind: string,
): string {
  const accountType = messages.quickSetup.accountType;
  if (value === "service") {
    return accountType.service;
  }
  if (value === "subscription") {
    return accountType.subscription;
  }
  if (value === "personal") {
    return accountType.personal;
  }
  if (value === "enterprise") {
    return accountType.enterprise;
  }
  return kind === "mini_program" ? value : value;
}

function accountTypeOptions(
  messages: SdkworkIamOauthAdminMessages,
  kind: string,
): Array<{ label: string, value: string }> {
  const accountType = messages.quickSetup.accountType;
  if (kind === "mini_program") {
    return [
      { label: accountType.personal, value: "personal" },
      { label: accountType.enterprise, value: "enterprise" },
    ];
  }
  return [
    { label: accountType.service, value: "service" },
    { label: accountType.subscription, value: "subscription" },
  ];
}

const DOMAIN_KEYS = ["request", "socket", "uploadFile", "downloadFile", "business"] as const;
type DomainKey = typeof DOMAIN_KEYS[number];

const LOGO_MAX_BYTES = 512 * 1024;
const LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

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
  initialOpen = false,
  kind,
  listPageInfo,
  messages,
  onChanged,
  onOpenCustomMenu,
  status,
  switchMessages,
}: {
  accounts: unknown[];
  common: CommonCopy;
  controller: SdkworkIamOauthAdminController;
  disabled: boolean;
  initialOpen?: boolean;
  kind: SdkworkIamOauthAccountKind;
  listPageInfo?: SdkWorkPageInfo;
  messages: AccountCopy;
  onChanged: () => void;
  /**
   * Optional navigation into the custom menu management page for official
   * accounts. The row action only renders when the host provides it, keeping
   * the section surface-agnostic.
   */
  onOpenCustomMenu?: (resourceAccountId: string) => void;
  status: string;
  switchMessages: AccountSwitchCopy;
}) {
  const [form, setForm] = useState<AccountFormValues>(() => createEmptyForm(kind));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AccountRow>();
  const [pendingDelete, setPendingDelete] = useState<AccountRow>();
  const [qrRow, setQrRow] = useState<AccountRow>();
  const [qrCode, setQrCode] = useState<SdkworkIamOauthAccountFollowQrCode>();
  const [qrError, setQrError] = useState<string>();
  const [qrLoading, setQrLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("");
  const [connectionFilter, setConnectionFilter] = useState("");
  const [enabledFilter, setEnabledFilter] = useState("");
  const paginationMessages = useSdkworkIamOauthAdminMessages();
  const rows = useMemo<AccountRow[]>(() => accounts.map((item) => {
    const config = readAccountConfig(item);
    return {
      accountId: readResourceAccountId(item),
      accountType: readAccountType(item),
      appId: readProviderClientId(item),
      appSecret: readProviderClientSecret(item) || undefined,
      authorizationStatus: readAuthorizationStatus(item),
      config,
      enabled: readEnabled(item),
      integrationId: readAccountIntegrationId(item),
      kind: readResourceAccountKind(item),
      label: readDisplayName(item),
      logoUrl: config?.logoUrl,
      originalId: readAccountOriginalId(item),
      verifyStatus: readDomainVerifyStatus(item),
      webhookVerifyStatus: readWebhookVerifyStatus(item),
    };
  }), [accounts]);
  const columns = useMemo<DataTableColumn<AccountRow>[]>(() => [
    {
      id: "logo",
      header: common.logo,
      cell: (row) => (
        row.logoUrl ? (
          <img
            alt={row.label}
            className="h-10 w-10 rounded-full border border-[var(--sdk-color-border-default)] object-cover"
            src={row.logoUrl}
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sdk-color-surface-muted)] text-[var(--sdk-color-text-muted)]"
          >
            <MessageCircle className="h-5 w-5" />
          </span>
        )
      ),
    },
    {
      id: "account",
      header: messages.fields.displayName,
      cell: (row) => (
        <span className="flex flex-col">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-[var(--sdk-color-text-primary)]">{row.label}</span>
            {row.accountType ? (
              <span className="rounded-full border border-[var(--sdk-color-border-default)] px-2 py-0.5 text-xs text-[var(--sdk-color-text-secondary)]">
                {accountTypeLabel(paginationMessages, row.accountType, kind)}
              </span>
            ) : null}
          </span>
          {row.originalId ? (
            <span className="mt-0.5 text-xs text-[var(--sdk-color-text-muted)]">{row.originalId}</span>
          ) : null}
        </span>
      ),
    },
    {
      id: "appId",
      header: messages.fields.appId,
      cell: (row) => (
        row.appId ? (
          <code className="text-xs text-[var(--sdk-color-text-muted)]">{row.appId}</code>
        ) : (
          <span className="text-[var(--sdk-color-text-muted)]">—</span>
        )
      ),
    },
    {
      id: "connection",
      header: <span title={common.connectionStatusHint}>{common.connectionStatus}</span>,
      cell: (row) => {
        const connected = row.authorizationStatus === "authorized";
        return (
          <StatusBadge
            label={connected ? common.connected : common.notConnected}
            showIcon
            status={connected ? "success" : "secondary"}
          />
        );
      },
    },
    {
      id: "status",
      header: <span title={common.statusHint}>{common.status}</span>,
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
  ], [common.connectionStatus, common.connectionStatusHint, common.connected, common.logo, common.notConnected, common.status, common.statusHint, messages.fields.appId, messages.fields.displayName, paginationMessages, switchMessages.enabled, switchMessages.notEnabled]);

  // A cross-page jump (e.g. the scan-login settings "add service account"
  // action) can request the add drawer to open on mount.
  useEffect(() => {
    if (initialOpen) {
      setDrawerOpen(true);
    }
  }, [initialOpen]);

  const canSubmit = Boolean(
    form.displayName.trim() && form.appId.trim() && form.appSecret.trim()
    // Mini programs sign in through `jscode2session` and never need an OAuth
    // callback; the redirect URL stays optional for them.
    && (kind === "mini_program"
      || Boolean(form.config.redirectUri?.trim() || form.config.webDomain?.trim())),
  );

  // List loading is owned by this section so search and filter state can be
  // combined with server-side paging in one query.
  const buildListQuery = (nextPage: number, nextPageSize: number) => {
    const params: Record<string, unknown> = { page: nextPage, page_size: nextPageSize };
    const query = search.trim();
    if (query) {
      params.q = query;
    }
    if (accountTypeFilter) {
      params.accountType = accountTypeFilter;
    }
    if (connectionFilter) {
      params.authorizationStatus = connectionFilter;
    }
    if (enabledFilter !== "") {
      params.enabled = enabledFilter;
    }
    return params;
  };

  const applyList = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
    void controller.listPageResource("resourceAccounts", buildListQuery(nextPage, nextPageSize))
      .then(onChanged)
      .catch(onChanged);
  };

  // Debounced search: typing settles for 300ms before the first page reloads.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyList(1, pageSize);
    }, 300);
    return () => window.clearTimeout(timer);
    // `buildListQuery` reads the current filter state; only the search term
    // drives this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const deleteAccount = (row: AccountRow) => {
    if (!row.accountId) {
      return;
    }
    setPendingDelete(undefined);
    void controller.deleteResourceAccount(row.accountId)
      .then(onChanged)
      .catch(onChanged);
  };

  const toggleEnabled = (row: AccountRow, enabled: boolean) => {
    if (!row.accountId) {
      return;
    }
    void controller.setResourceAccountEnabled(row.accountId, row.integrationId, enabled)
      .then(onChanged)
      .catch(onChanged);
  };

  const generateFollowQrCode = (row: AccountRow) => {
    if (!row.accountId) {
      return;
    }
    setQrRow(row);
    setQrCode(undefined);
    setQrError(undefined);
    setQrLoading(true);
    void controller.createAccountFollowQrCode(row.accountId)
      .then((detail) => {
        setQrCode(detail);
        setQrLoading(false);
      })
      .catch((error) => {
        setQrError(error instanceof Error ? error.message : paginationMessages.quickSetup.officialAccounts.followQrCode.failure);
        setQrLoading(false);
      });
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
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label={paginationMessages.quickSetup.searchPlaceholder}
            className="h-9 w-56"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={paginationMessages.quickSetup.searchPlaceholder}
            value={search}
          />
          <select
            aria-label={paginationMessages.quickSetup.accountType.label}
            className="h-9 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-2.5 text-sm outline-none"
            onChange={(event) => {
              setAccountTypeFilter(event.target.value);
              applyList(1, pageSize);
            }}
            value={accountTypeFilter}
          >
            <option value="">{paginationMessages.common.all}</option>
            {accountTypeOptions(paginationMessages, kind).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            aria-label={paginationMessages.common.connectionStatus}
            className="h-9 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-2.5 text-sm outline-none"
            onChange={(event) => {
              setConnectionFilter(event.target.value);
              applyList(1, pageSize);
            }}
            value={connectionFilter}
          >
            <option value="">{paginationMessages.common.all}</option>
            <option value="authorized">{paginationMessages.common.connected}</option>
            <option value="pending">{paginationMessages.common.notConnected}</option>
          </select>
          <select
            aria-label={paginationMessages.common.status}
            className="h-9 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-2.5 text-sm outline-none"
            onChange={(event) => {
              setEnabledFilter(event.target.value);
              applyList(1, pageSize);
            }}
            value={enabledFilter}
          >
            <option value="">{paginationMessages.common.all}</option>
            <option value="1">{switchMessages.enabled}</option>
            <option value="0">{switchMessages.notEnabled}</option>
          </select>
          <Button disabled={disabled} onClick={() => setDrawerOpen(true)} type="button">
            <Plus aria-hidden="true" className="h-4 w-4" />
            {messages.addButton}
          </Button>
        </div>
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
              applyList(nextPage, pageSize);
            }}
            onPageSizeChange={(nextPageSize) => {
              applyList(1, nextPageSize);
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
              {kind === "official_account" && row.accountType === "service" ? (
                <IconButton
                  aria-label={paginationMessages.quickSetup.officialAccounts.followQrCode.generate}
                  // Generating a follow QR needs the parameterized-QR API
                  // permission, which WeChat only grants to certified service
                  // accounts; the action stays hidden for subscriptions.
                  disabled={disabled || !row.accountId}
                  onClick={() => generateFollowQrCode(row)}
                  title={paginationMessages.quickSetup.officialAccounts.followQrCode.generate}
                  variant="ghost"
                >
                  <QrCode aria-hidden="true" className="h-4 w-4" />
                </IconButton>
              ) : null}
              {kind === "official_account" && onOpenCustomMenu ? (
                <IconButton
                  aria-label={paginationMessages.quickSetup.customMenus.openButton}
                  disabled={disabled || !row.accountId}
                  onClick={() => onOpenCustomMenu(row.accountId)}
                  title={paginationMessages.quickSetup.customMenus.openButton}
                  variant="ghost"
                >
                  <ListTree aria-hidden="true" className="h-4 w-4" />
                </IconButton>
              ) : null}
              <IconButton
                aria-label={messages.actions}
                disabled={disabled || !row.accountId}
                onClick={() => setEditingRow(row)}
                title={messages.actions}
                variant="ghost"
              >
                <Pencil aria-hidden="true" className="h-4 w-4" />
              </IconButton>
              <IconButton
                aria-label={common.delete}
                disabled={disabled || !row.accountId}
                onClick={() => setPendingDelete(row)}
                title={common.delete}
                variant="ghost"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
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

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={common.delete}
        confirmLoading={status === "saving"}
        description={pendingDelete
          ? templateMessage(paginationMessages.quickSetup.deleteAccountConfirmTemplate, { name: pendingDelete.label })
          : ""}
        onConfirm={() => { if (pendingDelete) deleteAccount(pendingDelete); }}
        onOpenChange={(open) => { if (!open && status !== "saving") setPendingDelete(undefined); }}
        open={Boolean(pendingDelete)}
        title={common.delete}
        tone="danger"
      />

      <AccountConfigDrawer
        configCopy={paginationMessages.quickSetup.accountConfig}
        controller={controller}
        disabled={disabled}
        onChanged={onChanged}
        row={editingRow}
        status={status}
        onClose={() => setEditingRow(undefined)}
      />

      <OauthFollowQrCodeDialog
        account={qrRow}
        copy={paginationMessages.quickSetup.officialAccounts.followQrCode}
        error={qrError}
        loading={qrLoading}
        onClose={() => {
          setQrRow(undefined);
          setQrCode(undefined);
          setQrError(undefined);
        }}
        qrCode={qrCode}
      />

      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmit}
        confirmLabel={messages.addButton}
        confirmLoading={status === "saving"}
        description={messages.addDescription}
        onCancel={() => setForm(createEmptyForm(kind))}
        onConfirm={() => {
          void controller.createAccountSetup(kind, {
            accountType: form.accountType,
            appId: form.appId,
            appSecret: form.appSecret,
            config: form.config,
            displayName: form.displayName,
            enabled: form.enabled,
            originalId: form.originalId,
            redirectUri: form.config.redirectUri ?? "",
          }).then(onChanged).catch(onChanged);
          setForm(createEmptyForm(kind));
        }}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        side="left"
        triggerLabel={messages.addButton}
        width="min(60vw,60rem)"
      >
        <OauthAccountFormTabs
          allMessages={paginationMessages}
          copy={{
            appIdLabel: messages.fields.appId,
            appIdPlaceholder: messages.fields.appIdPlaceholder,
            appSecretLabel: messages.fields.appSecret,
            appSecretPlaceholder: messages.fields.appSecretPlaceholder,
            displayNameLabel: messages.fields.displayName,
            displayNamePlaceholder: messages.fields.displayNamePlaceholder,
            redirectUriLabel: messages.fields.redirectUri,
            redirectUriPlaceholder: messages.fields.redirectUriPlaceholder,
          }}
          form={form}
          kind={kind}
          mode="create"
          onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
          switchCopy={switchMessages}
        />
      </OauthResourceDrawer>
    </div>
  );
}

function AccountConfigDrawer({
  configCopy,
  controller,
  disabled,
  onChanged,
  onClose,
  row,
  status,
}: {
  configCopy: AccountConfigCopy;
  controller: SdkworkIamOauthAdminController;
  disabled: boolean;
  onChanged: () => void;
  onClose: () => void;
  row?: AccountRow;
  status: string;
}) {
  const allMessages = useSdkworkIamOauthAdminMessages();
  const [form, setForm] = useState<AccountFormValues>(() =>
    createEmptyForm(row?.kind === "mini_program" ? "mini_program" : "official_account"));
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();

  const open = Boolean(row);

  useEffect(() => {
    if (!row) {
      return;
    }
    setForm({
      accountType: row.accountType ?? (row.kind === "mini_program" ? "personal" : "service"),
      appId: row.appId ?? "",
      // The backend echoes the saved AppSecret back on read so the drawer
      // shows the complete record; an untouched secret is not re-submitted
      // on save (see the dirty check in `save`).
      appSecret: row.appSecret ?? "",
      config: row.config ? { ...row.config } : {},
      displayName: row.label ?? "",
      enabled: row.enabled ?? false,
      originalId: row.originalId ?? "",
    });
    setNotice(undefined);
    setError(undefined);
  }, [row?.accountId]);

  const save = () => {
    if (!row?.accountId) {
      return;
    }
    setError(undefined);
    setNotice(undefined);
    const nextDisplayName = form.displayName.trim() || (row.label ?? "");
    const previousType = row.accountType ?? "service";
    const previousOriginalId = row.originalId ?? "";
    const profileChanged = nextDisplayName !== (row.label ?? "")
      || form.accountType !== previousType
      || form.originalId.trim() !== previousOriginalId;
    const appIdChanged = form.appId.trim() !== (row.appId ?? "");
    // The drawer is prefilled with the saved secret; only a value the
    // operator actually changed is re-submitted, so an untouched secret is
    // never re-rotated on save. Clearing the field keeps the stored value.
    const secretChanged = form.appSecret.trim() !== (row.appSecret ?? "");
    const secretProvided = secretChanged && form.appSecret.trim().length > 0;
    const enabledChanged = form.enabled !== (row.enabled ?? false);
    // Persist in dependency order — profile, credentials, developer
    // configuration, then the enabled state — so a partial failure never
    // stores half of an edit.
    const profileStep = profileChanged
      ? controller.updateAccountProfile(row.accountId, row.integrationId, {
        displayName: nextDisplayName,
        ...(form.accountType !== previousType ? { accountType: form.accountType } : {}),
        ...(form.originalId.trim() !== previousOriginalId ? { originalId: form.originalId } : {}),
      })
      : Promise.resolve();
    const credentialsStep = (appIdChanged || secretProvided)
      ? controller.updateAccountCredentials(row.accountId, {
        ...(appIdChanged ? { appId: form.appId } : {}),
        ...(secretProvided ? { appSecret: form.appSecret } : {}),
      })
      : Promise.resolve();
    const enabledStep = enabledChanged
      ? controller.setResourceAccountEnabled(row.accountId, row.integrationId, form.enabled)
      : Promise.resolve();
    void profileStep
      .then(() => credentialsStep)
      .then(() => controller.updateAccountConfig(row.accountId, form.config))
      .then(() => enabledStep)
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

  const verifyStatusMeta = verifyStatusMetaOf(configCopy.verifyFile, row?.verifyStatus);
  const webhookVerifyMeta = verifyStatusMetaOf(configCopy.verifyFile, row?.webhookVerifyStatus);
  const accountConnected = row?.authorizationStatus === "authorized";
  const connectionMeta = {
    label: accountConnected ? allMessages.common.connected : allMessages.common.notConnected,
    status: accountConnected ? "success" : "secondary",
  } as const;
  const accountEnabled = row?.enabled ?? false;
  const enabledMeta = {
    label: accountEnabled
      ? allMessages.quickSetup.accountSwitch.enabled
      : allMessages.quickSetup.accountSwitch.notEnabled,
    status: accountEnabled ? "enabled" : "disabled",
  } as const;

  return (
    <OauthResourceDrawer
      confirmDisabled={disabled || !row?.accountId}
      confirmLabel={configCopy.save}
      confirmLoading={status === "saving"}
      description={configCopy.editDescription}
      onConfirm={save}
      onCancel={() => setForm(createEmptyForm(row?.kind === "mini_program" ? "mini_program" : "official_account"))}
      onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}
      open={open}
      side="left"
      triggerLabel={configCopy.editTitle}
      width="min(60vw,60rem)"
    >
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}

      <OauthAccountFormTabs
        allMessages={allMessages}
        copy={{
          appIdLabel: configCopy.basic.appId,
          appIdPlaceholder: "",
          appSecretLabel: configCopy.basic.appSecret,
          appSecretPlaceholder: configCopy.basic.appSecretPlaceholder,
          displayNameLabel: configCopy.basic.displayName,
          displayNamePlaceholder: "",
          redirectUriLabel: configCopy.basic.callbackUrl,
          redirectUriPlaceholder: "",
        }}
        form={form}
        kind={row?.kind ?? "official_account"}
        mode="edit"
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
        onNotice={setNotice}
        onVerify={verify}
        row={row}
        statusMetas={{
          connection: connectionMeta,
          domainVerify: verifyStatusMeta,
          enabled: enabledMeta,
          webhookVerify: webhookVerifyMeta,
        }}
        switchCopy={allMessages.quickSetup.accountSwitch}
      />
    </OauthResourceDrawer>
  );
}

function StatusInfoRow({
  label,
  meta,
}: {
  label: string;
  meta: { label: string; status: string };
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--sdk-color-border-default)] px-4 py-3">
      <span className="text-sm font-medium text-[var(--sdk-color-text-primary)]">{label}</span>
      <StatusBadge label={meta.label} showIcon status={meta.status} />
    </div>
  );
}

/**
 * Centered follow-QR preview for one official account. The QR image comes from
 * `mp.weixin.qq.com/cgi-bin/showqrcode` (WeChat permanent parameterized QR);
 * the download action re-fetches it as a blob so a local PNG is saved even
 * though the ticket URL is cross-origin.
 */
function OauthFollowQrCodeDialog({
  account,
  copy,
  error,
  loading,
  onClose,
  qrCode,
}: {
  account?: AccountRow;
  copy: AccountFollowQrCodeCopy;
  error?: string;
  loading: boolean;
  onClose: () => void;
  qrCode?: SdkworkIamOauthAccountFollowQrCode;
}) {
  const download = () => {
    if (!qrCode?.qrCode) {
      return;
    }
    const fileName = `${(account?.label || "official-account").trim()}-follow-qr.png`;
    void fetch(qrCode.qrCode)
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      })
      .catch(() => undefined);
  };

  return (
    <Modal
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={Boolean(account)}
    >
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>{copy.title}</ModalTitle>
          <ModalDescription>{copy.description}</ModalDescription>
        </ModalHeader>
        <ModalBody className="flex flex-col items-center gap-3">
          {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
          {loading ? (
            <span className="flex h-56 w-56 items-center justify-center text-sm text-[var(--sdk-color-text-muted)]">
              {copy.loading}
            </span>
          ) : null}
          {!loading && qrCode?.qrCode ? (
            <>
              <img
                alt={account?.label ?? copy.title}
                className="h-56 w-56 border border-[var(--sdk-color-border-default)]"
                src={qrCode.qrCode}
              />
              <span className="text-sm font-medium text-[var(--sdk-color-text-primary)]">
                {account?.label ?? copy.title}
              </span>
              {qrCode.scene ? (
                <code className="max-w-full truncate text-xs text-[var(--sdk-color-text-muted)]">
                  {copy.sceneLabel}: {qrCode.scene}
                </code>
              ) : null}
              <StatusNotice tone="default">{copy.permanentHint}</StatusNotice>
            </>
          ) : null}
        </ModalBody>
        <ModalFooter>
          {!loading && qrCode?.qrCode ? (
            <Button onClick={download} size="sm" type="button" variant="outline">
              <Download aria-hidden="true" className="h-4 w-4" />
              {copy.download}
            </Button>
          ) : null}
          <Button onClick={onClose} size="sm" type="button" variant="outline">
            {copy.close}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * Form state shared by the create and edit drawers. The edit drawer is
 * initialized from the account row; the create drawer starts empty. Both
 * render the same four top tabs so the product surface stays consistent.
 */
type AccountFormValues = {
  accountType: string;
  appId: string;
  appSecret: string;
  config: SdkworkIamOauthAccountConfig;
  displayName: string;
  enabled: boolean;
  originalId: string;
};

function createEmptyForm(kind: SdkworkIamOauthAccountKind): AccountFormValues {
  return {
    accountType: kind === "mini_program" ? "personal" : "service",
    appId: "",
    appSecret: "",
    config: {},
    displayName: "",
    enabled: true,
    originalId: "",
  };
}

type AccountStatusMetas = {
  connection: { label: string; status: string };
  domainVerify: { label: string; status: string };
  enabled: { label: string; status: string };
  webhookVerify: { label: string; status: string };
};

/**
 * The four-tab account form (basic info / developer config / server config /
 * status) used by both the create and edit drawers. `mode` only affects the
 * status tab (empty hint while creating) and the domain-verification action
 * (available once the account exists).
 */
function OauthAccountFormTabs({
  allMessages,
  copy,
  form,
  kind,
  mode,
  onChange,
  onNotice,
  onVerify,
  row,
  statusMetas,
  switchCopy,
}: {
  allMessages: SdkworkIamOauthAdminMessages;
  copy: {
    appIdLabel: string;
    appIdPlaceholder: string;
    appSecretLabel: string;
    appSecretPlaceholder: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    redirectUriLabel: string;
    redirectUriPlaceholder: string;
  };
  form: AccountFormValues;
  kind: string;
  mode: "create" | "edit";
  onChange: (patch: Partial<AccountFormValues>) => void;
  onNotice?: (message: string) => void;
  onVerify?: () => void;
  row?: AccountRow;
  statusMetas?: AccountStatusMetas;
  switchCopy: AccountSwitchCopy;
}) {
  const quickSetup = allMessages.quickSetup;
  const configCopy = quickSetup.accountConfig;

  const setDomains = (key: DomainKey, values: string[]) => {
    onChange({
      config: { ...form.config, domains: { ...form.config.domains, [key]: values } },
    });
  };

  const setNotify = (patch: Partial<NonNullable<SdkworkIamOauthAccountConfig["notify"]>>) => {
    onChange({
      config: { ...form.config, notify: { ...form.config.notify, ...patch } },
    });
  };

  const setVerifyFiles = (verifyFiles: SdkworkIamOauthAccountDomainVerifyFile[]) => {
    onChange({
      config: { ...form.config, verifyFiles, verifyFile: undefined },
    });
  };

  const upsertVerifyFile = (domain: string, file: SdkworkIamOauthAccountDomainVerifyFile) => {
    const files = (form.config.verifyFiles ?? []).filter((item) => item.domain !== domain);
    setVerifyFiles([...files, file]);
  };

  const removeVerifyFile = (domain: string) => {
    setVerifyFiles((form.config.verifyFiles ?? []).filter((item) => item.domain !== domain));
  };

  const setJsSecureDomains = (jsSecureDomains: string[]) => {
    onChange({ config: { ...form.config, jsSecureDomains } });
  };

  const setBusinessDomains = (businessDomains: string[]) => {
    onChange({ config: { ...form.config, businessDomains } });
  };

  // The callback URL follows the standardized `/auth/oauth/callback` path
  // whenever the primary domain is configured; a manually edited URL wins.
  // The configured domains (web authorization domain + legal domains) drive
  // the per-domain verification file rows.
  const effectiveVerifyFiles = collectConfiguredDomains(form.config, kind);

  const setWebDomain = (webDomain: string) => {
    const previousAuto = form.config.webDomain
      ? buildStandardCallbackUri(form.config.webDomain)
      : "";
    const next = { ...form.config, webDomain };
    const autoUri = buildStandardCallbackUri(webDomain);
    if (autoUri && (!next.redirectUri || next.redirectUri === previousAuto)) {
      next.redirectUri = autoUri;
    }
    onChange({ config: next });
  };

  return (
    <Tabs defaultValue="basic">
      <TabsList className="w-full">
        <TabsTrigger className="flex-1" value="basic">{quickSetup.tabs.basic}</TabsTrigger>
        <TabsTrigger className="flex-1" value="config">{quickSetup.tabs.config}</TabsTrigger>
        {kind === "official_account" ? (
          <TabsTrigger className="flex-1" value="server">{quickSetup.tabs.server}</TabsTrigger>
        ) : null}
        <TabsTrigger className="flex-1" value="status">{quickSetup.tabs.status}</TabsTrigger>
      </TabsList>

      <TabsContent className="space-y-4 rounded-none border-0 bg-transparent p-0 shadow-none" value="basic">
        <OauthAdminField
          label={copy.displayNameLabel}
          onChange={(displayName) => onChange({ displayName })}
          placeholder={copy.displayNamePlaceholder}
          value={form.displayName}
        />
        <OauthAccountLogoField
          copy={configCopy.logo}
          disabled={false}
          onChange={(logoUrl) => onChange({ config: { ...form.config, logoUrl } })}
          value={form.config.logoUrl}
        />
        <OauthAdminSelectField
          label={kind === "mini_program" ? quickSetup.accountType.subjectLabel : quickSetup.accountType.label}
          onChange={(accountType) => onChange({ accountType })}
          options={accountTypeOptions(allMessages, kind)}
          value={form.accountType}
        />
        <OauthAdminField
          label={quickSetup.originalId.label}
          onChange={(originalId) => onChange({ originalId })}
          placeholder={quickSetup.originalId.placeholder}
          value={form.originalId}
        />
        <OauthAdminField
          label={copy.appIdLabel}
          onChange={(appId) => onChange({ appId })}
          placeholder={copy.appIdPlaceholder}
          value={form.appId}
        />
        <OauthAdminField
          label={copy.appSecretLabel}
          onChange={(appSecret) => onChange({ appSecret })}
          placeholder={copy.appSecretPlaceholder}
          type="password"
          value={form.appSecret}
        />
        <label className="flex items-center gap-2 text-sm" htmlFor={`oauth-account-enabled-${kind}`}>
          <input
            checked={form.enabled}
            id={`oauth-account-enabled-${kind}`}
            onChange={(event) => onChange({ enabled: event.target.checked })}
            type="checkbox"
          />
          {switchCopy.enable}
        </label>
        <StatusNotice tone="default">{switchCopy.enableHint}</StatusNotice>
      </TabsContent>

      <TabsContent className="space-y-4 rounded-none border-0 bg-transparent p-0 shadow-none" value="config">
        {kind === "official_account" ? (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
              {configCopy.basic.webDomain}
            </h3>
            <OauthAdminField
              label={configCopy.basic.webDomain}
              onChange={setWebDomain}
              placeholder={configCopy.basic.webDomainPlaceholder}
              value={form.config.webDomain ?? ""}
            />
            <OauthAdminField
              label={configCopy.basic.callbackUrl}
              onChange={(redirectUri) => onChange({ config: { ...form.config, redirectUri } })}
              type="url"
              value={form.config.redirectUri ?? ""}
            />
            <StatusNotice tone="default">{configCopy.basic.callbackUrlHint}</StatusNotice>
          </section>
        ) : (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
              {copy.redirectUriLabel}
            </h3>
            <OauthAdminField
              label={copy.redirectUriLabel}
              onChange={(redirectUri) => onChange({ config: { ...form.config, redirectUri } })}
              placeholder={copy.redirectUriPlaceholder}
              type="url"
              value={form.config.redirectUri ?? ""}
            />
            <StatusNotice tone="default">{configCopy.basic.miniCallbackHint}</StatusNotice>
          </section>
        )}

        {kind === "official_account" ? (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
              {configCopy.domains.officialTitle}
            </h3>
            <StatusNotice tone="default">{configCopy.domains.officialDescription}</StatusNotice>
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.jsSecureDomains}
              onChange={setJsSecureDomains}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.jsSecureDomains ?? []}
            />
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.businessDomains}
              onChange={setBusinessDomains}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.businessDomains ?? legacyBusinessDomains(form.config)}
            />
          </section>
        ) : (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
              {configCopy.domains.title}
            </h3>
            <StatusNotice tone="default">{configCopy.domains.miniDescription}</StatusNotice>
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.request}
              onChange={(values) => setDomains("request", values)}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.domains?.request ?? []}
            />
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.socket}
              onChange={(values) => setDomains("socket", values)}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.domains?.socket ?? []}
            />
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.uploadFile}
              onChange={(values) => setDomains("uploadFile", values)}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.domains?.uploadFile ?? []}
            />
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.downloadFile}
              onChange={(values) => setDomains("downloadFile", values)}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.domains?.downloadFile ?? []}
            />
            <OauthDomainListField
              addLabel={configCopy.domains.addDomain}
              label={configCopy.domains.business}
              onChange={(values) => setDomains("business", values)}
              placeholder={configCopy.domains.domainPlaceholder}
              removeLabel={allMessages.common.delete}
              values={form.config.domains?.business ?? []}
            />
          </section>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
            {configCopy.verifyFile.title}
          </h3>
          <StatusNotice tone="default">{configCopy.verifyFile.description}</StatusNotice>
          {effectiveVerifyFiles.length === 0 ? (
            <StatusNotice tone="default">{configCopy.verifyFile.noDomains}</StatusNotice>
          ) : (
            <div className="space-y-3">
              {effectiveVerifyFiles.map((item) => {
                const file = form.config.verifyFiles?.find((entry) => entry.domain === item.domain)
                  ?? legacyVerifyFileForDomain(form.config, item.domain);
                return (
                  <div key={item.domain} className="rounded-md border border-[var(--sdk-color-border-default)] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="text-xs text-[var(--sdk-color-text-primary)]">{item.domain}</code>
                      {item.kinds.map((kind) => (
                        <span
                          key={kind}
                          className="rounded-full border border-[var(--sdk-color-border-default)] px-2 py-0.5 text-xs text-[var(--sdk-color-text-secondary)]"
                        >
                          {domainKindLabel(configCopy, kind)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {file ? (
                        <>
                          <span className="text-xs font-medium text-[var(--sdk-color-text-primary)]">
                            {configCopy.verifyFile.uploaded}: {file.fileName}
                          </span>
                          <OauthDownloadVerifyButton
                            copy={configCopy.verifyFile}
                            content={file.content}
                            fileName={file.fileName}
                          />
                          <Button
                            onClick={() => removeVerifyFile(item.domain)}
                            size="sm"
                            type="button"
                            variant="danger"
                          >
                            {allMessages.common.delete}
                          </Button>
                        </>
                      ) : null}
                      <OauthDomainVerifyFileUploader
                        copy={configCopy.verifyFile}
                        onUploaded={(uploaded) => upsertVerifyFile(item.domain, {
                          content: uploaded.content,
                          domain: item.domain,
                          fileName: uploaded.fileName,
                        })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Label>{configCopy.verifyFile.status}</Label>
            <StatusBadge
              label={statusMetas?.domainVerify.label ?? configCopy.verifyFile.statusUnknown}
              showIcon
              status={statusMetas?.domainVerify.status ?? "secondary"}
            />
            {mode === "edit" && onVerify ? (
              <Button disabled={!row?.accountId} onClick={onVerify} size="sm" type="button" variant="outline">
                {configCopy.verifyFile.verify}
              </Button>
            ) : null}
          </div>
          <StatusNotice tone="default">{configCopy.verifyFile.deployHint}</StatusNotice>
        </section>
      </TabsContent>

      {kind === "official_account" ? (
      <TabsContent className="space-y-4 rounded-none border-0 bg-transparent p-0 shadow-none" value="server">
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
            value={form.config.notify?.url ?? ""}
          />
          <OauthSecretField
            copyLabel={allMessages.common.copy}
            copiedLabel={allMessages.common.copied}
            generate={generateWechatToken}
            generateLabel={configCopy.notify.generateToken}
            label={configCopy.notify.token}
            onChange={(token) => setNotify({ token })}
            placeholder={configCopy.notify.tokenPlaceholder}
            value={form.config.notify?.token ?? ""}
          />
          <OauthSecretField
            copyLabel={allMessages.common.copy}
            copiedLabel={allMessages.common.copied}
            generate={generateWechatEncodingAesKey}
            generateLabel={configCopy.notify.generateAesKey}
            label={configCopy.notify.encodingAesKey}
            onChange={(encodingAesKey) => setNotify({ encodingAesKey })}
            placeholder={configCopy.notify.encodingAesKeyPlaceholder}
            value={form.config.notify?.encodingAesKey ?? ""}
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
              value={form.config.notify?.encryptMode ?? "safe"}
            />
            <OauthAdminSelectField
              label={configCopy.notify.dataFormat}
              onChange={(dataFormat) => setNotify({ dataFormat: dataFormat as "json" | "xml" })}
              options={[
                { label: configCopy.notify.dataFormatXml, value: "xml" },
                { label: configCopy.notify.dataFormatJson, value: "json" },
              ]}
              value={form.config.notify?.dataFormat ?? "xml"}
            />
          </div>
          <StatusNotice tone="default">{configCopy.notify.syncHint}</StatusNotice>
        </section>
      </TabsContent>
      ) : null}

      <TabsContent className="space-y-4 rounded-none border-0 bg-transparent p-0 shadow-none" value="status">
        {mode === "edit" && statusMetas ? (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
              {quickSetup.tabs.status}
            </h3>
            <StatusInfoRow label={allMessages.common.connectionStatus} meta={statusMetas.connection} />
            <StatusInfoRow label={configCopy.verifyFile.status} meta={statusMetas.domainVerify} />
            <StatusInfoRow label={quickSetup.webhookVerifyStatus} meta={statusMetas.webhookVerify} />
            <StatusInfoRow label={allMessages.common.status} meta={statusMetas.enabled} />
          </section>
        ) : (
          <StatusNotice tone="default">{quickSetup.createStatusHint}</StatusNotice>
        )}
      </TabsContent>
    </Tabs>
  );
}

/**
 * Logo upload with an inline preview and remove action. The file is read as a
 * data URL and stored in `config.logoUrl`; validation is self-contained.
 */
function OauthAccountLogoField({
  copy,
  disabled,
  onChange,
  value,
}: {
  copy: AccountConfigCopy["logo"];
  disabled: boolean;
  onChange: (logoUrl: string | undefined) => void;
  value?: string;
}) {
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    setError(undefined);
    if (!file) {
      return;
    }
    if (!LOGO_MIME_TYPES.includes(file.type)) {
      setError(copy.invalidType);
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError(copy.tooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">
        {copy.title}
      </h3>
      <StatusNotice tone="default">{copy.hint}</StatusNotice>
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <img
            alt={copy.title}
            className="h-14 w-14 rounded-full border border-[var(--sdk-color-border-default)] object-cover"
            src={value}
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-[var(--sdk-color-border-default)] text-[var(--sdk-color-text-muted)]"
          >
            <ImageIcon className="h-5 w-5" />
          </span>
        )}
        <input
          ref={inputRef}
          accept="image/png,image/jpeg,image/webp"
          aria-label={copy.choose}
          className="sr-only"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
          type="file"
        />
        <Button
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          size="sm"
          type="button"
          variant="outline"
        >
          {copy.choose}
        </Button>
        {value ? (
          <Button
            disabled={disabled}
            onClick={() => onChange(undefined)}
            size="sm"
            type="button"
            variant="danger"
          >
            {copy.remove}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function OauthDownloadVerifyButton({
  content,
  copy,
  fileName,
}: {
  content: string;
  copy: AccountConfigCopy["verifyFile"];
  fileName?: string;
}) {
  const handleDownload = () => {
    const resolvedName = fileName?.trim() || "MP_verify.txt";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = resolvedName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Button disabled={!content} onClick={handleDownload} size="sm" type="button" variant="outline">
      <Download aria-hidden="true" className="h-4 w-4" />
      {copy.download}
    </Button>
  );
}

const VERIFY_FILE_MAX_BYTES = 1024 * 1024;

const WECHAT_SECRET_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomWechatSecret(length: number): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += WECHAT_SECRET_CHARS[values[index] % WECHAT_SECRET_CHARS.length];
  }
  return result;
}

/**
 * WeChat server-config token: 3-32 alphanumeric characters; 32 is generated.
 */
export function generateWechatToken(): string {
  return randomWechatSecret(32);
}

/**
 * WeChat EncodingAESKey: exactly 43 alphanumeric characters.
 */
export function generateWechatEncodingAesKey(): string {
  return randomWechatSecret(43);
}

type ConfiguredDomain = {
  domain: string;
  kinds: string[];
};

/**
 * Collects every configured root domain (web authorization domain plus legal
 * domains) and the kinds it appears under, deduplicated per domain.
 */
export function collectConfiguredDomains(
  config: SdkworkIamOauthAccountConfig,
  kind: string,
): ConfiguredDomain[] {
  const byDomain = new Map<string, string[]>();
  const add = (value: string, domainKind: string) => {
    const normalized = value.trim().replace(/^(https?|wss?):\/\//u, "").replace(/\/+$/u, "");
    if (!normalized) {
      return;
    }
    const kinds = byDomain.get(normalized) ?? [];
    if (!kinds.includes(domainKind)) {
      kinds.push(domainKind);
    }
    byDomain.set(normalized, kinds);
  };
  if (kind === "mini_program") {
    // Mini program domains: request / socket / uploadFile / downloadFile
    // legal domains plus web-view business domains.
    for (const key of DOMAIN_KEYS) {
      for (const value of config.domains?.[key] ?? []) {
        add(value, key);
      }
    }
    return [...byDomain.entries()].map(([domain, kinds]) => ({ domain, kinds }));
  }
  // Official account domains: the single web authorization domain, JS SDK
  // secure domains and business domains (web-view), each carrying its own
  // verification file. Legacy mini-program-shaped business domains stay
  // visible until re-saved.
  if (config.webDomain?.trim()) {
    add(config.webDomain, "web");
  }
  for (const value of config.jsSecureDomains ?? []) {
    add(value, "jsSecure");
  }
  for (const value of config.businessDomains ?? []) {
    add(value, "business");
  }
  for (const value of config.domains?.business ?? []) {
    add(value, "business");
  }
  return [...byDomain.entries()].map(([domain, kinds]) => ({ domain, kinds }));
}

/**
 * Legacy single `verifyFile` entries (pre-per-domain storage) are presented
 * on the web authorization domain row until the account is re-saved, which
 * migrates them into `verifyFiles`.
 */
function legacyVerifyFileForDomain(
  config: SdkworkIamOauthAccountConfig,
  domain: string,
): SdkworkIamOauthAccountDomainVerifyFile | undefined {
  const legacy = config.verifyFile;
  if (!legacy?.fileName && !legacy?.content) {
    return undefined;
  }
  const legacyDomain = config.webDomain ?? "";
  if (domain !== legacyDomain) {
    return undefined;
  }
  return {
    content: legacy.content ?? "",
    domain,
    fileName: legacy.fileName ?? "MP_verify.txt",
  };
}

function domainKindLabel(configCopy: AccountConfigCopy, kind: string): string {
  switch (kind) {
    case "web":
      return configCopy.basic.webDomain;
    case "jsSecure":
      return configCopy.domains.jsSecureDomains;
    case "request":
      return configCopy.domains.request;
    case "socket":
      return configCopy.domains.socket;
    case "uploadFile":
      return configCopy.domains.uploadFile;
    case "downloadFile":
      return configCopy.domains.downloadFile;
    case "business":
      return configCopy.domains.business;
    default:
      return kind;
  }
}

/**
 * Upload control for one domain's WeChat verification file. The file is read
 * as text and handed back as `{ fileName, content }`; only `.txt` files up to
 * 1MB are accepted.
 */
function OauthDomainVerifyFileUploader({
  copy,
  disabled,
  onUploaded,
}: {
  copy: AccountConfigCopy["verifyFile"];
  disabled?: boolean;
  onUploaded: (uploaded: { fileName: string; content: string }) => void;
}) {
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    setError(undefined);
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError(copy.invalidType);
      return;
    }
    if (file.size > VERIFY_FILE_MAX_BYTES) {
      setError(copy.tooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      if (content) {
        onUploaded({ fileName: file.name, content });
      }
    };
    reader.readAsText(file);
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        accept=".txt,text/plain"
        aria-label={copy.upload}
        className="sr-only"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        type="file"
      />
      <Button
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        size="sm"
        type="button"
        variant="outline"
      >
        <Upload aria-hidden="true" className="h-3.5 w-3.5" />
        {copy.upload}
      </Button>
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : null}
    </span>
  );
}

/**
 * Business domains written under the old mini-program-shaped `domains`
 * object are surfaced on the official account form until re-saved.
 */
function legacyBusinessDomains(config: SdkworkIamOauthAccountConfig): string[] {
  return config.businessDomains && config.businessDomains.length > 0
    ? []
    : [...(config.domains?.business ?? [])];
}

/**
 * Secret input with generate and copy link actions underneath, mirroring the
 * WeChat console server-config flow.
 */
function OauthSecretField({
  copyLabel,
  copiedLabel,
  generate,
  generateLabel,
  label,
  onChange,
  placeholder,
  value,
}: {
  copyLabel: string;
  copiedLabel: string;
  generate: () => string;
  generateLabel: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) {
      return;
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(value)
        .then(() => setCopied(true))
        .catch(() => undefined);
    }
  };

  return (
    <div className="space-y-1.5">
      <OauthAdminField
        label={label}
        onChange={onChange}
        placeholder={placeholder}
        type="password"
        value={value}
      />
      <div className="flex items-center gap-4">
        <button
          className="text-xs font-medium text-blue-600 underline-offset-2 hover:underline"
          onClick={() => onChange(generate())}
          type="button"
        >
          {generateLabel}
        </button>
        <button
          className="text-xs font-medium text-[var(--sdk-color-text-secondary)] underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-50"
          disabled={!value}
          onClick={handleCopy}
          type="button"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * Dynamic list of domain inputs: one row per domain with an inline remove
 * action and an add-row button, mirroring the WeChat console domain lists.
 */
function OauthDomainListField({
  addLabel,
  label,
  onChange,
  placeholder,
  removeLabel,
  values,
}: {
  addLabel: string;
  label: string;
  onChange: (values: string[]) => void;
  placeholder: string;
  removeLabel: string;
  values: string[];
}) {
  const updateAt = (index: number, value: string) => {
    onChange(values.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const removeAt = (index: number) => {
    onChange(values.filter((_, itemIndex) => itemIndex !== index));
  };

  const addRow = () => {
    onChange([...values, ""]);
  };

  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-[var(--sdk-color-text-primary)]">{label}</div>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              className="h-9 flex-1"
              onChange={(event) => updateAt(index, event.target.value)}
              placeholder={placeholder}
              value={value}
            />
            <IconButton
              aria-label={removeLabel}
              onClick={() => removeAt(index)}
              title={removeLabel}
              variant="ghost"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </IconButton>
          </div>
        ))}
      </div>
      <Button onClick={addRow} size="sm" type="button" variant="outline">
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
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
