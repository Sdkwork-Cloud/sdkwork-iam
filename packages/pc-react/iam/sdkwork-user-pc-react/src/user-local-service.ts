import type {
  SdkworkUserPreferences,
  SdkworkUserProfile,
  SdkworkUserService,
  SdkworkUserServiceCapabilities,
  SdkworkUserStorageLike,
} from "./user-service.ts";
import {
  mergeSdkworkUserPreferences,
  readSdkworkUserPreferencesStorage,
  writeSdkworkUserPreferencesStorage,
  type SdkworkUserPreferencesOptions,
} from "./user-preferences.ts";

const SDKWORK_LOCAL_USER_SERVICE_DEFAULT_CAPABILITIES: SdkworkUserServiceCapabilities = {
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

export interface SdkworkLocalUserPreferencesAdapter
  extends SdkworkUserPreferencesOptions {
  key?: string;
  read?: () => Promise<null | Partial<SdkworkUserPreferences> | SdkworkUserPreferences | undefined>;
  storage?: SdkworkUserStorageLike | null;
  write?: (
    preferences: SdkworkUserPreferences,
  ) => Promise<null | Partial<SdkworkUserPreferences> | SdkworkUserPreferences | undefined>;
}

export interface SdkworkLocalUserProfileAdapter<TAuthenticatedUser, TProfileSnapshot> {
  fromUserProfile: (
    profile: SdkworkUserProfile,
    currentSnapshot: TProfileSnapshot,
    user: TAuthenticatedUser,
  ) => Promise<TProfileSnapshot> | TProfileSnapshot;
  read: () => Promise<TProfileSnapshot>;
  toUserProfile: (
    snapshot: TProfileSnapshot,
    user: TAuthenticatedUser,
  ) => Promise<SdkworkUserProfile> | SdkworkUserProfile;
  write: (snapshot: TProfileSnapshot) => Promise<TProfileSnapshot>;
}

export interface CreateSdkworkLocalUserServiceOptions<
  TAuthenticatedUser,
  TProfileSnapshot,
> {
  capabilities?: Partial<SdkworkUserServiceCapabilities>;
  preferences?: SdkworkLocalUserPreferencesAdapter;
  profile: SdkworkLocalUserProfileAdapter<TAuthenticatedUser, TProfileSnapshot>;
  requireAuthenticatedMessage?: string;
  updatePassword?: (input: {
    currentPassword: string;
    nextPassword: string;
    user: TAuthenticatedUser;
  }) => Promise<void>;
  user: TAuthenticatedUser | null;
}

function mergeCapabilities(
  capabilities?: Partial<SdkworkUserServiceCapabilities>,
): SdkworkUserServiceCapabilities {
  return {
    profile: {
      ...SDKWORK_LOCAL_USER_SERVICE_DEFAULT_CAPABILITIES.profile,
      ...capabilities?.profile,
    },
    security: {
      ...SDKWORK_LOCAL_USER_SERVICE_DEFAULT_CAPABILITIES.security,
      ...capabilities?.security,
    },
  };
}

function resolveAuthenticatedUser<TAuthenticatedUser>(
  user: TAuthenticatedUser | null,
  message: string,
): TAuthenticatedUser {
  if (!user) {
    throw new Error(message);
  }

  return user;
}

export function createSdkworkLocalUserService<
  TAuthenticatedUser,
  TProfileSnapshot,
>(
  options: CreateSdkworkLocalUserServiceOptions<TAuthenticatedUser, TProfileSnapshot>,
): SdkworkUserService {
  const preferencesAdapter = options.preferences;
  const requireAuthenticatedMessage =
    options.requireAuthenticatedMessage
    ?? "The current user-center service requires an authenticated user session.";

  return {
    capabilities: mergeCapabilities(options.capabilities),

    async refreshAccountBindingPolicy() {
      return mergeCapabilities(options.capabilities);
    },

    async bindEmail() {
      throw new Error("Email binding is managed by the active IAM app-api service.");
    },

    async bindPhone() {
      throw new Error("Phone binding is managed by the active IAM app-api service.");
    },

    async getPreferences() {
      if (!preferencesAdapter) {
        return readSdkworkUserPreferencesStorage();
      }

      try {
        const remotePreferences = await preferencesAdapter.read?.();
        if (remotePreferences) {
          return writeSdkworkUserPreferencesStorage(remotePreferences, {
            defaults: preferencesAdapter.defaults,
            key: preferencesAdapter.key,
            storage: preferencesAdapter.storage,
          });
        }
      } catch {
        return readSdkworkUserPreferencesStorage({
          defaults: preferencesAdapter.defaults,
          key: preferencesAdapter.key,
          storage: preferencesAdapter.storage,
        });
      }

      return readSdkworkUserPreferencesStorage({
        defaults: preferencesAdapter.defaults,
        key: preferencesAdapter.key,
        storage: preferencesAdapter.storage,
      });
    },

    async getProfile() {
      const user = resolveAuthenticatedUser(
        options.user,
        requireAuthenticatedMessage,
      );
      const snapshot = await options.profile.read();
      return options.profile.toUserProfile(snapshot, user);
    },

    async updatePassword(currentPassword, nextPassword) {
      const user = resolveAuthenticatedUser(
        options.user,
        requireAuthenticatedMessage,
      );

      if (!options.updatePassword) {
        throw new Error(
          "Password changes are managed by the active login authority.",
        );
      }

      await options.updatePassword({
        currentPassword,
        nextPassword,
        user,
      });
    },

    async updatePreferences(preferences) {
      const currentPreferences = preferencesAdapter
        ? readSdkworkUserPreferencesStorage({
            defaults: preferencesAdapter.defaults,
            key: preferencesAdapter.key,
            storage: preferencesAdapter.storage,
          })
        : readSdkworkUserPreferencesStorage();
      const nextPreferences = mergeSdkworkUserPreferences(
        currentPreferences,
        preferences,
        {
          defaults: preferencesAdapter?.defaults,
        },
      );

      if (!preferencesAdapter?.write) {
        return writeSdkworkUserPreferencesStorage(nextPreferences, {
          defaults: preferencesAdapter?.defaults,
          key: preferencesAdapter?.key,
          storage: preferencesAdapter?.storage,
        });
      }

      const updatedPreferences =
        await preferencesAdapter.write(nextPreferences);

      return writeSdkworkUserPreferencesStorage(
        updatedPreferences ?? nextPreferences,
        {
          defaults: preferencesAdapter.defaults,
          key: preferencesAdapter.key,
          storage: preferencesAdapter.storage,
        },
      );
    },

    async updateProfile(profile) {
      const user = resolveAuthenticatedUser(
        options.user,
        requireAuthenticatedMessage,
      );
      const currentSnapshot = await options.profile.read();
      const nextSnapshot = await options.profile.fromUserProfile(
        profile,
        currentSnapshot,
        user,
      );
      const updatedSnapshot = await options.profile.write(nextSnapshot);
      return options.profile.toUserProfile(updatedSnapshot, user);
    },

    async unbindEmail() {
      throw new Error("Email unbinding is managed by the active IAM app-api service.");
    },

    async unbindPhone() {
      throw new Error("Phone unbinding is managed by the active IAM app-api service.");
    },
  };
}
