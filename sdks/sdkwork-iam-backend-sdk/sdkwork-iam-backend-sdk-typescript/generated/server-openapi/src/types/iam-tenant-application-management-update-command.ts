/** Update operator-managed tenant application domain and access permissions. */
export interface IamTenantApplicationManagementUpdateCommand {
  primaryDomain?: string;
  accessPermissions?: string[];
}
