import Foundation

public class IamOauthApi {
    private let client: HttpClient
    
    public init(client: HttpClient) {
        self.client = client
    }

    /// Iam oauth account Links list.
    public func accountLinksList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/account_links"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth account Links update.
    public func accountLinksUpdate(accountLinkId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/account_links/\(serializePathParameter(accountLinkId, PathParameterSpec(name: "accountLinkId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth callback Events list.
    public func callbackEventsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/callback_events"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth claim Mappings list.
    public func claimMappingsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/claim_mappings"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth claim Mappings create.
    public func claimMappingsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/claim_mappings"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth claim Mappings update.
    public func claimMappingsUpdate(mappingId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/claim_mappings/\(serializePathParameter(mappingId, PathParameterSpec(name: "mappingId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth clients list.
    public func clientsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/clients"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth clients create.
    public func clientsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/clients"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth clients delete.
    public func clientsDelete(oauthClientId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/oauth/clients/\(serializePathParameter(oauthClientId, PathParameterSpec(name: "oauthClientId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth clients retrieve.
    public func clientsRetrieve(oauthClientId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/oauth/clients/\(serializePathParameter(oauthClientId, PathParameterSpec(name: "oauthClientId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth clients update.
    public func clientsUpdate(oauthClientId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/clients/\(serializePathParameter(oauthClientId, PathParameterSpec(name: "oauthClientId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth diagnostic Runs list.
    public func diagnosticRunsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/diagnostic_runs"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth diagnostic Runs create.
    public func diagnosticRunsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/diagnostic_runs"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth diagnostic Runs retrieve.
    public func diagnosticRunsRetrieve(diagnosticRunId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/oauth/diagnostic_runs/\(serializePathParameter(diagnosticRunId, PathParameterSpec(name: "diagnosticRunId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth flow Configs list.
    public func flowConfigsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/flow_configs"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth flow Configs create.
    public func flowConfigsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/flow_configs"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth flow Configs update.
    public func flowConfigsUpdate(flowConfigId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/flow_configs/\(serializePathParameter(flowConfigId, PathParameterSpec(name: "flowConfigId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth grants list.
    public func grantsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/grants"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth grants delete.
    public func grantsDelete(grantId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/oauth/grants/\(serializePathParameter(grantId, PathParameterSpec(name: "grantId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth integrations list.
    public func integrationsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/integrations"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth integrations create.
    public func integrationsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/integrations"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth integrations delete.
    public func integrationsDelete(integrationId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/oauth/integrations/\(serializePathParameter(integrationId, PathParameterSpec(name: "integrationId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth integrations retrieve.
    public func integrationsRetrieve(integrationId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/oauth/integrations/\(serializePathParameter(integrationId, PathParameterSpec(name: "integrationId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth integrations update.
    public func integrationsUpdate(integrationId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/integrations/\(serializePathParameter(integrationId, PathParameterSpec(name: "integrationId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth operational Resources list.
    public func operationalResourcesList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/operational_resources"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth operational Resources create.
    public func operationalResourcesCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/operational_resources"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth operational Resources delete.
    public func operationalResourcesDelete(resourceId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/oauth/operational_resources/\(serializePathParameter(resourceId, PathParameterSpec(name: "resourceId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth operational Resources update.
    public func operationalResourcesUpdate(resourceId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/operational_resources/\(serializePathParameter(resourceId, PathParameterSpec(name: "resourceId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth operational Resources publishes create.
    public func operationalResourcesPublishesCreate(resourceId: String, body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/operational_resources/\(serializePathParameter(resourceId, PathParameterSpec(name: "resourceId", style: "simple", explode: false)))/publishes"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth operator Platforms list.
    public func operatorPlatformsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/operator_platforms"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth operator Platforms create.
    public func operatorPlatformsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/operator_platforms"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth operator Platforms update.
    public func operatorPlatformsUpdate(operatorPlatformId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/operator_platforms/\(serializePathParameter(operatorPlatformId, PathParameterSpec(name: "operatorPlatformId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth operator Platforms pre Authorizations create.
    public func operatorPlatformsPreAuthorizationsCreate(operatorPlatformId: String, body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/operator_platforms/\(serializePathParameter(operatorPlatformId, PathParameterSpec(name: "operatorPlatformId", style: "simple", explode: false)))/pre_authorizations"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth policies list.
    public func policiesList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/policies"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth policies create.
    public func policiesCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/policies"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth policies update.
    public func policiesUpdate(policyId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/policies/\(serializePathParameter(policyId, PathParameterSpec(name: "policyId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth provider Catalog list.
    public func providerCatalogList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/provider_catalog"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth provider Catalog create.
    public func providerCatalogCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/provider_catalog"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth provider Catalog retrieve.
    public func providerCatalogRetrieve(providerCatalogId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/oauth/provider_catalog/\(serializePathParameter(providerCatalogId, PathParameterSpec(name: "providerCatalogId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth provider Catalog update.
    public func providerCatalogUpdate(providerCatalogId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/provider_catalog/\(serializePathParameter(providerCatalogId, PathParameterSpec(name: "providerCatalogId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth resource Accounts list.
    public func resourceAccountsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/resource_accounts"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth resource Accounts create.
    public func resourceAccountsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/resource_accounts"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth resource Accounts update.
    public func resourceAccountsUpdate(resourceAccountId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/resource_accounts/\(serializePathParameter(resourceAccountId, PathParameterSpec(name: "resourceAccountId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth resource Accounts authorization Refreshes create.
    public func resourceAccountsAuthorizationRefreshesCreate(resourceAccountId: String, body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/resource_accounts/\(serializePathParameter(resourceAccountId, PathParameterSpec(name: "resourceAccountId", style: "simple", explode: false)))/authorization_refreshes"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth resource Accounts mini Program Login Checks create.
    public func resourceAccountsMiniProgramLoginChecksCreate(resourceAccountId: String, body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/resource_accounts/\(serializePathParameter(resourceAccountId, PathParameterSpec(name: "resourceAccountId", style: "simple", explode: false)))/mini_program_login_checks"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth resource Accounts verifications create.
    public func resourceAccountsVerificationsCreate(resourceAccountId: String, body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/resource_accounts/\(serializePathParameter(resourceAccountId, PathParameterSpec(name: "resourceAccountId", style: "simple", explode: false)))/verifications"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth resource Authorizations list.
    public func resourceAuthorizationsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/resource_authorizations"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth resource Authorizations create.
    public func resourceAuthorizationsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/resource_authorizations"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth resource Authorizations update.
    public func resourceAuthorizationsUpdate(authorizationId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/resource_authorizations/\(serializePathParameter(authorizationId, PathParameterSpec(name: "authorizationId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth scope Profiles list.
    public func scopeProfilesList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/scope_profiles"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth scope Profiles create.
    public func scopeProfilesCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/scope_profiles"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth scope Profiles update.
    public func scopeProfilesUpdate(scopeProfileId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/scope_profiles/\(serializePathParameter(scopeProfileId, PathParameterSpec(name: "scopeProfileId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth secrets list.
    public func secretsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/secrets"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth secrets create.
    public func secretsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/secrets"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth secrets delete.
    public func secretsDelete(secretId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/oauth/secrets/\(serializePathParameter(secretId, PathParameterSpec(name: "secretId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth surfaces list.
    public func surfacesList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/surfaces"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth surfaces create.
    public func surfacesCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/surfaces"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth surfaces delete.
    public func surfacesDelete(surfaceId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/oauth/surfaces/\(serializePathParameter(surfaceId, PathParameterSpec(name: "surfaceId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth surfaces update.
    public func surfacesUpdate(surfaceId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/surfaces/\(serializePathParameter(surfaceId, PathParameterSpec(name: "surfaceId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth tenant Bindings list.
    public func tenantBindingsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/tenant_bindings"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth tenant Bindings create.
    public func tenantBindingsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/tenant_bindings"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth tenant Bindings update.
    public func tenantBindingsUpdate(bindingId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/tenant_bindings/\(serializePathParameter(bindingId, PathParameterSpec(name: "bindingId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth webhook Configs list.
    public func webhookConfigsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/webhook_configs"), query), responseType: AppbaseApiResult.self)
    }

    /// Iam oauth webhook Configs create.
    public func webhookConfigsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/webhook_configs"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth webhook Configs update.
    public func webhookConfigsUpdate(webhookConfigId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/oauth/webhook_configs/\(serializePathParameter(webhookConfigId, PathParameterSpec(name: "webhookConfigId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Iam oauth webhook Configs verifications create.
    public func webhookConfigsVerificationsCreate(webhookConfigId: String, body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/oauth/webhook_configs/\(serializePathParameter(webhookConfigId, PathParameterSpec(name: "webhookConfigId", style: "simple", explode: false)))/verifications"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    private struct PathParameterSpec {
        let name: String
        let style: String
        let explode: Bool
    }

    private func serializePathParameter(_ value: Any?, _ spec: PathParameterSpec) -> String {
        guard let value else { return "" }
        let style = spec.style.isEmpty ? "simple" : spec.style
        if let array = value as? [Any] {
            return serializePathArray(spec.name, array, style, spec.explode)
        }
        if let object = value as? [String: Any] {
            return serializePathObject(spec.name, object, style, spec.explode)
        }
        return pathPrimitivePrefix(spec.name, style) + pathEncode(String(describing: value))
    }

    private func serializePathArray(_ name: String, _ values: [Any], _ style: String, _ explode: Bool) -> String {
        let serialized = values.map { pathEncode(String(describing: $0)) }
        if serialized.isEmpty { return pathPrefix(name, style) }
        if style == "matrix" {
            if explode {
                return serialized.map { ";\(name)=\($0)" }.joined()
            }
            return ";\(name)=" + serialized.joined(separator: ",")
        }
        let separator = explode ? "." : ","
        return pathPrefix(name, style) + serialized.joined(separator: separator)
    }

    private func serializePathObject(_ name: String, _ values: [String: Any], _ style: String, _ explode: Bool) -> String {
        var entries: [String] = []
        var exploded: [String] = []
        for (key, value) in values {
            let escapedKey = pathEncode(key)
            let escapedValue = pathEncode(String(describing: value))
            if explode {
                if style == "matrix" {
                    exploded.append(";\(escapedKey)=\(escapedValue)")
                } else {
                    exploded.append("\(escapedKey)=\(escapedValue)")
                }
            } else {
                entries.append(escapedKey)
                entries.append(escapedValue)
            }
        }
        if style == "matrix" {
            if explode {
                return exploded.joined()
            }
            return ";\(name)=" + entries.joined(separator: ",")
        }
        if explode {
            let separator = style == "label" ? "." : ","
            return pathPrefix(name, style) + exploded.joined(separator: separator)
        }
        return pathPrefix(name, style) + entries.joined(separator: ",")
    }

    private func pathPrefix(_ name: String, _ style: String) -> String {
        if style == "label" { return "." }
        if style == "matrix" { return ";\(name)" }
        return ""
    }

    private func pathPrimitivePrefix(_ name: String, _ style: String) -> String {
        style == "matrix" ? ";\(name)=" : pathPrefix(name, style)
    }

    private func pathEncode(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? value
    }

    private struct QueryParameterSpec {
        let name: String
        let value: Any?
        let style: String
        let explode: Bool
        let allowReserved: Bool
        let contentType: String?
    }

    private func buildQueryString(_ parameters: [QueryParameterSpec]) -> String {
        var pairs: [String] = []
        for parameter in parameters {
            appendSerializedParameter(&pairs, parameter)
        }
        return pairs.joined(separator: "&")
    }

    private func appendSerializedParameter(_ pairs: inout [String], _ parameter: QueryParameterSpec) {
        guard let value = parameter.value else { return }
        if let contentType = parameter.contentType, !contentType.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            let data = (try? JSONSerialization.data(withJSONObject: value, options: [])) ?? Data(String(describing: value).utf8)
            let json = String(data: data, encoding: .utf8) ?? String(describing: value)
            pairs.append("\(urlEncode(parameter.name))=\(encodeQueryValue(json, allowReserved: parameter.allowReserved))")
            return
        }

        let style = parameter.style.isEmpty ? "form" : parameter.style
        if style == "deepObject", let object = value as? [String: Any] {
            appendDeepObjectParameter(&pairs, name: parameter.name, values: object, allowReserved: parameter.allowReserved)
        } else if let array = value as? [Any] {
            appendArrayParameter(&pairs, name: parameter.name, values: array, style: style, explode: parameter.explode, allowReserved: parameter.allowReserved)
        } else if let object = value as? [String: Any] {
            appendObjectParameter(&pairs, name: parameter.name, values: object, style: style, explode: parameter.explode, allowReserved: parameter.allowReserved)
        } else {
            pairs.append("\(urlEncode(parameter.name))=\(encodeQueryValue(String(describing: value), allowReserved: parameter.allowReserved))")
        }
    }

    private func appendArrayParameter(
        _ pairs: inout [String],
        name: String,
        values: [Any],
        style: String,
        explode: Bool,
        allowReserved: Bool
    ) {
        let serialized = values.map { String(describing: $0) }
        guard !serialized.isEmpty else { return }
        if style == "form" && explode {
            for item in serialized {
                pairs.append("\(urlEncode(name))=\(encodeQueryValue(item, allowReserved: allowReserved))")
            }
            return
        }
        pairs.append("\(urlEncode(name))=\(encodeQueryValue(serialized.joined(separator: ","), allowReserved: allowReserved))")
    }

    private func appendObjectParameter(
        _ pairs: inout [String],
        name: String,
        values: [String: Any],
        style: String,
        explode: Bool,
        allowReserved: Bool
    ) {
        var serialized: [String] = []
        for (key, value) in values {
            if style == "form" && explode {
                pairs.append("\(urlEncode(key))=\(encodeQueryValue(String(describing: value), allowReserved: allowReserved))")
            } else {
                serialized.append(key)
                serialized.append(String(describing: value))
            }
        }
        if !serialized.isEmpty {
            pairs.append("\(urlEncode(name))=\(encodeQueryValue(serialized.joined(separator: ","), allowReserved: allowReserved))")
        }
    }

    private func appendDeepObjectParameter(_ pairs: inout [String], name: String, values: [String: Any], allowReserved: Bool) {
        for (key, value) in values {
            pairs.append("\(urlEncode("\(name)[\(key)]"))=\(encodeQueryValue(String(describing: value), allowReserved: allowReserved))")
        }
    }

    private func encodeQueryValue(_ value: String, allowReserved: Bool) -> String {
        var encoded = urlEncode(value)
        if !allowReserved { return encoded }
        [
            "%3A": ":", "%2F": "/", "%3F": "?", "%23": "#",
            "%5B": "[", "%5D": "]", "%40": "@", "%21": "!",
            "%24": "$", "%26": "&", "%27": "'", "%28": "(",
            "%29": ")", "%2A": "*", "%2B": "+", "%2C": ",",
            "%3B": ";", "%3D": "=",
        ].forEach { encoded = encoded.replacingOccurrences(of: $0.key, with: $0.value) }
        return encoded
    }

    private func urlEncode(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value
    }

}
