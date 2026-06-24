/** Issue a delegated access credential for an enabled tenant application. */
export interface AppbaseAccessCredentialCreateCommand {
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
  tenantId: string;
  organizationId: string;
  tenantApplicationId?: string;
  appId?: string;
  instanceKey?: string;
}
