import {
  createSdkworkUserController,
  type CreateSdkworkUserControllerOptions,
  type SdkworkUserController,
} from "./user-controller.ts";
import {
  readSdkworkMediaResource,
  type SdkworkMediaResource,
} from "@sdkwork/runtime-bootstrap";
import {
  mergeSdkworkUserMessagesOverrides,
  type SdkworkUserMessagesOverrides,
} from "./user-copy.ts";
import {
  createSdkworkLocalUserService,
  type CreateSdkworkLocalUserServiceOptions,
  type SdkworkLocalUserProfileAdapter,
} from "./user-local-service.ts";
import type {
  SdkworkUserProfile,
  SdkworkUserService,
} from "./user-service.ts";

export interface SdkworkCanonicalUserIdentityInput {
  avatar?: SdkworkMediaResource;
  displayName?: string;
  email?: string;
  emailVerified?: boolean;
  firstName?: string;
  id?: string;
  lastName?: string;
  phone?: string;
  phoneVerified?: boolean;
  username?: string;
}

export interface SdkworkCanonicalUserProfileSnapshotLike {
  avatar?: SdkworkMediaResource;
  displayName?: string;
  email?: string;
}

export interface CreateSdkworkCanonicalUserProfileAdapterOptions<
  TAuthenticatedUser,
  TProfileSnapshot extends SdkworkCanonicalUserProfileSnapshotLike,
> {
  mapUserProfileToSnapshot?: (
    profile: SdkworkUserProfile,
    currentSnapshot: TProfileSnapshot,
    user: TAuthenticatedUser,
  ) => Promise<TProfileSnapshot> | TProfileSnapshot;
  read: () => Promise<TProfileSnapshot>;
  resolveIdentity: (
    user: TAuthenticatedUser,
    snapshot: TProfileSnapshot,
  ) => Promise<SdkworkCanonicalUserIdentityInput> | SdkworkCanonicalUserIdentityInput;
  toUserProfile?: (
    snapshot: TProfileSnapshot,
    user: TAuthenticatedUser,
  ) => Promise<SdkworkUserProfile> | SdkworkUserProfile;
  write: (snapshot: TProfileSnapshot) => Promise<TProfileSnapshot>;
}

export interface CreateSdkworkCanonicalUserServiceOptions<
  TAuthenticatedUser,
  TProfileSnapshot,
> extends CreateSdkworkLocalUserServiceOptions<TAuthenticatedUser, TProfileSnapshot> {}

export interface CreateSdkworkCanonicalUserControllerOptions<
  TAuthenticatedUser,
  TProfileSnapshot,
> extends Omit<CreateSdkworkUserControllerOptions, "messages" | "service"> {
  locale?: string | null;
  messageDefaults?: SdkworkUserMessagesOverrides;
  messages?: SdkworkUserMessagesOverrides;
  service:
    | CreateSdkworkCanonicalUserServiceOptions<TAuthenticatedUser, TProfileSnapshot>
    | SdkworkUserService;
}

function splitDisplayName(displayName: string): {
  firstName: string;
  lastName: string;
} {
  const normalizedDisplayName = displayName.trim().replace(/\s+/g, " ");
  if (!normalizedDisplayName) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const [firstName, ...rest] = normalizedDisplayName.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function normalizeOptionalString(value: unknown): string | undefined {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  return normalizedValue || undefined;
}

function isSdkworkUserService(
  value: SdkworkUserService | object,
): value is SdkworkUserService {
  return typeof (value as SdkworkUserService).getPreferences === "function"
    && typeof (value as SdkworkUserService).getProfile === "function"
    && typeof (value as SdkworkUserService).updatePassword === "function"
    && typeof (value as SdkworkUserService).updatePreferences === "function"
    && typeof (value as SdkworkUserService).updateProfile === "function";
}

export function resolveSdkworkCanonicalUserDisplayName(
  profile: SdkworkUserProfile,
  fallbackDisplayName: string,
): string {
  const normalizedDisplayName = [profile.firstName, profile.lastName]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  return normalizedDisplayName || fallbackDisplayName.trim();
}

export function createSdkworkUserProfileFromCanonicalIdentity(
  identity: SdkworkCanonicalUserIdentityInput,
): SdkworkUserProfile {
  const displayName =
    normalizeOptionalString(identity.displayName)
    || [
      normalizeOptionalString(identity.firstName),
      normalizeOptionalString(identity.lastName),
    ]
      .filter(Boolean)
      .join(" ")
      .trim()
    || normalizeOptionalString(identity.username)
    || normalizeOptionalString(identity.email)
    || "";
  const firstName = normalizeOptionalString(identity.firstName);
  const lastName = normalizeOptionalString(identity.lastName);
  const nameParts = firstName
    ? {
        firstName,
        lastName: lastName || "",
      }
    : splitDisplayName(displayName);

  return {
    avatar: readSdkworkMediaResource(identity.avatar),
    email: normalizeOptionalString(identity.email) || "",
    emailVerified: identity.emailVerified === true,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    phone: normalizeOptionalString(identity.phone) || "",
    phoneVerified: identity.phoneVerified === true,
  };
}

export function createSdkworkCanonicalUserProfileAdapter<
  TAuthenticatedUser,
  TProfileSnapshot extends SdkworkCanonicalUserProfileSnapshotLike,
>(
  options: CreateSdkworkCanonicalUserProfileAdapterOptions<
    TAuthenticatedUser,
    TProfileSnapshot
  >,
): SdkworkLocalUserProfileAdapter<TAuthenticatedUser, TProfileSnapshot> {
  return {
    async fromUserProfile(profile, currentSnapshot, user) {
      if (options.mapUserProfileToSnapshot) {
        return options.mapUserProfileToSnapshot(profile, currentSnapshot, user);
      }

      return currentSnapshot;
    },
    read: options.read,
    async toUserProfile(snapshot, user) {
      if (options.toUserProfile) {
        return options.toUserProfile(snapshot, user);
      }

      return createSdkworkUserProfileFromCanonicalIdentity(
        await options.resolveIdentity(user, snapshot),
      );
    },
    write: options.write,
  };
}

export function createSdkworkCanonicalUserService<
  TAuthenticatedUser,
  TProfileSnapshot,
>(
  options: CreateSdkworkCanonicalUserServiceOptions<
    TAuthenticatedUser,
    TProfileSnapshot
  >,
): SdkworkUserService {
  return createSdkworkLocalUserService(options);
}

export function createSdkworkCanonicalUserController<
  TAuthenticatedUser,
  TProfileSnapshot,
>(
  options: CreateSdkworkCanonicalUserControllerOptions<
    TAuthenticatedUser,
    TProfileSnapshot
  >,
): SdkworkUserController {
  const service = isSdkworkUserService(options.service)
    ? options.service
    : createSdkworkCanonicalUserService(options.service);

  return createSdkworkUserController({
    locale: options.locale,
    messages: mergeSdkworkUserMessagesOverrides(
      options.messageDefaults,
      options.messages,
    ),
    registry: options.registry,
    service,
  });
}
