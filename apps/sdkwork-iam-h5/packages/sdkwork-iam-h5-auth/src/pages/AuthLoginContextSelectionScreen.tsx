import { useState } from "react";

import type {
  IamLoginContextOrganizationChoice,
  IamLoginContextSelectionChallenge,
} from "@sdkwork/iam-contracts";

import { useSdkworkIamH5AuthMessages } from "../i18n";
import type { SdkworkIamH5AuthController, SdkworkIamH5AuthSession } from "../types/auth-h5-types";

export interface SdkworkIamH5AuthLoginContextSelectionScreenProps {
  challenge: IamLoginContextSelectionChallenge;
  controller: SdkworkIamH5AuthController;
  errorMessage?: string;
  onAuthenticated?: (session: SdkworkIamH5AuthSession) => void;
  onCancel?: () => void;
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
}: SdkworkIamH5AuthLoginContextSelectionScreenProps) {
  const messages = useSdkworkIamH5AuthMessages();
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
  const optionClass =
    "rounded-lg border border-[var(--iam-h5-auth-border)] bg-[var(--iam-h5-auth-btn-disabled-bg)] px-4 py-3 text-left text-[15px] text-[var(--iam-h5-auth-text-main)] transition-colors active:opacity-70 disabled:opacity-50";

  return (
    <div className="sdkwork-iam-h5-auth-surface relative flex h-full flex-col overflow-y-auto">
      <div className="flex min-h-[500px] flex-1 flex-col justify-center px-8 py-8">
        <div className="mb-10 flex flex-col items-center">
          <h1 className="text-center text-2xl font-semibold">{messages.contextSelection.title}</h1>
          <p className="mt-2 text-center text-[14px] text-[var(--iam-h5-auth-text-sub)]">
            {messages.contextSelection.description}
          </p>
        </div>

        {resolvedError ? (
          <p className="mb-5 text-center text-[14px] text-[#EF4444]">{resolvedError}</p>
        ) : null}

        <div className="flex w-full flex-col gap-4">
          {challenge.challengeType === "LOGIN_CONTEXT_SELECTION" ? (
            <button
              className={optionClass}
              disabled={Boolean(busyTarget)}
              onClick={handlePersonalLogin}
              type="button"
            >
              {busyTarget === "personal"
                ? messages.contextSelection.signingIn
                : resolvePersonalLabel(challenge)}
            </button>
          ) : null}
          {challenge.organizations.map((organization) => (
            <button
              className={optionClass}
              disabled={Boolean(busyTarget)}
              key={organization.organizationId}
              onClick={() => handleOrganizationLogin(organization.organizationId)}
              type="button"
            >
              {busyTarget === organization.organizationId
                ? messages.contextSelection.signingIn
                : resolveOrganizationLabel(organization)}
            </button>
          ))}
        </div>

        {onCancel ? (
          <button
            className="mt-8 cursor-pointer text-center text-[14px] font-medium text-[var(--iam-h5-auth-link)] active:opacity-70 disabled:opacity-50"
            disabled={Boolean(busyTarget)}
            onClick={onCancel}
            type="button"
          >
            {messages.contextSelection.cancel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
