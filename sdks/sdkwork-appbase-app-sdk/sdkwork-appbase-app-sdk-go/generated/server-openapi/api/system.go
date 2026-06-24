package api

import (
    sdktypes "github.com/sdkwork/sdkwork-appbase-app-sdk/types"
    sdkhttp "github.com/sdkwork/sdkwork-appbase-app-sdk/http"
)

type SystemApi struct {
    client *sdkhttp.Client
}

func NewSystemApi(client *sdkhttp.Client) *SystemApi {
    return &SystemApi{client: client}
}

// Iam account Binding Policy retrieve.
func (a *SystemApi) IamAccountBindingPolicyRetrieve() (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Request("GET", AppApiPath("/system/iam/account_binding_policy"), nil, nil, nil, "", true)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam runtime retrieve.
func (a *SystemApi) IamRuntimeRetrieve() (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Request("GET", AppApiPath("/system/iam/runtime"), nil, nil, nil, "", true)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam verification Policy retrieve.
func (a *SystemApi) IamVerificationPolicyRetrieve() (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Request("GET", AppApiPath("/system/iam/verification_policy"), nil, nil, nil, "", true)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}
