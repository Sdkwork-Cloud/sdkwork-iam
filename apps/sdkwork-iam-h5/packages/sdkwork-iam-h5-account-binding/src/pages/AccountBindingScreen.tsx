import { useEffect, useState } from "react";

import type { SdkworkIamH5AccountBindingScreenProps } from "../types/account-binding-h5-types";

export function SdkworkIamH5AccountBindingScreen({
  controller,
  title = "Account binding",
}: SdkworkIamH5AccountBindingScreenProps) {
  const [policy, setPolicy] = useState(controller.getState().policy);
  const [accountLinks, setAccountLinks] = useState(controller.getState().accountLinks);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void Promise.all([
      controller.loadPolicy(),
      controller.listAccountLinks(),
    ]).then(([nextPolicy, links]) => {
      setPolicy(nextPolicy);
      setAccountLinks(links);
    }).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load account binding settings");
    });
  }, [controller]);

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {policy ? (
        <ul className="space-y-2 text-sm">
          <li>Contact binding: {policy.contactBinding.enabled ? "enabled" : "disabled"}</li>
          <li>Email binding: {policy.contactBinding.emailEnabled ? "enabled" : "disabled"}</li>
          <li>Phone binding: {policy.contactBinding.phoneEnabled ? "enabled" : "disabled"}</li>
          <li>OAuth self-service link: {policy.oauthBinding.selfServiceLinkEnabled ? "enabled" : "disabled"}</li>
        </ul>
      ) : null}
      <div>
        <h2 className="mb-2 text-sm font-medium">Linked OAuth accounts ({accountLinks.length})</h2>
        <ul className="space-y-2 text-sm">
          {accountLinks.map((link) => (
            <li key={link.id}>{link.provider || "provider"} — {link.providerUserId || link.accountLinkId}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
