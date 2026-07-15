/** Tenant-scoped OAuth provider client registration command. */
export interface IamOauthClientCreateCommand {
  integrationId: string;
  providerCode: string;
  clientCode: string;
  displayName: string;
  providerClientId: string;
  /** Provider-owned identity federation scope, such as a WeChat Open Platform account ID. */
  providerTenantId?: string;
}
