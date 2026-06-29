import { AlertTriangle } from "lucide-react";
import { Button } from "@sdkwork/ui-pc-react";
import type { SdkworkSessionAuthUnauthorizedDetail } from "../../../sdkwork-auth-runtime-pc-react/src/sessionAuthUnauthorized.ts";

export interface SdkworkSessionAuthRequiredDialogCopy {
  businessCodeLabel: string;
  close: string;
  codeLabel: string;
  description: string;
  detailsTitle: string;
  httpStatusLabel: string;
  login: string;
  messageLabel: string;
  pathLabel: string;
  title: string;
}

export interface SdkworkSessionAuthRequiredDialogProps {
  copy: SdkworkSessionAuthRequiredDialogCopy;
  detail: SdkworkSessionAuthUnauthorizedDetail;
  onClose(): void;
  onLogin(): void;
}

function formatDetailSummary(detail: SdkworkSessionAuthUnauthorizedDetail): string {
  return JSON.stringify(
    {
      httpStatus: detail.httpStatus,
      code: detail.code,
      businessCode: detail.businessCode,
      message: detail.message,
      path: detail.path,
      occurredAt: detail.occurredAt,
    },
    null,
    2,
  );
}

export function SdkworkSessionAuthRequiredDialog({
  copy,
  detail,
  onClose,
  onLogin,
}: SdkworkSessionAuthRequiredDialogProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/45 px-4 py-6">
      <section
        aria-labelledby="sdkwork-session-auth-required-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        role="dialog"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              id="sdkwork-session-auth-required-title"
            >
              {copy.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {copy.description}
            </p>
          </div>
        </div>

        <dl className="mt-5 space-y-2 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900/60">
          {detail.httpStatus !== undefined ? (
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                {copy.httpStatusLabel}
              </dt>
              <dd className="font-mono text-zinc-900 dark:text-zinc-100">
                {detail.httpStatus}
              </dd>
            </div>
          ) : null}
          {detail.code ? (
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                {copy.codeLabel}
              </dt>
              <dd className="font-mono text-zinc-900 dark:text-zinc-100">{detail.code}</dd>
            </div>
          ) : null}
          {detail.businessCode ? (
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                {copy.businessCodeLabel}
              </dt>
              <dd className="font-mono text-zinc-900 dark:text-zinc-100">
                {detail.businessCode}
              </dd>
            </div>
          ) : null}
          {detail.path ? (
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                {copy.pathLabel}
              </dt>
              <dd className="break-all font-mono text-zinc-900 dark:text-zinc-100">
                {detail.path}
              </dd>
            </div>
          ) : null}
          <div className="grid grid-cols-[7rem_1fr] gap-2">
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">
              {copy.messageLabel}
            </dt>
            <dd className="break-words text-zinc-900 dark:text-zinc-100">{detail.message}</dd>
          </div>
        </dl>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {copy.detailsTitle}
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">
            {formatDetailSummary(detail)}
          </pre>
        </details>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button onClick={onClose} type="button" variant="outline">
            {copy.close}
          </Button>
          <Button onClick={onLogin} type="button">
            {copy.login}
          </Button>
        </div>
      </section>
    </div>
  );
}
