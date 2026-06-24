import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Bell,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import {
  getSdkworkMediaDeliveryUrl,
  toExternalSdkworkMediaResource,
} from "@sdkwork/runtime-bootstrap";
import {
  Button,
  Input,
  Label,
  SettingsSection,
  StatusNotice,
  Switch,
} from "@sdkwork/ui-pc-react";
import { coalesce, defaultIfBlank, isBlank } from "@sdkwork/utils";
import { useSdkworkUserIntl } from "../user-intl.tsx";
import {
  createSdkworkUserSectionSurfaceStyle,
  mergeSdkworkUserClassNames,
  mergeSdkworkUserStyles,
  resolveSdkworkUserAppearance,
  type SdkworkUserAppearanceConfig,
} from "../user-appearance.ts";
import type {
  SdkworkUserProfileCapabilities,
  SdkworkUserPreferences,
  SdkworkUserProfile,
  SdkworkUserSecurityCapabilities,
} from "../user-service.ts";

function Surface({
  appearance,
  children,
}: {
  appearance?: SdkworkUserAppearanceConfig;
  children: ReactNode;
}) {
  const resolvedAppearance = resolveSdkworkUserAppearance(appearance);

  return (
    <div
      className={mergeSdkworkUserClassNames(
        "rounded-[1.5rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] p-6 shadow-[var(--sdk-shadow-sm)]",
        resolvedAppearance?.sectionSurfaceClassName,
      )}
      style={mergeSdkworkUserStyles(
        createSdkworkUserSectionSurfaceStyle(),
        resolvedAppearance?.sectionSurfaceStyle,
      )}
    >
      {children}
    </div>
  );
}

function PasswordInputField({
  hideLabel,
  id,
  isVisible,
  label,
  onChange,
  onToggle,
  showLabel,
  value,
}: {
  hideLabel: string;
  id: string;
  isVisible: boolean;
  label: string;
  onChange(value: string): void;
  onToggle(): void;
  showLabel: string;
  value: string;
}) {
  const toggleLabel = isVisible ? hideLabel : showLabel;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          className="pr-10"
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          aria-label={toggleLabel}
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
          onClick={onToggle}
          type="button"
          variant="ghost"
        >
          {isVisible ? (
            <EyeOff aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Eye aria-hidden="true" className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function SdkworkUserOverviewSection({
  appearance,
  preferences,
  profile,
}: {
  appearance?: SdkworkUserAppearanceConfig;
  preferences: SdkworkUserPreferences;
  profile: SdkworkUserProfile;
}) {
  const {
    copy,
    formatOverviewValue,
  } = useSdkworkUserIntl();
  const displayName = defaultIfBlank(
    coalesce([profile.firstName, profile.lastName].filter(Boolean).join(" ")),
    copy.overview.displayNameFallback,
  );

  return (
    <div className="space-y-6">
      <Surface appearance={appearance}>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sdk-color-brand-primary-soft)] text-[var(--sdk-color-brand-primary)]">
            <UserCircle2 className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-semibold text-[var(--sdk-color-text-primary)]">{displayName}</div>
            <div className="mt-1 text-sm text-[var(--sdk-color-text-secondary)]">{profile.email}</div>
            <div className="mt-3 text-sm leading-6 text-[var(--sdk-color-text-secondary)]">
              {copy.overview.description}
            </div>
          </div>
        </div>
      </Surface>

      <div className="grid gap-4 md:grid-cols-3">
        <Surface appearance={appearance}>
          <div className="flex items-center gap-3 text-[var(--sdk-color-text-primary)]">
            <Sparkles className="h-5 w-5 text-[var(--sdk-color-brand-primary)]" />
            <span className="font-medium">{copy.overview.generalTitle}</span>
          </div>
          <div className="mt-3 text-sm text-[var(--sdk-color-text-secondary)]">
            {formatOverviewValue(copy.overview.generalValueTemplate, preferences.general.compactModelSelector)}
          </div>
        </Surface>
        <Surface appearance={appearance}>
          <div className="flex items-center gap-3 text-[var(--sdk-color-text-primary)]">
            <Bell className="h-5 w-5 text-[var(--sdk-color-brand-primary)]" />
            <span className="font-medium">{copy.overview.notificationsTitle}</span>
          </div>
          <div className="mt-3 text-sm text-[var(--sdk-color-text-secondary)]">
            {formatOverviewValue(copy.overview.notificationsValueTemplate, preferences.notifications.newMessages)}
          </div>
        </Surface>
        <Surface appearance={appearance}>
          <div className="flex items-center gap-3 text-[var(--sdk-color-text-primary)]">
            <ShieldCheck className="h-5 w-5 text-[var(--sdk-color-brand-primary)]" />
            <span className="font-medium">{copy.overview.securityTitle}</span>
          </div>
          <div className="mt-3 text-sm text-[var(--sdk-color-text-secondary)]">
            {formatOverviewValue(copy.overview.securityValueTemplate, preferences.security.loginAlerts)}
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function SdkworkUserProfileSection({
  appearance,
  capabilities,
  isSaving,
  onBindEmail,
  onBindPhone,
  onSendVerifyCode,
  onSubmit,
  onUnbindEmail,
  onUnbindPhone,
  profile,
}: {
  appearance?: SdkworkUserAppearanceConfig;
  capabilities: SdkworkUserProfileCapabilities;
  isSaving: boolean;
  onBindEmail?(email: string, verificationCode: string): Promise<void>;
  onBindPhone?(phone: string, verificationCode: string): Promise<void>;
  onSendVerifyCode?(input: {
    scene: "BIND_EMAIL" | "BIND_PHONE";
    target: string;
    verifyType: "EMAIL" | "PHONE";
  }): Promise<void>;
  onSubmit(profile: SdkworkUserProfile): Promise<void>;
  onUnbindEmail?(password: string): Promise<void>;
  onUnbindPhone?(password: string): Promise<void>;
  profile: SdkworkUserProfile;
}) {
  const { copy } = useSdkworkUserIntl();
  const [draft, setDraft] = useState(profile);
  const [emailDraft, setEmailDraft] = useState(profile.email);
  const [phoneDraft, setPhoneDraft] = useState(profile.phone);
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [unbindPassword, setUnbindPassword] = useState("");

  useEffect(() => {
    setDraft(profile);
    setEmailDraft(profile.email);
    setPhoneDraft(profile.phone);
  }, [profile]);

  return (
    <Surface appearance={appearance}>
      <SettingsSection
        description={copy.profile.description}
        title={copy.profile.title}
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(draft);
          }}
        >
          <div className="space-y-2">
            <Label>{copy.profile.firstNameLabel}</Label>
            <Input
              disabled={!capabilities.profileEditable}
              value={draft.firstName}
              onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{copy.profile.lastNameLabel}</Label>
            <Input
              disabled={!capabilities.profileEditable}
              value={draft.lastName}
              onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{copy.profile.avatarLabel}</Label>
            <Input
              disabled={!capabilities.avatarEditable}
              value={getSdkworkMediaDeliveryUrl(draft.avatar) || ""}
              onChange={(event) => setDraft({ ...draft, avatar: toExternalSdkworkMediaResource(event.target.value, "image") })}
            />
          </div>
          {capabilities.contactBindingEnabled ? (
            <div className="md:col-span-2 space-y-4 rounded-[1rem] border border-[var(--sdk-color-border-subtle)] p-4">
              <SettingsSection
                description={copy.profile.contactDescription}
                title={copy.profile.contactTitle}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>{copy.profile.emailLabel}</Label>
                    <div className="text-sm text-[var(--sdk-color-text-secondary)]">
                      {profile.email || copy.profile.notBound}
                      {profile.emailVerified ? ` · ${copy.profile.verifiedLabel}` : ""}
                    </div>
                    {capabilities.emailEditable ? (
                      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                        <Input
                          type="email"
                          value={emailDraft}
                          onChange={(event) => setEmailDraft(event.target.value)}
                          placeholder={copy.profile.emailLabel}
                        />
                        <Input
                          value={emailCode}
                          onChange={(event) => setEmailCode(event.target.value)}
                          placeholder={copy.profile.verificationCodeLabel}
                        />
                        <div className="flex gap-2">
                          <Button
                            disabled={!onSendVerifyCode || isBlank(emailDraft)}
                            loading={isSaving}
                            onClick={() => void onSendVerifyCode?.({
                              scene: "BIND_EMAIL",
                              target: emailDraft.trim(),
                              verifyType: "EMAIL",
                            })}
                            type="button"
                            variant="outline"
                          >
                            {copy.profile.sendCodeButton}
                          </Button>
                          <Button
                            disabled={!onBindEmail || isBlank(emailDraft) || isBlank(emailCode)}
                            loading={isSaving}
                            onClick={() => void onBindEmail?.(emailDraft.trim(), emailCode.trim())}
                            type="button"
                          >
                            {profile.email ? copy.profile.changeButton : copy.profile.bindButton}
                          </Button>
                          {profile.email && capabilities.emailUnbindEnabled && onUnbindEmail ? (
                            <Button
                              disabled={isBlank(unbindPassword)}
                              loading={isSaving}
                              onClick={() => void onUnbindEmail(unbindPassword.trim())}
                              type="button"
                              variant="outline"
                            >
                              {copy.profile.unbindButton}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{copy.profile.phoneLabel}</Label>
                    <div className="text-sm text-[var(--sdk-color-text-secondary)]">
                      {profile.phone || copy.profile.notBound}
                      {profile.phoneVerified ? ` · ${copy.profile.verifiedLabel}` : ""}
                    </div>
                    {capabilities.phoneEditable ? (
                      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                        <Input
                          value={phoneDraft}
                          onChange={(event) => setPhoneDraft(event.target.value)}
                          placeholder={copy.profile.phoneLabel}
                        />
                        <Input
                          value={phoneCode}
                          onChange={(event) => setPhoneCode(event.target.value)}
                          placeholder={copy.profile.verificationCodeLabel}
                        />
                        <div className="flex gap-2">
                          <Button
                            disabled={!onSendVerifyCode || isBlank(phoneDraft)}
                            loading={isSaving}
                            onClick={() => void onSendVerifyCode?.({
                              scene: "BIND_PHONE",
                              target: phoneDraft.trim(),
                              verifyType: "PHONE",
                            })}
                            type="button"
                            variant="outline"
                          >
                            {copy.profile.sendCodeButton}
                          </Button>
                          <Button
                            disabled={!onBindPhone || isBlank(phoneDraft) || isBlank(phoneCode)}
                            loading={isSaving}
                            onClick={() => void onBindPhone?.(phoneDraft.trim(), phoneCode.trim())}
                            type="button"
                          >
                            {profile.phone ? copy.profile.changeButton : copy.profile.bindButton}
                          </Button>
                          {profile.phone && capabilities.phoneUnbindEnabled && onUnbindPhone ? (
                            <Button
                              disabled={isBlank(unbindPassword)}
                              loading={isSaving}
                              onClick={() => void onUnbindPhone(unbindPassword.trim())}
                              type="button"
                              variant="outline"
                            >
                              {copy.profile.unbindButton}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {(profile.email || profile.phone) ? (
                    <div className="space-y-2 md:col-span-2">
                      <Label>{copy.security.currentPasswordLabel}</Label>
                      <Input
                        type="password"
                        value={unbindPassword}
                        onChange={(event) => setUnbindPassword(event.target.value)}
                      />
                    </div>
                  ) : null}
                </div>
              </SettingsSection>
            </div>
          ) : (
            <div className="space-y-2 md:col-span-2">
              <Label>{copy.profile.emailLabel}</Label>
              <Input
                disabled
                type="email"
                value={draft.email}
              />
            </div>
          )}
          <div className="md:col-span-2 flex justify-end">
            <Button disabled={!capabilities.profileEditable} loading={isSaving} type="submit">{copy.profile.saveButton}</Button>
          </div>
        </form>
      </SettingsSection>
    </Surface>
  );
}

export function SdkworkUserNotificationsSection({
  appearance,
  isSaving,
  onSubmit,
  preferences,
}: {
  appearance?: SdkworkUserAppearanceConfig;
  isSaving: boolean;
  onSubmit(preferences: Partial<SdkworkUserPreferences>): Promise<void>;
  preferences: SdkworkUserPreferences;
}) {
  const { copy } = useSdkworkUserIntl();
  const [draft, setDraft] = useState(preferences.notifications);

  useEffect(() => {
    setDraft(preferences.notifications);
  }, [preferences]);

  return (
    <Surface appearance={appearance}>
      <SettingsSection
        description={copy.notifications.description}
        title={copy.notifications.title}
      >
        <div className="space-y-4">
          {[
            ["systemUpdates", copy.notifications.systemUpdates],
            ["taskFailures", copy.notifications.taskFailures],
            ["taskCompletions", copy.notifications.taskCompletions],
            ["newMessages", copy.notifications.newMessages],
            ["securityAlerts", copy.notifications.securityAlerts],
          ].map(([key, label]) => (
            <div className="flex items-center justify-between rounded-[1rem] border border-[var(--sdk-color-border-subtle)] px-4 py-3" key={key}>
              <div className="text-sm font-medium text-[var(--sdk-color-text-primary)]">{label}</div>
              <Switch checked={draft[key as keyof typeof draft]} onCheckedChange={(checked) => setDraft({ ...draft, [key]: checked })} />
            </div>
          ))}
          <div className="flex justify-end">
            <Button loading={isSaving} onClick={() => void onSubmit({ notifications: draft })} type="button">{copy.notifications.saveButton}</Button>
          </div>
        </div>
      </SettingsSection>
    </Surface>
  );
}

export function SdkworkUserSecuritySection({
  appearance,
  capabilities,
  isSaving,
  onChangePassword,
  onSubmit,
  preferences,
}: {
  appearance?: SdkworkUserAppearanceConfig;
  capabilities: SdkworkUserSecurityCapabilities;
  isSaving: boolean;
  onChangePassword(currentPassword: string, nextPassword: string): Promise<void>;
  onSubmit(preferences: Partial<SdkworkUserPreferences>): Promise<void>;
  preferences: SdkworkUserPreferences;
}) {
  const { copy } = useSdkworkUserIntl();
  const [draftSecurity, setDraftSecurity] = useState(preferences.security);
  const [currentPassword, setCurrentPassword] = useState("");
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [nextPassword, setNextPassword] = useState("");
  const [nextPasswordVisible, setNextPasswordVisible] = useState(false);

  useEffect(() => {
    setDraftSecurity(preferences.security);
  }, [preferences]);

  return (
    <div className="space-y-6">
      <Surface appearance={appearance}>
        <SettingsSection
          description={copy.security.protectionDescription}
          title={copy.security.protectionTitle}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-[1rem] border border-[var(--sdk-color-border-subtle)] px-4 py-3">
              <div className="text-sm font-medium text-[var(--sdk-color-text-primary)]">{copy.security.loginAlerts}</div>
              <Switch checked={draftSecurity.loginAlerts} onCheckedChange={(checked) => setDraftSecurity({ ...draftSecurity, loginAlerts: checked })} />
            </div>
            <div className="flex items-center justify-between rounded-[1rem] border border-[var(--sdk-color-border-subtle)] px-4 py-3">
              <div className="text-sm font-medium text-[var(--sdk-color-text-primary)]">{copy.security.twoFactorAuth}</div>
              <Switch checked={draftSecurity.twoFactorAuth} onCheckedChange={(checked) => setDraftSecurity({ ...draftSecurity, twoFactorAuth: checked })} />
            </div>
            <div className="flex justify-end">
              <Button loading={isSaving} onClick={() => void onSubmit({ security: draftSecurity })} type="button">{copy.security.protectionSaveButton}</Button>
            </div>
          </div>
        </SettingsSection>
      </Surface>

      {capabilities.passwordChangeEnabled ? (
        <Surface appearance={appearance}>
          <SettingsSection
            description={copy.security.passwordDescription}
            title={copy.security.passwordTitle}
          >
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void onChangePassword(currentPassword, nextPassword);
              }}
            >
              <PasswordInputField
                hideLabel={copy.security.hidePasswordLabel}
                id="sdkwork-user-current-password"
                isVisible={currentPasswordVisible}
                label={copy.security.currentPasswordLabel}
                showLabel={copy.security.showPasswordLabel}
                value={currentPassword}
                onChange={setCurrentPassword}
                onToggle={() => setCurrentPasswordVisible((current) => !current)}
              />
              <PasswordInputField
                hideLabel={copy.security.hidePasswordLabel}
                id="sdkwork-user-new-password"
                isVisible={nextPasswordVisible}
                label={copy.security.newPasswordLabel}
                showLabel={copy.security.showPasswordLabel}
                value={nextPassword}
                onChange={setNextPassword}
                onToggle={() => setNextPasswordVisible((current) => !current)}
              />
              <div className="md:col-span-2 flex justify-end">
                <Button loading={isSaving} type="submit">
                  <Lock className="h-4 w-4" />
                  {copy.security.updatePasswordButton}
                </Button>
              </div>
            </form>
          </SettingsSection>
        </Surface>
      ) : null}

      <StatusNotice title={copy.security.boundaryTitle}>
        {copy.security.boundaryDescription}
      </StatusNotice>
    </div>
  );
}
