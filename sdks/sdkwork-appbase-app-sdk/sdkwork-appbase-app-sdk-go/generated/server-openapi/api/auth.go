package api

import (
    sdktypes "github.com/sdkwork/sdkwork-appbase-app-sdk/types"
    sdkhttp "github.com/sdkwork/sdkwork-appbase-app-sdk/http"
)

type AuthApi struct {
    client *sdkhttp.Client
}

func NewAuthApi(client *sdkhttp.Client) *AuthApi {
    return &AuthApi{client: client}
}

// Password Reset Requests create.
func (a *AuthApi) PasswordResetRequestsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Request("POST", AppApiPath("/auth/password_reset_requests"), body, nil, nil, "application/json", true)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Password Resets create.
func (a *AuthApi) PasswordResetsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Request("POST", AppApiPath("/auth/password_resets"), body, nil, nil, "application/json", true)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Registrations create.
func (a *AuthApi) RegistrationsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Request("POST", AppApiPath("/auth/registrations"), body, nil, nil, "application/json", true)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Sessions create.
func (a *AuthApi) SessionsCreate(body sdktypes.AppbaseSessionCreateCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Request("POST", AppApiPath("/auth/sessions"), body, nil, nil, "application/json", true)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Sessions current delete.
func (a *AuthApi) SessionsCurrentDelete() (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Delete(AppApiPath("/auth/sessions/current"), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Sessions current retrieve.
func (a *AuthApi) SessionsCurrentRetrieve() (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Get(AppApiPath("/auth/sessions/current"), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Sessions current update.
func (a *AuthApi) SessionsCurrentUpdate(body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(AppApiPath("/auth/sessions/current"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Sessions login Context Selection create.
func (a *AuthApi) SessionsLoginContextSelectionCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Request("POST", AppApiPath("/auth/sessions/login_context_selection"), body, nil, nil, "application/json", true)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Sessions organization Selection create.
func (a *AuthApi) SessionsOrganizationSelectionCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Request("POST", AppApiPath("/auth/sessions/organization_selection"), body, nil, nil, "application/json", true)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Sessions refresh.
func (a *AuthApi) SessionsRefresh(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Request("POST", AppApiPath("/auth/sessions/refresh"), body, nil, nil, "application/json", true)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}
