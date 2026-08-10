import { useMemo } from "react";
import { StatusNotice } from "@sdkwork/ui-pc-react";

import type { SdkworkIamOauthAdminController } from "../types/oauth-admin-types";
import { useOauthAdminPageState } from "../hooks/use-oauth-admin-page-state";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import { OauthAccountSetupSection } from "../components/oauth-account-setup-section";
import { readResourceAccountKind } from "../utils/oauth-admin-utils";

/**
 * Mini program account management.
 *
 * Accounts are `iam_oauth_resource_account` rows with
 * `resourceAccountKind = "mini_program"`. Saving an account auto-creates or
 * reuses the `wechat_mini_program` login integration; enabling it makes the
 * mini program login available immediately.
 */
export function SdkworkIamOauthMiniProgramAccountsPage({
  controller,
}: {
  controller: SdkworkIamOauthAdminController;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const { data, disabled, error, listPageInfo, status, sync } = useOauthAdminPageState(controller, [
    "resourceAccounts",
    "integrations",
  ]);
  const accounts = useMemo(
    () => data.resourceAccounts.filter((item) => readResourceAccountKind(item) === "mini_program"),
    [data.resourceAccounts],
  );
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      <OauthAccountSetupSection
        accounts={accounts}
        common={messages.common}
        controller={controller}
        disabled={disabled}
        kind="mini_program"
        listPageInfo={listPageInfo?.resourceAccounts}
        messages={messages.quickSetup.miniProgramAccounts}
        onChanged={sync}
        status={status}
        switchMessages={messages.quickSetup.accountSwitch}
      />
    </div>
  );
}
