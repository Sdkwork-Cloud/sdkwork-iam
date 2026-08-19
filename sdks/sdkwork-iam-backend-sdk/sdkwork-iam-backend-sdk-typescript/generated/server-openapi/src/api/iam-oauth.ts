import { backendApiPath } from './paths';
import type { ApiRequestOptions, HttpClient } from '../http/client';

import type { AppbaseOperationCommand, IamOauthClientCreateCommand, SdkWorkPageData } from '../types';


export class IamOauthIamOauthWebhookConfigsVerificationsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth webhook Configs verifications create. */
  async create(webhookConfigId: string, body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/webhook_configs/${serializePathParameter(webhookConfigId, { name: 'webhookConfigId', style: 'simple', explode: false })}/verifications`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthWebhookConfigsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthWebhookConfigsApi {
  private client: HttpClient;
  public readonly verifications: IamOauthIamOauthWebhookConfigsVerificationsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.verifications = new IamOauthIamOauthWebhookConfigsVerificationsApi(client);
  }


/** Iam oauth webhook Configs list. */
  async list(params?: IamOauthIamOauthWebhookConfigsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/webhook_configs`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth webhook Configs create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/webhook_configs`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth webhook Configs delete. */
  async delete(webhookConfigId: string, requestOptions?: ApiRequestOptions): Promise<void> {
    return this.client.request<void>(backendApiPath(`/iam/oauth/webhook_configs/${serializePathParameter(webhookConfigId, { name: 'webhookConfigId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'DELETE' as any });
  }

/** Iam oauth webhook Configs update. */
  async update(webhookConfigId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/webhook_configs/${serializePathParameter(webhookConfigId, { name: 'webhookConfigId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthTenantBindingsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthTenantBindingsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth tenant Bindings list. */
  async list(params?: IamOauthIamOauthTenantBindingsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/tenant_bindings`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth tenant Bindings create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/tenant_bindings`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth tenant Bindings update. */
  async update(bindingId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/tenant_bindings/${serializePathParameter(bindingId, { name: 'bindingId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthSurfacesListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthSurfacesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth surfaces list. */
  async list(params?: IamOauthIamOauthSurfacesListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/surfaces`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth surfaces create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/surfaces`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth surfaces delete. */
  async delete(surfaceId: string, requestOptions?: ApiRequestOptions): Promise<void> {
    return this.client.request<void>(backendApiPath(`/iam/oauth/surfaces/${serializePathParameter(surfaceId, { name: 'surfaceId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'DELETE' as any });
  }

/** Iam oauth surfaces update. */
  async update(surfaceId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/surfaces/${serializePathParameter(surfaceId, { name: 'surfaceId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthSecretsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthSecretsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth secrets list. */
  async list(params?: IamOauthIamOauthSecretsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/secrets`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth secrets create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/secrets`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth secrets delete. */
  async delete(secretId: string, requestOptions?: ApiRequestOptions): Promise<void> {
    return this.client.request<void>(backendApiPath(`/iam/oauth/secrets/${serializePathParameter(secretId, { name: 'secretId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'DELETE' as any });
  }
}

export interface IamOauthIamOauthScopeProfilesListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthScopeProfilesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth scope Profiles list. */
  async list(params?: IamOauthIamOauthScopeProfilesListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/scope_profiles`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth scope Profiles create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/scope_profiles`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth scope Profiles update. */
  async update(scopeProfileId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/scope_profiles/${serializePathParameter(scopeProfileId, { name: 'scopeProfileId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export class IamOauthIamOauthScanLoginSettingsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth scan Login Settings retrieve. */
  async retrieve(requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/scan_login_settings`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth scan Login Settings update. */
  async update(body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/scan_login_settings`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export class IamOauthIamOauthScanLoginPreviewsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth scan Login Previews create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/scan_login_previews`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthResourceAuthorizationsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthResourceAuthorizationsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth resource Authorizations list. */
  async list(params?: IamOauthIamOauthResourceAuthorizationsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/resource_authorizations`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth resource Authorizations create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/resource_authorizations`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth resource Authorizations update. */
  async update(authorizationId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/resource_authorizations/${serializePathParameter(authorizationId, { name: 'authorizationId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export class IamOauthIamOauthResourceAccountsVerificationsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth resource Accounts verifications create. */
  async create(resourceAccountId: string, body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, { name: 'resourceAccountId', style: 'simple', explode: false })}/verifications`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export class IamOauthIamOauthResourceAccountsMiniProgramLoginChecksApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth resource Accounts mini Program Login Checks create. */
  async create(resourceAccountId: string, body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, { name: 'resourceAccountId', style: 'simple', explode: false })}/mini_program_login_checks`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export class IamOauthIamOauthResourceAccountsFollowQrCodesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth resource Accounts follow Qr Codes create. */
  async create(resourceAccountId: string, body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, { name: 'resourceAccountId', style: 'simple', explode: false })}/follow_qr_codes`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export class IamOauthIamOauthResourceAccountsCustomMenusApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth resource Accounts custom Menus retrieve. */
  async retrieve(resourceAccountId: string, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, { name: 'resourceAccountId', style: 'simple', explode: false })}/custom_menus`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth resource Accounts custom Menus update. */
  async update(resourceAccountId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, { name: 'resourceAccountId', style: 'simple', explode: false })}/custom_menus`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth resource Accounts custom Menus publish. */
  async publish(resourceAccountId: string, body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, { name: 'resourceAccountId', style: 'simple', explode: false })}/custom_menus/publish`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export class IamOauthIamOauthResourceAccountsAuthorizationRefreshesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth resource Accounts authorization Refreshes create. */
  async create(resourceAccountId: string, body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, { name: 'resourceAccountId', style: 'simple', explode: false })}/authorization_refreshes`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthResourceAccountsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthResourceAccountsApi {
  private client: HttpClient;
  public readonly authorizationRefreshes: IamOauthIamOauthResourceAccountsAuthorizationRefreshesApi;
  public readonly customMenus: IamOauthIamOauthResourceAccountsCustomMenusApi;
  public readonly followQrCodes: IamOauthIamOauthResourceAccountsFollowQrCodesApi;
  public readonly miniProgramLoginChecks: IamOauthIamOauthResourceAccountsMiniProgramLoginChecksApi;
  public readonly verifications: IamOauthIamOauthResourceAccountsVerificationsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.authorizationRefreshes = new IamOauthIamOauthResourceAccountsAuthorizationRefreshesApi(client);
    this.customMenus = new IamOauthIamOauthResourceAccountsCustomMenusApi(client);
    this.followQrCodes = new IamOauthIamOauthResourceAccountsFollowQrCodesApi(client);
    this.miniProgramLoginChecks = new IamOauthIamOauthResourceAccountsMiniProgramLoginChecksApi(client);
    this.verifications = new IamOauthIamOauthResourceAccountsVerificationsApi(client);
  }


/** Iam oauth resource Accounts list. */
  async list(params?: IamOauthIamOauthResourceAccountsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/resource_accounts`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth resource Accounts create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/resource_accounts`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth resource Accounts update. */
  async update(resourceAccountId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, { name: 'resourceAccountId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthProviderCatalogListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthProviderCatalogApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth provider Catalog list. */
  async list(params?: IamOauthIamOauthProviderCatalogListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/provider_catalog`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth provider Catalog create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/provider_catalog`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth provider Catalog retrieve. */
  async retrieve(providerCatalogId: string, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/provider_catalog/${serializePathParameter(providerCatalogId, { name: 'providerCatalogId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth provider Catalog update. */
  async update(providerCatalogId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/provider_catalog/${serializePathParameter(providerCatalogId, { name: 'providerCatalogId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthPoliciesListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthPoliciesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth policies list. */
  async list(params?: IamOauthIamOauthPoliciesListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/policies`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth policies create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/policies`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth policies update. */
  async update(policyId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/policies/${serializePathParameter(policyId, { name: 'policyId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export class IamOauthIamOauthOperatorPlatformsPreAuthorizationsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth operator Platforms pre Authorizations create. */
  async create(operatorPlatformId: string, body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/operator_platforms/${serializePathParameter(operatorPlatformId, { name: 'operatorPlatformId', style: 'simple', explode: false })}/pre_authorizations`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthOperatorPlatformsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthOperatorPlatformsApi {
  private client: HttpClient;
  public readonly preAuthorizations: IamOauthIamOauthOperatorPlatformsPreAuthorizationsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.preAuthorizations = new IamOauthIamOauthOperatorPlatformsPreAuthorizationsApi(client);
  }


/** Iam oauth operator Platforms list. */
  async list(params?: IamOauthIamOauthOperatorPlatformsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/operator_platforms`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth operator Platforms create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/operator_platforms`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth operator Platforms update. */
  async update(operatorPlatformId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/operator_platforms/${serializePathParameter(operatorPlatformId, { name: 'operatorPlatformId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export class IamOauthIamOauthOperationalResourcesPublishesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth operational Resources publishes create. */
  async create(resourceId: string, body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/operational_resources/${serializePathParameter(resourceId, { name: 'resourceId', style: 'simple', explode: false })}/publishes`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthOperationalResourcesListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthOperationalResourcesApi {
  private client: HttpClient;
  public readonly publishes: IamOauthIamOauthOperationalResourcesPublishesApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.publishes = new IamOauthIamOauthOperationalResourcesPublishesApi(client);
  }


/** Iam oauth operational Resources list. */
  async list(params?: IamOauthIamOauthOperationalResourcesListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/operational_resources`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth operational Resources create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/operational_resources`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth operational Resources delete. */
  async delete(resourceId: string, requestOptions?: ApiRequestOptions): Promise<void> {
    return this.client.request<void>(backendApiPath(`/iam/oauth/operational_resources/${serializePathParameter(resourceId, { name: 'resourceId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'DELETE' as any });
  }

/** Iam oauth operational Resources update. */
  async update(resourceId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/operational_resources/${serializePathParameter(resourceId, { name: 'resourceId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthIntegrationsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthIntegrationsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth integrations list. */
  async list(params?: IamOauthIamOauthIntegrationsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/integrations`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth integrations create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/integrations`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth integrations delete. */
  async delete(integrationId: string, requestOptions?: ApiRequestOptions): Promise<void> {
    return this.client.request<void>(backendApiPath(`/iam/oauth/integrations/${serializePathParameter(integrationId, { name: 'integrationId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'DELETE' as any });
  }

/** Iam oauth integrations retrieve. */
  async retrieve(integrationId: string, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/integrations/${serializePathParameter(integrationId, { name: 'integrationId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth integrations update. */
  async update(integrationId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/integrations/${serializePathParameter(integrationId, { name: 'integrationId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthGrantsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthGrantsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth grants list. */
  async list(params?: IamOauthIamOauthGrantsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/grants`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth grants delete. */
  async delete(grantId: string, requestOptions?: ApiRequestOptions): Promise<void> {
    return this.client.request<void>(backendApiPath(`/iam/oauth/grants/${serializePathParameter(grantId, { name: 'grantId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'DELETE' as any });
  }
}

export interface IamOauthIamOauthFlowConfigsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthFlowConfigsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth flow Configs list. */
  async list(params?: IamOauthIamOauthFlowConfigsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/flow_configs`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth flow Configs create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/flow_configs`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth flow Configs update. */
  async update(flowConfigId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/flow_configs/${serializePathParameter(flowConfigId, { name: 'flowConfigId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthDiagnosticRunsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthDiagnosticRunsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth diagnostic Runs list. */
  async list(params?: IamOauthIamOauthDiagnosticRunsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/diagnostic_runs`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth diagnostic Runs create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/diagnostic_runs`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth diagnostic Runs retrieve. */
  async retrieve(diagnosticRunId: string, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/diagnostic_runs/${serializePathParameter(diagnosticRunId, { name: 'diagnosticRunId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthClientsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthClientsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth clients list. */
  async list(params?: IamOauthIamOauthClientsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/clients`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth clients create. */
  async create(body: IamOauthClientCreateCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/clients`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth clients delete. */
  async delete(oauthClientId: string, requestOptions?: ApiRequestOptions): Promise<void> {
    return this.client.request<void>(backendApiPath(`/iam/oauth/clients/${serializePathParameter(oauthClientId, { name: 'oauthClientId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'DELETE' as any });
  }

/** Iam oauth clients retrieve. */
  async retrieve(oauthClientId: string, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/clients/${serializePathParameter(oauthClientId, { name: 'oauthClientId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth clients update. */
  async update(oauthClientId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/clients/${serializePathParameter(oauthClientId, { name: 'oauthClientId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthClaimMappingsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthClaimMappingsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth claim Mappings list. */
  async list(params?: IamOauthIamOauthClaimMappingsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/claim_mappings`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth claim Mappings create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/claim_mappings`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', sdkworkUnwrapKind: 'item' });
  }

/** Iam oauth claim Mappings update. */
  async update(mappingId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/claim_mappings/${serializePathParameter(mappingId, { name: 'mappingId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export interface IamOauthIamOauthCallbackEventsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthCallbackEventsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth callback Events list. */
  async list(params?: IamOauthIamOauthCallbackEventsListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/callback_events`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }
}

export interface IamOauthIamOauthAccountLinksListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class IamOauthIamOauthAccountLinksApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth account Links list. */
  async list(params?: IamOauthIamOauthAccountLinksListParams, requestOptions?: ApiRequestOptions): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<SdkWorkPageData>(appendQueryString(backendApiPath(`/iam/oauth/account_links`), query), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'page' });
  }

/** Iam oauth account Links update. */
  async update(accountLinkId: string, body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(backendApiPath(`/iam/oauth/account_links/${serializePathParameter(accountLinkId, { name: 'accountLinkId', style: 'simple', explode: false })}`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export class IamOauthIamOauthApi {
  public readonly accountLinks: IamOauthIamOauthAccountLinksApi;
  public readonly callbackEvents: IamOauthIamOauthCallbackEventsApi;
  public readonly claimMappings: IamOauthIamOauthClaimMappingsApi;
  public readonly clients: IamOauthIamOauthClientsApi;
  public readonly diagnosticRuns: IamOauthIamOauthDiagnosticRunsApi;
  public readonly flowConfigs: IamOauthIamOauthFlowConfigsApi;
  public readonly grants: IamOauthIamOauthGrantsApi;
  public readonly integrations: IamOauthIamOauthIntegrationsApi;
  public readonly operationalResources: IamOauthIamOauthOperationalResourcesApi;
  public readonly operatorPlatforms: IamOauthIamOauthOperatorPlatformsApi;
  public readonly policies: IamOauthIamOauthPoliciesApi;
  public readonly providerCatalog: IamOauthIamOauthProviderCatalogApi;
  public readonly resourceAccounts: IamOauthIamOauthResourceAccountsApi;
  public readonly resourceAuthorizations: IamOauthIamOauthResourceAuthorizationsApi;
  public readonly scanLoginPreviews: IamOauthIamOauthScanLoginPreviewsApi;
  public readonly scanLoginSettings: IamOauthIamOauthScanLoginSettingsApi;
  public readonly scopeProfiles: IamOauthIamOauthScopeProfilesApi;
  public readonly secrets: IamOauthIamOauthSecretsApi;
  public readonly surfaces: IamOauthIamOauthSurfacesApi;
  public readonly tenantBindings: IamOauthIamOauthTenantBindingsApi;
  public readonly webhookConfigs: IamOauthIamOauthWebhookConfigsApi;

  constructor(client: HttpClient) {
    this.accountLinks = new IamOauthIamOauthAccountLinksApi(client);
    this.callbackEvents = new IamOauthIamOauthCallbackEventsApi(client);
    this.claimMappings = new IamOauthIamOauthClaimMappingsApi(client);
    this.clients = new IamOauthIamOauthClientsApi(client);
    this.diagnosticRuns = new IamOauthIamOauthDiagnosticRunsApi(client);
    this.flowConfigs = new IamOauthIamOauthFlowConfigsApi(client);
    this.grants = new IamOauthIamOauthGrantsApi(client);
    this.integrations = new IamOauthIamOauthIntegrationsApi(client);
    this.operationalResources = new IamOauthIamOauthOperationalResourcesApi(client);
    this.operatorPlatforms = new IamOauthIamOauthOperatorPlatformsApi(client);
    this.policies = new IamOauthIamOauthPoliciesApi(client);
    this.providerCatalog = new IamOauthIamOauthProviderCatalogApi(client);
    this.resourceAccounts = new IamOauthIamOauthResourceAccountsApi(client);
    this.resourceAuthorizations = new IamOauthIamOauthResourceAuthorizationsApi(client);
    this.scanLoginPreviews = new IamOauthIamOauthScanLoginPreviewsApi(client);
    this.scanLoginSettings = new IamOauthIamOauthScanLoginSettingsApi(client);
    this.scopeProfiles = new IamOauthIamOauthScopeProfilesApi(client);
    this.secrets = new IamOauthIamOauthSecretsApi(client);
    this.surfaces = new IamOauthIamOauthSurfacesApi(client);
    this.tenantBindings = new IamOauthIamOauthTenantBindingsApi(client);
    this.webhookConfigs = new IamOauthIamOauthWebhookConfigsApi(client);
  }

}

export class IamOauthIamApi {
  public readonly oauth: IamOauthIamOauthApi;

  constructor(client: HttpClient) {
    this.oauth = new IamOauthIamOauthApi(client);
  }

}

export class IamOauthApi {
  public readonly iam: IamOauthIamApi;

  constructor(client: HttpClient) {
    this.iam = new IamOauthIamApi(client);
  }

}

export function createIamOauthApi(client: HttpClient): IamOauthApi {
  return new IamOauthApi(client);
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
