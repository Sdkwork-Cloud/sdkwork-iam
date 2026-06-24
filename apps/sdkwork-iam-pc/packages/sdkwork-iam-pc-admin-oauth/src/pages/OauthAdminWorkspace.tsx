import { useState } from "react";
import { Button } from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthAdminTab,
  SdkworkIamOauthAdminWorkspaceProps,
} from "../types/oauth-admin-types";
import { SdkworkIamOauthAdminSettings } from "./OauthAdminSettings";

const TABS: Array<{ id: SdkworkIamOauthAdminTab; label: string; summary: string }> = [
  {
    id: "inbound",
    label: "Inbound IdP",
    summary: "Tenant integrations, clients, secrets, surfaces, flows, scopes, claims, webhooks",
  },
  {
    id: "provider",
    label: "Authorization server",
    summary: "SDKWork relying parties, grants, account links",
  },
  {
    id: "extended",
    label: "Extended platform",
    summary: "Policies, bindings, operator platforms, resource accounts, operational assets",
  },
  {
    id: "audit",
    label: "Diagnostics & audit",
    summary: "Diagnostic runs, callback events, operational verification queues",
  },
];

export function SdkworkIamOauthAdminWorkspace({
  controller,
  description = "Configure OAuth provider integrations, authorization-server relying parties, and tenant policy.",
  title = "OAuth administration",
}: SdkworkIamOauthAdminWorkspaceProps) {
  const [tab, setTab] = useState<SdkworkIamOauthAdminTab>("inbound");
  const activeTab = TABS.find((entry) => entry.id === tab) ?? TABS[0];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((entry) => (
            <Button
              key={entry.id}
              onClick={() => setTab(entry.id)}
              type="button"
              variant={tab === entry.id ? "primary" : "secondary"}
            >
              {entry.label}
            </Button>
          ))}
        </div>
        <p className="text-sm text-[var(--sdk-color-text-muted)]">{activeTab.summary}</p>
      </div>
      <SdkworkIamOauthAdminSettings
        controller={controller}
        description={description}
        tab={tab}
        title={title}
      />
    </div>
  );
}
