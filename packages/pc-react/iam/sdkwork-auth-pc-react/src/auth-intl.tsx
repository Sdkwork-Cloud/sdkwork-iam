import { useMemo } from "react";
import { useSdkworkI18n, useSdkworkModuleMessages } from "@sdkwork/i18n-pc-react";
import {
  formatSdkworkAuthTemplate,
  SDKWORK_AUTH_I18N_CATALOG,
  type SdkworkAuthLocale,
  type SdkworkAuthMessages,
} from "./auth-copy.ts";
import type {
  SdkworkAuthLoginMethod,
  SdkworkAuthQrPanelState,
} from "./auth-runtime-config.ts";

export interface SdkworkAuthIntlValue {
  copy: SdkworkAuthMessages;
  formatLoginMethodLabel: (method: SdkworkAuthLoginMethod) => string;
  formatOAuthProviderContinueLabel: (provider: string) => string;
  formatOAuthProviderHint: (provider: string) => string;
  formatOAuthProviderName: (provider: string) => string;
  formatQrStatusLabel: (state: SdkworkAuthQrPanelState) => string;
  locale: SdkworkAuthLocale;
}

function humanizeProviderName(provider: string, locale: SdkworkAuthLocale): string {
  const normalized = provider.trim().toLowerCase();
  if (normalized === "github") {
    return "GitHub";
  }

  if (normalized === "wechat") {
    return locale === "zh-CN" ? "\u5fae\u4fe1" : "WeChat";
  }

  if (normalized === "alipay") {
    return locale === "zh-CN" ? "\u652f\u4ed8\u5b9d" : "Alipay";
  }

  if (normalized === "douyin") {
    return locale === "zh-CN" ? "\u6296\u97f3" : "Douyin";
  }

  if (normalized === "tiktok" || normalized === "tik_tok") {
    return "TikTok";
  }

  if (normalized === "google") {
    return "Google";
  }

  return provider
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function createSdkworkAuthIntlValue(
  copy: SdkworkAuthMessages,
  locale: SdkworkAuthLocale,
): SdkworkAuthIntlValue {
  return {
    copy,
    formatLoginMethodLabel(method) {
      if (method === "emailCode") {
        return copy.login.emailCodeMethod;
      }

      if (method === "phoneCode") {
        return copy.login.phoneCodeMethod;
      }

      if (method === "sessionBridge") {
        return copy.login.sessionBridgeMethod;
      }

      return copy.login.passwordMethod;
    },
    formatOAuthProviderContinueLabel(provider) {
      return formatSdkworkAuthTemplate(copy.oauth.providerContinueTemplate, {
        provider: humanizeProviderName(provider, locale),
      });
    },
    formatOAuthProviderHint(provider) {
      return formatSdkworkAuthTemplate(copy.oauth.providerHintTemplate, {
        provider: humanizeProviderName(provider, locale),
      });
    },
    formatOAuthProviderName(provider) {
      return humanizeProviderName(provider, locale);
    },
    formatQrStatusLabel(state) {
      return state === "idle" ? copy.qr.status.pending : copy.qr.status[state];
    },
    locale,
  };
}

export function useSdkworkAuthIntl(): SdkworkAuthIntlValue {
  const copy = useSdkworkModuleMessages(SDKWORK_AUTH_I18N_CATALOG);
  const i18n = useSdkworkI18n();
  const locale = i18n?.locale ?? SDKWORK_AUTH_I18N_CATALOG.defaultLocale;

  return useMemo(
    () => createSdkworkAuthIntlValue(copy, locale),
    [copy, locale],
  );
}
