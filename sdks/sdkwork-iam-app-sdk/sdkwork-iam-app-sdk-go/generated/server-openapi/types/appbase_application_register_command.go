package types

// Super-admin registered application command for startup bootstrap.
type AppbaseApplicationRegisterCommand struct {
	AuthToken string `json:"authToken"`
	Username string `json:"username"`
	Email string `json:"email"`
	Phone string `json:"phone"`
	Password string `json:"password"`
	OwnerTenantId string `json:"ownerTenantId"`
	AppKey string `json:"appKey"`
	Name string `json:"name"`
	DisplayName string `json:"displayName"`
	AppType string `json:"appType"`
	PackageName string `json:"packageName"`
	BundleId string `json:"bundleId"`
	DesktopAppId string `json:"desktopAppId"`
	Version string `json:"version"`
	Channel string `json:"channel"`
	ManifestHash string `json:"manifestHash"`
	DefaultAccessPermissions []string `json:"defaultAccessPermissions"`
	Config map[string]interface{} `json:"config"`
	Packages []map[string]interface{} `json:"packages"`
}
