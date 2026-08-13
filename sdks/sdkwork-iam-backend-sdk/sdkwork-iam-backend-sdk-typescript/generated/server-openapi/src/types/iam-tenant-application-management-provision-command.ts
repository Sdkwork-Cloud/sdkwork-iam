/** Provision a registered application template for a tenant through an authenticated operator workflow. */
export interface IamTenantApplicationManagementProvisionCommand {
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
}
