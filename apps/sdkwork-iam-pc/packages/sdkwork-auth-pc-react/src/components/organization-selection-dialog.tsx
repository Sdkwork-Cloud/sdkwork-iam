import {
  Building2,
  Loader2,
  UserRound,
} from "lucide-react";
import {
  Button,
} from "@sdkwork/ui-pc-react";
import { isLoginEligibleOrganizationId } from "@sdkwork/iam-contracts";
import type {
  SdkworkAuthOrganizationChoice,
  SdkworkAuthOrganizationSelectionChallenge,
} from "../auth-service.ts";

export interface SdkworkOrganizationSelectionDialogCopy {
  cancel: string;
  description: string;
  errorTitle: string;
  personalAccount: string;
  personalDescription: string;
  selecting: string;
  tenantLabel: string;
  title: string;
}

export interface SdkworkOrganizationSelectionDialogProps {
  challenge: SdkworkAuthOrganizationSelectionChallenge;
  copy: SdkworkOrganizationSelectionDialogCopy;
  errorMessage?: string;
  onCancel(): void;
  onSelectOrganization(organizationId: string): void;
  onSelectPersonal?(): void;
  selectedOrganizationId?: string;
  selectingPersonal?: boolean;
}

function resolveOrganizationName(organization: SdkworkAuthOrganizationChoice): string {
  return organization.displayName
    || organization.name
    || organization.organizationId;
}

function resolveOrganizationDescription(
  organization: SdkworkAuthOrganizationChoice,
  tenantLabel: string,
): string {
  return organization.tenantId
    ? `${tenantLabel} ${organization.tenantId}`
    : organization.organizationId;
}

function resolvePersonalDisplayName(
  challenge: SdkworkAuthOrganizationSelectionChallenge,
  fallback: string,
): string {
  const personalOption = challenge.options?.find((option) => option.loginScope === "TENANT");
  return personalOption?.displayName || fallback;
}

export function SdkworkOrganizationSelectionDialog({
  challenge,
  copy,
  errorMessage,
  onCancel,
  onSelectOrganization,
  onSelectPersonal,
  selectedOrganizationId,
  selectingPersonal = false,
}: SdkworkOrganizationSelectionDialogProps) {
  const showPersonalOption = challenge.challengeType === "LOGIN_CONTEXT_SELECTION"
    && typeof onSelectPersonal === "function";
  const isBusy = Boolean(selectedOrganizationId) || selectingPersonal;
  const organizationChoices = challenge.organizations.filter((organization) =>
    isLoginEligibleOrganizationId(organization.organizationId),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 px-4 py-6">
      <section
        aria-labelledby="sdkwork-auth-organization-selection-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        role="dialog"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-200">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
              id="sdkwork-auth-organization-selection-title"
            >
              {copy.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {copy.description}
            </p>
          </div>
        </div>

        {errorMessage ? (
          <div
            className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700 dark:border-rose-950/60 dark:bg-rose-950/30 dark:text-rose-200"
            role="alert"
          >
            <span className="font-medium">{copy.errorTitle}</span>
            <span className="ml-1">{errorMessage}</span>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3">
          {showPersonalOption ? (
            <button
              className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500/35 disabled:cursor-wait disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
              disabled={isBusy}
              onClick={onSelectPersonal}
              type="button"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {selectingPersonal ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {resolvePersonalDisplayName(challenge, copy.personalAccount)}
                </span>
                <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {selectingPersonal ? copy.selecting : copy.personalDescription}
                </span>
              </span>
            </button>
          ) : null}

          {organizationChoices.map((organization) => {
            const isSelecting = selectedOrganizationId === organization.organizationId;
            return (
              <button
                className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500/35 disabled:cursor-wait disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
                disabled={isBusy}
                key={organization.organizationId}
                onClick={() => onSelectOrganization(organization.organizationId)}
                type="button"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {isSelecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {resolveOrganizationName(organization)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {isSelecting
                      ? copy.selecting
                      : resolveOrganizationDescription(organization, copy.tenantLabel)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            disabled={isBusy}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            {copy.cancel}
          </Button>
        </div>
      </section>
    </div>
  );
}
