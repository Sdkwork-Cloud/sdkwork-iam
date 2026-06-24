import type {
  SdkworkUserPreferences,
  SdkworkUserStorageLike,
} from "./user-service.ts";

export const SDKWORK_USER_DEFAULT_PREFERENCES_STORAGE_KEY = "sdkwork-user-preferences";

export const SDKWORK_USER_DEFAULT_GENERAL_PREFERENCES: SdkworkUserPreferences["general"] = {
  compactModelSelector: true,
  launchOnStartup: false,
  startMinimized: false,
};

export const SDKWORK_USER_DEFAULT_NOTIFICATION_PREFERENCES: SdkworkUserPreferences["notifications"] = {
  newMessages: true,
  securityAlerts: true,
  systemUpdates: true,
  taskCompletions: true,
  taskFailures: true,
};

export const SDKWORK_USER_DEFAULT_PRIVACY_PREFERENCES: SdkworkUserPreferences["privacy"] = {
  personalizedRecommendations: false,
  shareUsageData: false,
};

export const SDKWORK_USER_DEFAULT_SECURITY_PREFERENCES: SdkworkUserPreferences["security"] = {
  loginAlerts: true,
  twoFactorAuth: false,
};

export const SDKWORK_USER_DEFAULT_PREFERENCES: SdkworkUserPreferences = {
  general: SDKWORK_USER_DEFAULT_GENERAL_PREFERENCES,
  notifications: SDKWORK_USER_DEFAULT_NOTIFICATION_PREFERENCES,
  privacy: SDKWORK_USER_DEFAULT_PRIVACY_PREFERENCES,
  security: SDKWORK_USER_DEFAULT_SECURITY_PREFERENCES,
};

export interface SdkworkUserPreferencesOptions {
  defaults?: Partial<SdkworkUserPreferences>;
}

export interface SdkworkUserPreferencesStorageOptions extends SdkworkUserPreferencesOptions {
  key?: string;
  storage?: SdkworkUserStorageLike | null;
}

export function getDefaultSdkworkUserStorage(): SdkworkUserStorageLike | null {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }

  return globalThis.localStorage;
}

export function createDefaultSdkworkUserPreferences(
  options: SdkworkUserPreferencesOptions = {},
): SdkworkUserPreferences {
  return normalizeSdkworkUserPreferences(undefined, options);
}

export function normalizeSdkworkUserPreferences(
  preferences: null | Partial<SdkworkUserPreferences> | undefined,
  options: SdkworkUserPreferencesOptions = {},
): SdkworkUserPreferences {
  const defaults = options.defaults;

  return {
    general: {
      ...SDKWORK_USER_DEFAULT_GENERAL_PREFERENCES,
      ...defaults?.general,
      ...preferences?.general,
    },
    notifications: {
      ...SDKWORK_USER_DEFAULT_NOTIFICATION_PREFERENCES,
      ...defaults?.notifications,
      ...preferences?.notifications,
    },
    privacy: {
      ...SDKWORK_USER_DEFAULT_PRIVACY_PREFERENCES,
      ...defaults?.privacy,
      ...preferences?.privacy,
    },
    security: {
      ...SDKWORK_USER_DEFAULT_SECURITY_PREFERENCES,
      ...defaults?.security,
      ...preferences?.security,
    },
  };
}

export function mergeSdkworkUserPreferences(
  current: SdkworkUserPreferences,
  updates: Partial<SdkworkUserPreferences>,
  options: SdkworkUserPreferencesOptions = {},
): SdkworkUserPreferences {
  return normalizeSdkworkUserPreferences(
    {
      general: {
        ...current.general,
        ...updates.general,
      },
      notifications: {
        ...current.notifications,
        ...updates.notifications,
      },
      privacy: {
        ...current.privacy,
        ...updates.privacy,
      },
      security: {
        ...current.security,
        ...updates.security,
      },
    },
    options,
  );
}

export function readSdkworkUserPreferencesStorage(
  options: SdkworkUserPreferencesStorageOptions = {},
): SdkworkUserPreferences {
  const storage = options.storage ?? getDefaultSdkworkUserStorage();
  if (!storage) {
    return createDefaultSdkworkUserPreferences(options);
  }

  const rawValue = storage.getItem(
    options.key ?? SDKWORK_USER_DEFAULT_PREFERENCES_STORAGE_KEY,
  );
  if (!rawValue) {
    return createDefaultSdkworkUserPreferences(options);
  }

  try {
    return normalizeSdkworkUserPreferences(
      JSON.parse(rawValue) as Partial<SdkworkUserPreferences>,
      options,
    );
  } catch {
    return createDefaultSdkworkUserPreferences(options);
  }
}

export function writeSdkworkUserPreferencesStorage(
  preferences: Partial<SdkworkUserPreferences> | SdkworkUserPreferences,
  options: SdkworkUserPreferencesStorageOptions = {},
): SdkworkUserPreferences {
  const normalizedPreferences = normalizeSdkworkUserPreferences(
    preferences,
    options,
  );
  const storage = options.storage ?? getDefaultSdkworkUserStorage();

  storage?.setItem(
    options.key ?? SDKWORK_USER_DEFAULT_PREFERENCES_STORAGE_KEY,
    JSON.stringify(normalizedPreferences),
  );

  return normalizedPreferences;
}
