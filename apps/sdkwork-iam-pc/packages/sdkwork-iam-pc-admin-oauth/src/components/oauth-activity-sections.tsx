import { useState } from "react";
import {
  Button,
  Label,
  SettingsSection,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthDiagnosticRunDraft,
} from "../types/oauth-admin-types";
import { canSubmitDiagnosticRun, templateMessage } from "../utils/oauth-admin-utils";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import {
  DiagnosticRunResourceList,
  ResourceList,
} from "./OauthAdminResourceList";
import {
  OauthAdminField,
  OauthResourceDetailBlock,
  OauthResourceDrawer,
} from "./oauth-admin-ui";
import type { SdkworkIamOauthAdminSectionProps } from "../types/oauth-admin-types";

const EMPTY_DIAGNOSTIC_RUN_DRAFT = (): SdkworkIamOauthDiagnosticRunDraft => ({
  integrationId: "",
  providerCode: "",
  runKind: "manual",
});

export function OauthDiagnosticRunSection({
  controller,
  diagnosticDetail,
  disabled,
  diagnosticRuns,
  listPageInfo,
  onChanged,
  status,
}: SdkworkIamOauthAdminSectionProps & {
  diagnosticDetail?: unknown;
  diagnosticRuns: unknown[];
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [draft, setDraft] = useState<SdkworkIamOauthDiagnosticRunDraft>(EMPTY_DIAGNOSTIC_RUN_DRAFT);
  return (
    <SettingsSection description={messages.diagnosticRuns.description} title={messages.diagnosticRuns.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.diagnosticRuns.listLabelTemplate, { count: String(diagnosticRuns.length) })}
        </Label>
        <DiagnosticRunResourceList
          controller={controller}
          diagnosticRuns={diagnosticRuns}
          disabled={disabled}
          emptyLabel={messages.diagnosticRuns.emptyLabel}
          onChanged={onChanged}
        />
      </div>
      <OauthResourceDrawer
        confirmDisabled={disabled || !canSubmitDiagnosticRun(draft)}
        confirmLabel={messages.diagnosticRuns.addButton}
        confirmLoading={status === "saving"}
        description={messages.diagnosticRuns.addDescription}
        onConfirm={() => {
          void controller.createDiagnosticRun(draft).then(onChanged).catch(onChanged);
          setDraft(EMPTY_DIAGNOSTIC_RUN_DRAFT());
        }}
        triggerLabel={messages.diagnosticRuns.addTrigger}
      >
        <OauthAdminField
          label={messages.diagnosticRuns.fields.providerCode}
          onChange={(providerCode) => setDraft((current) => ({ ...current, providerCode }))}
          value={draft.providerCode}
        />
        <OauthAdminField
          label={messages.diagnosticRuns.fields.integrationId}
          onChange={(integrationId) => setDraft((current) => ({ ...current, integrationId }))}
          value={draft.integrationId}
        />
        <OauthAdminField
          label={messages.diagnosticRuns.fields.runKind}
          onChange={(runKind) => setDraft((current) => ({ ...current, runKind }))}
          value={draft.runKind}
        />
      </OauthResourceDrawer>
      {diagnosticDetail ? (
        <div className="mt-6">
          <OauthResourceDetailBlock detail={diagnosticDetail} label={messages.diagnosticRuns.latestDetailLabel} />
        </div>
      ) : null}
    </SettingsSection>
  );
}

export function OauthCallbackEventSection({
  callbackEvents,
  controller,
  disabled,
  listPageInfo,
  onChanged,
}: SdkworkIamOauthAdminSectionProps & { callbackEvents: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <SettingsSection description={messages.callbackEvents.description} title={messages.callbackEvents.title}>
      <div className="space-y-3">
        <Label>
          {templateMessage(messages.callbackEvents.listLabelTemplate, { count: String(callbackEvents.length) })}
        </Label>
        <ResourceList
          emptyLabel={messages.callbackEvents.emptyLabel}
          items={callbackEvents}
          listPageInfo={listPageInfo?.callbackEvents}
          onPageChange={(page, pageSize) => controller.listPageResource("callbackEvents", { page, page_size: pageSize }).then(onChanged)}
          onPageSizeChange={(pageSize) => controller.listPageResource("callbackEvents", { page: 1, page_size: pageSize }).then(onChanged)}
        />
      </div>
    </SettingsSection>
  );
}
