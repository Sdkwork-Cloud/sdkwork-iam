import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { ArrowDown, ArrowUp, QrCode, Trash2 } from "lucide-react";
import {
  Button,
  ConfirmDialog,
  IconButton,
  SettingsSection,
  StatusBadge,
  StatusNotice,
  Switch,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthAdminController,
  SdkworkIamOauthScanLoginModeEntry,
  SdkworkIamOauthScanLoginOfficialAccount,
  SdkworkIamOauthScanLoginPreview,
  SdkworkIamOauthScanLoginSettings,
} from "../types/oauth-admin-types";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import { OauthAdminField, OauthAdminSelectField } from "./oauth-admin-ui";

/** Reports a generated scan-login preview to the page-level preview drawer. */
export type OauthScanLoginPreviewHandler = (
  preview: SdkworkIamOauthScanLoginPreview,
  hint: string,
) => void;

/** Reports a transient success message shown at page level. */
export type OauthScanLoginNoticeHandler = (message: string) => void;

/**
 * Official-account scan login configuration.
 *
 * Each enabled official account can enable "scan to follow, follow to sign
 * in": the login page then shows a WeChat parameterized temp QR of that
 * account. The message callback (webhook) state is surfaced so the WeChat
 * console server configuration can be completed.
 */
export function OauthOfficialAccountScanLoginSection({
  accounts,
  busy,
  controller,
  onChanged,
  onError,
  onPreview,
}: {
  accounts: SdkworkIamOauthScanLoginOfficialAccount[];
  busy: boolean;
  controller: SdkworkIamOauthAdminController;
  onChanged: () => void;
  onError: (message: string) => void;
  onPreview: OauthScanLoginPreviewHandler;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const copy = messages.scanLogin;
  const [generating, setGenerating] = useState<string | undefined>();

  const generatePreview = (accountId: string) => {
    setGenerating(accountId);
    void controller.generateScanLoginPreview("official_account", accountId)
      .then((preview) => onPreview(preview, copy.preview.officialAccountHint))
      .catch((error) => {
        onError(error instanceof Error ? error.message : "Failed to generate QR code");
      })
      .finally(() => setGenerating(undefined));
  };

  const toggleQrLogin = (account: SdkworkIamOauthScanLoginOfficialAccount, enabled: boolean) => {
    void controller.setResourceAccountQrLogin(account.accountId, enabled)
      .then(onChanged)
      .catch((error) => {
        onError(error instanceof Error ? error.message : "Failed to update scan login state");
      });
  };

  if (accounts.length === 0) {
    return (
      <SettingsSection description={copy.accounts.noAccountHint} title={copy.accounts.title}>
        <StatusNotice tone="default">{copy.accounts.emptyLabel}</StatusNotice>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection description={copy.accounts.enableHint} title={copy.accounts.title}>
      <div className="space-y-3">
        {accounts.map((account) => {
          const webhookReady = Boolean(account.webhook?.enabled);
          return (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"
              key={account.accountId}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[var(--sdk-color-text-primary)]">
                    {account.displayName}
                  </span>
                  {account.appId ? (
                    <code className="text-xs text-[var(--sdk-color-text-muted)]">{account.appId}</code>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--sdk-color-text-muted)]">
                  <StatusBadge
                    label={webhookReady ? copy.accounts.webhookReady : copy.accounts.webhookMissing}
                    showIcon
                    status={webhookReady ? "enabled" : "disabled"}
                  />
                  {account.webhook?.callbackUrl ? (
                    <code className="break-all">{account.webhook.callbackUrl}</code>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Switch
                  aria-label={account.qrLoginEnabled ? copy.accounts.disableLogin : copy.accounts.enableLogin}
                  checked={account.qrLoginEnabled}
                  disabled={busy}
                  onCheckedChange={(enabled) => toggleQrLogin(account, enabled)}
                  title={account.qrLoginEnabled ? copy.accounts.disableLogin : copy.accounts.enableLogin}
                />
                <Button
                  disabled={busy || !account.enabled}
                  loading={generating === account.accountId}
                  onClick={() => generatePreview(account.accountId)}
                  size="sm"
                  type="button"
                >
                  {copy.accounts.generateLabel}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </SettingsSection>
  );
}

/**
 * URL scan-login configuration: the H5 mobile login origin plus an
 * enable switch. The generated QR content is the H5 login page URL.
 */
export function OauthUrlScanLoginSection({
  busy,
  controller,
  onChanged,
  onError,
  onNotice,
  onPreview,
  settings,
}: {
  busy: boolean;
  controller: SdkworkIamOauthAdminController;
  onChanged: (settings: SdkworkIamOauthScanLoginSettings) => void;
  onError: (message: string) => void;
  onNotice: OauthScanLoginNoticeHandler;
  onPreview: OauthScanLoginPreviewHandler;
  settings: SdkworkIamOauthScanLoginSettings;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const copy = messages.scanLogin;
  const [h5LoginOrigin, setH5LoginOrigin] = useState(settings.urlLogin.h5LoginOrigin);
  const [urlEnabled, setUrlEnabled] = useState(settings.urlLogin.enabled);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Sync local draft when the page reloads settings.
  useEffect(() => {
    setH5LoginOrigin(settings.urlLogin.h5LoginOrigin);
    setUrlEnabled(settings.urlLogin.enabled);
  }, [settings]);

  const saveUrlSettings = () => {
    setSaving(true);
    void controller.updateScanLoginSettings({
      urlLogin: {
        enabled: urlEnabled,
        h5LoginOrigin: h5LoginOrigin.trim(),
      },
    })
      .then((updated) => {
        onChanged(updated);
        onError("");
        onNotice(copy.common.saveSuccess);
      })
      .catch((error) => {
        onError(error instanceof Error ? error.message : "Failed to save URL configuration");
      })
      .finally(() => setSaving(false));
  };

  const generatePreview = () => {
    setGenerating(true);
    void controller.generateScanLoginPreview("url")
      .then((preview) => onPreview(preview, copy.preview.urlHint))
      .catch((error) => {
        onError(error instanceof Error ? error.message : "Failed to generate QR code");
      })
      .finally(() => setGenerating(false));
  };

  return (
    <SettingsSection description={copy.url.titleHint} title={copy.url.title}>
      <div className="space-y-3">
        <OauthAdminField
          label={copy.url.h5LoginOrigin}
          onChange={setH5LoginOrigin}
          placeholder={copy.url.h5LoginOriginPlaceholder}
          type="url"
          value={h5LoginOrigin}
        />
        <p className="text-xs text-[var(--sdk-color-text-muted)]">{copy.url.h5LoginOriginHint}</p>
        <label className="flex items-center gap-2 text-sm" htmlFor="oauth-scan-login-url-enabled">
          <Switch
            aria-label={copy.url.enabledLabel}
            checked={urlEnabled}
            disabled={busy}
            id="oauth-scan-login-url-enabled"
            onCheckedChange={setUrlEnabled}
          />
          {copy.url.enabledLabel}
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy || saving}
            loading={saving}
            onClick={saveUrlSettings}
            size="sm"
            type="button"
          >
            {copy.url.save}
          </Button>
          <Button
            disabled={busy || generating || !h5LoginOrigin.trim()}
            loading={generating}
            onClick={generatePreview}
            size="sm"
            type="button"
          >
            {copy.url.generateLabel}
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}

/** Renders a generated scan-login QR inside the page-level preview drawer. */
export function OauthScanLoginPreviewContent({
  busy,
  preview,
}: {
  busy: boolean;
  preview: SdkworkIamOauthScanLoginPreview;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const copy = messages.scanLogin.preview;
  const [copied, setCopied] = useState(false);

  const copyContent = () => {
    void navigator.clipboard?.writeText(preview.qrContent)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  };

  const qrImage = useMemo(() => {
    if (preview.qrCode) {
      return <img alt="Scan login QR" className="h-52 w-52 rounded border object-contain" src={preview.qrCode} />;
    }
    if (preview.qrContent) {
      return <QrCodeCanvasSvg content={preview.qrContent} />;
    }
    return null;
  }, [preview]);

  return (
    <div className="space-y-4">
      <div className="flex justify-center">{qrImage}</div>
      {preview.qrContent ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 break-all text-xs text-[var(--sdk-color-text-muted)]">{preview.qrContent}</code>
          <Button disabled={busy} onClick={copyContent} size="sm" type="button" variant="outline">
            {copied ? copy.copied : copy.copy}
          </Button>
        </div>
      ) : null}
      {preview.expireSeconds ? (
        <p className="text-xs text-[var(--sdk-color-text-muted)]">
          {copy.expireTemplate.replace("{seconds}", String(preview.expireSeconds))}
        </p>
      ) : null}
    </div>
  );
}

/** Locally rendered QR code canvas for URL scan-login content. */
function QrCodeCanvasSvg({ content }: { content: string }) {
  const [dataUrl, setDataUrl] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(content, {
      color: { dark: "#111827", light: "#ffffff" },
      errorCorrectionLevel: "M",
      margin: 1,
      width: 208,
    })
      .then((rendered) => {
        if (!cancelled) {
          setDataUrl(rendered);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(undefined);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [content]);

  if (!dataUrl) {
    return (
      <div className="flex h-52 w-52 items-center justify-center rounded border text-xs text-[var(--sdk-color-text-muted)]">
        QR unavailable
      </div>
    );
  }
  return <img alt="Scan login URL QR" className="h-52 w-52 rounded border object-contain" src={dataUrl} />;
}

type AddModeKind = "official_account" | "url" | "provider" | "";

/**
 * Scan-login mode registry management: ordered, enable/disable, add and
 * remove modes (official account follow login, H5 URL, third-party OAuth
 * provider). The login page shows the first enabled mode by default and
 * lets users rotate through the rest.
 */
export function OauthScanLoginModesSection({
  busy,
  controller,
  modes,
  onChanged,
  onError,
  onNotice,
  onPreview,
  providerCatalog,
}: {
  busy: boolean;
  controller: SdkworkIamOauthAdminController;
  modes: SdkworkIamOauthScanLoginModeEntry[];
  onChanged: (settings: SdkworkIamOauthScanLoginSettings) => void;
  onError: (message: string) => void;
  onNotice: OauthScanLoginNoticeHandler;
  onPreview: OauthScanLoginPreviewHandler;
  providerCatalog: unknown[];
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const copy = messages.scanLogin.modes;
  const [addKind, setAddKind] = useState<AddModeKind>("");
  const [providerCode, setProviderCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | undefined>();
  const [generating, setGenerating] = useState<string | undefined>();

  const providerOptions = useMemo(() => providerCatalog
    .map((item) => {
      const record = toRecord(item);
      return {
        code: optionalString(record.providerCode) || "",
        name: optionalString(record.displayName) || optionalString(record.providerCode) || "",
      };
    })
    .filter((option) => Boolean(option.code))
    .sort((left, right) => left.code.localeCompare(right.code)), [providerCatalog]);

  const saveModes = (next: SdkworkIamOauthScanLoginModeEntry[]) => {
    setSaving(true);
    void controller.updateScanLoginSettings({ modes: next })
      .then((updated) => {
        onChanged(updated);
        onError("");
        onNotice(messages.scanLogin.common.saveSuccess);
      })
      .catch((error) => {
        onError(error instanceof Error ? error.message : "Failed to update scan login modes");
      })
      .finally(() => setSaving(false));
  };

  const move = (index: number, delta: number) => {
    const next = [...modes];
    const target = index + delta;
    if (target < 0 || target >= next.length) {
      return;
    }
    const [entry] = next.splice(index, 1);
    next.splice(target, 0, entry);
    saveModes(next);
  };

  const toggleEnabled = (index: number) => {
    const next = modes.map((mode, modeIndex) => (
      modeIndex === index ? { ...mode, enabled: !mode.enabled } : mode
    ));
    saveModes(next);
  };

  const remove = (index: number) => {
    const next = modes.filter((_, modeIndex) => modeIndex !== index);
    saveModes(next);
  };

  const addMode = (mode: SdkworkIamOauthScanLoginModeEntry) => {
    const nextSortOrder = modes.reduce((max, entry) => Math.max(max, entry.sortOrder), 0) + 10;
    saveModes([...modes, { ...mode, sortOrder: nextSortOrder }]);
  };

  const addSelectedKind = () => {
    if (addKind === "official_account") {
      addMode({
        displayName: undefined,
        enabled: true,
        mode: "official_account",
        providerCode: undefined,
        qrMode: "official_account",
        sortOrder: 999,
      });
    } else if (addKind === "url") {
      addMode({
        displayName: undefined,
        enabled: true,
        mode: "url",
        providerCode: undefined,
        qrMode: "url",
        sortOrder: 999,
      });
    } else if (addKind === "provider") {
      const code = providerCode.trim();
      if (!code) {
        return;
      }
      addMode({
        displayName: undefined,
        enabled: true,
        mode: "provider",
        providerCode: code,
        qrMode: `provider:${code}`,
        sortOrder: 999,
      });
      setProviderCode("");
    } else {
      return;
    }
    setAddKind("");
  };

  const addProviderMode = (option: { code: string; name: string }) => {
    addMode({
      displayName: option.name,
      enabled: true,
      mode: "provider",
      providerCode: option.code,
      qrMode: `provider:${option.code}`,
      sortOrder: 999,
    });
  };

  const generatePreview = (qrMode: string) => {
    setGenerating(qrMode);
    void controller.generateScanLoginPreview(qrMode)
      .then((preview) => onPreview(preview, previewHint(qrMode)))
      .catch((error) => {
        onError(error instanceof Error ? error.message : "Failed to generate QR code");
      })
      .finally(() => setGenerating(undefined));
  };

  const modeLabel = (entry: SdkworkIamOauthScanLoginModeEntry): string => {
    if (entry.displayName) {
      return entry.displayName;
    }
    if (entry.mode === "official_account") {
      return messages.scanLogin.accounts.title;
    }
    if (entry.mode === "provider") {
      return entry.providerCode ? `${copy.providerModeLabel} · ${entry.providerCode}` : copy.providerModeLabel;
    }
    return messages.scanLogin.url.title;
  };

  const previewHint = (qrMode: string): string => {
    if (qrMode === "provider" || qrMode.startsWith("provider:")) {
      return messages.scanLogin.preview.urlHint;
    }
    if (qrMode === "official_account") {
      return messages.scanLogin.preview.officialAccountHint;
    }
    return messages.scanLogin.preview.urlHint;
  };

  const addDisabled = busy || saving || addKind === "" || (addKind === "provider" && !providerCode.trim());

  return (
    <SettingsSection description={copy.defaultHint} title={copy.title}>
      {modes.length === 0 ? (
        <StatusNotice tone="default">{copy.emptyHint}</StatusNotice>
      ) : (
        <div className="space-y-2">
          {modes.map((entry, index) => (
            <div
              className="flex flex-wrap items-center justify-between gap-2 rounded border p-2"
              key={`${entry.qrMode}-${index}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="text-xs text-[var(--sdk-color-text-muted)]">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{modeLabel(entry)}</span>
                {entry.mode === "provider" && entry.providerCode ? (
                  <code className="text-xs text-[var(--sdk-color-text-muted)]">{entry.providerCode}</code>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <IconButton
                  aria-label={copy.moveUp}
                  disabled={busy || saving || index === 0}
                  onClick={() => move(index, -1)}
                  title={copy.moveUp}
                  type="button"
                  variant="outline"
                >
                  <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  aria-label={copy.moveDown}
                  disabled={busy || saving || index === modes.length - 1}
                  onClick={() => move(index, 1)}
                  title={copy.moveDown}
                  type="button"
                  variant="outline"
                >
                  <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  aria-label={messages.scanLogin.accounts.generateLabel}
                  disabled={busy || saving}
                  loading={generating === entry.qrMode}
                  onClick={() => generatePreview(entry.qrMode)}
                  title={messages.scanLogin.accounts.generateLabel}
                  type="button"
                >
                  <QrCode aria-hidden="true" className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  aria-label={copy.remove}
                  disabled={busy || saving}
                  onClick={() => setPendingRemoveIndex(index)}
                  title={copy.remove}
                  type="button"
                  variant="outline"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                </IconButton>
                <Switch
                  aria-label={entry.enabled ? copy.disable : copy.enable}
                  checked={entry.enabled}
                  disabled={busy || saving}
                  onCheckedChange={() => toggleEnabled(index)}
                  title={entry.enabled ? copy.disable : copy.enable}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-56">
          <OauthAdminSelectField
            label={copy.addKindLabel}
            onChange={(value) => setAddKind(value as AddModeKind)}
            options={[
              { label: copy.addKindPlaceholder, value: "" },
              { label: copy.addKindOfficialAccount, value: "official_account" },
              { label: copy.addKindUrl, value: "url" },
              { label: copy.addKindProvider, value: "provider" },
            ]}
            value={addKind}
          />
        </div>
        {addKind === "provider" ? (
          <div className="w-72">
            <OauthAdminField
              label={copy.addProvider}
              onChange={setProviderCode}
              placeholder={copy.addProviderPlaceholder}
              value={providerCode}
            />
          </div>
        ) : null}
        <Button disabled={addDisabled} loading={saving} onClick={addSelectedKind} size="sm" type="button">
          {copy.add}
        </Button>
      </div>
      {addKind === "provider" && providerOptions.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {providerOptions.map((option) => (
            <Button
              disabled={busy || saving || modes.some((mode) => mode.providerCode === option.code)}
              key={option.code}
              onClick={() => addProviderMode(option)}
              size="sm"
              type="button"
              variant="outline"
            >
              {option.name}
            </Button>
          ))}
        </div>
      ) : null}
      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={copy.removeConfirm}
        confirmLoading={saving}
        description={pendingRemoveIndex === undefined ? undefined : copy.removeDescriptionTemplate.replace("{name}", modeLabel(modes[pendingRemoveIndex]))}
        onConfirm={() => {
          if (pendingRemoveIndex === undefined) {
            return;
          }
          remove(pendingRemoveIndex);
          setPendingRemoveIndex(undefined);
        }}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setPendingRemoveIndex(undefined);
          }
        }}
        open={pendingRemoveIndex !== undefined}
        title={copy.removeTitle}
        tone="danger"
      />
    </SettingsSection>
  );
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
}
