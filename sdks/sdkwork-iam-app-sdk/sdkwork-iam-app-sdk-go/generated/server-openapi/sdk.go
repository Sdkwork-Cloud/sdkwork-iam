package app

import (
    "github.com/sdkwork/sdkwork-iam-app-sdk/api"
    sdkhttp "github.com/sdkwork/sdkwork-iam-app-sdk/http"
)

type SdkworkAppClient struct {
    http *sdkhttp.Client
    Auth *api.AuthApi
    Iam *api.IamApi
    Oauth *api.OauthApi
    System *api.SystemApi
}

func NewSdkworkAppClient(baseURL string) *SdkworkAppClient {
    cfg := sdkhttp.NewDefaultConfig(baseURL)
    return NewSdkworkAppClientWithConfig(cfg)
}

func NewSdkworkAppClientWithConfig(config sdkhttp.Config) *SdkworkAppClient {
    client := sdkhttp.NewClient(config)
    return &SdkworkAppClient{
        http: client,
        Auth: api.NewAuthApi(client),
        Iam: api.NewIamApi(client),
        Oauth: api.NewOauthApi(client),
        System: api.NewSystemApi(client),
    }
}

func (c *SdkworkAppClient) SetAuthToken(token string) *SdkworkAppClient {
    c.http.SetAuthToken(token)
    return c
}

func (c *SdkworkAppClient) SetAccessToken(token string) *SdkworkAppClient {
    c.http.SetAccessToken(token)
    return c
}

func (c *SdkworkAppClient) SetHeader(key string, value string) *SdkworkAppClient {
    c.http.SetHeader(key, value)
    return c
}

func (c *SdkworkAppClient) Http() *sdkhttp.Client {
    return c.http
}
