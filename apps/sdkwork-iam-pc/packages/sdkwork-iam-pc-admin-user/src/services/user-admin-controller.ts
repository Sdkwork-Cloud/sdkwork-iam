import type { SdkworkIamService } from "@sdkwork/iam-service";

import type {
  CreateSdkworkIamUserAdminControllerInput,
  SdkworkIamAdminUser,
  SdkworkIamAdminUserDraft,
  SdkworkIamAdminUserState,
  SdkworkIamUserAdminController,
} from "../types/user-admin-types";

export function createSdkworkIamUserAdminController(
  input: SdkworkIamService | CreateSdkworkIamUserAdminControllerInput,
): SdkworkIamUserAdminController {
  const resolved = resolveInput(input);
  let state: SdkworkIamAdminUserState = {
    selectedUser: undefined,
    status: "idle",
    users: [],
  };

  const setState = (patch: Partial<SdkworkIamAdminUserState>) => {
    state = { ...state, ...patch };
  };

  const controller: SdkworkIamUserAdminController = {
    createUser: async (body) => {
      requireIdentityField(body);
      setState({ status: "loading" });
      try {
        const user = toUser(await resolved.service.iam.users.create(body as unknown as Record<string, unknown>));
        if (!user) {
          throw new Error("SDKWork IAM user create response is missing userId");
        }
        const users = [...state.users.filter((item) => item.userId !== user.userId), user];
        setState({ selectedUser: user, status: "ready", users });
        return user;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    deleteUser: async (userId) => {
      const normalizedUserId = requireId(userId, "userId");
      setState({ status: "loading" });
      try {
        await resolved.service.iam.users.delete(normalizedUserId);
        const users = state.users.filter((user) => user.userId !== normalizedUserId);
        const selectedUser = state.selectedUser?.userId === normalizedUserId ? undefined : state.selectedUser;
        setState({ selectedUser, status: "ready", users });
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    getSelectedUser: () => state.selectedUser,
    getState: () => ({
      ...state,
      selectedUser: state.selectedUser ? { ...state.selectedUser } : undefined,
      users: [...state.users],
    }),
    listUsers: async (params) => {
      setState({ status: "loading" });
      try {
        const users = extractList(await resolved.service.iam.users.list(params))
          .map(toUser)
          .filter(Boolean) as SdkworkIamAdminUser[];
        const selectedUser = state.selectedUser
          ? users.find((user) => user.userId === state.selectedUser?.userId) ?? state.selectedUser
          : users.find((user) => user.userId === resolved.selectedUserId);
        setState({ selectedUser, status: "ready", users });
        return users;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    retrieveUser: async (userId) => {
      const normalizedUserId = requireId(userId, "userId");
      setState({ status: "loading" });
      try {
        const user = toUser(await resolved.service.iam.users.retrieve(normalizedUserId));
        if (user) {
          const users = [...state.users.filter((item) => item.userId !== user.userId), user];
          setState({ selectedUser: user, status: "ready", users });
        } else {
          setState({ status: "ready" });
        }
        return user;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    selectUser: async (userId) => {
      const normalizedUserId = requireId(userId, "userId");
      const users = state.users.length > 0 ? state.users : await controller.listUsers();
      const selectedUser = users.find((user) => user.userId === normalizedUserId || user.id === normalizedUserId);
      if (selectedUser) {
        setState({ selectedUser });
        return selectedUser;
      }
      return controller.retrieveUser(normalizedUserId);
    },
    updateUser: async (userId, body) => {
      const normalizedUserId = requireId(userId, "userId");
      setState({ status: "loading" });
      try {
        const user = toUser(
          await resolved.service.iam.users.update(normalizedUserId, body as unknown as Record<string, unknown>),
        );
        if (!user) {
          throw new Error("SDKWork IAM user update response is missing userId");
        }
        const users = [...state.users.filter((item) => item.userId !== user.userId), user];
        const selectedUser = state.selectedUser?.userId === user.userId ? user : state.selectedUser;
        setState({ selectedUser, status: "ready", users });
        return user;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
  };

  return controller;
}

function resolveInput(
  input: SdkworkIamService | CreateSdkworkIamUserAdminControllerInput,
): CreateSdkworkIamUserAdminControllerInput {
  if ("service" in input) {
    return input;
  }
  return { service: input };
}

function extractList(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value || typeof value !== "object") {
    return [];
  }
  const record = value as Record<string, unknown>;
  for (const key of ["records", "items", "list", "rows", "content", "data"]) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return nested;
    }
  }
  return [];
}

function toUser(value: unknown): SdkworkIamAdminUser | undefined {
  const record = toRecord(value);
  const userId = optionalString(record.userId) || optionalString(record.user_id) || optionalString(record.id);
  if (!userId) {
    return undefined;
  }
  return {
    displayName: optionalString(record.displayName) || optionalString(record.display_name),
    email: optionalString(record.email),
    id: optionalString(record.id) || userId,
    phone: optionalString(record.phone) || optionalString(record.phoneNumber) || optionalString(record.phone_number),
    status: optionalString(record.status),
    userId,
    username: optionalString(record.username),
  };
}

function requireIdentityField(body: SdkworkIamAdminUserDraft) {
  if (!optionalString(body.username) && !optionalString(body.email) && !optionalString(body.phone)) {
    throw new Error("SDKWork IAM user create requires username, email, or phone");
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function optionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : value === undefined || value === null ? "" : String(value).trim();
  return normalized || undefined;
}

function requireId(value: unknown, name: string): string {
  const normalized = optionalString(value);
  if (!normalized) {
    throw new Error(`SDKWork IAM user admin controller requires ${name}`);
  }
  return normalized;
}
