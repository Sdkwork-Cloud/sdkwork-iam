import { isBlank } from "@sdkwork/utils";
import { useState } from "react";

import type { SdkworkIamH5AuthLoginScreenProps } from "../types/auth-h5-types";
import { SdkworkIamH5AuthLoginContextSelectionScreen } from "./AuthLoginContextSelectionScreen";

export function SdkworkIamH5AuthLoginScreen({
  controller,
  onAuthenticated,
  title = "Sign in",
}: SdkworkIamH5AuthLoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState(controller.getState().challenge);

  if (challenge) {
    return (
      <SdkworkIamH5AuthLoginContextSelectionScreen
        challenge={challenge}
        controller={controller}
        errorMessage={error}
        onAuthenticated={(session) => {
          setChallenge(undefined);
          onAuthenticated?.(session);
        }}
        onCancel={() => {
          setChallenge(undefined);
          setError(undefined);
        }}
        title="Choose login context"
      />
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <label className="flex flex-col gap-1 text-sm">
        <span>Username</span>
        <input
          autoComplete="username"
          className="rounded border px-3 py-2"
          onChange={(event) => setUsername(event.target.value)}
          value={username}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Password</span>
        <input
          autoComplete="current-password"
          className="rounded border px-3 py-2"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>
      <button
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        disabled={busy || isBlank(username) || isBlank(password)}
        onClick={() => {
          setBusy(true);
          setError(undefined);
          void controller.login({ password, username })
            .then((result) => {
              if (result.kind === "loginContextSelectionRequired") {
                setChallenge(result.challenge);
                return;
              }

              onAuthenticated?.(result.session);
            })
            .catch((loginError) => {
              setError(loginError instanceof Error ? loginError.message : "Login failed");
            })
            .finally(() => setBusy(false));
        }}
        type="button"
      >
        Sign in
      </button>
    </section>
  );
}
