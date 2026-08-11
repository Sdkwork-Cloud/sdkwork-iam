import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Globe, MessageCircle, Plus, QrCode, ShieldCheck } from "lucide-react";
import {
  Button,
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
 * Service accounts (the backend only returns `service` type accounts) can
 * enable "scan to follow, follow to sign in": the login page then shows a
 * WeChat parameterized temp QR of that account. Exactly one account is active
 * at a time — the backend clears `qr_default_enabled` on every other account
 * when one is enabled. When no service account exists, an add action jumps to
 * the official-accounts management page with the add drawer open.
 */
export function OauthOfficialAccountScanLoginSection({
  accounts,
  busy,
  controller,
  onAddAccount,
  onChanged,
  onError,
  onPreview,
}: {
  accounts: SdkworkIamOauthScanLoginOfficialAccount[];
  busy: boolean;
  controller: SdkworkIamOauthAdminController;
  onAddAccount: () => void;
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
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--sdk-color-border-default)] px-6 py-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sdk-color-surface-panel-muted)] text-[var(--sdk-color-text-muted)]">
            <MessageCircle aria-hidden="true" className="h-6 w-6" />
          </span>
          <StatusNotice tone="default">{copy.accounts.emptyLabel}</StatusNotice>
          <Button onClick={onAddAccount} size="sm" type="button" variant="outline">
            <Plus aria-hidden="true" className="h-4 w-4" />
            {copy.accounts.addServiceAccount}
          </Button>
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection description={copy.accounts.enableHint} title={copy.accounts.title}>
      <div className="space-y-3">
        {accounts.map((account) => {
          const webhookReady = Boolean(account.webhook?.enabled);
          const active = account.qrLoginEnabled;
          return (
            <label
              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
                active
                  ? "border-[var(--sdk-color-brand-primary)] bg-[var(--sdk-color-brand-primary-soft)]"
                  : "border-[var(--sdk-color-border-default)] hover:border-[var(--sdk-color-border-strong)]"
              }`}
              key={account.accountId}
            >
              <span className="flex min-w-0 flex-1 items-start gap-3">
                <input
                  checked={active}
                  className="mt-1 h-4 w-4 accent-[var(--sdk-color-brand-primary)]"
                  disabled={busy}
                  name="oauth-scan-login-active-account"
                  onChange={() => toggleQrLogin(account, true)}
                  onClick={() => {
                    // Radios cannot be unchecked natively: clicking the
                    // already-active radio disables scan login for it, so the
                    // operator can turn the active account off.
                    if (active) {
                      toggleQrLogin(account, false);
                    }
                  }}
                  type="radio"
                />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] text-[var(--sdk-color-text-secondary)]">
                  <MessageCircle aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[var(--sdk-color-text-primary)]">
                      {account.displayName}
                    </span>
                    {active ? (
                      <StatusBadge
                        label={copy.currentActiveBadge}
                        showIcon
                        status="enabled"
                      />
                    ) : null}
                    {account.appId ? (
                      <code className="text-xs text-[var(--sdk-color-text-muted)]">{account.appId}</code>
                    ) : null}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-[var(--sdk-color-text-muted)]">
                    <StatusBadge
                      label={webhookReady ? copy.accounts.webhookReady : copy.accounts.webhookMissing}
                      showIcon
                      status={webhookReady ? "enabled" : "disabled"}
                    />
                    {account.webhook?.callbackUrl ? (
                      <code className="break-all">{account.webhook.callbackUrl}</code>
                    ) : null}
                  </span>
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-3">
                {active ? (
                  <Button
                    disabled={busy}
                    onClick={() => toggleQrLogin(account, false)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {copy.accounts.stopLogin}
                  </Button>
                ) : null}
                <Button
                  disabled={busy || !account.enabled}
                  loading={generating === account.accountId}
                  onClick={() => generatePreview(account.accountId)}
                  size="sm"
                  type="button"
                  variant={active ? "primary" : "outline"}
                >
                  {copy.accounts.generateLabel}
                </Button>
              </span>
            </label>
          );
        })}
      </div>
      <p className="text-xs text-[var(--sdk-color-text-muted)]">{copy.accounts.mutualExclusiveHint}</p>
      <Button onClick={onAddAccount} size="sm" type="button" variant="outline">
        <Plus aria-hidden="true" className="h-4 w-4" />
        {copy.accounts.addServiceAccount}
      </Button>
    </SettingsSection>
  );
}

/**
 * URL scan-login configuration: the H5 mobile login origin is edited as a
 * protocol choice (https/http) plus a domain, and the complete login URL is
 * previewed from the standard `{origin}/auth/login?session_key=...` shape.
 * Saving writes the assembled origin back to the backend.
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
  const [protocol, setProtocol] = useState("https");
  const [domain, setDomain] = useState("");
  const [urlEnabled, setUrlEnabled] = useState(settings.urlLogin.enabled);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Split the stored origin back into protocol + domain whenever the page
  // reloads settings from the backend.
  useEffect(() => {
    const origin = settings.urlLogin.h5LoginOrigin.trim();
    const match = /^(https?):\/\/([^/]+)/u.exec(origin);
    if (match) {
      setProtocol(match[1]);
      setDomain(match[2]);
    } else {
      setProtocol("https");
      setDomain(origin.replace(/^https?:\/\//u, ""));
    }
    setUrlEnabled(settings.urlLogin.enabled);
  }, [settings]);

  const origin = `${protocol}://${domain.trim()}`;
  // The preview shows the exact URL the login page encodes into the QR
  // (mirrors the backend url-mode generation).
  const loginUrl = domain.trim()
    ? `${origin}/auth/login?session_key=...&purpose=login&scan_source=qr`
    : "";

  const saveUrlSettings = () => {
    setSaving(true);
    void controller.updateScanLoginSettings({
      urlLogin: {
        enabled: urlEnabled,
        h5LoginOrigin: origin,
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

  const canSave = Boolean(domain.trim() && (protocol === "https" || protocol === "http"));
  const [copied, setCopied] = useState(false);
  // The login-path suffix is appended by the login page at QR time; it is
  // shown read-only on the same row as protocol + domain.
  const uriSuffix = "/auth/login?session_key=…&purpose=login&scan_source=qr";

  const copyLoginUrl = () => {
    void navigator.clipboard?.writeText(loginUrl)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  };

  return (
    <SettingsSection description={copy.url.titleHint} title={copy.url.title}>
      <div className="space-y-3">
        <div className="flex items-stretch overflow-hidden rounded-[0.75rem] border border-[var(--sdk-color-border-default)] focus-within:border-[var(--sdk-color-brand-primary)]">
          <select
            aria-label={copy.url.protocolLabel}
            className="shrink-0 border-r border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm outline-none"
            onChange={(event) => setProtocol(event.target.value)}
            value={protocol}
          >
            <option value="https">https</option>
            <option value="http">http</option>
          </select>
          <span className="flex items-center px-1 text-sm text-[var(--sdk-color-text-muted)]">://</span>
          <input
            aria-label={copy.url.domainLabel}
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[var(--sdk-color-text-muted)]"
            onChange={(event) => setDomain(event.target.value)}
            placeholder={copy.url.domainPlaceholder}
            value={domain}
          />
          <span className="flex shrink-0 items-center border-l border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-muted)] px-3 text-xs text-[var(--sdk-color-text-muted)]">
            {uriSuffix}
          </span>
        </div>
        {loginUrl ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--sdk-color-text-secondary)]">
              {copy.url.loginUrlPreview}
            </p>
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-muted)] px-3 py-2">
              <code className="min-w-0 flex-1 break-all text-xs text-[var(--sdk-color-text-primary)]">
                {loginUrl}
              </code>
              <Button disabled={!loginUrl} onClick={copyLoginUrl} size="sm" type="button" variant="outline">
                {copied ? copy.preview.copied : copy.preview.copy}
              </Button>
            </div>
          </div>
        ) : null}
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
            disabled={busy || saving || !canSave}
            loading={saving}
            onClick={saveUrlSettings}
            size="sm"
            type="button"
          >
            {copy.url.save}
          </Button>
          <Button
            disabled={busy || generating || !canSave}
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
