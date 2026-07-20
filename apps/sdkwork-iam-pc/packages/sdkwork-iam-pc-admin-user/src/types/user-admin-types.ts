import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamAdminUser {
  displayName?: string;
  email?: string;
  id: string;
  phone?: string;
  status?: string;
  userId: string;
  username?: string;
}

export interface SdkworkIamAdminUserDraft {
  displayName?: string;
  email?: string;
  phone?: string;
  status?: string;
  username?: string;
}

export interface SdkworkIamAdminUserState {
  lastError?: string;
  listPageInfo?: SdkWorkPageInfo;
  selectedUser?: SdkworkIamAdminUser;
  status: "idle" | "loading" | "ready" | "error";
  users: readonly SdkworkIamAdminUser[];
}

export interface CreateSdkworkIamUserAdminControllerInput {
  selectedUserId?: string;
  service: SdkworkIamService;
}

export interface SdkworkIamUserAdminController {
  createUser(body: SdkworkIamAdminUserDraft): Promise<SdkworkIamAdminUser>;
  deleteUser(userId: string): Promise<void>;
  getSelectedUser(): SdkworkIamAdminUser | undefined;
  getState(): SdkworkIamAdminUserState;
  listUsers(params?: Record<string, unknown>): Promise<readonly SdkworkIamAdminUser[]>;
  loadMoreUsers(): Promise<readonly SdkworkIamAdminUser[]>;
  retrieveUser(userId: string): Promise<SdkworkIamAdminUser | undefined>;
  selectUser(userId: string): Promise<SdkworkIamAdminUser | undefined>;
  updateUser(userId: string, body: Partial<SdkworkIamAdminUserDraft>): Promise<SdkworkIamAdminUser>;
}

export interface SdkworkIamUserAdminWorkspaceProps {
  controller: SdkworkIamUserAdminController;
  description?: string;
  locale?: string | null;
  permissions?: {
    create: boolean;
    delete: boolean;
    update: boolean;
  };
  title?: string;
}

export const IAM_PC_ADMIN_USER_ROUTES = {
  basePath: "/admin/iam/users",
  defaultPath: "/admin/iam/users",
  moduleId: "iam-user",
  permissionPrefix: "iam.users",
} as const;
