/** Super-admin registered application command for startup bootstrap. */
export interface AppbaseApplicationRegisterCommand {
  /** Super-admin auth token used for bootstrap body authentication. */
  authToken?: string;
  /** Super-admin username credential for bootstrap body authentication. */
  username?: string;
  /** Super-admin email credential for bootstrap body authentication. */
  email?: string;
  /** Super-admin phone credential for bootstrap body authentication. */
  phone?: string;
  /** Super-admin password credential for bootstrap body authentication. */
  password?: string;
  ownerTenantId?: string;
  appKey: string;
  name: string;
  displayName?: string;
  appType: string;
  packageName?: string;
  bundleId?: string;
  desktopAppId?: string;
  version: string;
  channel?: string;
  manifestHash?: string;
  defaultAccessPermissions: string[];
  config?: Record<string, unknown>;
  packages?: Record<string, unknown>[];
}
