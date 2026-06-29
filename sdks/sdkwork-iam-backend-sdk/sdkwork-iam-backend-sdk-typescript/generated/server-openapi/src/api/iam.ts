import { backendApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { AppbaseAccessCredentialCreateCommand, AppbaseApplicationRegisterCommand, AppbaseOperationCommand, AppbaseTenantApplicationEnableCommand, AppbaseTenantApplicationProvisionCommand, AppbaseTenantApplicationUpdateCommand, PageInfo } from '../types';


export interface IamUsersListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamUsersApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Users list. */
  async list(params?: IamUsersListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/users`), query));
  }

/** Users create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/users`), body, undefined, undefined, 'application/json');
  }

/** Users delete. */
  async delete(userId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/users/${serializePathParameter(userId, { name: 'userId', style: 'simple', explode: false })}`));
  }

/** Users retrieve. */
  async retrieve(userId: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/users/${serializePathParameter(userId, { name: 'userId', style: 'simple', explode: false })}`));
  }

/** Users update. */
  async update(userId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/users/${serializePathParameter(userId, { name: 'userId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export interface IamTenantsMembersListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamTenantsMembersApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Tenants members list. */
  async list(tenantId: string, params?: IamTenantsMembersListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/tenants/${serializePathParameter(tenantId, { name: 'tenantId', style: 'simple', explode: false })}/members`), query));
  }

/** Tenants members create. */
  async create(tenantId: string, body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/tenants/${serializePathParameter(tenantId, { name: 'tenantId', style: 'simple', explode: false })}/members`), body, undefined, undefined, 'application/json');
  }

/** Tenants members delete. */
  async delete(tenantId: string, userId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/tenants/${serializePathParameter(tenantId, { name: 'tenantId', style: 'simple', explode: false })}/members/${serializePathParameter(userId, { name: 'userId', style: 'simple', explode: false })}`));
  }

/** Tenants members update. */
  async update(tenantId: string, userId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/tenants/${serializePathParameter(tenantId, { name: 'tenantId', style: 'simple', explode: false })}/members/${serializePathParameter(userId, { name: 'userId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export interface IamTenantsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamTenantsApi {
  private client: HttpClient;
  public readonly members: IamTenantsMembersApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.members = new IamTenantsMembersApi(client);
  }


/** Tenants list. */
  async list(params?: IamTenantsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/tenants`), query));
  }

/** Tenants create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/tenants`), body, undefined, undefined, 'application/json');
  }

/** Tenants delete. */
  async delete(tenantId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/tenants/${serializePathParameter(tenantId, { name: 'tenantId', style: 'simple', explode: false })}`));
  }

/** Tenants retrieve. */
  async retrieve(tenantId: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/tenants/${serializePathParameter(tenantId, { name: 'tenantId', style: 'simple', explode: false })}`));
  }

/** Tenants update. */
  async update(tenantId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/tenants/${serializePathParameter(tenantId, { name: 'tenantId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export class IamTenantApplicationsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Tenant Applications provision. */
  async provision(body: AppbaseTenantApplicationProvisionCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/tenant_applications`), body, undefined, undefined, 'application/json');
  }

/** Tenant Applications retrieve. */
  async retrieve(tenantApplicationId: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/tenant_applications/${serializePathParameter(tenantApplicationId, { name: 'tenantApplicationId', style: 'simple', explode: false })}`));
  }

/** Tenant Applications update. */
  async update(tenantApplicationId: string, body?: AppbaseTenantApplicationUpdateCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/tenant_applications/${serializePathParameter(tenantApplicationId, { name: 'tenantApplicationId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }

/** Tenant Applications enable. */
  async enable(tenantApplicationId: string, body: AppbaseTenantApplicationEnableCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/tenant_applications/${serializePathParameter(tenantApplicationId, { name: 'tenantApplicationId', style: 'simple', explode: false })}/enable`), body, undefined, undefined, 'application/json');
  }
}

export interface IamServiceAccountsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamServiceAccountsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Service Accounts list. */
  async list(params?: IamServiceAccountsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/service_accounts`), query));
  }

/** Service Accounts create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/service_accounts`), body, undefined, undefined, 'application/json');
  }

/** Service Accounts delete. */
  async delete(serviceAccountId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/service_accounts/${serializePathParameter(serviceAccountId, { name: 'serviceAccountId', style: 'simple', explode: false })}`));
  }

/** Service Accounts retrieve. */
  async retrieve(serviceAccountId: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/service_accounts/${serializePathParameter(serviceAccountId, { name: 'serviceAccountId', style: 'simple', explode: false })}`));
  }

/** Service Accounts update. */
  async update(serviceAccountId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/service_accounts/${serializePathParameter(serviceAccountId, { name: 'serviceAccountId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export interface IamSecurityEventsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamSecurityEventsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Security Events list. */
  async list(params?: IamSecurityEventsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/security_events`), query));
  }
}

export interface IamRolesPermissionsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamRolesPermissionsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Roles permissions list. */
  async list(roleId: string, params?: IamRolesPermissionsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/roles/${serializePathParameter(roleId, { name: 'roleId', style: 'simple', explode: false })}/permissions`), query));
  }

/** Roles permissions create. */
  async create(roleId: string, body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/roles/${serializePathParameter(roleId, { name: 'roleId', style: 'simple', explode: false })}/permissions`), body, undefined, undefined, 'application/json');
  }

/** Roles permissions delete. */
  async delete(roleId: string, permissionId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/roles/${serializePathParameter(roleId, { name: 'roleId', style: 'simple', explode: false })}/permissions/${serializePathParameter(permissionId, { name: 'permissionId', style: 'simple', explode: false })}`));
  }
}

export interface IamRolesListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamRolesApi {
  private client: HttpClient;
  public readonly permissions: IamRolesPermissionsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.permissions = new IamRolesPermissionsApi(client);
  }


/** Roles list. */
  async list(params?: IamRolesListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/roles`), query));
  }

/** Roles create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/roles`), body, undefined, undefined, 'application/json');
  }

/** Roles delete. */
  async delete(roleId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/roles/${serializePathParameter(roleId, { name: 'roleId', style: 'simple', explode: false })}`));
  }

/** Roles retrieve. */
  async retrieve(roleId: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/roles/${serializePathParameter(roleId, { name: 'roleId', style: 'simple', explode: false })}`));
  }

/** Roles update. */
  async update(roleId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/roles/${serializePathParameter(roleId, { name: 'roleId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export interface IamRoleBindingsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamRoleBindingsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Role Bindings list. */
  async list(params?: IamRoleBindingsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/role_bindings`), query));
  }

/** Role Bindings create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/role_bindings`), body, undefined, undefined, 'application/json');
  }

/** Role Bindings delete. */
  async delete(roleBindingId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/role_bindings/${serializePathParameter(roleBindingId, { name: 'roleBindingId', style: 'simple', explode: false })}`));
  }
}

export interface IamPositionsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamPositionsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Positions list. */
  async list(params?: IamPositionsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/positions`), query));
  }

/** Positions create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/positions`), body, undefined, undefined, 'application/json');
  }

/** Positions delete. */
  async delete(positionId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/positions/${serializePathParameter(positionId, { name: 'positionId', style: 'simple', explode: false })}`));
  }

/** Positions update. */
  async update(positionId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/positions/${serializePathParameter(positionId, { name: 'positionId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export interface IamPositionAssignmentsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamPositionAssignmentsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Position Assignments list. */
  async list(params?: IamPositionAssignmentsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/position_assignments`), query));
  }

/** Position Assignments create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/position_assignments`), body, undefined, undefined, 'application/json');
  }

/** Position Assignments update. */
  async update(assignmentId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/position_assignments/${serializePathParameter(assignmentId, { name: 'assignmentId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export interface IamPoliciesListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamPoliciesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Policies list. */
  async list(params?: IamPoliciesListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/policies`), query));
  }

/** Policies create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/policies`), body, undefined, undefined, 'application/json');
  }

/** Policies delete. */
  async delete(policyId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/policies/${serializePathParameter(policyId, { name: 'policyId', style: 'simple', explode: false })}`));
  }

/** Policies retrieve. */
  async retrieve(policyId: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/policies/${serializePathParameter(policyId, { name: 'policyId', style: 'simple', explode: false })}`));
  }

/** Policies update. */
  async update(policyId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/policies/${serializePathParameter(policyId, { name: 'policyId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export interface IamPermissionsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamPermissionsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Permissions list. */
  async list(params?: IamPermissionsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/permissions`), query));
  }

/** Permissions create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/permissions`), body, undefined, undefined, 'application/json');
  }

/** Permissions delete. */
  async delete(permissionId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/permissions/${serializePathParameter(permissionId, { name: 'permissionId', style: 'simple', explode: false })}`));
  }

/** Permissions retrieve. */
  async retrieve(permissionId: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/permissions/${serializePathParameter(permissionId, { name: 'permissionId', style: 'simple', explode: false })}`));
  }

/** Permissions update. */
  async update(permissionId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/permissions/${serializePathParameter(permissionId, { name: 'permissionId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export class IamOrganizationsTreeApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Organizations tree retrieve. */
  async retrieve(): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/organizations/tree`));
  }
}

export interface IamOrganizationsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOrganizationsApi {
  private client: HttpClient;
  public readonly tree: IamOrganizationsTreeApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.tree = new IamOrganizationsTreeApi(client);
  }


/** Organizations list. */
  async list(params?: IamOrganizationsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/organizations`), query));
  }

/** Organizations create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/organizations`), body, undefined, undefined, 'application/json');
  }

/** Organizations delete. */
  async delete(organizationId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/organizations/${serializePathParameter(organizationId, { name: 'organizationId', style: 'simple', explode: false })}`));
  }

/** Organizations retrieve. */
  async retrieve(organizationId: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/organizations/${serializePathParameter(organizationId, { name: 'organizationId', style: 'simple', explode: false })}`));
  }

/** Organizations update. */
  async update(organizationId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/organizations/${serializePathParameter(organizationId, { name: 'organizationId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export interface IamOrganizationMembershipsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOrganizationMembershipsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Organization Memberships list. */
  async list(params?: IamOrganizationMembershipsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/organization_memberships`), query));
  }

/** Organization Memberships create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/organization_memberships`), body, undefined, undefined, 'application/json');
  }

/** Organization Memberships update. */
  async update(membershipId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/organization_memberships/${serializePathParameter(membershipId, { name: 'membershipId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export interface IamGroupsMembersListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamGroupsMembersApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Groups members list. */
  async list(groupId: string, params?: IamGroupsMembersListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/groups/${serializePathParameter(groupId, { name: 'groupId', style: 'simple', explode: false })}/members`), query));
  }

/** Groups members create. */
  async create(groupId: string, body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/groups/${serializePathParameter(groupId, { name: 'groupId', style: 'simple', explode: false })}/members`), body, undefined, undefined, 'application/json');
  }

/** Groups members delete. */
  async delete(groupId: string, memberId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/groups/${serializePathParameter(groupId, { name: 'groupId', style: 'simple', explode: false })}/members/${serializePathParameter(memberId, { name: 'memberId', style: 'simple', explode: false })}`));
  }
}

export interface IamGroupsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamGroupsApi {
  private client: HttpClient;
  public readonly members: IamGroupsMembersApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.members = new IamGroupsMembersApi(client);
  }


/** Groups list. */
  async list(params?: IamGroupsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/groups`), query));
  }

/** Groups create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/groups`), body, undefined, undefined, 'application/json');
  }

/** Groups delete. */
  async delete(groupId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/groups/${serializePathParameter(groupId, { name: 'groupId', style: 'simple', explode: false })}`));
  }

/** Groups retrieve. */
  async retrieve(groupId: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/groups/${serializePathParameter(groupId, { name: 'groupId', style: 'simple', explode: false })}`));
  }

/** Groups update. */
  async update(groupId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/groups/${serializePathParameter(groupId, { name: 'groupId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export class IamDepartmentsTreeApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Departments tree retrieve. */
  async retrieve(): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/departments/tree`));
  }
}

export interface IamDepartmentsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamDepartmentsApi {
  private client: HttpClient;
  public readonly tree: IamDepartmentsTreeApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.tree = new IamDepartmentsTreeApi(client);
  }


/** Departments list. */
  async list(params?: IamDepartmentsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/departments`), query));
  }

/** Departments create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/departments`), body, undefined, undefined, 'application/json');
  }

/** Departments delete. */
  async delete(departmentId: string): Promise<Record<string, unknown>> {
    return this.client.delete<Record<string, unknown>>(backendApiPath(`/iam/departments/${serializePathParameter(departmentId, { name: 'departmentId', style: 'simple', explode: false })}`));
  }

/** Departments retrieve. */
  async retrieve(departmentId: string): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/departments/${serializePathParameter(departmentId, { name: 'departmentId', style: 'simple', explode: false })}`));
  }

/** Departments update. */
  async update(departmentId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/departments/${serializePathParameter(departmentId, { name: 'departmentId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export interface IamDepartmentAssignmentsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamDepartmentAssignmentsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Department Assignments list. */
  async list(params?: IamDepartmentAssignmentsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/department_assignments`), query));
  }

/** Department Assignments create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/department_assignments`), body, undefined, undefined, 'application/json');
  }

/** Department Assignments update. */
  async update(assignmentId: string, body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/department_assignments/${serializePathParameter(assignmentId, { name: 'assignmentId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
  }
}

export interface IamAuditEventsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamAuditEventsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Audit Events list. */
  async list(params?: IamAuditEventsListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/audit_events`), query));
  }
}

export class IamApplicationsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Applications register. */
  async register(body: AppbaseApplicationRegisterCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/applications/register`), body, undefined, undefined, 'application/json');
  }
}

export interface IamApiKeysListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamApiKeysApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Api Keys list. */
  async list(params?: IamApiKeysListParams): Promise<Record<string, unknown>> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<Record<string, unknown>>(appendQueryString(backendApiPath(`/iam/api_keys`), query));
  }

/** Api Keys revoke. */
  async revoke(apiKeyId: string, body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/api_keys/${serializePathParameter(apiKeyId, { name: 'apiKeyId', style: 'simple', explode: false })}/revoke`), body, undefined, undefined, 'application/json');
  }
}

export class IamAccountBindingPolicyApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Account Binding Policy retrieve. */
  async retrieve(): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(backendApiPath(`/iam/account_binding_policy`));
  }

/** Account Binding Policy update. */
  async update(body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(backendApiPath(`/iam/account_binding_policy`), body, undefined, undefined, 'application/json');
  }
}

export class IamAccessCredentialsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Access Credentials create. */
  async create(body: AppbaseAccessCredentialCreateCommand): Promise<Record<string, unknown>> {
    return this.client.post<Record<string, unknown>>(backendApiPath(`/iam/access_credentials`), body, undefined, undefined, 'application/json');
  }
}

export class IamApi {
  private client: HttpClient;
  public readonly accessCredentials: IamAccessCredentialsApi;
  public readonly accountBindingPolicy: IamAccountBindingPolicyApi;
  public readonly apiKeys: IamApiKeysApi;
  public readonly applications: IamApplicationsApi;
  public readonly auditEvents: IamAuditEventsApi;
  public readonly departmentAssignments: IamDepartmentAssignmentsApi;
  public readonly departments: IamDepartmentsApi;
  public readonly groups: IamGroupsApi;
  public readonly organizationMemberships: IamOrganizationMembershipsApi;
  public readonly organizations: IamOrganizationsApi;
  public readonly permissions: IamPermissionsApi;
  public readonly policies: IamPoliciesApi;
  public readonly positionAssignments: IamPositionAssignmentsApi;
  public readonly positions: IamPositionsApi;
  public readonly roleBindings: IamRoleBindingsApi;
  public readonly roles: IamRolesApi;
  public readonly securityEvents: IamSecurityEventsApi;
  public readonly serviceAccounts: IamServiceAccountsApi;
  public readonly tenantApplications: IamTenantApplicationsApi;
  public readonly tenants: IamTenantsApi;
  public readonly users: IamUsersApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.accessCredentials = new IamAccessCredentialsApi(client);
    this.accountBindingPolicy = new IamAccountBindingPolicyApi(client);
    this.apiKeys = new IamApiKeysApi(client);
    this.applications = new IamApplicationsApi(client);
    this.auditEvents = new IamAuditEventsApi(client);
    this.departmentAssignments = new IamDepartmentAssignmentsApi(client);
    this.departments = new IamDepartmentsApi(client);
    this.groups = new IamGroupsApi(client);
    this.organizationMemberships = new IamOrganizationMembershipsApi(client);
    this.organizations = new IamOrganizationsApi(client);
    this.permissions = new IamPermissionsApi(client);
    this.policies = new IamPoliciesApi(client);
    this.positionAssignments = new IamPositionAssignmentsApi(client);
    this.positions = new IamPositionsApi(client);
    this.roleBindings = new IamRoleBindingsApi(client);
    this.roles = new IamRolesApi(client);
    this.securityEvents = new IamSecurityEventsApi(client);
    this.serviceAccounts = new IamServiceAccountsApi(client);
    this.tenantApplications = new IamTenantApplicationsApi(client);
    this.tenants = new IamTenantsApi(client);
    this.users = new IamUsersApi(client);
  }

}

export function createIamApi(client: HttpClient): IamApi {
  return new IamApi(client);
}

function appendQueryString(path: string, rawQueryString: string): string {
  const query = rawQueryString.replace(/^\?+/, '');
  if (!query) {
    return path;
  }
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}

interface PathParameterSpec {
  name: string;
  style: string;
  explode: boolean;
}

function serializePathParameter(value: unknown, spec: PathParameterSpec): string {
  if (value === undefined || value === null) {
    return '';
  }

  const style = spec.style || 'simple';
  if (Array.isArray(value)) {
    return serializePathArray(spec.name, value, style, spec.explode);
  }
  if (typeof value === 'object') {
    return serializePathObject(spec.name, value as Record<string, unknown>, style, spec.explode);
  }
  return pathPrefix(spec.name, style, false) + encodePathValue(serializePathPrimitive(value));
}

function serializePathArray(name: string, values: unknown[], style: string, explode: boolean): string {
  const serialized = values
    .filter((item) => item !== undefined && item !== null)
    .map((item) => encodePathValue(serializePathPrimitive(item)));
  if (serialized.length === 0) {
    return pathPrefix(name, style, false);
  }
  if (style === 'matrix') {
    return explode
      ? serialized.map((item) => `;${name}=${item}`).join('')
      : `;${name}=${serialized.join(',')}`;
  }
  return pathPrefix(name, style, false) + serialized.join(explode ? '.' : ',');
}

function serializePathObject(name: string, value: Record<string, unknown>, style: string, explode: boolean): string {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return pathPrefix(name, style, true);
  }
  if (style === 'matrix') {
    return explode
      ? entries.map(([key, entryValue]) => `;${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join('')
      : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',')}`;
  }
  const serialized = explode
    ? entries.map(([key, entryValue]) => `${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join(style === 'label' ? '.' : ',')
    : entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',');
  return pathPrefix(name, style, true) + serialized;
}

function pathPrefix(name: string, style: string, _objectValue: boolean): string {
  if (style === 'label') return '.';
  if (style === 'matrix') return `;${name}`;
  return '';
}

function encodePathValue(value: string): string {
  return encodeURIComponent(value);
}

function serializePathPrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
interface QueryParameterSpec {
  name: string;
  value: unknown;
  style: string;
  explode: boolean;
  allowReserved: boolean;
  contentType?: string;
}

function buildQueryString(parameters: QueryParameterSpec[]): string {
  const pairs: string[] = [];
  for (const parameter of parameters) {
    appendSerializedParameter(pairs, parameter);
  }
  return pairs.join('&');
}

function appendSerializedParameter(pairs: string[], parameter: QueryParameterSpec): void {
  if (parameter.value === undefined || parameter.value === null) {
    return;
  }

  if (parameter.contentType) {
    pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(JSON.stringify(parameter.value), parameter.allowReserved)}`);
    return;
  }

  const style = parameter.style || 'form';
  if (style === 'deepObject') {
    appendDeepObjectParameter(pairs, parameter.name, parameter.value, parameter.allowReserved);
    return;
  }

  if (Array.isArray(parameter.value)) {
    appendArrayParameter(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
    return;
  }

  if (typeof parameter.value === 'object') {
    appendObjectParameter(pairs, parameter.name, parameter.value as Record<string, unknown>, style, parameter.explode, parameter.allowReserved);
    return;
  }

  pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(serializePrimitive(parameter.value), parameter.allowReserved)}`);
}

function appendArrayParameter(
  pairs: string[],
  name: string,
  value: unknown[],
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
  const values = value
    .filter((item) => item !== undefined && item !== null)
    .map((item) => serializePrimitive(item));
  if (values.length === 0) {
    return;
  }

  if (style === 'form' && explode) {
    for (const item of values) {
      pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(item, allowReserved)}`);
    }
    return;
  }

  pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(values.join(','), allowReserved)}`);
}

function appendObjectParameter(
  pairs: string[],
  name: string,
  value: Record<string, unknown>,
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return;
  }

  if (style === 'form' && explode) {
    for (const [key, entryValue] of entries) {
      pairs.push(`${encodeQueryComponent(key)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
    }
    return;
  }

  const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive(entryValue)]).join(',');
  pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serialized, allowReserved)}`);
}

function appendDeepObjectParameter(
  pairs: string[],
  name: string,
  value: unknown,
  allowReserved: boolean,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serializePrimitive(value), allowReserved)}`);
    return;
  }

  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    if (entryValue === undefined || entryValue === null) {
      continue;
    }
    pairs.push(`${encodeQueryComponent(`${name}[${key}]`)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
  }
}

function serializePrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function encodeQueryComponent(value: string): string {
  return encodeURIComponent(value);
}

function encodeQueryValue(value: string, allowReserved: boolean): string {
  const encoded = encodeURIComponent(value);
  if (!allowReserved) {
    return encoded;
  }
  return encoded.replace(/%3A/gi, ':')
    .replace(/%2F/gi, '/')
    .replace(/%3F/gi, '?')
    .replace(/%23/gi, '#')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
    .replace(/%40/gi, '@')
    .replace(/%21/gi, '!')
    .replace(/%24/gi, '$')
    .replace(/%26/gi, '&')
    .replace(/%27/gi, "'")
    .replace(/%28/gi, '(')
    .replace(/%29/gi, ')')
    .replace(/%2A/gi, '*')
    .replace(/%2B/gi, '+')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
    .replace(/%3D/gi, '=');
}
