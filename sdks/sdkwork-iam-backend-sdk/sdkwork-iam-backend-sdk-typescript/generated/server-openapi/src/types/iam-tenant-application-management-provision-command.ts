/** Provision a registered application template for a tenant through an authenticated operator workflow. */
export interface IamTenantApplicationManagementProvisionCommand {
  organizationId: string;
  templateId?: string;
  appKey?: string;
  instanceKey: string;
  displayName: string;
  environment: string;
  primaryDomain?: string;
  accessPermissions?: string[];
}
