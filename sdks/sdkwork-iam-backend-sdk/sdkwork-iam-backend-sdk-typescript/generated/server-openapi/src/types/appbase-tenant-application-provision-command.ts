/** Provision a tenant application from a registered application template. */
export interface AppbaseTenantApplicationProvisionCommand {
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
  templateId?: string;
  appKey?: string;
  instanceKey: string;
  displayName: string;
  environment: string;
  /** Product-semantic application type (api | h5 | pc | flutter | other); defaults to a mapping of the template app_type. */
  applicationType?: 'api' | 'h5' | 'pc' | 'flutter' | 'other';
  primaryDomain?: string;
  accessPermissions?: string[];
  runtimeConfig?: Record<string, unknown>;
}
