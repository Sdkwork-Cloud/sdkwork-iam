import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { SdkworkSessionAuthUnauthorizedDetail } from "../../sdkwork-auth-runtime-pc-react/src/sessionAuthUnauthorized.ts";
import { subscribeSdkworkSessionAuthUnauthorized } from "../../sdkwork-auth-runtime-pc-react/src/sessionAuthUnauthorized.ts";
import {
  SdkworkSessionAuthRequiredDialog,
  type SdkworkSessionAuthRequiredDialogCopy,
} from "./components/session-auth-required-dialog.tsx";

export interface SdkworkSessionAuthUnauthorizedProviderProps {
  authLoginPath?: string;
  children: ReactNode;
  copy?: Partial<SdkworkSessionAuthRequiredDialogCopy>;
  onBeforeLoginRedirect?: (detail: SdkworkSessionAuthUnauthorizedDetail) => void;
}

const DEFAULT_COPY: SdkworkSessionAuthRequiredDialogCopy = {
  businessCodeLabel: "Business code",
  close: "Stay on page",
  codeLabel: "Code",
  description:
    "The API rejected the current session. Review the details below before signing in again.",
  detailsTitle: "Technical details",
  httpStatusLabel: "HTTP status",
  login: "Sign in",
  messageLabel: "Message",
  pathLabel: "Request path",
  title: "Sign-in required",
};

function buildLoginRedirectPath(
  authLoginPath: string,
  location: { hash?: string; pathname: string; search?: string },
): string {
  const returnPath = `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`;
  return `${authLoginPath}?redirect=${encodeURIComponent(returnPath)}`;
}

export function SdkworkSessionAuthUnauthorizedProvider({
  authLoginPath = "/auth/login",
  children,
  copy,
  onBeforeLoginRedirect,
}: SdkworkSessionAuthUnauthorizedProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<SdkworkSessionAuthUnauthorizedDetail | null>(null);
  const dialogCopy = { ...DEFAULT_COPY, ...copy };

  useEffect(() => {
    return subscribeSdkworkSessionAuthUnauthorized((nextDetail) => {
      setDetail(nextDetail);
    });
  }, []);

  const handleClose = () => {
    setDetail(null);
  };

  const handleLogin = () => {
    if (!detail) {
      return;
    }
    onBeforeLoginRedirect?.(detail);
    navigate(buildLoginRedirectPath(authLoginPath, location), { replace: true });
    setDetail(null);
  };

  return (
    <>
      {children}
      {detail ? (
        <SdkworkSessionAuthRequiredDialog
          copy={dialogCopy}
          detail={detail}
          onClose={handleClose}
          onLogin={handleLogin}
        />
      ) : null}
    </>
  );
}
