import { appApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { AppbaseApiResult } from '../types';


export class SystemIamVerificationPolicyApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam verification Policy retrieve. */
  async retrieve(): Promise<AppbaseApiResult> {
    return this.client.request<AppbaseApiResult>(appApiPath(`/system/iam/verification_policy`), { method: 'GET' as any, skipAuth: true });
  }
}

export class SystemIamRuntimeApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam runtime retrieve. */
  async retrieve(): Promise<AppbaseApiResult> {
    return this.client.request<AppbaseApiResult>(appApiPath(`/system/iam/runtime`), { method: 'GET' as any, skipAuth: true });
  }
}

export class SystemIamAccountBindingPolicyApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam account Binding Policy retrieve. */
  async retrieve(): Promise<AppbaseApiResult> {
    return this.client.request<AppbaseApiResult>(appApiPath(`/system/iam/account_binding_policy`), { method: 'GET' as any, skipAuth: true });
  }
}

export class SystemIamApi {
  private client: HttpClient;
  public readonly accountBindingPolicy: SystemIamAccountBindingPolicyApi;
  public readonly runtime: SystemIamRuntimeApi;
  public readonly verificationPolicy: SystemIamVerificationPolicyApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.accountBindingPolicy = new SystemIamAccountBindingPolicyApi(client);
    this.runtime = new SystemIamRuntimeApi(client);
    this.verificationPolicy = new SystemIamVerificationPolicyApi(client);
  }

}

export class SystemApi {
  private client: HttpClient;
  public readonly iam: SystemIamApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.iam = new SystemIamApi(client);
  }

}

export function createSystemApi(client: HttpClient): SystemApi {
  return new SystemApi(client);
}

function appendQueryString(path: string, rawQueryString: string): string {
  const query = rawQueryString.replace(/^\?+/, '');
  if (!query) {
    return path;
  }
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
