package api

import (
    "encoding/json"
    "fmt"
    "net/url"
    "strings"
    sdktypes "github.com/sdkwork/sdkwork-iam-backend-sdk/types"
    sdkhttp "github.com/sdkwork/sdkwork-iam-backend-sdk/http"
)

type IamOauthApi struct {
    client *sdkhttp.Client
}

func NewIamOauthApi(client *sdkhttp.Client) *IamOauthApi {
    return &IamOauthApi{client: client}
}

// Iam oauth account Links list.
func (a *IamOauthApi) AccountLinksList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/account_links"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth account Links update.
func (a *IamOauthApi) AccountLinksUpdate(accountLinkId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/account_links/%s", SerializePathParameter(accountLinkId, PathParameterSpec{Name: "accountLinkId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth callback Events list.
func (a *IamOauthApi) CallbackEventsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/callback_events"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth claim Mappings list.
func (a *IamOauthApi) ClaimMappingsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/claim_mappings"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth claim Mappings create.
func (a *IamOauthApi) ClaimMappingsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/claim_mappings"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth claim Mappings update.
func (a *IamOauthApi) ClaimMappingsUpdate(mappingId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/claim_mappings/%s", SerializePathParameter(mappingId, PathParameterSpec{Name: "mappingId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth clients list.
func (a *IamOauthApi) ClientsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/clients"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth clients create.
func (a *IamOauthApi) ClientsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/clients"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth clients delete.
func (a *IamOauthApi) ClientsDelete(oauthClientId string) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Delete(BackendApiPath(fmt.Sprintf("/iam/oauth/clients/%s", SerializePathParameter(oauthClientId, PathParameterSpec{Name: "oauthClientId", Style: "simple", Explode: false}))), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth clients retrieve.
func (a *IamOauthApi) ClientsRetrieve(oauthClientId string) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Get(BackendApiPath(fmt.Sprintf("/iam/oauth/clients/%s", SerializePathParameter(oauthClientId, PathParameterSpec{Name: "oauthClientId", Style: "simple", Explode: false}))), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth clients update.
func (a *IamOauthApi) ClientsUpdate(oauthClientId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/clients/%s", SerializePathParameter(oauthClientId, PathParameterSpec{Name: "oauthClientId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth diagnostic Runs list.
func (a *IamOauthApi) DiagnosticRunsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/diagnostic_runs"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth diagnostic Runs create.
func (a *IamOauthApi) DiagnosticRunsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/diagnostic_runs"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth diagnostic Runs retrieve.
func (a *IamOauthApi) DiagnosticRunsRetrieve(diagnosticRunId string) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Get(BackendApiPath(fmt.Sprintf("/iam/oauth/diagnostic_runs/%s", SerializePathParameter(diagnosticRunId, PathParameterSpec{Name: "diagnosticRunId", Style: "simple", Explode: false}))), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth flow Configs list.
func (a *IamOauthApi) FlowConfigsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/flow_configs"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth flow Configs create.
func (a *IamOauthApi) FlowConfigsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/flow_configs"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth flow Configs update.
func (a *IamOauthApi) FlowConfigsUpdate(flowConfigId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/flow_configs/%s", SerializePathParameter(flowConfigId, PathParameterSpec{Name: "flowConfigId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth grants list.
func (a *IamOauthApi) GrantsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/grants"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth grants delete.
func (a *IamOauthApi) GrantsDelete(grantId string) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Delete(BackendApiPath(fmt.Sprintf("/iam/oauth/grants/%s", SerializePathParameter(grantId, PathParameterSpec{Name: "grantId", Style: "simple", Explode: false}))), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth integrations list.
func (a *IamOauthApi) IntegrationsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/integrations"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth integrations create.
func (a *IamOauthApi) IntegrationsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/integrations"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth integrations delete.
func (a *IamOauthApi) IntegrationsDelete(integrationId string) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Delete(BackendApiPath(fmt.Sprintf("/iam/oauth/integrations/%s", SerializePathParameter(integrationId, PathParameterSpec{Name: "integrationId", Style: "simple", Explode: false}))), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth integrations retrieve.
func (a *IamOauthApi) IntegrationsRetrieve(integrationId string) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Get(BackendApiPath(fmt.Sprintf("/iam/oauth/integrations/%s", SerializePathParameter(integrationId, PathParameterSpec{Name: "integrationId", Style: "simple", Explode: false}))), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth integrations update.
func (a *IamOauthApi) IntegrationsUpdate(integrationId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/integrations/%s", SerializePathParameter(integrationId, PathParameterSpec{Name: "integrationId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth operational Resources list.
func (a *IamOauthApi) OperationalResourcesList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/operational_resources"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth operational Resources create.
func (a *IamOauthApi) OperationalResourcesCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/operational_resources"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth operational Resources delete.
func (a *IamOauthApi) OperationalResourcesDelete(resourceId string) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Delete(BackendApiPath(fmt.Sprintf("/iam/oauth/operational_resources/%s", SerializePathParameter(resourceId, PathParameterSpec{Name: "resourceId", Style: "simple", Explode: false}))), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth operational Resources update.
func (a *IamOauthApi) OperationalResourcesUpdate(resourceId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/operational_resources/%s", SerializePathParameter(resourceId, PathParameterSpec{Name: "resourceId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth operational Resources publishes create.
func (a *IamOauthApi) OperationalResourcesPublishesCreate(resourceId string, body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath(fmt.Sprintf("/iam/oauth/operational_resources/%s/publishes", SerializePathParameter(resourceId, PathParameterSpec{Name: "resourceId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth operator Platforms list.
func (a *IamOauthApi) OperatorPlatformsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/operator_platforms"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth operator Platforms create.
func (a *IamOauthApi) OperatorPlatformsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/operator_platforms"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth operator Platforms update.
func (a *IamOauthApi) OperatorPlatformsUpdate(operatorPlatformId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/operator_platforms/%s", SerializePathParameter(operatorPlatformId, PathParameterSpec{Name: "operatorPlatformId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth operator Platforms pre Authorizations create.
func (a *IamOauthApi) OperatorPlatformsPreAuthorizationsCreate(operatorPlatformId string, body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath(fmt.Sprintf("/iam/oauth/operator_platforms/%s/pre_authorizations", SerializePathParameter(operatorPlatformId, PathParameterSpec{Name: "operatorPlatformId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth policies list.
func (a *IamOauthApi) PoliciesList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/policies"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth policies create.
func (a *IamOauthApi) PoliciesCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/policies"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth policies update.
func (a *IamOauthApi) PoliciesUpdate(policyId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/policies/%s", SerializePathParameter(policyId, PathParameterSpec{Name: "policyId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth provider Catalog list.
func (a *IamOauthApi) ProviderCatalogList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/provider_catalog"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth provider Catalog create.
func (a *IamOauthApi) ProviderCatalogCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/provider_catalog"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth provider Catalog retrieve.
func (a *IamOauthApi) ProviderCatalogRetrieve(providerCatalogId string) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Get(BackendApiPath(fmt.Sprintf("/iam/oauth/provider_catalog/%s", SerializePathParameter(providerCatalogId, PathParameterSpec{Name: "providerCatalogId", Style: "simple", Explode: false}))), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth provider Catalog update.
func (a *IamOauthApi) ProviderCatalogUpdate(providerCatalogId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/provider_catalog/%s", SerializePathParameter(providerCatalogId, PathParameterSpec{Name: "providerCatalogId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth resource Accounts list.
func (a *IamOauthApi) ResourceAccountsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/resource_accounts"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth resource Accounts create.
func (a *IamOauthApi) ResourceAccountsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/resource_accounts"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth resource Accounts update.
func (a *IamOauthApi) ResourceAccountsUpdate(resourceAccountId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/resource_accounts/%s", SerializePathParameter(resourceAccountId, PathParameterSpec{Name: "resourceAccountId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth resource Accounts authorization Refreshes create.
func (a *IamOauthApi) ResourceAccountsAuthorizationRefreshesCreate(resourceAccountId string, body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath(fmt.Sprintf("/iam/oauth/resource_accounts/%s/authorization_refreshes", SerializePathParameter(resourceAccountId, PathParameterSpec{Name: "resourceAccountId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth resource Accounts mini Program Login Checks create.
func (a *IamOauthApi) ResourceAccountsMiniProgramLoginChecksCreate(resourceAccountId string, body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath(fmt.Sprintf("/iam/oauth/resource_accounts/%s/mini_program_login_checks", SerializePathParameter(resourceAccountId, PathParameterSpec{Name: "resourceAccountId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth resource Accounts verifications create.
func (a *IamOauthApi) ResourceAccountsVerificationsCreate(resourceAccountId string, body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath(fmt.Sprintf("/iam/oauth/resource_accounts/%s/verifications", SerializePathParameter(resourceAccountId, PathParameterSpec{Name: "resourceAccountId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth resource Authorizations list.
func (a *IamOauthApi) ResourceAuthorizationsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/resource_authorizations"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth resource Authorizations create.
func (a *IamOauthApi) ResourceAuthorizationsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/resource_authorizations"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth resource Authorizations update.
func (a *IamOauthApi) ResourceAuthorizationsUpdate(authorizationId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/resource_authorizations/%s", SerializePathParameter(authorizationId, PathParameterSpec{Name: "authorizationId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth scope Profiles list.
func (a *IamOauthApi) ScopeProfilesList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/scope_profiles"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth scope Profiles create.
func (a *IamOauthApi) ScopeProfilesCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/scope_profiles"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth scope Profiles update.
func (a *IamOauthApi) ScopeProfilesUpdate(scopeProfileId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/scope_profiles/%s", SerializePathParameter(scopeProfileId, PathParameterSpec{Name: "scopeProfileId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth secrets list.
func (a *IamOauthApi) SecretsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/secrets"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth secrets create.
func (a *IamOauthApi) SecretsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/secrets"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth secrets delete.
func (a *IamOauthApi) SecretsDelete(secretId string) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Delete(BackendApiPath(fmt.Sprintf("/iam/oauth/secrets/%s", SerializePathParameter(secretId, PathParameterSpec{Name: "secretId", Style: "simple", Explode: false}))), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth surfaces list.
func (a *IamOauthApi) SurfacesList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/surfaces"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth surfaces create.
func (a *IamOauthApi) SurfacesCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/surfaces"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth surfaces delete.
func (a *IamOauthApi) SurfacesDelete(surfaceId string) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Delete(BackendApiPath(fmt.Sprintf("/iam/oauth/surfaces/%s", SerializePathParameter(surfaceId, PathParameterSpec{Name: "surfaceId", Style: "simple", Explode: false}))), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth surfaces update.
func (a *IamOauthApi) SurfacesUpdate(surfaceId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/surfaces/%s", SerializePathParameter(surfaceId, PathParameterSpec{Name: "surfaceId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth tenant Bindings list.
func (a *IamOauthApi) TenantBindingsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/tenant_bindings"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth tenant Bindings create.
func (a *IamOauthApi) TenantBindingsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/tenant_bindings"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth tenant Bindings update.
func (a *IamOauthApi) TenantBindingsUpdate(bindingId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/tenant_bindings/%s", SerializePathParameter(bindingId, PathParameterSpec{Name: "bindingId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth webhook Configs list.
func (a *IamOauthApi) WebhookConfigsList(page *int, pageSize *int, cursor *string, sort *string, q *string) (sdktypes.AppbaseApiResult, error) {
    query := BuildQueryString([]QueryParameterSpec{
        {Name: "page", Value: func() interface{} { if page == nil { return nil }; return *page }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "page_size", Value: func() interface{} { if pageSize == nil { return nil }; return *pageSize }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "cursor", Value: func() interface{} { if cursor == nil { return nil }; return *cursor }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "sort", Value: func() interface{} { if sort == nil { return nil }; return *sort }(), Style: "form", Explode: true, AllowReserved: false},
        {Name: "q", Value: func() interface{} { if q == nil { return nil }; return *q }(), Style: "form", Explode: true, AllowReserved: false},
    })
    raw, err := a.client.Get(AppendQueryString(BackendApiPath("/iam/oauth/webhook_configs"), query), nil, nil)
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth webhook Configs create.
func (a *IamOauthApi) WebhookConfigsCreate(body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath("/iam/oauth/webhook_configs"), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth webhook Configs update.
func (a *IamOauthApi) WebhookConfigsUpdate(webhookConfigId string, body *sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Patch(BackendApiPath(fmt.Sprintf("/iam/oauth/webhook_configs/%s", SerializePathParameter(webhookConfigId, PathParameterSpec{Name: "webhookConfigId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

// Iam oauth webhook Configs verifications create.
func (a *IamOauthApi) WebhookConfigsVerificationsCreate(webhookConfigId string, body sdktypes.AppbaseOperationCommand) (sdktypes.AppbaseApiResult, error) {
    raw, err := a.client.Post(BackendApiPath(fmt.Sprintf("/iam/oauth/webhook_configs/%s/verifications", SerializePathParameter(webhookConfigId, PathParameterSpec{Name: "webhookConfigId", Style: "simple", Explode: false}))), body, nil, nil, "application/json")
    if err != nil {
        var zero sdktypes.AppbaseApiResult
        return zero, err
    }
    return decodeResult[sdktypes.AppbaseApiResult](raw)
}

type PathParameterSpec struct {
    Name    string
    Style   string
    Explode bool
}

func SerializePathParameter(value interface{}, spec PathParameterSpec) string {
    if value == nil {
        return ""
    }
    style := spec.Style
    if style == "" {
        style = "simple"
    }

    switch typed := value.(type) {
    case []string:
        return SerializePathArray(spec.Name, stringSliceToInterface(typed), style, spec.Explode)
    case []int:
        return SerializePathArray(spec.Name, intSliceToInterface(typed), style, spec.Explode)
    case []interface{}:
        return SerializePathArray(spec.Name, typed, style, spec.Explode)
    case map[string]string:
        return SerializePathObject(spec.Name, stringMapToInterface(typed), style, spec.Explode)
    case map[string]int:
        return SerializePathObject(spec.Name, intMapToInterface(typed), style, spec.Explode)
    case map[string]interface{}:
        return SerializePathObject(spec.Name, typed, style, spec.Explode)
    default:
        return PathPrefix(spec.Name, style) + url.PathEscape(fmt.Sprint(value))
    }
}

func SerializePathArray(name string, values []interface{}, style string, explode bool) string {
    serialized := make([]string, 0, len(values))
    for _, item := range values {
        if item != nil {
            serialized = append(serialized, url.PathEscape(fmt.Sprint(item)))
        }
    }
    if len(serialized) == 0 {
        return PathPrefix(name, style)
    }
    if style == "matrix" {
        if explode {
            parts := make([]string, 0, len(serialized))
            for _, item := range serialized {
                parts = append(parts, ";"+name+"="+item)
            }
            return strings.Join(parts, "")
        }
        return ";" + name + "=" + strings.Join(serialized, ",")
    }
    separator := ","
    if explode {
        separator = "."
    }
    return PathPrefix(name, style) + strings.Join(serialized, separator)
}

func SerializePathObject(name string, values map[string]interface{}, style string, explode bool) string {
    entries := make([]string, 0, len(values)*2)
    exploded := make([]string, 0, len(values))
    for key, value := range values {
        if value == nil {
            continue
        }
        escapedKey := url.PathEscape(key)
        escapedValue := url.PathEscape(fmt.Sprint(value))
        if explode {
            if style == "matrix" {
                exploded = append(exploded, ";"+escapedKey+"="+escapedValue)
            } else {
                exploded = append(exploded, escapedKey+"="+escapedValue)
            }
        } else {
            entries = append(entries, escapedKey, escapedValue)
        }
    }
    if style == "matrix" {
        if explode {
            return strings.Join(exploded, "")
        }
        return ";" + name + "=" + strings.Join(entries, ",")
    }
    if explode {
        separator := ","
        if style == "label" {
            separator = "."
        }
        return PathPrefix(name, style) + strings.Join(exploded, separator)
    }
    return PathPrefix(name, style) + strings.Join(entries, ",")
}

func PathPrefix(name string, style string) string {
    if style == "label" {
        return "."
    }
    if style == "matrix" {
        return ";" + name
    }
    return ""
}
type QueryParameterSpec struct {
    Name          string
    Value         interface{}
    Style         string
    Explode       bool
    AllowReserved bool
    ContentType   string
}

func BuildQueryString(parameters []QueryParameterSpec) string {
    pairs := make([]string, 0)
    for _, parameter := range parameters {
        AppendSerializedParameter(&pairs, parameter)
    }
    return strings.Join(pairs, "&")
}

func AppendSerializedParameter(pairs *[]string, parameter QueryParameterSpec) {
    if parameter.Value == nil {
        return
    }

    if parameter.ContentType != "" {
        encoded, _ := json.Marshal(parameter.Value)
        *pairs = append(*pairs, url.QueryEscape(parameter.Name)+"="+EncodeQueryValue(string(encoded), parameter.AllowReserved))
        return
    }

    style := parameter.Style
    if style == "" {
        style = "form"
    }

    switch value := parameter.Value.(type) {
    case []string:
        AppendArrayParameter(pairs, parameter.Name, stringSliceToInterface(value), style, parameter.Explode, parameter.AllowReserved)
    case []int:
        AppendArrayParameter(pairs, parameter.Name, intSliceToInterface(value), style, parameter.Explode, parameter.AllowReserved)
    case []interface{}:
        AppendArrayParameter(pairs, parameter.Name, value, style, parameter.Explode, parameter.AllowReserved)
    case map[string]int:
        AppendObjectParameter(pairs, parameter.Name, intMapToInterface(value), style, parameter.Explode, parameter.AllowReserved)
    case map[string]string:
        AppendObjectParameter(pairs, parameter.Name, stringMapToInterface(value), style, parameter.Explode, parameter.AllowReserved)
    case map[string]interface{}:
        if style == "deepObject" {
            AppendDeepObjectParameter(pairs, parameter.Name, value, parameter.AllowReserved)
        } else {
            AppendObjectParameter(pairs, parameter.Name, value, style, parameter.Explode, parameter.AllowReserved)
        }
    default:
        *pairs = append(*pairs, url.QueryEscape(parameter.Name)+"="+EncodeQueryValue(fmt.Sprint(value), parameter.AllowReserved))
    }
}

func AppendArrayParameter(pairs *[]string, name string, value []interface{}, style string, explode bool, allowReserved bool) {
    values := make([]string, 0, len(value))
    for _, item := range value {
        if item != nil {
            values = append(values, fmt.Sprint(item))
        }
    }
    if len(values) == 0 {
        return
    }
    if style == "form" && explode {
        for _, item := range values {
            *pairs = append(*pairs, url.QueryEscape(name)+"="+EncodeQueryValue(item, allowReserved))
        }
        return
    }
    *pairs = append(*pairs, url.QueryEscape(name)+"="+EncodeQueryValue(strings.Join(values, ","), allowReserved))
}

func AppendObjectParameter(pairs *[]string, name string, value map[string]interface{}, style string, explode bool, allowReserved bool) {
    entries := make([]string, 0, len(value)*2)
    for key, item := range value {
        if item == nil {
            continue
        }
        if style == "form" && explode {
            *pairs = append(*pairs, url.QueryEscape(key)+"="+EncodeQueryValue(fmt.Sprint(item), allowReserved))
            continue
        }
        entries = append(entries, key, fmt.Sprint(item))
    }
    if len(entries) == 0 {
        return
    }
    if !(style == "form" && explode) {
        *pairs = append(*pairs, url.QueryEscape(name)+"="+EncodeQueryValue(strings.Join(entries, ","), allowReserved))
    }
}

func AppendDeepObjectParameter(pairs *[]string, name string, value map[string]interface{}, allowReserved bool) {
    for key, item := range value {
        if item == nil {
            continue
        }
        *pairs = append(*pairs, url.QueryEscape(fmt.Sprintf("%s[%s]", name, key))+"="+EncodeQueryValue(fmt.Sprint(item), allowReserved))
    }
}

func EncodeQueryValue(value string, allowReserved bool) string {
    encoded := url.QueryEscape(value)
    if !allowReserved {
        return encoded
    }
    replacements := map[string]string{
        "%3A": ":", "%2F": "/", "%3F": "?", "%23": "#",
        "%5B": "[", "%5D": "]", "%40": "@", "%21": "!",
        "%24": "$", "%26": "&", "%27": "'", "%28": "(",
        "%29": ")", "%2A": "*", "%2B": "+", "%2C": ",",
        "%3B": ";", "%3D": "=",
    }
    for escaped, reserved := range replacements {
        encoded = strings.ReplaceAll(encoded, escaped, reserved)
    }
    return encoded
}



func stringSliceToInterface(values []string) []interface{} {
    result := make([]interface{}, 0, len(values))
    for _, value := range values {
        result = append(result, value)
    }
    return result
}

func intSliceToInterface(values []int) []interface{} {
    result := make([]interface{}, 0, len(values))
    for _, value := range values {
        result = append(result, value)
    }
    return result
}

func stringMapToInterface(values map[string]string) map[string]interface{} {
    result := make(map[string]interface{}, len(values))
    for key, value := range values {
        result[key] = value
    }
    return result
}

func intMapToInterface(values map[string]int) map[string]interface{} {
    result := make(map[string]interface{}, len(values))
    for key, value := range values {
        result[key] = value
    }
    return result
}
