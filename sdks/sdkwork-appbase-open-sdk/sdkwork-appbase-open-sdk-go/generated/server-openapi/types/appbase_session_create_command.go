package types

// Session creation command for credential login and external user-center session exchange.
type AppbaseSessionCreateCommand struct {
	Email string `json:"email"`
	Username string `json:"username"`
	Phone string `json:"phone"`
	Password string `json:"password"`
	ExternalToken string `json:"externalToken"`
	ProviderKey string `json:"providerKey"`
	TenantId string `json:"tenantId"`
	OrganizationId string `json:"organizationId"`
}
