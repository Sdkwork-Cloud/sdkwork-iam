import { getAppClientWithSession } from "@sdkwork/core-pc-react";
import {
  readSdkworkMediaResource,
  type SdkworkMediaResource,
} from "@sdkwork/runtime-bootstrap";
import {
  createSdkworkUserMessages,
  type SdkworkUserMessagesOverrides,
} from "./user-copy.ts";
import { getDefaultSdkworkUserStorage } from "./user-preferences.ts";
import { coalesce, isSdkWorkSuccessCode } from "@sdkwork/utils";

export interface SdkworkUserProfile {
  avatar?: SdkworkMediaResource;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  phoneVerified: boolean;
}

export interface SdkworkUserPreferences {
  general: {
    compactModelSelector: boolean;
    launchOnStartup: boolean;
    startMinimized: boolean;
  };
  notifications: {
    newMessages: boolean;
    securityAlerts: boolean;
    systemUpdates: boolean;
    taskCompletions: boolean;
    taskFailures: boolean;
  };
  privacy: {
    personalizedRecommendations: boolean;
    shareUsageData: boolean;
  };
  security: {
    loginAlerts: boolean;
    twoFactorAuth: boolean;
  };
}

export interface SdkworkUserProfileCapabilities {
  avatarEditable: boolean;
  contactBindingEnabled: boolean;
  emailEditable: boolean;
  emailUnbindEnabled: boolean;
  oauthBindingEnabled: boolean;
  phoneEditable: boolean;
  phoneUnbindEnabled: boolean;
  profileEditable: boolean;
}

export interface SdkworkUserSecurityCapabilities {
  passwordChangeEnabled: boolean;
}

export interface SdkworkUserServiceCapabilities {
  profile: SdkworkUserProfileCapabilities;
  security: SdkworkUserSecurityCapabilities;
}

export interface SdkworkUserStorageLike {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface SdkworkUserVerificationHandlers {
  sendVerifyCode(input: {
    scene: "BIND_EMAIL" | "BIND_PHONE";
    target: string;
    verifyType: "EMAIL" | "PHONE";
  }): Promise<void>;
}

export interface SdkworkUserClient {
  iam?: {
    users?: {
      current?: {
        emailBindings?: {
          create?: (payload: Record<string, unknown>) => Promise<unknown>;
          delete?: (payload: Record<string, unknown>) => Promise<unknown>;
        };
        password?: {
          update?: (payload: Record<string, unknown>) => Promise<unknown>;
        };
        phoneBindings?: {
          create?: (payload: Record<string, unknown>) => Promise<unknown>;
          delete?: (payload: Record<string, unknown>) => Promise<unknown>;
        };
        retrieve?: () => Promise<unknown>;
        update?: (payload: Record<string, unknown>) => Promise<unknown>;
      };
    };
  };
  notification?: {
    getNotificationSettings?: () => Promise<unknown>;
    updateNotificationSettings?: (payload: RemoteNotificationSettings) => Promise<unknown>;
    updateTypeSettings?: (type: string, payload: Record<string, unknown>) => Promise<unknown>;
  };
  system?: {
    iam?: {
      accountBindingPolicy?: {
        retrieve?: () => Promise<unknown>;
      };
      verificationPolicy?: {
        retrieve?: () => Promise<unknown>;
      };
    };
  };
  oauth?: {
    accountLinks?: {
      list?: (params?: Record<string, unknown>) => Promise<unknown>;
    };
  };
}

export interface CreateSdkworkUserServiceOptions {
  getClient?: () => SdkworkUserClient;
  locale?: string | null;
  messages?: SdkworkUserMessagesOverrides;
  storage?: SdkworkUserStorageLike | null;
  verification?: SdkworkUserVerificationHandlers;
}

export interface SdkworkUserService {
  capabilities: SdkworkUserServiceCapabilities;
  refreshAccountBindingPolicy(): Promise<SdkworkUserServiceCapabilities>;
  bindEmail(email: string, verificationCode: string): Promise<SdkworkUserProfile>;
  bindPhone(phone: string, verificationCode: string): Promise<SdkworkUserProfile>;
  getPreferences(): Promise<SdkworkUserPreferences>;
  getProfile(): Promise<SdkworkUserProfile>;
  unbindEmail(password: string): Promise<SdkworkUserProfile>;
  unbindPhone(password: string): Promise<SdkworkUserProfile>;
  updatePassword(currentPassword: string, nextPassword: string): Promise<void>;
  updatePreferences(preferences: Partial<SdkworkUserPreferences>): Promise<SdkworkUserPreferences>;
  updateProfile(profile: SdkworkUserProfile): Promise<SdkworkUserProfile>;
}

interface SdkworkAppSdkEnvelope<T> {
  code?: number | string;
  data?: T;
  message?: string;
  msg?: string;
}

interface RemoteNotificationTypeSettings {
  enableEmail?: boolean;
  enableInApp?: boolean;
  enablePush?: boolean;
  enableSms?: boolean;
}

interface RemoteNotificationSettings {
  enableEmail?: boolean;
  enableInApp?: boolean;
  enablePush?: boolean;
  enableSms?: boolean;
  notificationSound?: string;
  quietHoursEnd?: string;
  quietHoursStart?: string;
  typeSettings?: Record<string, RemoteNotificationTypeSettings>;
  vibrationEnabled?: boolean;
}

const SETTINGS_OVERLAY_STORAGE_KEY = "sdkwork-user-settings-overlay";
const TASK_NOTIFICATION_TYPE = "TASK";
const MESSAGE_NOTIFICATION_TYPE = "MESSAGE";
const ALERT_NOTIFICATION_TYPE_CANDIDATES = ["ALERT", "SECURITY"];

const DEFAULT_GENERAL_PREFERENCES: SdkworkUserPreferences["general"] = {
  compactModelSelector: true,
  launchOnStartup: false,
  startMinimized: false,
};

const DEFAULT_PRIVACY_PREFERENCES: SdkworkUserPreferences["privacy"] = {
  personalizedRecommendations: false,
  shareUsageData: false,
};

const DEFAULT_SECURITY_PREFERENCES: SdkworkUserPreferences["security"] = {
  loginAlerts: true,
  twoFactorAuth: false,
};

const DEFAULT_USER_SERVICE_CAPABILITIES: SdkworkUserServiceCapabilities = {
  profile: {
    avatarEditable: false,
    contactBindingEnabled: false,
    emailEditable: false,
    emailUnbindEnabled: false,
    oauthBindingEnabled: false,
    phoneEditable: false,
    phoneUnbindEnabled: false,
    profileEditable: false,
  },
  security: {
    passwordChangeEnabled: false,
  },
};

interface SdkworkAccountBindingPolicyContact {
  enabled?: boolean;
  emailEnabled?: boolean;
  phoneEnabled?: boolean;
  emailChangeEnabled?: boolean;
  phoneChangeEnabled?: boolean;
  emailUnbindEnabled?: boolean;
  phoneUnbindEnabled?: boolean;
}

interface SdkworkAccountBindingPolicyOauth {
  enabled?: boolean;
  selfServiceLinkEnabled?: boolean;
  selfServiceUnlinkEnabled?: boolean;
}

interface SdkworkAccountBindingPolicyDocument {
  contactBinding?: SdkworkAccountBindingPolicyContact;
  oauthBinding?: SdkworkAccountBindingPolicyOauth;
}

function normalizeAccountBindingPolicy(value: unknown): SdkworkAccountBindingPolicyDocument | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const contactBinding = (record.contactBinding ?? record.contact_binding) as SdkworkAccountBindingPolicyContact | undefined;
  const oauthBinding = (record.oauthBinding ?? record.oauth_binding) as SdkworkAccountBindingPolicyOauth | undefined;

  return {
    contactBinding,
    oauthBinding,
  };
}

function resolveUserServiceCapabilities(
  client: SdkworkUserClient,
  accountBindingPolicy: SdkworkAccountBindingPolicyDocument | null,
): SdkworkUserServiceCapabilities {
  const current = client.iam?.users?.current;
  const sdkContactBindingEnabled = Boolean(
    current?.emailBindings?.create
    && current?.phoneBindings?.create
    && current?.emailBindings?.delete
    && current?.phoneBindings?.delete,
  );
  const contactPolicy = accountBindingPolicy?.contactBinding;
  const oauthPolicy = accountBindingPolicy?.oauthBinding;
  const contactBindingEnabled = sdkContactBindingEnabled
    && (contactPolicy?.enabled ?? true);
  const emailBindingAllowed = contactBindingEnabled && (contactPolicy?.emailEnabled ?? true);
  const phoneBindingAllowed = contactBindingEnabled && (contactPolicy?.phoneEnabled ?? true);

  return {
    profile: {
      avatarEditable: Boolean(current?.update),
      contactBindingEnabled,
      emailEditable: Boolean(current?.emailBindings?.create) && emailBindingAllowed,
      emailUnbindEnabled: Boolean(current?.emailBindings?.delete)
        && emailBindingAllowed
        && (contactPolicy?.emailUnbindEnabled === true),
      oauthBindingEnabled: Boolean(client.oauth?.accountLinks?.list)
        && (oauthPolicy?.enabled === true),
      phoneEditable: Boolean(current?.phoneBindings?.create) && phoneBindingAllowed,
      phoneUnbindEnabled: Boolean(current?.phoneBindings?.delete)
        && phoneBindingAllowed
        && (contactPolicy?.phoneUnbindEnabled === true),
      profileEditable: Boolean(current?.update),
    },
    security: {
      passwordChangeEnabled: Boolean(current?.password?.update),
    },
  };
}

function isSuccessCode(code: number | string | undefined): boolean {
  if (code === undefined || code === null) {
    return true;
  }

  const parsed = Number(String(code).trim());
  return Number.isFinite(parsed) && isSdkWorkSuccessCode(parsed);
}

function unwrapAppSdkResponse<T>(
  payload: unknown,
  fallbackMessage: string,
): T {
  if (!payload || typeof payload !== "object") {
    return payload as T;
  }

  if (!("code" in payload) && !("data" in payload)) {
    return payload as T;
  }

  const envelope = payload as SdkworkAppSdkEnvelope<T>;
  if (!isSuccessCode(envelope.code)) {
    throw new Error(String(envelope.message || envelope.msg || fallbackMessage).trim());
  }

  return (envelope.data ?? null) as T;
}

function requireSdkResourceMethod<TMethod>(
  method: TMethod | undefined,
  name: string,
): TMethod {
  if (!method) {
    throw new Error(`Missing SDKWork appbase app SDK resource: ${name}`);
  }

  return method;
}

function normalizeOptionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

function readSettingsOverlay(storage: SdkworkUserStorageLike | null): Pick<SdkworkUserPreferences, "general" | "privacy" | "security"> {
  if (!storage) {
    return {
      general: { ...DEFAULT_GENERAL_PREFERENCES },
      privacy: { ...DEFAULT_PRIVACY_PREFERENCES },
      security: { ...DEFAULT_SECURITY_PREFERENCES },
    };
  }

  const rawValue = storage.getItem(SETTINGS_OVERLAY_STORAGE_KEY);
  if (!rawValue) {
    return {
      general: { ...DEFAULT_GENERAL_PREFERENCES },
      privacy: { ...DEFAULT_PRIVACY_PREFERENCES },
      security: { ...DEFAULT_SECURITY_PREFERENCES },
    };
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<Pick<SdkworkUserPreferences, "general" | "privacy" | "security">>;
    return {
      general: { ...DEFAULT_GENERAL_PREFERENCES, ...parsed.general },
      privacy: { ...DEFAULT_PRIVACY_PREFERENCES, ...parsed.privacy },
      security: { ...DEFAULT_SECURITY_PREFERENCES, ...parsed.security },
    };
  } catch {
    return {
      general: { ...DEFAULT_GENERAL_PREFERENCES },
      privacy: { ...DEFAULT_PRIVACY_PREFERENCES },
      security: { ...DEFAULT_SECURITY_PREFERENCES },
    };
  }
}

function writeSettingsOverlay(
  storage: SdkworkUserStorageLike | null,
  overlay: Pick<SdkworkUserPreferences, "general" | "privacy" | "security">,
): void {
  storage?.setItem(SETTINGS_OVERLAY_STORAGE_KEY, JSON.stringify(overlay));
}

function resolveNotificationTypeSetting(
  settings: RemoteNotificationSettings,
  notificationTypes: string[],
  channel: keyof RemoteNotificationTypeSettings,
  fallback: boolean,
): boolean {
  for (const notificationType of notificationTypes) {
    const value = settings.typeSettings?.[notificationType]?.[channel];
    if (value !== undefined) {
      return value;
    }
  }

  return fallback;
}

function buildPreferencesFromNotificationSettings(
  settings: RemoteNotificationSettings,
  overlay: Pick<SdkworkUserPreferences, "general" | "privacy" | "security">,
): SdkworkUserPreferences {
  const emailEnabled = settings.enableEmail ?? true;
  const inAppEnabled = settings.enableInApp ?? true;

  return {
    general: overlay.general,
    notifications: {
      newMessages: resolveNotificationTypeSetting(
        settings,
        [MESSAGE_NOTIFICATION_TYPE],
        "enableInApp",
        inAppEnabled,
      ),
      securityAlerts: resolveNotificationTypeSetting(
        settings,
        ALERT_NOTIFICATION_TYPE_CANDIDATES,
        "enableEmail",
        emailEnabled,
      ),
      systemUpdates: emailEnabled,
      taskCompletions: resolveNotificationTypeSetting(
        settings,
        [TASK_NOTIFICATION_TYPE],
        "enableInApp",
        inAppEnabled,
      ),
      taskFailures: resolveNotificationTypeSetting(
        settings,
        [TASK_NOTIFICATION_TYPE],
        "enableEmail",
        emailEnabled,
      ),
    },
    privacy: overlay.privacy,
    security: overlay.security,
  };
}

function buildNotificationSettingsUpdate(
  current: RemoteNotificationSettings,
  notifications: Partial<SdkworkUserPreferences["notifications"]>,
): RemoteNotificationSettings {
  return {
    enableEmail: notifications.systemUpdates ?? current.enableEmail,
    enableInApp: current.enableInApp,
    enablePush: current.enablePush,
    enableSms: current.enableSms,
    notificationSound: current.notificationSound,
    quietHoursEnd: current.quietHoursEnd,
    quietHoursStart: current.quietHoursStart,
    vibrationEnabled: current.vibrationEnabled,
  };
}

function buildNotificationTypeSettingsUpdates(
  currentSettings: RemoteNotificationSettings,
  notifications: Partial<SdkworkUserPreferences["notifications"]>,
): Array<Record<string, unknown>> {
  const updates: Array<Record<string, unknown>> = [];

  if (notifications.taskFailures !== undefined || notifications.taskCompletions !== undefined) {
    updates.push({
      enableEmail: notifications.taskFailures,
      enableInApp: notifications.taskCompletions,
      type: TASK_NOTIFICATION_TYPE,
    });
  }

  if (notifications.securityAlerts !== undefined) {
    updates.push({
      enableEmail: notifications.securityAlerts,
      type: currentSettings.typeSettings?.SECURITY ? "SECURITY" : "ALERT",
    });
  }

  if (notifications.newMessages !== undefined) {
    updates.push({
      enableInApp: notifications.newMessages,
      type: MESSAGE_NOTIFICATION_TYPE,
    });
  }

  return updates;
}

function toUserProfile(profile: {
  avatar?: unknown;
  displayName?: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  nickname?: string;
  phone?: string;
  phoneVerified?: boolean;
  username?: string;
}): SdkworkUserProfile {
  const displayName = normalizeOptionalString(profile.displayName)
    || normalizeOptionalString(profile.name)
    || normalizeOptionalString(profile.nickname)
    || normalizeOptionalString(profile.username)
    || normalizeOptionalString(profile.email)
    || "";
  const [firstName = "", ...rest] = displayName
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    avatar: readSdkworkMediaResource(profile.avatar),
    email: normalizeOptionalString(profile.email) || "",
    emailVerified: profile.emailVerified === true,
    firstName,
    lastName: rest.join(" "),
    phone: normalizeOptionalString(profile.phone) || "",
    phoneVerified: profile.phoneVerified === true,
  };
}

function toRemoteUserProfile(profile: SdkworkUserProfile): SdkworkUserProfile {
  return {
    avatar: profile.avatar,
    email: profile.email,
    emailVerified: profile.emailVerified,
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    phoneVerified: profile.phoneVerified,
  };
}

export function createSdkworkUserService(
  options: CreateSdkworkUserServiceOptions = {},
): SdkworkUserService {
  const copy = createSdkworkUserMessages(options.locale, options.messages);
  const getClient = options.getClient ?? (() => getAppClientWithSession() as unknown as SdkworkUserClient);
  const storage = options.storage ?? getDefaultSdkworkUserStorage();
  let cachedAccountBindingPolicy: SdkworkAccountBindingPolicyDocument | null = null;
  const resolveCapabilities = () => resolveUserServiceCapabilities(getClient(), cachedAccountBindingPolicy);

  return {
    get capabilities() {
      return resolveCapabilities();
    },

    async refreshAccountBindingPolicy() {
      const client = getClient();
      const retrieve = client.system?.iam?.accountBindingPolicy?.retrieve
        ?? client.system?.iam?.verificationPolicy?.retrieve;

      if (!retrieve) {
        cachedAccountBindingPolicy = null;
        return resolveCapabilities();
      }

      try {
        const payload = unwrapAppSdkResponse<Record<string, unknown>>(
          await retrieve(),
          copy.common.requestFailed,
        );
        cachedAccountBindingPolicy = normalizeAccountBindingPolicy(
          payload.accountBinding ?? payload.account_binding ?? payload,
        );
      } catch {
        cachedAccountBindingPolicy = null;
      }

      return resolveCapabilities();
    },

    async bindEmail(email, verificationCode) {
      const client = getClient();
      const createEmailBinding = requireSdkResourceMethod(
        client.iam?.users?.current?.emailBindings?.create,
        "appbaseApp.iam.users.current.emailBindings.create",
      );
      const updated = unwrapAppSdkResponse<{
        avatar?: unknown;
        email?: string;
        emailVerified?: boolean;
        phone?: string;
        phoneVerified?: boolean;
      }>(
        await createEmailBinding({
          email: email.trim(),
          verificationCode: verificationCode.trim(),
        }),
        copy.common.requestFailed,
      ) || {};

      return toUserProfile(updated);
    },

    async bindPhone(phone, verificationCode) {
      const client = getClient();
      const createPhoneBinding = requireSdkResourceMethod(
        client.iam?.users?.current?.phoneBindings?.create,
        "appbaseApp.iam.users.current.phoneBindings.create",
      );
      const updated = unwrapAppSdkResponse<{
        avatar?: unknown;
        email?: string;
        emailVerified?: boolean;
        phone?: string;
        phoneVerified?: boolean;
      }>(
        await createPhoneBinding({
          phone: phone.trim(),
          verificationCode: verificationCode.trim(),
        }),
        copy.common.requestFailed,
      ) || {};

      return toUserProfile(updated);
    },
    async getPreferences() {
      const client = getClient();
      const settings = unwrapAppSdkResponse<RemoteNotificationSettings>(
        await client.notification?.getNotificationSettings?.(),
        copy.common.requestFailed,
      ) || {};

      return buildPreferencesFromNotificationSettings(settings, readSettingsOverlay(storage));
    },

    async getProfile() {
      const client = getClient();
      const retrieveCurrentUser = requireSdkResourceMethod(
        client.iam?.users?.current?.retrieve,
        "appbaseApp.iam.users.current.retrieve",
      );
      const profile = unwrapAppSdkResponse<{
        avatar?: unknown;
        displayName?: string;
        email?: string;
        emailVerified?: boolean;
        name?: string;
        nickname?: string;
        phone?: string;
        phoneVerified?: boolean;
        username?: string;
      }>(
        await retrieveCurrentUser(),
        copy.common.requestFailed,
      );

      return toUserProfile(profile);
    },

    async unbindEmail(password) {
      const client = getClient();
      const deleteEmailBinding = requireSdkResourceMethod(
        client.iam?.users?.current?.emailBindings?.delete,
        "appbaseApp.iam.users.current.emailBindings.delete",
      );
      const updated = unwrapAppSdkResponse<{
        avatar?: unknown;
        email?: string;
        emailVerified?: boolean;
        phone?: string;
        phoneVerified?: boolean;
      }>(
        await deleteEmailBinding({ password }),
        copy.common.requestFailed,
      ) || {};

      return toUserProfile(updated);
    },

    async unbindPhone(password) {
      const client = getClient();
      const deletePhoneBinding = requireSdkResourceMethod(
        client.iam?.users?.current?.phoneBindings?.delete,
        "appbaseApp.iam.users.current.phoneBindings.delete",
      );
      const updated = unwrapAppSdkResponse<{
        avatar?: unknown;
        email?: string;
        emailVerified?: boolean;
        phone?: string;
        phoneVerified?: boolean;
      }>(
        await deletePhoneBinding({ password }),
        copy.common.requestFailed,
      ) || {};

      return toUserProfile(updated);
    },

    async updatePassword(currentPassword, nextPassword) {
      const client = getClient();
      const updateCurrentPassword = requireSdkResourceMethod(
        client.iam?.users?.current?.password?.update,
        "appbaseApp.iam.users.current.password.update",
      );
      await updateCurrentPassword({
        confirmPassword: nextPassword,
        newPassword: nextPassword,
        oldPassword: currentPassword,
      });
    },

    async updatePreferences(preferences) {
      const client = getClient();
      const currentOverlay = readSettingsOverlay(storage);
      const nextOverlay = {
        general: { ...currentOverlay.general, ...preferences.general },
        privacy: { ...currentOverlay.privacy, ...preferences.privacy },
        security: { ...currentOverlay.security, ...preferences.security },
      };
      writeSettingsOverlay(storage, nextOverlay);

      const currentSettings = unwrapAppSdkResponse<RemoteNotificationSettings>(
        await client.notification?.getNotificationSettings?.(),
        copy.common.requestFailed,
      ) || {};

      if (!preferences.notifications) {
        return buildPreferencesFromNotificationSettings(currentSettings, nextOverlay);
      }

      const updatedSettings = unwrapAppSdkResponse<RemoteNotificationSettings>(
        await client.notification?.updateNotificationSettings?.(
          buildNotificationSettingsUpdate(currentSettings, preferences.notifications),
        ),
        copy.common.requestFailed,
      ) || currentSettings;

      const typeSettingsUpdates = buildNotificationTypeSettingsUpdates(
        updatedSettings,
        preferences.notifications,
      );

      for (const update of typeSettingsUpdates) {
        await client.notification?.updateTypeSettings?.(String(update.type), update);
      }

      return buildPreferencesFromNotificationSettings(updatedSettings, nextOverlay);
    },

    async updateProfile(profile) {
      const client = getClient();
      const updateCurrentUser = requireSdkResourceMethod(
        client.iam?.users?.current?.update,
        "appbaseApp.iam.users.current.update",
      );
      const updated = unwrapAppSdkResponse<{
        avatar?: unknown;
        displayName?: string;
        email?: string;
        emailVerified?: boolean;
        phone?: string;
        phoneVerified?: boolean;
      }>(
        await updateCurrentUser({
          avatar: profile.avatar,
          nickname: coalesce([profile.firstName, profile.lastName].filter(Boolean).join(" ")),
        }),
        copy.common.requestFailed,
      ) || {};

      return toRemoteUserProfile({
        ...profile,
        avatar: readSdkworkMediaResource(updated.avatar) || profile.avatar,
        email: normalizeOptionalString(updated.email) || profile.email,
        emailVerified: updated.emailVerified ?? profile.emailVerified,
        phone: normalizeOptionalString(updated.phone) || profile.phone,
        phoneVerified: updated.phoneVerified ?? profile.phoneVerified,
      });
    },
  };
}
