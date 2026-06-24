import {
  useEffect,
  useMemo,
} from "react";
import {
  Bell,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import {
  LoadingBlock,
  sdkToast,
  SettingsCenter,
  StatusNotice,
} from "@sdkwork/ui-pc-react";
import {
  createSdkworkUserDarkCardStyle,
  createSdkworkUserDarkIconWellStyle,
  mergeSdkworkUserClassNames,
  mergeSdkworkUserStyles,
  resolveSdkworkUserAppearance,
  type SdkworkUserAppearanceConfig,
} from "../user-appearance.ts";
import type { SdkworkUserMessagesOverrides } from "../user-copy.ts";
import {
  SdkworkUserIntlProvider,
  useSdkworkUserIntl,
} from "../user-intl.tsx";
import {
  useSdkworkUserController,
  useSdkworkUserControllerState,
  type CreateSdkworkUserControllerOptions,
  type SdkworkUserController,
} from "../user-controller.ts";
import {
  SdkworkUserNotificationsSection,
  SdkworkUserOverviewSection,
  SdkworkUserProfileSection,
  SdkworkUserSecuritySection,
} from "../components/user-sections.tsx";
import { SdkworkUserPageShell } from "../components/user-page-shell.tsx";

export interface SdkworkUserCenterPageProps {
  appearance?: SdkworkUserAppearanceConfig;
  controller?: SdkworkUserController;
  description?: string;
  locale?: string | null;
  messages?: SdkworkUserMessagesOverrides;
  title?: string;
  verification?: CreateSdkworkUserControllerOptions["verification"];
}

function buildPageIcons(index: number) {
  if (index === 1) {
    return <Bell className="h-5 w-5 text-white" />;
  }

  if (index === 2) {
    return <ShieldCheck className="h-5 w-5 text-white" />;
  }

  return <UserCircle2 className="h-5 w-5 text-white" />;
}

interface SdkworkUserCenterPageContentProps extends SdkworkUserCenterPageProps {}

function SdkworkUserCenterPageContent({
  appearance,
  controller: providedController,
  description,
  locale,
  messages,
  title,
  verification,
}: SdkworkUserCenterPageContentProps) {
  const { copy } = useSdkworkUserIntl();
  const resolvedAppearance = resolveSdkworkUserAppearance(appearance);
  const controllerOptions = useMemo<CreateSdkworkUserControllerOptions>(
    () => ({
      locale,
      messages,
      verification,
    }),
    [locale, messages, verification],
  );
  const controller = useSdkworkUserController(providedController, controllerOptions);
  const state = useSdkworkUserControllerState(controller);
  const capabilities = controller.service.capabilities;
  const resolvedTitle = title || copy.page.title;
  const resolvedDescription = description || copy.page.description;

  useEffect(() => {
    void controller.load();
  }, [controller]);

  const sections = Object.entries(state.registry.groups)
    .map(([group, items]) => ({
      items: items.map((section) => ({
        description: section.description,
        id: section.id,
        keywords: section.keywords,
        label: section.title,
      })),
      title: items[0]?.group ? copy.registry.groups[group as keyof typeof copy.registry.groups] : undefined,
    }))
    .filter((section) => section.items.length > 0);

  async function handleProfileSubmit(profile: NonNullable<typeof state.profile>) {
    try {
      await controller.updateProfile(profile);
      sdkToast.success(copy.toast.profileSaved);
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : copy.toast.profileSaveFailed);
    }
  }

  async function handleNotificationsSubmit(preferences: Parameters<SdkworkUserController["updatePreferences"]>[0]) {
    try {
      await controller.updatePreferences(preferences);
      sdkToast.success(copy.toast.notificationsSaved);
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : copy.toast.notificationsSaveFailed);
    }
  }

  async function handleSecuritySubmit(preferences: Parameters<SdkworkUserController["updatePreferences"]>[0]) {
    try {
      await controller.updatePreferences(preferences);
      sdkToast.success(copy.toast.securitySaved);
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : copy.toast.securitySaveFailed);
    }
  }

  async function handlePasswordChange(currentPassword: string, nextPassword: string) {
    try {
      await controller.updatePassword(currentPassword, nextPassword);
      sdkToast.success(copy.toast.passwordUpdated);
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : copy.toast.passwordUpdateFailed);
    }
  }

  async function handleBindEmail(email: string, verificationCode: string) {
    try {
      await controller.bindEmail(email, verificationCode);
      sdkToast.success(copy.toast.contactSaved);
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : copy.toast.contactSaveFailed);
    }
  }

  async function handleBindPhone(phone: string, verificationCode: string) {
    try {
      await controller.bindPhone(phone, verificationCode);
      sdkToast.success(copy.toast.contactSaved);
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : copy.toast.contactSaveFailed);
    }
  }

  async function handleUnbindEmail(password: string) {
    try {
      await controller.unbindEmail(password);
      sdkToast.success(copy.toast.contactSaved);
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : copy.toast.contactSaveFailed);
    }
  }

  async function handleUnbindPhone(password: string) {
    try {
      await controller.unbindPhone(password);
      sdkToast.success(copy.toast.contactSaved);
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : copy.toast.contactSaveFailed);
    }
  }

  async function handleSendVerifyCode(input: Parameters<SdkworkUserController["sendVerifyCode"]>[0]) {
    try {
      await controller.sendVerifyCode(input);
      sdkToast.success(copy.toast.verificationCodeSent);
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : copy.toast.verificationCodeSendFailed);
    }
  }

  const activeSection = (() => {
    if (state.isLoading || !state.profile || !state.preferences) {
      return <LoadingBlock label={copy.common.loading} />;
    }

    if (state.activeSectionId === "overview") {
      return (
        <SdkworkUserOverviewSection
          appearance={resolvedAppearance}
          preferences={state.preferences}
          profile={state.profile}
        />
      );
    }

    if (state.activeSectionId === "notifications") {
      return (
        <SdkworkUserNotificationsSection
          appearance={resolvedAppearance}
          isSaving={state.isSaving}
          onSubmit={handleNotificationsSubmit}
          preferences={state.preferences}
        />
      );
    }

    if (state.activeSectionId === "security") {
      return (
        <SdkworkUserSecuritySection
          appearance={resolvedAppearance}
          capabilities={capabilities.security}
          isSaving={state.isSaving}
          onChangePassword={handlePasswordChange}
          onSubmit={handleSecuritySubmit}
          preferences={state.preferences}
        />
      );
    }

    return (
      <SdkworkUserProfileSection
        appearance={resolvedAppearance}
        capabilities={capabilities.profile}
        isSaving={state.isSaving}
        onBindEmail={handleBindEmail}
        onBindPhone={handleBindPhone}
        onSendVerifyCode={handleSendVerifyCode}
        onSubmit={handleProfileSubmit}
        onUnbindEmail={handleUnbindEmail}
        onUnbindPhone={handleUnbindPhone}
        profile={state.profile}
      />
    );
  })();

  const standardsContent = (
    <div className="grid gap-3">
      {copy.standards.items.map((item, index) => (
        <div
          className={mergeSdkworkUserClassNames(
            "rounded-[1.25rem] border p-4",
            resolvedAppearance?.standardsCardClassName,
          )}
          key={item.title}
          style={mergeSdkworkUserStyles(
            createSdkworkUserDarkCardStyle(),
            resolvedAppearance?.standardsCardStyle,
          )}
        >
          <div
            className={mergeSdkworkUserClassNames(
              "mb-3 flex h-10 w-10 items-center justify-center rounded-[0.9rem]",
              resolvedAppearance?.standardsIconWellClassName,
            )}
            style={mergeSdkworkUserStyles(
              createSdkworkUserDarkIconWellStyle(),
              resolvedAppearance?.standardsIconWellStyle,
            )}
          >
            {buildPageIcons(index)}
          </div>
          <div className="text-sm font-semibold tracking-tight text-white">
            {item.title}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <SdkworkUserPageShell
      appearance={resolvedAppearance}
      badge={copy.page.badge}
      description={resolvedDescription}
      heroIcon={<Sparkles className="h-7 w-7" />}
      standardsContent={standardsContent}
      standardsEyebrow={copy.page.standardsEyebrow}
      title={resolvedTitle}
    >
      {state.lastError ? (
        <StatusNotice className="mb-4" tone="danger" title={copy.page.errorTitle}>
          {state.lastError}
        </StatusNotice>
      ) : null}

      <SettingsCenter
        activeItem={state.activeSectionId}
        description={resolvedDescription}
        onActiveItemChange={(itemId) => controller.selectSection(itemId)}
        onSearchChange={(value) => controller.setSearchValue(value)}
        searchPlaceholder={copy.common.searchPlaceholder}
        searchValue={state.searchValue}
        sections={sections}
        title={resolvedTitle}
      >
        {activeSection}
      </SettingsCenter>
    </SdkworkUserPageShell>
  );
}

export function SdkworkUserCenterPage({
  locale,
  messages,
  verification,
  ...props
}: SdkworkUserCenterPageProps) {
  const content = (
    <SdkworkUserCenterPageContent
      {...props}
      locale={locale}
      messages={messages}
      verification={verification}
    />
  );

  if (locale || messages) {
    return (
      <SdkworkUserIntlProvider locale={locale} messages={messages}>
        {content}
      </SdkworkUserIntlProvider>
    );
  }

  return content;
}
