import { useEffect, useState } from "react";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";
import { Button, SettingsSection, StatusNotice } from "@sdkwork/ui-pc-react";

import type { SdkworkIamConsoleAccountBindingWorkspaceProps } from "../types/account-binding-console-types";

export function SdkworkIamConsoleAccountBindingWorkspace({
  controller,
  description = "Review account binding policy, manage contact bindings, and inspect linked OAuth accounts for the signed-in tenant owner.",
  title = "Account binding console",
}: SdkworkIamConsoleAccountBindingWorkspaceProps) {
  const [policy, setPolicy] = useState(controller.getState().policy);
  const [accountLinks, setAccountLinks] = useState(controller.getState().accountLinks);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [unbindPassword, setUnbindPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();

  useEffect(() => {
    void controller.refreshWorkspace()
      .then(({ policy: nextPolicy, accountLinks: links }) => {
        setPolicy(nextPolicy);
        setAccountLinks(links);
        setListPageInfo(controller.getState().listPageInfo);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load account binding console");
      });
  }, [controller]);

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await action();
      setNotice(successMessage);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  };

  const emailBindingEnabled = policy?.contactBinding.enabled && policy.contactBinding.emailEnabled;

  return (
    <div className="space-y-6">
      <SettingsSection description={description} title={title}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}
        {policy ? (
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <div><dt className="font-medium">Contact binding</dt><dd>{policy.contactBinding.enabled ? "enabled" : "disabled"}</dd></div>
            <div><dt className="font-medium">Email binding</dt><dd>{policy.contactBinding.emailEnabled ? "enabled" : "disabled"}</dd></div>
            <div><dt className="font-medium">Phone binding</dt><dd>{policy.contactBinding.phoneEnabled ? "enabled" : "disabled"}</dd></div>
            <div><dt className="font-medium">OAuth self-service</dt><dd>{policy.oauthBinding.selfServiceLinkEnabled ? "enabled" : "disabled"}</dd></div>
          </dl>
        ) : null}

        {emailBindingEnabled ? (
          <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
            <h3 className="text-sm font-semibold">Email binding</h3>
            <label className="block space-y-2 text-sm">
              <span>Email</span>
              <input
                className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span>Verification code</span>
              <input
                className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
                onChange={(event) => setVerificationCode(event.target.value)}
                value={verificationCode}
              />
            </label>
            <Button
              disabled={busy || !email.trim() || !verificationCode.trim()}
              onClick={() => void runAction(async () => {
                await controller.bindEmail({ email: email.trim(), verificationCode: verificationCode.trim() });
                setEmail("");
                setVerificationCode("");
                const links = await controller.listAccountLinks();
                setAccountLinks(links);
                setListPageInfo(controller.getState().listPageInfo);
              }, "Email bound")}
              type="button"
            >
              Bind email
            </Button>
            {policy.contactBinding.emailChangeEnabled ? (
              <>
                <label className="block space-y-2 text-sm">
                  <span>Current password (unbind)</span>
                  <input
                    className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
                    onChange={(event) => setUnbindPassword(event.target.value)}
                    type="password"
                    value={unbindPassword}
                  />
                </label>
                <Button
                  disabled={busy || !unbindPassword.trim()}
                  onClick={() => void runAction(async () => {
                    await controller.unbindEmail({ password: unbindPassword.trim() });
                    setUnbindPassword("");
                    const links = await controller.listAccountLinks();
                    setAccountLinks(links);
                    setListPageInfo(controller.getState().listPageInfo);
                  }, "Email unbound")}
                  type="button"
                  variant="outline"
                >
                  Unbind email
                </Button>
              </>
            ) : null}
          </section>
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
          <SdkworkIamListPaginationControls
            busy={busy}
            onLoadMore={() => void runAction(async () => {
              const links = await controller.loadMoreAccountLinks();
              setAccountLinks(links);
              setListPageInfo(controller.getState().listPageInfo);
            }, "Loaded more account links")}
            pageInfo={listPageInfo}
          />
        </section>
      </SettingsSection>
    </div>
  );
}
