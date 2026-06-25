import { useEffect, useState } from "react";
import { Button, SettingsSection, StatusNotice } from "@sdkwork/ui-pc-react";

import type { SdkworkIamConsoleUserWorkspaceProps } from "../types/user-console-types";

export function SdkworkIamConsoleUserWorkspace({
  controller,
  description = "Manage your profile and password through the tenant self-service console.",
  title = "Profile console",
}: SdkworkIamConsoleUserWorkspaceProps) {
  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState<string | undefined>();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationNote, setVerificationNote] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();

  useEffect(() => {
    void controller.refreshWorkspace()
      .then(({ profile, verificationPolicy }) => {
        setDisplayName(profile.displayName ?? "");
        setNickname(profile.nickname ?? "");
        setEmail(profile.email);
        const notes = [
          verificationPolicy.emailVerificationRequired ? "Email verification required for binding changes." : undefined,
          verificationPolicy.phoneVerificationRequired ? "Phone verification required for binding changes." : undefined,
        ].filter(Boolean);
        setVerificationNote(notes.length > 0 ? notes.join(" ") : undefined);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load profile console");
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

  return (
    <div className="space-y-6">
      <SettingsSection description={description} title={title}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}
        {verificationNote ? <p className="text-sm text-[var(--sdk-color-text-muted)]">{verificationNote}</p> : null}
        {email ? <p className="text-sm text-[var(--sdk-color-text-muted)]">Email: {email}</p> : null}

        <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
          <h3 className="text-sm font-semibold">Profile</h3>
          <Field label="Display name" onChange={setDisplayName} value={displayName} />
          <Field label="Nickname" onChange={setNickname} value={nickname} />
          <Button
            disabled={busy}
            onClick={() => void runAction(async () => {
              await controller.updateProfile({ displayName, nickname });
            }, "Profile updated")}
            type="button"
          >
            Save profile
          </Button>
        </section>

        <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
          <h3 className="text-sm font-semibold">Password</h3>
          <Field label="Current password" onChange={setOldPassword} type="password" value={oldPassword} />
          <Field label="New password" onChange={setNewPassword} type="password" value={newPassword} />
          <Field label="Confirm password" onChange={setConfirmPassword} type="password" value={confirmPassword} />
          <Button
            disabled={busy || !oldPassword || !newPassword || newPassword !== confirmPassword}
            onClick={() => void runAction(async () => {
              await controller.updatePassword({ confirmPassword, newPassword, oldPassword });
              setOldPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }, "Password updated")}
            type="button"
            variant="outline"
          >
            Update password
          </Button>
        </section>
      </SettingsSection>
    </div>
  );
}

function Field({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span>{label}</span>
      <input
        className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}
