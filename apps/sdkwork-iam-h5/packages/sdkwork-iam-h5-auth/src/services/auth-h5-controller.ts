import {
  buildOrganizationLoginContextSelectionBody,
  buildPersonalLoginContextSelectionBody,
  normalizeIamLoginContextSelectionChallenge,
} from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";
import { isBlank, trim } from "@sdkwork/utils";

import type {
  CreateSdkworkIamH5AuthControllerInput,
  SdkworkIamH5AuthController,
  SdkworkIamH5AuthSession,
  SdkworkIamH5AuthState,
  SdkworkIamH5LoginCredentials,
  SdkworkIamH5LoginResult,
} from "../types/auth-h5-types";

export function createSdkworkIamH5AuthController(
  input: SdkworkIamService | CreateSdkworkIamH5AuthControllerInput,
): SdkworkIamH5AuthController {
  const service = "service" in input ? input.service : input;
  let state: SdkworkIamH5AuthState = { status: "idle" };

  const setState = (patch: Partial<SdkworkIamH5AuthState>) => {
    state = { ...state, ...patch };
  };

  const completeSession = (response: unknown): SdkworkIamH5AuthSession => {
    const session = toSession(response);
    setState({ challenge: undefined, session, status: "ready" });
    return session;
  };

  return {
    getState: () => ({
      ...state,
      challenge: state.challenge ? { ...state.challenge } : undefined,
      session: state.session ? { ...state.session } : undefined,
    }),
    login: async (credentials) => {
      setState({ challenge: undefined, lastError: undefined, status: "loading" });
      try {
        const response = await service.auth.sessions.create({
          password: credentials.password,
          username: credentials.username,
        });
        const challenge = normalizeIamLoginContextSelectionChallenge(response);
        if (challenge) {
          setState({
            challenge,
            session: undefined,
            status: "loginContextSelectionRequired",
          });
          return {
            challenge,
            kind: "loginContextSelectionRequired",
          };
        }

        const session = completeSession(response);
        return { kind: "session", session };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Login failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    logout: async () => {
      setState({ status: "loading" });
      try {
        await service.auth.sessions.current.delete();
        setState({ challenge: undefined, session: undefined, status: "ready" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Logout failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    selectOrganization: async (input) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const response = await service.auth.sessions.loginContextSelection.create(
          buildOrganizationLoginContextSelectionBody(
            input.continuationToken,
            input.organizationId,
          ),
        );
        return completeSession(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Organization selection failed";
        setState({ lastError: message, status: "loginContextSelectionRequired" });
        throw error;
      }
    },
    selectPersonalLogin: async (input) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const response = await service.auth.sessions.loginContextSelection.create(
          buildPersonalLoginContextSelectionBody(input.continuationToken),
        );
        return completeSession(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Personal login failed";
        setState({ lastError: message, status: "loginContextSelectionRequired" });
        throw error;
      }
    },
  };
}

function toSession(value: unknown): SdkworkIamH5AuthSession {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    accessToken: optionalString(record.accessToken) || optionalString(record.access_token),
    authToken: optionalString(record.authToken) || optionalString(record.auth_token),
    refreshToken: optionalString(record.refreshToken) || optionalString(record.refresh_token),
    sessionId: optionalString(record.sessionId) || optionalString(record.session_id),
    userId: optionalString(record.userId) || optionalString(record.user_id),
  };
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = trim(String(value));
  return isBlank(normalized) ? undefined : normalized;
}
