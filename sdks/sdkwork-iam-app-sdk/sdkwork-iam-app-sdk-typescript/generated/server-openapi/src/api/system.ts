import { appApiPath } from './paths';
import type { ApiRequestOptions, HttpClient } from '../http/client';



export class SystemIamVerificationPolicyApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam verification Policy retrieve. */
  async retrieve(requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/system/iam/verification_policy`), { signal: requestOptions?.signal, timeout: requestOptions?.timeout, method: 'GET' as any, accessTokenOnly: true });
  }
}

export class SystemIamRuntimeApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam runtime retrieve. */
  async retrieve(requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/system/iam/runtime`), { signal: requestOptions?.signal, timeout: requestOptions?.timeout, method: 'GET' as any, accessTokenOnly: true });
  }
}

export class SystemIamAccountBindingPolicyApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam account Binding Policy retrieve. */
  async retrieve(requestOptions?: ApiRequestOptions): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/system/iam/account_binding_policy`), { signal: requestOptions?.signal, timeout: requestOptions?.timeout, method: 'GET' as any, accessTokenOnly: true });
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
