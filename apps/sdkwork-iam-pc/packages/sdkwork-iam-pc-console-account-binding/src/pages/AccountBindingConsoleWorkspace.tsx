import { useEffect, useState } from "react";
import { SettingsSection, StatusNotice } from "@sdkwork/ui-pc-react";

import type { SdkworkIamConsoleAccountBindingWorkspaceProps } from "../types/account-binding-console-types";

export function SdkworkIamConsoleAccountBindingWorkspace({
  controller,
  description = "Review account binding policy and linked OAuth accounts for the signed-in tenant owner.",
  title = "Account binding console",
}: SdkworkIamConsoleAccountBindingWorkspaceProps) {
  const [policy, setPolicy] = useState(controller.getState().policy);
  const [accountLinks, setAccountLinks] = useState(controller.getState().accountLinks);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void controller.refreshWorkspace()
      .then(({ policy: nextPolicy, accountLinks: links }) => {
        setPolicy(nextPolicy);
        setAccountLinks(links);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load account binding console");
      });
  }, [controller]);

  return (
    <div className="space-y-6">
      <SettingsSection description={description} title={title}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {policy ? (
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <div><dt className="font-medium">Contact binding</dt><dd>{policy.contactBinding.enabled ? "enabled" : "disabled"}</dd></div>
            <div><dt className="font-medium">Email binding</dt><dd>{policy.contactBinding.emailEnabled ? "enabled" : "disabled"}</dd></div>
            <div><dt className="font-medium">Phone binding</dt><dd>{policy.contactBinding.phoneEnabled ? "enabled" : "disabled"}</dd></div>
            <div><dt className="font-medium">OAuth self-service</dt><dd>{policy.oauthBinding.selfServiceLinkEnabled ? "enabled" : "disabled"}</dd></div>
          </dl>
        ) : null}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Linked OAuth accounts ({accountLinks.length})</h3>
          <ul className="space-y-2">
            {accountLinks.map((link) => (
              <li className="rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm" key={link.id}>
                {link.provider || "provider"} — {link.providerUserId || link.accountLinkId}
              </li>
            ))}
          </ul>
        </section>
      </SettingsSection>
    </div>
  );
}
