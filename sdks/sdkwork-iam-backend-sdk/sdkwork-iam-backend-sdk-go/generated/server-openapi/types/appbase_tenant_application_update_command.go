package types

// Update tenant application access and runtime configuration.
type AppbaseTenantApplicationUpdateCommand struct {
	AuthToken string `json:"authToken"`
	Username string `json:"username"`
	Email string `json:"email"`
	Phone string `json:"phone"`
	Password string `json:"password"`
	PrimaryDomain string `json:"primaryDomain"`
	DomainConfig map[string]interface{} `json:"domainConfig"`
	AccessPermissions []string `json:"accessPermissions"`
	RuntimeConfig map[string]interface{} `json:"runtimeConfig"`
}
