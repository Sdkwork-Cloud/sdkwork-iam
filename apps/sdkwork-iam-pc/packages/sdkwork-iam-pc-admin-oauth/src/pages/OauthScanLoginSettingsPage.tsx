import { useCallback, useEffect, useMemo, useState } from "react";
import { Globe, HelpCircle, MessageCircle, QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  StatusBadge,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthScanLoginPreview,
  SdkworkIamOauthScanLoginSettings,
} from "../types/oauth-admin-types";
import type { SdkworkIamOauthAdminPageProps } from "../types/oauth-admin-types";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import {
  OauthOfficialAccountScanLoginSection,
  OauthScanLoginPreviewContent,
  OauthUrlScanLoginSection,
  type OauthScanLoginNoticeHandler,
  type OauthScanLoginPreviewHandler,
} from "../components/oauth-scan-login-sections";
import { OauthAdminField, OauthAdminSelectField, OauthResourceDrawer } from "../components/oauth-admin-ui";

type ScanLoginModeKind = "official_account" | "url" | "provider";

/**
 * Scan login configuration surface.
 *
 * The operator picks the login mode with a radio choice (official-account
 * service accounts / H5 URL / third-party provider); selecting a mode saves
 * it as the only enabled mode and renders that mode's configuration form.
 * Service accounts can be added right here in a drawer (no navigation to the
 * official-accounts page), and exactly one account powers scan login at a
 * time. The selected mode is read back from the backend on every load.
 */
export function SdkworkIamOauthScanLoginSettingsPage({
  controller,
}: SdkworkIamOauthAdminPageProps) {
  const messages = useSdkworkIamOauthAdminMessages();
  const copy = messages.scanLogin;
  const [settings, setSettings] = useState<SdkworkIamOauthScanLoginSettings | undefined>();
  const [providerCatalog, setProviderCatalog] = useState<unknown[]>([]);
  const [activeMode, setActiveMode] = useState<ScanLoginModeKind>("official_account");
  const [providerCode, setProviderCode] = useState("");
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [addDraft, setAddDraft] = useState({ displayName: "", appId: "", appSecret: "", originalId: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const [preview, setPreview] = useState<SdkworkIamOauthScanLoginPreview | undefined>();
  const [previewHint, setPreviewHint] = useState<string>("");
  const [helpOpen, setHelpOpen] = useState(false);

  const load = useCallback(() => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    void Promise.all([
      controller.loadScanLoginSettings(),
      controller.load(["providerCatalog"]).then((snapshot) => snapshot.providerCatalog).catch(() => []),
    ])
      .then(([nextSettings, providers]) => {
        setSettings(nextSettings);
        setProviderCatalog(providers);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : copy.common.error);
      })
      .finally(() => setBusy(false));
  }, [controller, copy.common.error]);

  useEffect(() => {
    load();
  }, [load]);

  // The active mode is read back from the backend on every load: the pinned
  // defaultQrMode wins when it matches an enabled registry mode, otherwise
  // the first enabled mode; official-account scan login is the fallback.
  useEffect(() => {
    if (!settings) {
      return;
    }
    const preferred = settings.defaultQrMode;
    if (preferred !== "auto" && settings.modes.some((mode) => mode.enabled && mode.qrMode === preferred)) {
      setActiveMode(preferred === "official_account" || preferred === "url" ? preferred : "provider");
      return;
    }
    const firstEnabled = settings.modes.find((mode) => mode.enabled);
    if (firstEnabled?.qrMode === "url") {
      setActiveMode("url");
    } else if (firstEnabled?.mode === "provider") {
      setActiveMode("provider");
      setProviderCode(firstEnabled.providerCode ?? "");
    } else {
      setActiveMode("official_account");
    }
  }, [settings]);

  const providerOptions = useMemo(() => providerCatalog
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        code: String(record.providerCode ?? ""),
        name: String(record.displayName ?? "") || String(record.providerCode ?? ""),
      };
    })
    .filter((option) => Boolean(option.code))
    .sort((left, right) => left.code.localeCompare(right.code)), [providerCatalog]);

  const modeIcon = (mode: ScanLoginModeKind) => {
    if (mode === "official_account") {
      return <MessageCircle aria-hidden="true" className="h-5 w-5" />;
    }
    if (mode === "url") {
      return <Globe aria-hidden="true" className="h-5 w-5" />;
    }
    return <ShieldCheck aria-hidden="true" className="h-5 w-5" />;
  };

  const modeLabel = (mode: ScanLoginModeKind): string => {
    if (mode === "official_account") {
      return copy.modes.addKindOfficialAccount;
    }
    if (mode === "url") {
      return copy.modes.addKindUrl;
    }
    return copy.modes.addKindProvider;
  };

  const modeDescription = (mode: ScanLoginModeKind): string => {
    if (mode === "official_account") {
      return copy.modeCardDescriptions.officialAccount;
    }
    if (mode === "url") {
      return copy.modeCardDescriptions.url;
    }
    return copy.modeCardDescriptions.provider;
  };

  // Selecting a mode saves it as the only enabled scan-login mode; the
  // provider mode is saved once a provider is picked.
  const saveMode = (kind: ScanLoginModeKind, provider?: string) => {
    const qrMode = kind === "provider" ? `provider:${provider ?? ""}` : kind;
    const entry = kind === "provider"
      ? { enabled: true, mode: "provider", providerCode: provider ?? "", qrMode, sortOrder: 10 }
      : { enabled: true, mode: kind, qrMode, sortOrder: 10 };
    setBusy(true);
    void controller.updateScanLoginSettings({ modes: [entry] })
      .then((updated) => {
        setSettings(updated);
        setError(undefined);
        setNotice(copy.common.saveSuccess);
      })
      .catch((saveError) => {
        setError(saveError instanceof Error ? saveError.message : copy.common.error);
      })
      .finally(() => setBusy(false));
  };

  const selectMode = (mode: ScanLoginModeKind) => {
    setActiveMode(mode);
    if (mode !== "provider") {
      saveMode(mode);
    }
  };

  const saveProviderMode = () => {
    if (!providerCode.trim()) {
      return;
    }
    saveMode("provider", providerCode.trim());
  };

  const handlePreview: OauthScanLoginPreviewHandler = useCallback((nextPreview, hint) => {
    setPreview(nextPreview);
    setPreviewHint(hint);
  }, []);

  const handleNotice: OauthScanLoginNoticeHandler = useCallback((message) => {
    setNotice(message);
  }, []);

  const generateProviderPreview = () => {
    if (!providerCode.trim()) {
      return;
    }
    setBusy(true);
    void controller.generateScanLoginPreview(`provider:${providerCode.trim()}`)
      .then((nextPreview) => handlePreview(nextPreview, copy.preview.urlHint))
      .catch((generateError) => {
        setError(generateError instanceof Error ? generateError.message : copy.common.error);
      })
      .finally(() => setBusy(false));
  };

  const canSubmitAdd = Boolean(
    addDraft.displayName.trim() && addDraft.appId.trim() && addDraft.appSecret.trim(),
  );

  const saveAddAccount = () => {
    if (!canSubmitAdd) {
      return;
    }
    setBusy(true);
    void controller.createAccountSetup("official_account", {
      accountType: "service",
      appId: addDraft.appId.trim(),
      appSecret: addDraft.appSecret.trim(),
      displayName: addDraft.displayName.trim(),
      enabled: true,
      originalId: addDraft.originalId.trim(),
      redirectUri: "",
    })
      .then(() => {
        setAddDrawerOpen(false);
        setAddDraft({ displayName: "", appId: "", appSecret: "", originalId: "" });
        setError(undefined);
        setNotice(copy.accounts.addSuccess);
        load();
      })
      .catch((addError) => {
        setError(addError instanceof Error ? addError.message : copy.common.error);
      })
      .finally(() => setBusy(false));
  };

  const modeRadios: ScanLoginModeKind[] = ["official_account", "url", "provider"];

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--sdk-color-text-primary)]">{copy.title}</h2>
        <div className="flex items-center gap-1">
          <Button onClick={() => setHelpOpen(true)} size="sm" type="button" variant="ghost">
            <HelpCircle aria-hidden="true" className="h-4 w-4" />
            {copy.help.title}
          </Button>
          <Button disabled={busy} onClick={load} size="sm" type="button" variant="outline">
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            {copy.common.refresh}
          </Button>
        </div>
      </div>
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}
      {busy && !settings ? (
        <StatusNotice tone="default">{copy.common.loading}</StatusNotice>
      ) : null}
      {settings ? (
        <>
          <div className="space-y-2">
            <span className="text-sm font-medium text-[var(--sdk-color-text-secondary)]">
              {copy.currentModeLabel}
            </span>
            <div className="space-y-2">
              {modeRadios.map((mode) => {
                const selected = mode === activeMode;
                return (
                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                      selected
                        ? "border-[var(--sdk-color-brand-primary)] bg-[var(--sdk-color-brand-primary-soft)]"
                        : "border-[var(--sdk-color-border-default)] hover:border-[var(--sdk-color-border-strong)]"
                    }`}
                    key={mode}
                  >
                    <input
                      checked={selected}
                      className="mt-1 h-4 w-4 accent-[var(--sdk-color-brand-primary)]"
                      disabled={busy}
                      name="oauth-scan-login-mode"
                      onChange={() => selectMode(mode)}
                      type="radio"
                    />
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        selected
                          ? "bg-[var(--sdk-color-brand-primary)] text-white"
                          : "bg-[var(--sdk-color-surface-panel-muted)] text-[var(--sdk-color-text-secondary)]"
                      }`}
                    >
                      {modeIcon(mode)}
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[var(--sdk-color-text-primary)]">
                          {modeLabel(mode)}
                        </span>
                        {selected ? (
                          <StatusBadge label={copy.currentActiveBadge} showIcon status="enabled" />
                        ) : null}
                      </span>
                      <span className="block text-xs text-[var(--sdk-color-text-muted)]">
                        {modeDescription(mode)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {activeMode === "official_account" ? (
            <OauthOfficialAccountScanLoginSection
              accounts={settings.officialAccounts}
              busy={busy}
              controller={controller}
              onAddAccount={() => setAddDrawerOpen(true)}
              onChanged={() => {
                setError(undefined);
                load();
              }}
              onError={setError}
              onPreview={handlePreview}
            />
          ) : null}
          {activeMode === "url" ? (
            <OauthUrlScanLoginSection
              busy={busy}
              controller={controller}
              onChanged={(updated) => {
                setError(undefined);
                setSettings(updated);
              }}
              onError={setError}
              onNotice={handleNotice}
              onPreview={handlePreview}
              settings={settings}
            />
          ) : null}
          {activeMode === "provider" ? (
            <div className="flex flex-col gap-3 rounded-lg border border-[var(--sdk-color-border-default)] p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-72">
                  <OauthAdminSelectField
                    label={copy.providerSelectLabel}
                    onChange={(value) => {
                      setProviderCode(value);
                      if (value) {
                        saveMode("provider", value);
                      }
                    }}
                    options={[
                      { label: copy.providerSelectPlaceholder, value: "" },
                      ...providerOptions.map((option) => ({
                        label: `${option.name} (${option.code})`,
                        value: option.code,
                      })),
                    ]}
                    value={providerCode}
                  />
                </div>
                <Button
                  disabled={busy || !providerCode.trim()}
                  loading={busy}
                  onClick={generateProviderPreview}
                  size="sm"
                  type="button"
                >
                  <QrCode aria-hidden="true" className="h-4 w-4" />
                  {copy.accounts.generateLabel}
                </Button>
              </div>
              <p className="text-xs text-[var(--sdk-color-text-muted)]">{copy.providerModeHint}</p>
            </div>
          ) : null}
        </>
      ) : null}

      <OauthResourceDrawer
        confirmDisabled={busy || !canSubmitAdd}
        confirmLabel={copy.accounts.addServiceAccount}
        confirmLoading={busy}
        description={copy.accounts.addDescription}
        onConfirm={saveAddAccount}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setAddDrawerOpen(false);
          }
        }}
        open={addDrawerOpen}
        triggerLabel={copy.accounts.addServiceAccount}
      >
        <OauthAdminField
          label={copy.quickSetupOfficialAccountFields.displayName}
          onChange={(displayName) => setAddDraft((current) => ({ ...current, displayName }))}
          placeholder={copy.quickSetupOfficialAccountFields.displayNamePlaceholder}
          value={addDraft.displayName}
        />
        <OauthAdminField
          label={copy.quickSetupOfficialAccountFields.appId}
          onChange={(appId) => setAddDraft((current) => ({ ...current, appId }))}
          placeholder={copy.quickSetupOfficialAccountFields.appIdPlaceholder}
          value={addDraft.appId}
        />
        <OauthAdminField
          label={copy.quickSetupOfficialAccountFields.appSecret}
          onChange={(appSecret) => setAddDraft((current) => ({ ...current, appSecret }))}
          placeholder={copy.quickSetupOfficialAccountFields.appSecretPlaceholder}
          type="password"
          value={addDraft.appSecret}
        />
        <OauthAdminField
          label={copy.quickSetupOriginalIdLabel}
          onChange={(originalId) => setAddDraft((current) => ({ ...current, originalId }))}
          placeholder={copy.quickSetupOriginalIdPlaceholder}
          value={addDraft.originalId}
        />
      </OauthResourceDrawer>

      <Drawer
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) {
            setPreview(undefined);
          }
        }}
      >
        <DrawerContent size="md">
          <DrawerHeader>
            <DrawerTitle>{copy.preview.title}</DrawerTitle>
            {previewHint ? <DrawerDescription>{previewHint}</DrawerDescription> : null}
          </DrawerHeader>
          <DrawerBody>
            {preview ? <OauthScanLoginPreviewContent busy={busy} preview={preview} /> : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <Modal open={helpOpen} onOpenChange={setHelpOpen}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>{copy.help.title}</ModalTitle>
            <ModalDescription>{copy.help.description}</ModalDescription>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">{copy.accounts.title}</h3>
              <p className="text-sm text-[var(--sdk-color-text-secondary)]">{copy.accounts.enableHint}</p>
              <p className="text-sm text-[var(--sdk-color-text-secondary)]">{copy.accounts.webhookCallbackHint}</p>
            </section>
            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">{copy.url.title}</h3>
              <p className="text-sm text-[var(--sdk-color-text-secondary)]">{copy.url.titleHint}</p>
              <p className="text-sm text-[var(--sdk-color-text-secondary)]">{copy.url.h5LoginOriginHint}</p>
            </section>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
