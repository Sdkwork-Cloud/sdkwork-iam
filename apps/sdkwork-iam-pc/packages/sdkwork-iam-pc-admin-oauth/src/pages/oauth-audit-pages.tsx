
import type {
  SdkworkIamOauthAdminPageProps,
} from "../types/oauth-admin-types";
import { useOauthAdminPageState } from "../hooks/use-oauth-admin-page-state";
import {
  OauthCallbackEventSection,
  OauthDiagnosticRunSection,
} from "../components/oauth-activity-sections";
import { OauthWebhookConfigSection } from "../components/oauth-login-sections";
import { OauthPageStatus } from "../components/oauth-admin-ui";



export function OauthAuditAdminPage({ controller }: SdkworkIamOauthAdminPageProps) {
  const { data, diagnosticDetail, disabled, error, listPageInfo, resourceDetail, status, sync } = useOauthAdminPageState(controller, [
    "diagnosticRuns",
    "callbackEvents",
  ]);
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto">
      <OauthPageStatus error={error} resourceDetail={resourceDetail} />
      <OauthDiagnosticRunSection
        controller={controller}
        diagnosticDetail={diagnosticDetail}
        disabled={disabled}
        diagnosticRuns={data.diagnosticRuns}
        listPageInfo={listPageInfo}
        onChanged={sync}
        status={status}
      />
      <OauthCallbackEventSection
        callbackEvents={data.callbackEvents}
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
      />
    </div>
  );
}

export function OauthActivityAdminPage({ controller }: SdkworkIamOauthAdminPageProps) {
  const { data, diagnosticDetail, disabled, error, listPageInfo, resourceDetail, status, sync } = useOauthAdminPageState(controller, [
    "webhookConfigs",
    "diagnosticRuns",
    "callbackEvents",
  ]);
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto">
      <OauthPageStatus error={error} resourceDetail={resourceDetail} />
      <OauthWebhookConfigSection
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        status={status}
        webhookConfigs={data.webhookConfigs}
      />
      <OauthDiagnosticRunSection
        controller={controller}
        diagnosticDetail={diagnosticDetail}
        disabled={disabled}
        diagnosticRuns={data.diagnosticRuns}
        listPageInfo={listPageInfo}
        onChanged={sync}
        status={status}
      />
      <OauthCallbackEventSection
        callbackEvents={data.callbackEvents}
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
      />
    </div>
  );
}
