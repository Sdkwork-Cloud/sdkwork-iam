package types

// Provision a tenant application from a registered application template.
type AppbaseTenantApplicationProvisionCommand struct {
	AuthToken string `json:"authToken"`
	Username string `json:"username"`
	Email string `json:"email"`
	Phone string `json:"phone"`
	Password string `json:"password"`
	TenantId string `json:"tenantId"`
	OrganizationId string `json:"organizationId"`
	TemplateId string `json:"templateId"`
	AppKey string `json:"appKey"`
	InstanceKey string `json:"instanceKey"`
	DisplayName string `json:"displayName"`
	Environment string `json:"environment"`
	PrimaryDomain string `json:"primaryDomain"`
	AccessPermissions []string `json:"accessPermissions"`
	RuntimeConfig map[string]interface{} `json:"runtimeConfig"`
}
