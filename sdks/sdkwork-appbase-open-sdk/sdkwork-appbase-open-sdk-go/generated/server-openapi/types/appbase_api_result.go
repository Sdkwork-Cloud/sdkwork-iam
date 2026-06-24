package types


type AppbaseApiResult struct {
	Code string `json:"code"`
	Message string `json:"message"`
	RequestId string `json:"requestId"`
	Data map[string]interface{} `json:"data"`
}
