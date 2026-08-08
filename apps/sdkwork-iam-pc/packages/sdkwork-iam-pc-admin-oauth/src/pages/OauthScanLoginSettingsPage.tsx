import { useCallback, useEffect, useState } from "react";
import { HelpCircle, RefreshCw } from "lucide-react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
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
  OauthScanLoginModesSection,
  OauthScanLoginPreviewContent,
  OauthUrlScanLoginSection,
  type OauthScanLoginNoticeHandler,
  type OauthScanLoginPreviewHandler,
} from "../components/oauth-scan-login-sections";

/**
 * Scan login configuration surface.
 *
 * Two scan-login modes for the login page QR panel:
 * 1. **official_account** — WeChat parameterized temp QR of an enabled
 *    official account; scanning follows the account (or confirms an
 *    existing follow) and completes the login via the message webhook.
 * 2. **url** — QR content is the H5 mobile login page URL; the user signs
 *    in on their phone (WeChat in-app browsers use official account
 *    authorization automatically).
 *
 * The configurable mode registry (`modes`) drives which QR modes the login
 * page offers and in which order; third-party OAuth providers (`provider:
 * <code>`) can be added without code changes.
 *
 * All sections report generated QR previews and transient success notices
 * to this page: previews open in a single shared drawer so the page layout
 * never shifts while a QR is being generated.
 */
export function SdkworkIamOauthScanLoginSettingsPage({
  controller,
}: SdkworkIamOauthAdminPageProps) {
  const messages = useSdkworkIamOauthAdminMessages();
  const copy = messages.scanLogin;
  const [settings, setSettings] = useState<SdkworkIamOauthScanLoginSettings | undefined>();
  const [providerCatalog, setProviderCatalog] = useState<unknown[]>([]);
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

  const handlePreview: OauthScanLoginPreviewHandler = useCallback((nextPreview, hint) => {
    setPreview(nextPreview);
    setPreviewHint(hint);
  }, []);

  const handleNotice: OauthScanLoginNoticeHandler = useCallback((message) => {
    setNotice(message);
  }, []);

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
          <OauthScanLoginModesSection
            busy={busy}
            controller={controller}
            modes={settings.modes}
            onChanged={(updated) => {
              setError(undefined);
              setSettings(updated);
            }}
            onError={setError}
            onNotice={handleNotice}
            onPreview={handlePreview}
            providerCatalog={providerCatalog}
          />
          <OauthOfficialAccountScanLoginSection
            accounts={settings.officialAccounts}
            busy={busy}
            controller={controller}
            onChanged={() => {
              setError(undefined);
              load();
            }}
            onError={setError}
            onPreview={handlePreview}
          />
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
        </>
      ) : null}
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
              <h3 className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">{copy.modes.title}</h3>
              <p className="text-sm text-[var(--sdk-color-text-secondary)]">{copy.modes.defaultHint}</p>
            </section>
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
