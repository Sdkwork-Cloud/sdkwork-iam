import { HttpClient, createHttpClient } from './http/client';
import type { SdkworkAppConfig } from './types/common';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

import { AuthApi, createAuthApi } from './api/auth';
import { IamApi, createIamApi } from './api/iam';
import { OauthApi, createOauthApi } from './api/oauth';
import { SystemApi, createSystemApi } from './api/system';

export class SdkworkAppClient {
  private httpClient: HttpClient;

  public readonly auth: AuthApi;
  public readonly iam: IamApi;
  public readonly oauth: OauthApi;
  public readonly system: SystemApi;

  constructor(config: SdkworkAppConfig) {
    this.httpClient = createHttpClient(config);
    this.auth = createAuthApi(this.httpClient);

    this.iam = createIamApi(this.httpClient);

    this.oauth = createOauthApi(this.httpClient);

    this.system = createSystemApi(this.httpClient);
  }
  setAuthToken(token: string): this {
    this.httpClient.setAuthToken(token);
    return this;
  }

  setAccessToken(token: string): this {
    this.httpClient.setAccessToken(token);
    return this;
  }

  setTokenManager(manager: AuthTokenManager): this {
    this.httpClient.setTokenManager(manager);
    return this;
  }

  get http(): HttpClient {
    return this.httpClient;
  }
}

export function createClient(config: SdkworkAppConfig): SdkworkAppClient {
  return new SdkworkAppClient(config);
}

export default SdkworkAppClient;
