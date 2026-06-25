import type { SdkworkIamService } from "@sdkwork/iam-service";

import type {
  CreateSdkworkIamConsoleUserControllerInput,
  SdkworkIamConsolePasswordDraft,
  SdkworkIamConsoleUserController,
  SdkworkIamConsoleUserProfile,
  SdkworkIamConsoleUserProfileDraft,
  SdkworkIamConsoleUserState,
  SdkworkIamConsoleVerificationPolicy,
} from "../types/user-console-types";

export function createSdkworkIamConsoleUserController(
  input: SdkworkIamService | CreateSdkworkIamConsoleUserControllerInput,
): SdkworkIamConsoleUserController {
  const service = "service" in input ? input.service : input;
  let state: SdkworkIamConsoleUserState = { status: "idle" };

  const setState = (patch: Partial<SdkworkIamConsoleUserState>) => {
    state = { ...state, ...patch };
  };

  const controller: SdkworkIamConsoleUserController = {
    getState: () => ({
      ...state,
      profile: state.profile ? { ...state.profile } : undefined,
      verificationPolicy: state.verificationPolicy ? { ...state.verificationPolicy } : undefined,
    }),
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
    loadVerificationPolicy: async () => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const verificationPolicy = toVerificationPolicy(await service.system.iam.verificationPolicy.retrieve());
        setState({ status: state.profile ? "ready" : "idle", verificationPolicy });
        return verificationPolicy;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load verification policy";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    refreshWorkspace: async () => {
      const [profile, verificationPolicy] = await Promise.all([
        controller.loadProfile(),
        controller.loadVerificationPolicy(),
      ]);
      return { profile, verificationPolicy };
    },
    updatePassword: async (body: SdkworkIamConsolePasswordDraft) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        await service.iam.users.current.password.update(body as unknown as Record<string, unknown>);
        setState({ status: state.profile ? "ready" : "idle" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update password";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    updateProfile: async (body: SdkworkIamConsoleUserProfileDraft) => {
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

  return controller;
}

function toVerificationPolicy(value: unknown): SdkworkIamConsoleVerificationPolicy {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    emailVerificationRequired: readBoolean(record.emailVerificationRequired ?? record.email_verification_required),
    phoneVerificationRequired: readBoolean(record.phoneVerificationRequired ?? record.phone_verification_required),
  };
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }
    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }
  return undefined;
}

function toProfile(value: unknown): SdkworkIamConsoleUserProfile | undefined {
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
