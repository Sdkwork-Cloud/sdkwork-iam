import { useEffect, useState } from "react";

import type { SdkworkIamH5UserProfileScreenProps } from "../types/user-h5-types";

export function SdkworkIamH5UserProfileScreen({
  controller,
  title = "Profile",
}: SdkworkIamH5UserProfileScreenProps) {
  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState<string | undefined>();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationNote, setVerificationNote] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBusy(true);
    void Promise.all([
      controller.loadProfile(),
      controller.loadVerificationPolicy(),
    ])
      .then(([profile, verificationPolicy]) => {
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
        setError(loadError instanceof Error ? loadError.message : "Failed to load profile");
      })
      .finally(() => setBusy(false));
  }, [controller]);

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {notice ? <p className="text-sm text-green-700">{notice}</p> : null}
      {verificationNote ? <p className="text-sm text-gray-600">{verificationNote}</p> : null}
      {email ? <p className="text-sm text-gray-600">Email: {email}</p> : null}
      <label className="flex flex-col gap-1 text-sm">
        <span>Display name</span>
        <input
          className="rounded border px-3 py-2"
          onChange={(event) => setDisplayName(event.target.value)}
          value={displayName}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Nickname</span>
        <input
          className="rounded border px-3 py-2"
          onChange={(event) => setNickname(event.target.value)}
          value={nickname}
        />
      </label>
      <button
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError(undefined);
          setNotice(undefined);
          void controller.updateProfile({ displayName, nickname })
            .then(() => setNotice("Profile updated"))
            .catch((updateError) => {
              setError(updateError instanceof Error ? updateError.message : "Update failed");
            })
            .finally(() => setBusy(false));
        }}
        type="button"
      >
        Save profile
      </button>
      <div className="border-t pt-4">
        <h2 className="mb-2 text-sm font-semibold">Change password</h2>
        <label className="mb-2 flex flex-col gap-1 text-sm">
          <span>Current password</span>
          <input className="rounded border px-3 py-2" onChange={(event) => setOldPassword(event.target.value)} type="password" value={oldPassword} />
        </label>
        <label className="mb-2 flex flex-col gap-1 text-sm">
          <span>New password</span>
          <input className="rounded border px-3 py-2" onChange={(event) => setNewPassword(event.target.value)} type="password" value={newPassword} />
        </label>
        <label className="mb-2 flex flex-col gap-1 text-sm">
          <span>Confirm password</span>
          <input className="rounded border px-3 py-2" onChange={(event) => setConfirmPassword(event.target.value)} type="password" value={confirmPassword} />
        </label>
        <button
          className="rounded border px-4 py-2 text-sm disabled:opacity-50"
          disabled={busy || !oldPassword || !newPassword || newPassword !== confirmPassword}
          onClick={() => {
            setBusy(true);
            setError(undefined);
            setNotice(undefined);
            void controller.updatePassword({ confirmPassword, newPassword, oldPassword })
              .then(() => {
                setNotice("Password updated");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
              })
              .catch((updateError) => {
                setError(updateError instanceof Error ? updateError.message : "Password update failed");
              })
              .finally(() => setBusy(false));
          }}
          type="button"
        >
          Update password
        </button>
      </div>
    </section>
  );
}
