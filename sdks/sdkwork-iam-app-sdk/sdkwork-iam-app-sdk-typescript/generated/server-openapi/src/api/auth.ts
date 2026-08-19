import { appApiPath } from './paths';
import type { ApiRequestOptions, HttpClient } from '../http/client';

import type { AppbaseOperationCommand, AppbaseSessionCreateCommand, SdkWorkCommandData } from '../types';


export class AuthVerificationCodeRequestsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Verification Code Requests create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/verification_code_requests`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', accessTokenOnly: true, sdkworkUnwrapKind: 'item' });
  }
}

export class AuthSessionsOrganizationSelectionApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Sessions organization Selection create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/sessions/organization_selection`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', accessTokenOnly: true, sdkworkUnwrapKind: 'item' });
  }
}

export class AuthSessionsLoginContextSelectionApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Sessions login Context Selection create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/sessions/login_context_selection`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', accessTokenOnly: true, sdkworkUnwrapKind: 'item' });
  }
}

export class AuthSessionsCurrentApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Sessions current delete. */
  async delete(requestOptions?: ApiRequestOptions): Promise<void> {
    return this.client.request<void>(appApiPath(`/auth/sessions/current`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'DELETE' as any });
  }

/** Sessions current retrieve. */
  async retrieve(requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/sessions/current`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'GET' as any, sdkworkUnwrapKind: 'item' });
  }

/** Sessions current update. */
  async update(body?: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/sessions/current`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'PATCH' as any, ...(body !== undefined ? { body, contentType: 'application/json' } : {}), sdkworkUnwrapKind: 'item' });
  }
}

export class AuthSessionsApi {
  private client: HttpClient;
  public readonly current: AuthSessionsCurrentApi;
  public readonly loginContextSelection: AuthSessionsLoginContextSelectionApi;
  public readonly organizationSelection: AuthSessionsOrganizationSelectionApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.current = new AuthSessionsCurrentApi(client);
    this.loginContextSelection = new AuthSessionsLoginContextSelectionApi(client);
    this.organizationSelection = new AuthSessionsOrganizationSelectionApi(client);
  }


/** Sessions create. */
  async create(body: AppbaseSessionCreateCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/sessions`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', accessTokenOnly: true, sdkworkUnwrapKind: 'item' });
  }

/** Sessions refresh. */
  async refresh(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<SdkWorkCommandData> {
    return this.client.request<SdkWorkCommandData>(appApiPath(`/auth/sessions/refresh`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', skipAuth: true, sdkworkUnwrapKind: 'command' });
  }
}

export class AuthRegistrationsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Registrations create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/registrations`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', accessTokenOnly: true, sdkworkUnwrapKind: 'item' });
  }
}

export class AuthPasswordResetsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Password Resets create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/password_resets`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', accessTokenOnly: true, sdkworkUnwrapKind: 'item' });
  }
}

export class AuthPasswordResetRequestsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Password Reset Requests create. */
  async create(body: AppbaseOperationCommand, requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/password_reset_requests`), { ...(requestOptions?.signal !== undefined ? { signal: requestOptions.signal } : {}), ...(requestOptions?.timeout !== undefined ? { timeout: requestOptions.timeout } : {}), method: 'POST' as any, body, contentType: 'application/json', accessTokenOnly: true, sdkworkUnwrapKind: 'item' });
  }
}

export class AuthApi {
  public readonly passwordResetRequests: AuthPasswordResetRequestsApi;
  public readonly passwordResets: AuthPasswordResetsApi;
  public readonly registrations: AuthRegistrationsApi;
  public readonly sessions: AuthSessionsApi;
  public readonly verificationCodeRequests: AuthVerificationCodeRequestsApi;

  constructor(client: HttpClient) {
    this.passwordResetRequests = new AuthPasswordResetRequestsApi(client);
    this.passwordResets = new AuthPasswordResetsApi(client);
    this.registrations = new AuthRegistrationsApi(client);
    this.sessions = new AuthSessionsApi(client);
    this.verificationCodeRequests = new AuthVerificationCodeRequestsApi(client);
  }

}

export function createAuthApi(client: HttpClient): AuthApi {
  return new AuthApi(client);
}
