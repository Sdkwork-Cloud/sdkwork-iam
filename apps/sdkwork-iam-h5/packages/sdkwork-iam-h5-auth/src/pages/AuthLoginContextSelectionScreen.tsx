import { useState } from "react";

import type {
  IamLoginContextOrganizationChoice,
  IamLoginContextSelectionChallenge,
} from "@sdkwork/iam-contracts";

import type { SdkworkIamH5AuthController, SdkworkIamH5AuthSession } from "../types/auth-h5-types";

export interface SdkworkIamH5AuthLoginContextSelectionScreenProps {
  challenge: IamLoginContextSelectionChallenge;
  controller: SdkworkIamH5AuthController;
  errorMessage?: string;
  onAuthenticated?: (session: SdkworkIamH5AuthSession) => void;
  onCancel?: () => void;
  title?: string;
}

function resolveOrganizationLabel(organization: IamLoginContextOrganizationChoice): string {
  return organization.displayName || organization.name || organization.organizationId;
}

function resolvePersonalLabel(challenge: IamLoginContextSelectionChallenge): string {
  return challenge.options?.find((option) => option.loginScope === "TENANT")?.displayName
    || "Personal account";
}

export function SdkworkIamH5AuthLoginContextSelectionScreen({
  challenge,
  controller,
  errorMessage,
  onAuthenticated,
  onCancel,
  title = "Choose login context",
}: SdkworkIamH5AuthLoginContextSelectionScreenProps) {
  const [busyTarget, setBusyTarget] = useState<string | undefined>();
  const [localError, setLocalError] = useState<string | undefined>();

  const handlePersonalLogin = () => {
    setBusyTarget("personal");
    setLocalError(undefined);
    void controller.selectPersonalLogin({ continuationToken: challenge.continuationToken })
      .then((session) => onAuthenticated?.(session))
      .catch((error) => {
        setLocalError(error instanceof Error ? error.message : "Personal login failed");
      })
      .finally(() => setBusyTarget(undefined));
  };

  const handleOrganizationLogin = (organizationId: string) => {
    setBusyTarget(organizationId);
    setLocalError(undefined);
    void controller.selectOrganization({
      continuationToken: challenge.continuationToken,
      organizationId,
    })
      .then((session) => onAuthenticated?.(session))
      .catch((error) => {
        setLocalError(error instanceof Error ? error.message : "Organization login failed");
      })
      .finally(() => setBusyTarget(undefined));
  };

  const resolvedError = localError || errorMessage;

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm text-zinc-600">Choose personal platform access or an organization workspace.</p>
      {resolvedError ? <p className="text-sm text-red-600">{resolvedError}</p> : null}
      {challenge.challengeType === "LOGIN_CONTEXT_SELECTION" ? (
        <button
          className="rounded border px-4 py-3 text-left text-sm disabled:opacity-50"
          disabled={Boolean(busyTarget)}
          onClick={handlePersonalLogin}
          type="button"
        >
          {busyTarget === "personal" ? "Signing in..." : resolvePersonalLabel(challenge)}
        </button>
      ) : null}
      {challenge.organizations.map((organization) => (
        <button
          className="rounded border px-4 py-3 text-left text-sm disabled:opacity-50"
          disabled={Boolean(busyTarget)}
          key={organization.organizationId}
          onClick={() => handleOrganizationLogin(organization.organizationId)}
          type="button"
        >
          {busyTarget === organization.organizationId
            ? "Signing in..."
            : resolveOrganizationLabel(organization)}
        </button>
      ))}
      {onCancel ? (
        <button
          className="rounded px-4 py-2 text-sm text-zinc-600"
          disabled={Boolean(busyTarget)}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      ) : null}
    </section>
  );
}
