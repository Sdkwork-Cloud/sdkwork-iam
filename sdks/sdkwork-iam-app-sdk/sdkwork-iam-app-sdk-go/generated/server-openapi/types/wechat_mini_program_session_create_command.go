package types

// One-time WeChat Mini Program login-code exchange command.
type WechatMiniProgramSessionCreateCommand struct {
	JsCode string `json:"jsCode"`
	ProviderCode string `json:"providerCode"`
	SurfaceCode string `json:"surfaceCode"`
}
