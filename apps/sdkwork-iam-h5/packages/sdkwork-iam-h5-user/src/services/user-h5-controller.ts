import type { SdkworkIamService } from "@sdkwork/iam-service";

import type {
  CreateSdkworkIamH5UserControllerInput,
  SdkworkIamH5UserController,
  SdkworkIamH5UserProfile,
  SdkworkIamH5UserProfileDraft,
  SdkworkIamH5UserState,
} from "../types/user-h5-types";

export function createSdkworkIamH5UserController(
  input: SdkworkIamService | CreateSdkworkIamH5UserControllerInput,
): SdkworkIamH5UserController {
  const service = "service" in input ? input.service : input;
  let state: SdkworkIamH5UserState = { status: "idle" };

  const setState = (patch: Partial<SdkworkIamH5UserState>) => {
    state = { ...state, ...patch };
  };

  return {
    getState: () => ({ ...state, profile: state.profile ? { ...state.profile } : undefined }),
    loadProfile: async () => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const profile = toProfile(await service.iam.users.current.retrieve());
        if (!profile) {
          throw new Error("Current user profile is missing userId");
        }
        setState({ profile, status: "ready" });
        return profile;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load profile";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    updateProfile: async (body) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const profile = toProfile(await service.iam.users.current.update(body as unknown as Record<string, unknown>));
        if (!profile) {
          throw new Error("Updated user profile is missing userId");
        }
        setState({ profile, status: "ready" });
        return profile;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update profile";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
  };
}

function toProfile(value: unknown): SdkworkIamH5UserProfile | undefined {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const userId = optionalString(record.userId) || optionalString(record.user_id) || optionalString(record.id);
  if (!userId) {
    return undefined;
  }

  return {
    displayName: optionalString(record.displayName) || optionalString(record.display_name),
    email: optionalString(record.email),
    id: optionalString(record.id) || userId,
    nickname: optionalString(record.nickname),
    phone: optionalString(record.phone) || optionalString(record.phoneNumber) || optionalString(record.phone_number),
    userId,
    username: optionalString(record.username),
  };
}

function optionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : value === undefined || value === null ? "" : String(value).trim();
  return normalized || undefined;
}
