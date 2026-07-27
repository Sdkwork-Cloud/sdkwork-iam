package api

import (
    sdktypes "github.com/sdkwork/sdkwork-iam-app-sdk/types"
    sdkhttp "github.com/sdkwork/sdkwork-iam-app-sdk/http"
)

type SystemApi struct {
    client *sdkhttp.Client
}

func NewSystemApi(client *sdkhttp.Client) *SystemApi {
    return &SystemApi{client: client}
}

// Iam account Binding Policy retrieve.
func (a *SystemApi) IamAccountBindingPolicyRetrieve() (sdktypes.SdkWorkResourceResponse, error) {
    raw, err := a.client.Request("GET", AppApiPath("/system/iam/account_binding_policy"), nil, nil, nil, "", false, true)
    if err != nil {
        var zero sdktypes.SdkWorkResourceResponse
        return zero, err
    }
    return decodeResult[sdktypes.SdkWorkResourceResponse](raw)
}

// Iam runtime retrieve.
func (a *SystemApi) IamRuntimeRetrieve() (sdktypes.SdkWorkResourceResponse, error) {
    raw, err := a.client.Request("GET", AppApiPath("/system/iam/runtime"), nil, nil, nil, "", false, true)
    if err != nil {
        var zero sdktypes.SdkWorkResourceResponse
        return zero, err
    }
    return decodeResult[sdktypes.SdkWorkResourceResponse](raw)
}

// Iam verification Policy retrieve.
func (a *SystemApi) IamVerificationPolicyRetrieve() (sdktypes.SdkWorkResourceResponse, error) {
    raw, err := a.client.Request("GET", AppApiPath("/system/iam/verification_policy"), nil, nil, nil, "", false, true)
    if err != nil {
        var zero sdktypes.SdkWorkResourceResponse
        return zero, err
    }
    return decodeResult[sdktypes.SdkWorkResourceResponse](raw)
}
