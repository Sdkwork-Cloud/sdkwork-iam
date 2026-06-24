import {
  ArrowRight,
  AtSign,
  GitBranch,
  Globe,
  LoaderCircle,
  MessageCircle,
  Music2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import {
  createSdkworkAuthOAuthCardStyle,
  mergeSdkworkAuthClassNames,
  mergeSdkworkAuthStyles,
  resolveSdkworkAuthAppearance,
  type SdkworkAuthAppearanceConfig,
} from "../auth-appearance.ts";
import { useSdkworkAuthIntl } from "../auth-intl.tsx";

export interface SdkworkOAuthProviderGridProps {
  activeProvider?: string | null;
  appearance?: SdkworkAuthAppearanceConfig;
  onSelect(provider: string): void;
  providers: string[];
}

function resolveProviderIcon(provider: string) {
  if (provider === "github") {
    return <GitBranch className="h-5 w-5" />;
  }

  if (provider === "google") {
    return <Globe className="h-5 w-5" />;
  }

  if (provider === "wechat" || provider === "wechat_mini_program" || provider === "wechat_open") {
    return <MessageCircle className="h-5 w-5" />;
  }

  if (provider === "alipay") {
    return <ShieldCheck className="h-5 w-5" />;
  }

  if (provider === "douyin" || provider === "tiktok") {
    return <Music2 className="h-5 w-5" />;
  }

  if (provider === "twitter" || provider === "x") {
    return <AtSign className="h-5 w-5" />;
  }

  if (provider === "qq" || provider === "line") {
    return <MessageCircle className="h-5 w-5" />;
  }

  if (provider === "phone" || provider === "huawei" || provider === "xiaomi") {
    return <Smartphone className="h-5 w-5" />;
  }

  return <ShieldCheck className="h-5 w-5" />;
}

export function SdkworkOAuthProviderGrid({
  activeProvider,
  appearance,
  onSelect,
  providers,
}: SdkworkOAuthProviderGridProps) {
  const resolvedAppearance = resolveSdkworkAuthAppearance(appearance);
  const {
    copy,
    formatOAuthProviderContinueLabel,
    formatOAuthProviderHint,
  } = useSdkworkAuthIntl();

  if (!providers.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 pt-2">
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-[var(--sdkwork-auth-divider-color,rgba(24,24,27,0.12))]"
        />
        <h3 className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {copy.oauth.dividerLabel}
        </h3>
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-[var(--sdkwork-auth-divider-color,rgba(24,24,27,0.12))]"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => {
          const isBusy = activeProvider === provider;
          const providerHint = formatOAuthProviderHint(provider);

          return (
            <button
              className={mergeSdkworkAuthClassNames(
                `group flex min-h-[72px] w-full items-center justify-between rounded-lg bg-[var(--sdkwork-auth-oauth-card-background-color,#ffffff)] px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  isBusy
                    ? "bg-primary-50/60 dark:bg-primary-950/20"
                    : "hover:bg-[var(--sdkwork-auth-oauth-card-hover-background-color,rgba(244,244,245,0.96))] dark:hover:bg-[var(--sdkwork-auth-oauth-card-hover-background-color,rgba(39,39,42,0.9))]"
                }`,
                resolvedAppearance?.oauthProviderCardClassName,
              )}
              disabled={Boolean(activeProvider)}
              key={provider}
              onClick={() => onSelect(provider)}
              style={mergeSdkworkAuthStyles(
                createSdkworkAuthOAuthCardStyle(),
                resolvedAppearance?.oauthProviderCardStyle,
              )}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  data-sdkwork-oauth-provider-icon=""
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isBusy
                      ? "bg-white text-primary-600 dark:bg-zinc-950 dark:text-primary-200"
                      : "bg-[var(--sdkwork-auth-oauth-card-icon-background-color,#f4f4f5)] text-[var(--sdkwork-auth-oauth-card-icon-color,#52525b)] group-hover:text-primary-600 dark:group-hover:text-primary-200"
                  }`}
                >
                  {resolveProviderIcon(provider)}
                </span>
                <span className="min-w-0">
                  <span className="text-sm font-semibold text-[var(--sdkwork-auth-oauth-card-title-color,#18181b)]">
                    {formatOAuthProviderContinueLabel(provider)}
                  </span>
                  {providerHint ? (
                    <span className="mt-0.5 block text-xs leading-5 text-[var(--sdkwork-auth-oauth-card-hint-color,#71717a)]">
                      {providerHint}
                    </span>
                  ) : null}
                </span>
              </span>
              {isBusy ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-primary-500" />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--sdkwork-auth-oauth-card-action-color,#a1a1aa)] transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-200">
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
