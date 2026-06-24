import { useEffect, useState } from "react";

import type { SdkworkIamH5UserProfileScreenProps } from "../types/user-h5-types";

export function SdkworkIamH5UserProfileScreen({
  controller,
  title = "Profile",
}: SdkworkIamH5UserProfileScreenProps) {
  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBusy(true);
    void controller.loadProfile()
      .then((profile) => {
        setDisplayName(profile.displayName ?? "");
        setNickname(profile.nickname ?? "");
        setEmail(profile.email);
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
    </section>
  );
}
