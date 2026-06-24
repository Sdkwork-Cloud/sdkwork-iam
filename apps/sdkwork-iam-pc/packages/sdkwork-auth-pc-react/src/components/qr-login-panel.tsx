import { LoaderCircle, QrCode, RefreshCw } from "lucide-react";
import { Button } from "@sdkwork/ui-pc-react";
import {
  createSdkworkAuthDarkPanelStyle,
  createSdkworkAuthQrFrameStyle,
  mergeSdkworkAuthClassNames,
  mergeSdkworkAuthStyles,
  resolveSdkworkAuthAppearance,
  type SdkworkAuthAppearanceConfig,
} from "../auth-appearance.ts";
import { useSdkworkAuthIntl } from "../auth-intl.tsx";
import type { SdkworkAuthQrPanelState } from "../auth-config.ts";
import type { SdkworkAuthLoginQrCode } from "../auth-service.ts";

function shouldUseBackendQrText(value: string | undefined): value is string {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return normalized !== "desktop qr login"
    && normalized !== "scan to login"
    && normalized !== "scan to sign in"
    && normalized !== "\u626b\u7801\u767b\u5f55"
    && normalized !== "scan the qr code to continue"
    && normalized !== "scan with another signed-in sdkwork user center session to confirm login quickly"
    && normalized !== "scan with another signed-in sdkwork session to confirm login quickly"
    && normalized !== "scan with sdkwork mobile app to continue"
    && normalized !== "sdkwork local sign in"
    && normalized !== "use sdkwork local iam to complete this qr authentication session."
    && normalized !== "use your mobile app to continue";
}

export interface SdkworkQrLoginPanelProps {
  appearance?: SdkworkAuthAppearanceConfig;
  onRefresh(): void;
  panelDescription?: string;
  panelTitle?: string;
  qrCode: SdkworkAuthLoginQrCode | null;
  qrErrorMessage?: string;
  qrImageSrc: string;
  qrState: SdkworkAuthQrPanelState;
}

export function SdkworkQrLoginPanel({
  appearance,
  onRefresh,
  panelDescription,
  panelTitle,
  qrCode,
  qrErrorMessage,
  qrImageSrc,
  qrState,
}: SdkworkQrLoginPanelProps) {
  const resolvedAppearance = resolveSdkworkAuthAppearance(appearance);
  const isBroken = qrState === "error" || qrState === "expired" || qrState === "failed";
  const {
    copy,
    formatQrStatusLabel,
  } = useSdkworkAuthIntl();
  const qrTitle = panelTitle
    || (shouldUseBackendQrText(qrCode?.title) ? qrCode.title : copy.qr.defaultTitle);
  const qrDescription = panelDescription
    || (shouldUseBackendQrText(qrCode?.description) ? qrCode.description : copy.qr.defaultDescription);
  const shouldShowStatus = qrState !== "idle" && qrState !== "pending";
  const statusHint = qrState === "error"
    ? qrErrorMessage || copy.qr.unavailable
    : qrState === "scanned"
      ? copy.qr.statusHint.scanned || copy.qr.scannedHint
      : qrState === "passwordRequired"
        ? copy.qr.statusHint.passwordRequired
        : qrState === "bindRequired"
          ? copy.qr.statusHint.bindRequired
          : qrState === "organizationSelectionRequired"
            ? copy.qr.statusHint.organizationSelectionRequired
            : qrState === "confirmed"
              ? copy.qr.statusHint.confirmed
              : qrState === "expired"
                ? copy.qr.statusHint.expired
                : qrState === "failed"
                  ? copy.qr.statusHint.failed
                  : "";

  return (
    <div
      className={mergeSdkworkAuthClassNames(
        "relative flex h-full flex-col justify-center overflow-hidden rounded-lg bg-zinc-950 p-8 text-white",
        resolvedAppearance?.asidePanelClassName,
      )}
      style={mergeSdkworkAuthStyles(
        createSdkworkAuthDarkPanelStyle(),
        resolvedAppearance?.asidePanelStyle,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.05),_transparent_30%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-[320px] flex-col justify-center gap-6">
        <div>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.08]">
            <QrCode className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            {qrTitle}
          </h2>
          {qrDescription ? (
            <p className="mt-2 max-w-[260px] text-sm leading-6 text-zinc-300">
              {qrDescription}
            </p>
          ) : null}
        </div>

        <div>
          <div
            className={mergeSdkworkAuthClassNames(
              "rounded-xl bg-zinc-900/70 p-3",
              resolvedAppearance?.qrFrameClassName,
            )}
            style={mergeSdkworkAuthStyles(
              createSdkworkAuthQrFrameStyle(),
              resolvedAppearance?.qrFrameStyle,
            )}
          >
            <div
              className="mx-auto aspect-square min-h-[220px] w-full max-w-[220px]"
              data-testid="sdkwork-auth-qr-frame"
            >
              <div className="relative h-full w-full overflow-hidden rounded-lg bg-white">
                {qrImageSrc ? (
                  <img
                    alt={copy.qr.alt}
                    className={`h-full w-full object-contain p-3 transition-opacity ${
                      isBroken ? "opacity-40" : "opacity-100"
                    }`}
                    src={qrImageSrc}
                  />
                ) : isBroken ? (
                  <div className="flex h-full items-center justify-center bg-zinc-100">
                    <QrCode className="h-10 w-10 text-zinc-300" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center bg-zinc-100">
                    <LoaderCircle className="h-8 w-8 animate-spin text-zinc-400" />
                  </div>
                )}

                {isBroken ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/10">
                    <Button
                      className="h-auto rounded-xl px-4 py-2.5 text-sm font-bold"
                      onClick={onRefresh}
                      type="button"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {copy.qr.refresh}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {shouldShowStatus ? (
            <div className={`mt-5 text-sm font-medium ${
              qrState === "scanned"
              || qrState === "passwordRequired"
              || qrState === "bindRequired"
              || qrState === "organizationSelectionRequired"
                ? "text-amber-300"
                : qrState === "confirmed"
                  ? "text-emerald-300"
                  : qrState === "expired" || qrState === "error" || qrState === "failed"
                    ? "text-rose-300"
                    : "text-zinc-300"
            }`}
            >
              {formatQrStatusLabel(qrState)}
            </div>
          ) : null}
          {statusHint ? (
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {statusHint}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
