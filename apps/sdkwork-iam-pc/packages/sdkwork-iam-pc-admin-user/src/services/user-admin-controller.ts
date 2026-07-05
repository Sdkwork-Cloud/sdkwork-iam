import {
  buildNextSdkWorkListQuery,
  extractSdkWorkListPage,
  mergeSdkWorkListPage,
  resolveSdkWorkListQuery,
} from "@sdkwork/iam-contracts";
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
    listPageInfo: undefined,
    selectedUser: undefined,
    status: "idle",
    users: [],
  };

  let lastListParams: Record<string, unknown> | undefined;

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
      listPageInfo: state.listPageInfo ? { ...state.listPageInfo } : undefined,
      selectedUser: state.selectedUser ? { ...state.selectedUser } : undefined,
      users: [...state.users],
    }),
    listUsers: async (params, options) => {
      const append = options?.append === true;
      if (!append) {
        lastListParams = params ? { ...params } : undefined;
      }
      setState({ status: "loading" });
      try {
        const query = resolveSdkWorkListQuery(append ? lastListParams : params);
        const page = extractSdkWorkListPage(
          await resolved.service.iam.users.list(query),
        );
        const mapped = page.items.map(toUser).filter(Boolean) as SdkworkIamAdminUser[];
        const merged = mergeSdkWorkListPage(append ? state.users : [], { ...page, items: mapped }, append ? "append" : "replace");
        const users = merged.items;
        const selectedUser = state.selectedUser
          ? users.find((user) => user.userId === state.selectedUser?.userId) ?? state.selectedUser
          : users.find((user) => user.userId === resolved.selectedUserId);
        setState({ listPageInfo: merged.pageInfo, selectedUser, status: "ready", users });
        return users;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadMoreUsers: async () => {
      const nextQuery = buildNextSdkWorkListQuery(lastListParams, state.listPageInfo);
      if (!nextQuery) {
        return state.users;
      }
      lastListParams = { ...nextQuery };
      return controller.listUsers(lastListParams, { append: true });
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
