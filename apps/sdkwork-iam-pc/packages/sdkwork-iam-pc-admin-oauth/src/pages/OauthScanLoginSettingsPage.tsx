import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button, StatusNotice } from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthScanLoginSettings,
} from "../types/oauth-admin-types";
import type { SdkworkIamOauthAdminPageProps } from "../types/oauth-admin-types";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import {
  OauthOfficialAccountScanLoginSection,
  OauthUrlScanLoginSection,
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
 */
export function SdkworkIamOauthScanLoginSettingsPage({
  controller,
}: SdkworkIamOauthAdminPageProps) {
  const messages = useSdkworkIamOauthAdminMessages();
  const copy = messages.scanLogin;
  const [settings, setSettings] = useState<SdkworkIamOauthScanLoginSettings | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const load = useCallback(() => {
    setBusy(true);
    setError(undefined);
    void controller.loadScanLoginSettings()
      .then(setSettings)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : copy.common.error);
      })
      .finally(() => setBusy(false));
  }, [controller, copy.common.error]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--sdk-color-text-primary)]">{copy.title}</h2>
        <Button disabled={busy} onClick={load} size="sm" type="button" variant="outline">
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          {copy.common.refresh}
        </Button>
      </div>
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      {busy && !settings ? (
        <StatusNotice tone="default">{copy.common.loading}</StatusNotice>
      ) : null}
      {settings ? (
        <>
          <OauthOfficialAccountScanLoginSection
            accounts={settings.officialAccounts}
            busy={busy}
            controller={controller}
            onChanged={() => {
              setError(undefined);
              load();
            }}
            onError={setError}
          />
          <OauthUrlScanLoginSection
            busy={busy}
            controller={controller}
            onChanged={(updated) => {
              setError(undefined);
              setSettings(updated);
            }}
            onError={setError}
            settings={settings}
          />
        </>
      ) : null}
    </div>
  );
}
