package com.sdkwork.iam.backend.sdk.api

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.sdkwork.iam.backend.sdk.*
import com.sdkwork.iam.backend.sdk.http.HttpClient

class IamOauthApi(private val client: HttpClient) {

    /** Iam oauth account Links list. */
    suspend fun accountLinksList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/account_links"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth account Links update. */
    suspend fun accountLinksUpdate(accountLinkId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/account_links/${serializePathParameter(accountLinkId, PathParameterSpec("accountLinkId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth callback Events list. */
    suspend fun callbackEventsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/callback_events"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth claim Mappings list. */
    suspend fun claimMappingsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/claim_mappings"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth claim Mappings create. */
    suspend fun claimMappingsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/claim_mappings"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth claim Mappings update. */
    suspend fun claimMappingsUpdate(mappingId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/claim_mappings/${serializePathParameter(mappingId, PathParameterSpec("mappingId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth clients list. */
    suspend fun clientsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/clients"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth clients create. */
    suspend fun clientsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/clients"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth clients delete. */
    suspend fun clientsDelete(oauthClientId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/oauth/clients/${serializePathParameter(oauthClientId, PathParameterSpec("oauthClientId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth clients retrieve. */
    suspend fun clientsRetrieve(oauthClientId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/oauth/clients/${serializePathParameter(oauthClientId, PathParameterSpec("oauthClientId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth clients update. */
    suspend fun clientsUpdate(oauthClientId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/clients/${serializePathParameter(oauthClientId, PathParameterSpec("oauthClientId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth diagnostic Runs list. */
    suspend fun diagnosticRunsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/diagnostic_runs"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth diagnostic Runs create. */
    suspend fun diagnosticRunsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/diagnostic_runs"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth diagnostic Runs retrieve. */
    suspend fun diagnosticRunsRetrieve(diagnosticRunId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/oauth/diagnostic_runs/${serializePathParameter(diagnosticRunId, PathParameterSpec("diagnosticRunId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth flow Configs list. */
    suspend fun flowConfigsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/flow_configs"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth flow Configs create. */
    suspend fun flowConfigsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/flow_configs"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth flow Configs update. */
    suspend fun flowConfigsUpdate(flowConfigId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/flow_configs/${serializePathParameter(flowConfigId, PathParameterSpec("flowConfigId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth grants list. */
    suspend fun grantsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/grants"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth grants delete. */
    suspend fun grantsDelete(grantId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/oauth/grants/${serializePathParameter(grantId, PathParameterSpec("grantId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth integrations list. */
    suspend fun integrationsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/integrations"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth integrations create. */
    suspend fun integrationsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/integrations"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth integrations delete. */
    suspend fun integrationsDelete(integrationId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/oauth/integrations/${serializePathParameter(integrationId, PathParameterSpec("integrationId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth integrations retrieve. */
    suspend fun integrationsRetrieve(integrationId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/oauth/integrations/${serializePathParameter(integrationId, PathParameterSpec("integrationId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth integrations update. */
    suspend fun integrationsUpdate(integrationId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/integrations/${serializePathParameter(integrationId, PathParameterSpec("integrationId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth operational Resources list. */
    suspend fun operationalResourcesList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/operational_resources"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth operational Resources create. */
    suspend fun operationalResourcesCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/operational_resources"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth operational Resources delete. */
    suspend fun operationalResourcesDelete(resourceId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/oauth/operational_resources/${serializePathParameter(resourceId, PathParameterSpec("resourceId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth operational Resources update. */
    suspend fun operationalResourcesUpdate(resourceId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/operational_resources/${serializePathParameter(resourceId, PathParameterSpec("resourceId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth operational Resources publishes create. */
    suspend fun operationalResourcesPublishesCreate(resourceId: String, body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/operational_resources/${serializePathParameter(resourceId, PathParameterSpec("resourceId", "simple", false))}/publishes"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth operator Platforms list. */
    suspend fun operatorPlatformsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/operator_platforms"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth operator Platforms create. */
    suspend fun operatorPlatformsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/operator_platforms"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth operator Platforms update. */
    suspend fun operatorPlatformsUpdate(operatorPlatformId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/operator_platforms/${serializePathParameter(operatorPlatformId, PathParameterSpec("operatorPlatformId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth operator Platforms pre Authorizations create. */
    suspend fun operatorPlatformsPreAuthorizationsCreate(operatorPlatformId: String, body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/operator_platforms/${serializePathParameter(operatorPlatformId, PathParameterSpec("operatorPlatformId", "simple", false))}/pre_authorizations"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth policies list. */
    suspend fun policiesList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/policies"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth policies create. */
    suspend fun policiesCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/policies"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth policies update. */
    suspend fun policiesUpdate(policyId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/policies/${serializePathParameter(policyId, PathParameterSpec("policyId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth provider Catalog list. */
    suspend fun providerCatalogList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/provider_catalog"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth provider Catalog create. */
    suspend fun providerCatalogCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/provider_catalog"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth provider Catalog retrieve. */
    suspend fun providerCatalogRetrieve(providerCatalogId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/oauth/provider_catalog/${serializePathParameter(providerCatalogId, PathParameterSpec("providerCatalogId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth provider Catalog update. */
    suspend fun providerCatalogUpdate(providerCatalogId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/provider_catalog/${serializePathParameter(providerCatalogId, PathParameterSpec("providerCatalogId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth resource Accounts list. */
    suspend fun resourceAccountsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/resource_accounts"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth resource Accounts create. */
    suspend fun resourceAccountsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/resource_accounts"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth resource Accounts update. */
    suspend fun resourceAccountsUpdate(resourceAccountId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, PathParameterSpec("resourceAccountId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth resource Accounts authorization Refreshes create. */
    suspend fun resourceAccountsAuthorizationRefreshesCreate(resourceAccountId: String, body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, PathParameterSpec("resourceAccountId", "simple", false))}/authorization_refreshes"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth resource Accounts mini Program Login Checks create. */
    suspend fun resourceAccountsMiniProgramLoginChecksCreate(resourceAccountId: String, body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, PathParameterSpec("resourceAccountId", "simple", false))}/mini_program_login_checks"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth resource Accounts verifications create. */
    suspend fun resourceAccountsVerificationsCreate(resourceAccountId: String, body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, PathParameterSpec("resourceAccountId", "simple", false))}/verifications"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth resource Authorizations list. */
    suspend fun resourceAuthorizationsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/resource_authorizations"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth resource Authorizations create. */
    suspend fun resourceAuthorizationsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/resource_authorizations"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth resource Authorizations update. */
    suspend fun resourceAuthorizationsUpdate(authorizationId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/resource_authorizations/${serializePathParameter(authorizationId, PathParameterSpec("authorizationId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth scope Profiles list. */
    suspend fun scopeProfilesList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/scope_profiles"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth scope Profiles create. */
    suspend fun scopeProfilesCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/scope_profiles"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth scope Profiles update. */
    suspend fun scopeProfilesUpdate(scopeProfileId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/scope_profiles/${serializePathParameter(scopeProfileId, PathParameterSpec("scopeProfileId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth secrets list. */
    suspend fun secretsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/secrets"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth secrets create. */
    suspend fun secretsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/secrets"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth secrets delete. */
    suspend fun secretsDelete(secretId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/oauth/secrets/${serializePathParameter(secretId, PathParameterSpec("secretId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth surfaces list. */
    suspend fun surfacesList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/surfaces"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth surfaces create. */
    suspend fun surfacesCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/surfaces"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth surfaces delete. */
    suspend fun surfacesDelete(surfaceId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/oauth/surfaces/${serializePathParameter(surfaceId, PathParameterSpec("surfaceId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth surfaces update. */
    suspend fun surfacesUpdate(surfaceId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/surfaces/${serializePathParameter(surfaceId, PathParameterSpec("surfaceId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth tenant Bindings list. */
    suspend fun tenantBindingsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/tenant_bindings"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth tenant Bindings create. */
    suspend fun tenantBindingsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/tenant_bindings"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth tenant Bindings update. */
    suspend fun tenantBindingsUpdate(bindingId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/tenant_bindings/${serializePathParameter(bindingId, PathParameterSpec("bindingId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth webhook Configs list. */
    suspend fun webhookConfigsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/webhook_configs"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth webhook Configs create. */
    suspend fun webhookConfigsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/webhook_configs"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth webhook Configs update. */
    suspend fun webhookConfigsUpdate(webhookConfigId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/oauth/webhook_configs/${serializePathParameter(webhookConfigId, PathParameterSpec("webhookConfigId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam oauth webhook Configs verifications create. */
    suspend fun webhookConfigsVerificationsCreate(webhookConfigId: String, body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/oauth/webhook_configs/${serializePathParameter(webhookConfigId, PathParameterSpec("webhookConfigId", "simple", false))}/verifications"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    private data class PathParameterSpec(val name: String, val style: String, val explode: Boolean)

    private fun serializePathParameter(value: Any?, spec: PathParameterSpec): String {
        if (value == null) return ""
        val style = spec.style.ifBlank { "simple" }
        return when (value) {
            is Iterable<*> -> serializePathArray(spec.name, value, style, spec.explode)
            is Map<*, *> -> serializePathObject(spec.name, value, style, spec.explode)
            else -> pathPrimitivePrefix(spec.name, style) + pathEncode(value.toString())
        }
    }

    private fun serializePathArray(name: String, values: Iterable<*>, style: String, explode: Boolean): String {
        val serialized = values.mapNotNull { it?.toString()?.let(::pathEncode) }
        if (serialized.isEmpty()) return pathPrefix(name, style)
        if (style == "matrix") {
            if (explode) {
                return serialized.joinToString("") { ";$name=$it" }
            }
            return ";$name=" + serialized.joinToString(",")
        }
        val separator = if (explode) "." else ","
        return pathPrefix(name, style) + serialized.joinToString(separator)
    }

    private fun serializePathObject(name: String, values: Map<*, *>, style: String, explode: Boolean): String {
        val entries = mutableListOf<String>()
        val exploded = mutableListOf<String>()
        values.forEach { (key, value) ->
            if (value == null) return@forEach
            val escapedKey = pathEncode(key.toString())
            val escapedValue = pathEncode(value.toString())
            if (explode) {
                if (style == "matrix") {
                    exploded += ";$escapedKey=$escapedValue"
                } else {
                    exploded += "$escapedKey=$escapedValue"
                }
            } else {
                entries += escapedKey
                entries += escapedValue
            }
        }
        if (style == "matrix") {
            if (explode) return exploded.joinToString("")
            return ";$name=" + entries.joinToString(",")
        }
        if (explode) {
            val separator = if (style == "label") "." else ","
            return pathPrefix(name, style) + exploded.joinToString(separator)
        }
        return pathPrefix(name, style) + entries.joinToString(",")
    }

    private fun pathPrefix(name: String, style: String): String {
        return when (style) {
            "label" -> "."
            "matrix" -> ";$name"
            else -> ""
        }
    }

    private fun pathPrimitivePrefix(name: String, style: String): String {
        return if (style == "matrix") ";$name=" else pathPrefix(name, style)
    }

    private fun pathEncode(value: String): String {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20")
    }

    private data class QueryParameterSpec(
        val name: String,
        val value: Any?,
        val style: String,
        val explode: Boolean,
        val allowReserved: Boolean,
        val contentType: String?,
    )

    private val queryObjectMapper = ObjectMapper().registerKotlinModule()

    private fun buildQueryString(parameters: List<QueryParameterSpec>): String {
        val pairs = mutableListOf<String>()
        parameters.forEach { appendSerializedParameter(pairs, it) }
        return pairs.joinToString("&")
    }

    private fun appendSerializedParameter(pairs: MutableList<String>, parameter: QueryParameterSpec) {
        val value = parameter.value ?: return
        if (!parameter.contentType.isNullOrBlank()) {
            val json = queryObjectMapper.writeValueAsString(value)
            pairs += urlEncode(parameter.name) + "=" + encodeQueryValue(json, parameter.allowReserved)
            return
        }

        val style = parameter.style.ifBlank { "form" }
        when (value) {
            is Iterable<*> -> appendArrayParameter(pairs, parameter.name, value, style, parameter.explode, parameter.allowReserved)
            is Map<*, *> -> if (style == "deepObject") {
                appendDeepObjectParameter(pairs, parameter.name, value, parameter.allowReserved)
            } else {
                appendObjectParameter(pairs, parameter.name, value, style, parameter.explode, parameter.allowReserved)
            }
            else -> pairs += urlEncode(parameter.name) + "=" + encodeQueryValue(value.toString(), parameter.allowReserved)
        }
    }

    private fun appendArrayParameter(
        pairs: MutableList<String>,
        name: String,
        values: Iterable<*>,
        style: String,
        explode: Boolean,
        allowReserved: Boolean,
    ) {
        val serialized = values.mapNotNull { it?.toString() }
        if (serialized.isEmpty()) return
        if (style == "form" && explode) {
            serialized.forEach { pairs += urlEncode(name) + "=" + encodeQueryValue(it, allowReserved) }
            return
        }
        pairs += urlEncode(name) + "=" + encodeQueryValue(serialized.joinToString(","), allowReserved)
    }

    private fun appendObjectParameter(
        pairs: MutableList<String>,
        name: String,
        values: Map<*, *>,
        style: String,
        explode: Boolean,
        allowReserved: Boolean,
    ) {
        val serialized = mutableListOf<String>()
        values.forEach { (key, value) ->
            if (value == null) return@forEach
            if (style == "form" && explode) {
                pairs += urlEncode(key.toString()) + "=" + encodeQueryValue(value.toString(), allowReserved)
            } else {
                serialized += key.toString()
                serialized += value.toString()
            }
        }
        if (serialized.isNotEmpty()) {
            pairs += urlEncode(name) + "=" + encodeQueryValue(serialized.joinToString(","), allowReserved)
        }
    }

    private fun appendDeepObjectParameter(pairs: MutableList<String>, name: String, values: Map<*, *>, allowReserved: Boolean) {
        values.forEach { (key, value) ->
            if (value != null) {
                pairs += urlEncode("$name[$key]") + "=" + encodeQueryValue(value.toString(), allowReserved)
            }
        }
    }

    private fun encodeQueryValue(value: String, allowReserved: Boolean): String {
        var encoded = urlEncode(value)
        if (!allowReserved) return encoded
        mapOf(
            "%3A" to ":", "%2F" to "/", "%3F" to "?", "%23" to "#",
            "%5B" to "[", "%5D" to "]", "%40" to "@", "%21" to "!",
            "%24" to "$", "%26" to "&", "%27" to "'", "%28" to "(",
            "%29" to ")", "%2A" to "*", "%2B" to "+", "%2C" to ",",
            "%3B" to ";", "%3D" to "=",
        ).forEach { (escaped, reserved) -> encoded = encoded.replace(escaped, reserved) }
        return encoded
    }

    private fun urlEncode(value: String): String {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8)
    }

}
