import { appApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { AppbaseOperationCommand, AppbaseSessionCreateCommand, SdkWorkCommandData } from '../types';


export class AuthSessionsOrganizationSelectionApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Sessions organization Selection create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/sessions/organization_selection`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }
}

export class AuthSessionsLoginContextSelectionApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Sessions login Context Selection create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/sessions/login_context_selection`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }
}

export class AuthSessionsCurrentApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Sessions current delete. */
  async delete(): Promise<void> {
    return this.client.delete<void>(appApiPath(`/auth/sessions/current`));
  }

/** Sessions current retrieve. */
  async retrieve(): Promise<Record<string, unknown>> {
    return this.client.get<Record<string, unknown>>(appApiPath(`/auth/sessions/current`));
  }

/** Sessions current update. */
  async update(body?: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.patch<Record<string, unknown>>(appApiPath(`/auth/sessions/current`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
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
  async create(body: AppbaseSessionCreateCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/sessions`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }

/** Sessions refresh. */
  async refresh(body: AppbaseOperationCommand): Promise<SdkWorkCommandData> {
    return this.client.request<SdkWorkCommandData>(appApiPath(`/auth/sessions/refresh`), { method: 'POST' as any, body, contentType: 'application/json', skipAuth: true });
  }
}

export class AuthRegistrationsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Registrations create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/registrations`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }
}

export class AuthPasswordResetsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Password Resets create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/password_resets`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }
}

export class AuthPasswordResetRequestsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Password Reset Requests create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/auth/password_reset_requests`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }
}

export class AuthApi {
  private client: HttpClient;
  public readonly passwordResetRequests: AuthPasswordResetRequestsApi;
  public readonly passwordResets: AuthPasswordResetsApi;
  public readonly registrations: AuthRegistrationsApi;
  public readonly sessions: AuthSessionsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.passwordResetRequests = new AuthPasswordResetRequestsApi(client);
    this.passwordResets = new AuthPasswordResetsApi(client);
    this.registrations = new AuthRegistrationsApi(client);
    this.sessions = new AuthSessionsApi(client);
  }

}

export function createAuthApi(client: HttpClient): AuthApi {
  return new AuthApi(client);
}

function appendQueryString(path: string, rawQueryString: string): string {
  const query = rawQueryString.replace(/^\?+/, '');
  if (!query) {
    return path;
  }
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
