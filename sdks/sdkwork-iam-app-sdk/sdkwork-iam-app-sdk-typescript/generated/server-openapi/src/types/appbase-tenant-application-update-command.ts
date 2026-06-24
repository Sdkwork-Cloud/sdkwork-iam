/** Update tenant application access and runtime configuration. */
export interface AppbaseTenantApplicationUpdateCommand {
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
  primaryDomain?: string;
  domainConfig?: Record<string, unknown>;
  accessPermissions?: string[];
  runtimeConfig?: Record<string, unknown>;
}
