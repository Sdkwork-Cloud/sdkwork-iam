import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  Button,
  Label,
  SettingsSection,
  StatusBadge,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthAdminController,
  SdkworkIamOauthScanLoginOfficialAccount,
  SdkworkIamOauthScanLoginPreview,
  SdkworkIamOauthScanLoginQrMode,
  SdkworkIamOauthScanLoginSettings,
} from "../types/oauth-admin-types";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import { OauthAdminField } from "./oauth-admin-ui";

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
}: {
  accounts: SdkworkIamOauthScanLoginOfficialAccount[];
  busy: boolean;
  controller: SdkworkIamOauthAdminController;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const copy = messages.scanLogin;
  const [preview, setPreview] = useState<SdkworkIamOauthScanLoginPreview | undefined>();
  const [previewAccountId, setPreviewAccountId] = useState<string | undefined>();
  const [generating, setGenerating] = useState<string | undefined>();

  const generatePreview = (accountId: string) => {
    setGenerating(accountId);
    setPreview(undefined);
    setPreviewAccountId(accountId);
    void controller.generateScanLoginPreview("official_account", accountId)
      .then(setPreview)
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
      <StatusNotice tone="default">{copy.accounts.webhookCallbackHint}</StatusNotice>
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
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  disabled={busy}
                  onClick={() => toggleQrLogin(account, !account.qrLoginEnabled)}
                  size="sm"
                  type="button"
                  variant={account.qrLoginEnabled ? "outline" : "primary"}
                >
                  {account.qrLoginEnabled ? "已启用扫码登录" : "启用扫码登录"}
                </Button>
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
      {preview && previewAccountId ? (
        <OauthScanLoginPreview
          busy={busy}
          hint={copy.preview.officialAccountHint}
          preview={preview}
        />
      ) : null}
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
  settings,
}: {
  busy: boolean;
  controller: SdkworkIamOauthAdminController;
  onChanged: (settings: SdkworkIamOauthScanLoginSettings) => void;
  onError: (message: string) => void;
  settings: SdkworkIamOauthScanLoginSettings;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const copy = messages.scanLogin;
  const [h5LoginOrigin, setH5LoginOrigin] = useState(settings.urlLogin.h5LoginOrigin);
  const [urlEnabled, setUrlEnabled] = useState(settings.urlLogin.enabled);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<SdkworkIamOauthScanLoginPreview | undefined>();
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
      })
      .catch((error) => {
        onError(error instanceof Error ? error.message : "Failed to save URL configuration");
      })
      .finally(() => setSaving(false));
  };

  const generatePreview = () => {
    setGenerating(true);
    setPreview(undefined);
    void controller.generateScanLoginPreview("url")
      .then(setPreview)
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
          <input
            checked={urlEnabled}
            id="oauth-scan-login-url-enabled"
            onChange={(event) => setUrlEnabled(event.target.checked)}
            type="checkbox"
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
      {preview ? (
        <OauthScanLoginPreview busy={busy} hint={copy.preview.urlHint} preview={preview} />
      ) : null}
    </SettingsSection>
  );
}

/** Renders a generated scan-login QR (image URL or locally drawn QR code). */
export function OauthScanLoginPreview({
  busy,
  hint,
  preview,
}: {
  busy: boolean;
  hint: string;
  preview: SdkworkIamOauthScanLoginPreview;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const copy = messages.scanLogin.preview;
  const [copied, setCopied] = useState(false);
  const qrModeLabel = preview.qrMode === "official_account" ? "official_account" : "url";

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
    <div className="flex flex-wrap items-start gap-4 rounded border p-3">
      <div className="shrink-0">{qrImage}</div>
      <div className="min-w-0 flex-1 space-y-2">
        <Label>{copy.title}</Label>
        <StatusNotice tone="default">{hint}</StatusNotice>
        <div className="flex flex-wrap items-center gap-2">
          <code className="break-all text-xs text-[var(--sdk-color-text-muted)]">{preview.qrContent}</code>
          {preview.qrContent ? (
            <Button disabled={busy} onClick={copyContent} size="sm" type="button" variant="outline">
              {copied ? copy.copied : copy.copy}
            </Button>
          ) : null}
        </div>
        {preview.expireSeconds ? (
          <p className="text-xs text-[var(--sdk-color-text-muted)]">
            {copy.expireTemplate.replace("{seconds}", String(preview.expireSeconds))}
          </p>
        ) : null}
      </div>
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
