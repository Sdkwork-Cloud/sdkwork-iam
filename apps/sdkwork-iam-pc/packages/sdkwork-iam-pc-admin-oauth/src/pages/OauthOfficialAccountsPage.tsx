import { useEffect, useMemo, useState } from "react";
import { StatusNotice } from "@sdkwork/ui-pc-react";

import type { SdkworkIamOauthAdminController } from "../types/oauth-admin-types";
import { useOauthAdminPageState } from "../hooks/use-oauth-admin-page-state";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import { OauthAccountSetupSection } from "../components/oauth-account-setup-section";
import { readResourceAccountKind } from "../utils/oauth-admin-utils";

/**
 * Official (service) account management.
 *
 * Accounts are `iam_oauth_resource_account` rows with
 * `resourceAccountKind = "official_account"`. Saving an account auto-creates
 * or reuses the `wechat` web-authorization login integration; enabling it
 * shows the WeChat login entry on the login page immediately.
 *
 * `?open=add` in the URL (e.g. jumped from the scan-login settings page)
 * opens the add-account drawer automatically on mount. When the host provides
 * `onOpenCustomMenu`, every official account row gains a custom menu manager
 * action.
 */
export function SdkworkIamOauthOfficialAccountsPage({
  controller,
  onOpenCustomMenu,
}: {
  controller: SdkworkIamOauthAdminController;
  onOpenCustomMenu?: (resourceAccountId: string) => void;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const { data, disabled, error, listPageInfo, status, sync } = useOauthAdminPageState(controller, [
    "resourceAccounts",
    "integrations",
  ]);
  const [initialOpen, setInitialOpen] = useState(false);
  const accounts = useMemo(
    () => data.resourceAccounts.filter((item) => readResourceAccountKind(item) === "official_account"),
    [data.resourceAccounts],
  );
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("open") === "add") {
      setInitialOpen(true);
    }
  }, []);
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      <OauthAccountSetupSection
        accounts={accounts}
        common={messages.common}
        controller={controller}
        disabled={disabled}
        initialOpen={initialOpen}
        kind="official_account"
        listPageInfo={listPageInfo?.resourceAccounts}
        messages={messages.quickSetup.officialAccounts}
        onChanged={sync}
        onOpenCustomMenu={onOpenCustomMenu}
        status={status}
        switchMessages={messages.quickSetup.accountSwitch}
      />
    </div>
  );
}
