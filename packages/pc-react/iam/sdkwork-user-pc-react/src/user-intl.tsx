import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import {
  createSdkworkUserMessages,
  formatSdkworkUserTemplate,
  normalizeSdkworkUserLocale,
  type SdkworkUserLocale,
  type SdkworkUserMessages,
  type SdkworkUserMessagesOverrides,
} from "./user-copy.ts";

export interface SdkworkUserIntlValue {
  copy: SdkworkUserMessages;
  formatEnabledState: (enabled: boolean) => string;
  formatOverviewValue: (template: string, enabled: boolean) => string;
  locale: SdkworkUserLocale;
}

export interface SdkworkUserIntlProviderProps extends PropsWithChildren {
  locale?: string | null;
  messages?: SdkworkUserMessagesOverrides;
}

function createSdkworkUserIntlValue(
  locale?: string | null,
  overrides?: SdkworkUserMessagesOverrides,
): SdkworkUserIntlValue {
  const resolvedLocale = normalizeSdkworkUserLocale(locale);
  const copy = createSdkworkUserMessages(resolvedLocale, overrides);

  return {
    copy,
    formatEnabledState(enabled) {
      return enabled ? copy.common.enabled : copy.common.disabled;
    },
    formatOverviewValue(template, enabled) {
      return formatSdkworkUserTemplate(template, {
        value: enabled ? copy.common.enabled : copy.common.disabled,
      });
    },
    locale: resolvedLocale,
  };
}

const DEFAULT_SDKWORK_USER_INTL = createSdkworkUserIntlValue();

const SdkworkUserIntlContext = createContext<SdkworkUserIntlValue>(
  DEFAULT_SDKWORK_USER_INTL,
);

export function SdkworkUserIntlProvider({
  children,
  locale,
  messages,
}: SdkworkUserIntlProviderProps) {
  const value = useMemo(
    () => createSdkworkUserIntlValue(locale, messages),
    [locale, messages],
  );

  return (
    <SdkworkUserIntlContext.Provider value={value}>
      {children}
    </SdkworkUserIntlContext.Provider>
  );
}

export function useSdkworkUserIntl(): SdkworkUserIntlValue {
  return useContext(SdkworkUserIntlContext);
}
