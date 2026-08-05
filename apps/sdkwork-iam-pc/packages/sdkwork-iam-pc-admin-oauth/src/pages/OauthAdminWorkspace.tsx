import { useState } from "react";
import {
  Activity,
  Landmark,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import { SegmentedControl } from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthAdminTab,
  SdkworkIamOauthAdminWorkspaceProps,
} from "../types/oauth-admin-types";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import { SdkworkIamOauthAdminSettings } from "./OauthAdminSettings";

const TAB_IDS: readonly SdkworkIamOauthAdminTab[] = ["inbound", "provider", "extended", "audit"];

const TAB_ICONS: Record<SdkworkIamOauthAdminTab, typeof PlugZap> = {
  audit: Activity,
  extended: ShieldCheck,
  inbound: PlugZap,
  provider: Landmark,
};

export function SdkworkIamOauthAdminWorkspace({
  controller,
}: SdkworkIamOauthAdminWorkspaceProps) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [tab, setTab] = useState<SdkworkIamOauthAdminTab>("inbound");
  const activeTabMessages = messages.tabs[tab];

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="space-y-3">
        <SegmentedControl
          aria-label={activeTabMessages.label}
          fullWidth={false}
          onValueChange={(value) => setTab(value as SdkworkIamOauthAdminTab)}
          options={TAB_IDS.map((tabId) => {
            const Icon = TAB_ICONS[tabId];
            return {
              icon: <Icon aria-hidden="true" className="h-4 w-4" />,
              label: messages.tabs[tabId].label,
              value: tabId,
            };
          })}
          value={tab}
        />
        <p className="text-sm text-[var(--sdk-color-text-muted)]">{activeTabMessages.summary}</p>
      </div>
      <div className="min-h-0 flex-1">
        <SdkworkIamOauthAdminSettings controller={controller} tab={tab} />
      </div>
    </div>
  );
}
