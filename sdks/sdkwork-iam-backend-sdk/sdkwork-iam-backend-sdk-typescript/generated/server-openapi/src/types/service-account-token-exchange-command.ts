/** Exchange a workload client credential for short-lived tenant-bound dual tokens. */
export interface ServiceAccountTokenExchangeCommand {
  clientId: string;
  clientSecret: string;
}
