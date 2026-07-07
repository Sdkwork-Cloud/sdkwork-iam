import { useEffect, useState } from "react";

import type { SdkworkIamH5AccountBindingScreenProps } from "../types/account-binding-h5-types";

export function SdkworkIamH5AccountBindingScreen({
  controller,
  title = "Account binding",
}: SdkworkIamH5AccountBindingScreenProps) {
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
    void Promise.all([
      controller.loadPolicy(),
      controller.listAccountLinks(),
    ]).then(([nextPolicy, links]) => {
      setPolicy(nextPolicy);
      setAccountLinks(links);
      setListPageInfo(controller.getState().listPageInfo);
    }).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load account binding settings");
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
  const canLoadMore = Boolean(listPageInfo?.hasMore);

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {notice ? <p className="text-sm text-green-700">{notice}</p> : null}
      {policy ? (
        <ul className="space-y-2 text-sm">
          <li>Contact binding: {policy.contactBinding.enabled ? "enabled" : "disabled"}</li>
          <li>Email binding: {policy.contactBinding.emailEnabled ? "enabled" : "disabled"}</li>
          <li>Phone binding: {policy.contactBinding.phoneEnabled ? "enabled" : "disabled"}</li>
          <li>OAuth self-service link: {policy.oauthBinding.selfServiceLinkEnabled ? "enabled" : "disabled"}</li>
        </ul>
      ) : null}

      {emailBindingEnabled ? (
        <div className="space-y-3 rounded-xl border border-neutral-200 p-3">
          <h2 className="text-sm font-medium">Email binding</h2>
          <label className="block space-y-1 text-sm">
            <span>Email</span>
            <input className="w-full rounded-lg border border-neutral-300 px-3 py-2" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Verification code</span>
            <input className="w-full rounded-lg border border-neutral-300 px-3 py-2" onChange={(event) => setVerificationCode(event.target.value)} value={verificationCode} />
          </label>
          <button
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
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
          </button>
          {policy.contactBinding.emailChangeEnabled ? (
            <>
              <label className="block space-y-1 text-sm">
                <span>Password (unbind)</span>
                <input className="w-full rounded-lg border border-neutral-300 px-3 py-2" onChange={(event) => setUnbindPassword(event.target.value)} type="password" value={unbindPassword} />
              </label>
              <button
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50"
                disabled={busy || !unbindPassword.trim()}
                onClick={() => void runAction(async () => {
                  await controller.unbindEmail({ password: unbindPassword.trim() });
                  setUnbindPassword("");
                  const links = await controller.listAccountLinks();
                  setAccountLinks(links);
                  setListPageInfo(controller.getState().listPageInfo);
                }, "Email unbound")}
                type="button"
              >
                Unbind email
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      <div>
        <h2 className="mb-2 text-sm font-medium">Linked OAuth accounts ({accountLinks.length})</h2>
        <ul className="space-y-2 text-sm">
          {accountLinks.map((link) => (
            <li key={link.id}>{link.provider || "provider"} — {link.providerUserId || link.accountLinkId}</li>
          ))}
        </ul>
        {canLoadMore ? (
          <button
            className="mt-3 rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50"
            disabled={busy}
            onClick={() => void runAction(async () => {
              const links = await controller.loadMoreAccountLinks();
              setAccountLinks(links);
              setListPageInfo(controller.getState().listPageInfo);
            }, "Loaded more")}
            type="button"
          >
            Load more
          </button>
        ) : null}
      </div>
    </section>
  );
}
