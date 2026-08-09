import { MessageCircle } from "lucide-react";

import { useSdkworkIamH5AuthMessages } from "../i18n";
import type { SdkworkIamH5AuthMode } from "../types/auth-h5-types";

const MODE_TITLE_KEYS: Record<SdkworkIamH5AuthMode, "loginPwd" | "loginCode" | "register" | "forgot"> = {
  "login-pwd": "loginPwd",
  "login-code": "loginCode",
  register: "register",
  forgot: "forgot",
};

export function SdkworkIamH5AuthHeader({ mode }: { mode: SdkworkIamH5AuthMode }) {
  const messages = useSdkworkIamH5AuthMessages();
  return (
    <div className="mb-10 flex flex-col items-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--iam-h5-auth-green)] shadow-sm">
        <MessageCircle className="h-10 w-10 fill-white text-white" />
      </div>
      <h1 className="text-center text-2xl font-semibold">
        {messages.modes[MODE_TITLE_KEYS[mode]]}
      </h1>
    </div>
  );
}
