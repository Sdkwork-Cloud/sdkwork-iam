package types

// Issue a delegated access credential for an enabled tenant application.
type AppbaseAccessCredentialCreateCommand struct {
	AuthToken string `json:"authToken"`
	Username string `json:"username"`
	Email string `json:"email"`
	Phone string `json:"phone"`
	Password string `json:"password"`
	TenantId string `json:"tenantId"`
	OrganizationId string `json:"organizationId"`
	TenantApplicationId string `json:"tenantApplicationId"`
	AppId string `json:"appId"`
	InstanceKey string `json:"instanceKey"`
}
