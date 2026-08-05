
import { StatusNotice } from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthAdminPageProps,
} from "../types/oauth-admin-types";
import { useOauthAdminPageState } from "../hooks/use-oauth-admin-page-state";
import {
  OauthAccountLinkSection,
  OauthGrantSection,
  OauthRelyingPartySection,
} from "../components/oauth-provider-sections";
import { OauthResourceDetailBlock } from "../components/oauth-admin-ui";


function ProviderPageSections({ controller }: SdkworkIamOauthAdminPageProps) {
  const { data, disabled, error, listPageInfo, resourceDetail, status, sync } = useOauthAdminPageState(controller, [
    "accountLinks",
    "grants",
  ]);
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto">
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      {resourceDetail ? (
        <OauthResourceDetailBlock detail={resourceDetail.detail} label={resourceDetail.label} />
      ) : null}
      <OauthRelyingPartySection controller={controller} disabled={disabled} status={status} />
      <OauthAccountLinkSection
        accountLinks={data.accountLinks}
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
      />
      <OauthGrantSection
        controller={controller}
        disabled={disabled}
        grants={data.grants}
        listPageInfo={listPageInfo}
        onRevoked={sync}
      />
    </div>
  );
}

export function OauthProviderAdminPage(props: SdkworkIamOauthAdminPageProps) {
  return <ProviderPageSections {...props} />;
}

function AuthorizationsPageSections({ controller }: SdkworkIamOauthAdminPageProps) {
  const { data, disabled, error, listPageInfo, resourceDetail, sync } = useOauthAdminPageState(controller, [
    "accountLinks",
    "grants",
  ]);
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto">
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      {resourceDetail ? (
        <OauthResourceDetailBlock detail={resourceDetail.detail} label={resourceDetail.label} />
      ) : null}
      <OauthAccountLinkSection
        accountLinks={data.accountLinks}
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
      />
      <OauthGrantSection
        controller={controller}
        disabled={disabled}
        grants={data.grants}
        listPageInfo={listPageInfo}
        onRevoked={sync}
      />
    </div>
  );
}

export function OauthAuthorizationsAdminPage(props: SdkworkIamOauthAdminPageProps) {
  return <AuthorizationsPageSections {...props} />;
}
