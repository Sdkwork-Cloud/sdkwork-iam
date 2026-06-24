package com.sdkwork.iam.backend.sdk.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.sdkwork.iam.backend.sdk.http.HttpClient;
import com.sdkwork.iam.backend.sdk.model.*;
import java.util.List;
import java.util.Map;

public class IamOauthApi {
    private final HttpClient client;

    public IamOauthApi(HttpClient client) {
        this.client = client;
    }

    /** Iam oauth account Links list. */
    public AppbaseApiResult accountLinksList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/account_links"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth account Links update. */
    public AppbaseApiResult accountLinksUpdate(String accountLinkId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/account_links/" + serializePathParameter(accountLinkId, new PathParameterSpec("accountLinkId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth callback Events list. */
    public AppbaseApiResult callbackEventsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/callback_events"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth claim Mappings list. */
    public AppbaseApiResult claimMappingsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/claim_mappings"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth claim Mappings create. */
    public AppbaseApiResult claimMappingsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/claim_mappings"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth claim Mappings update. */
    public AppbaseApiResult claimMappingsUpdate(String mappingId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/claim_mappings/" + serializePathParameter(mappingId, new PathParameterSpec("mappingId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth clients list. */
    public AppbaseApiResult clientsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/clients"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth clients create. */
    public AppbaseApiResult clientsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/clients"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth clients delete. */
    public AppbaseApiResult clientsDelete(String oauthClientId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/oauth/clients/" + serializePathParameter(oauthClientId, new PathParameterSpec("oauthClientId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth clients retrieve. */
    public AppbaseApiResult clientsRetrieve(String oauthClientId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/oauth/clients/" + serializePathParameter(oauthClientId, new PathParameterSpec("oauthClientId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth clients update. */
    public AppbaseApiResult clientsUpdate(String oauthClientId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/clients/" + serializePathParameter(oauthClientId, new PathParameterSpec("oauthClientId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth diagnostic Runs list. */
    public AppbaseApiResult diagnosticRunsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/diagnostic_runs"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth diagnostic Runs create. */
    public AppbaseApiResult diagnosticRunsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/diagnostic_runs"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth diagnostic Runs retrieve. */
    public AppbaseApiResult diagnosticRunsRetrieve(String diagnosticRunId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/oauth/diagnostic_runs/" + serializePathParameter(diagnosticRunId, new PathParameterSpec("diagnosticRunId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth flow Configs list. */
    public AppbaseApiResult flowConfigsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/flow_configs"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth flow Configs create. */
    public AppbaseApiResult flowConfigsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/flow_configs"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth flow Configs update. */
    public AppbaseApiResult flowConfigsUpdate(String flowConfigId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/flow_configs/" + serializePathParameter(flowConfigId, new PathParameterSpec("flowConfigId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth grants list. */
    public AppbaseApiResult grantsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/grants"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth grants delete. */
    public AppbaseApiResult grantsDelete(String grantId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/oauth/grants/" + serializePathParameter(grantId, new PathParameterSpec("grantId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth integrations list. */
    public AppbaseApiResult integrationsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/integrations"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth integrations create. */
    public AppbaseApiResult integrationsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/integrations"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth integrations delete. */
    public AppbaseApiResult integrationsDelete(String integrationId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/oauth/integrations/" + serializePathParameter(integrationId, new PathParameterSpec("integrationId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth integrations retrieve. */
    public AppbaseApiResult integrationsRetrieve(String integrationId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/oauth/integrations/" + serializePathParameter(integrationId, new PathParameterSpec("integrationId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth integrations update. */
    public AppbaseApiResult integrationsUpdate(String integrationId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/integrations/" + serializePathParameter(integrationId, new PathParameterSpec("integrationId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth operational Resources list. */
    public AppbaseApiResult operationalResourcesList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/operational_resources"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth operational Resources create. */
    public AppbaseApiResult operationalResourcesCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/operational_resources"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth operational Resources delete. */
    public AppbaseApiResult operationalResourcesDelete(String resourceId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/oauth/operational_resources/" + serializePathParameter(resourceId, new PathParameterSpec("resourceId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth operational Resources update. */
    public AppbaseApiResult operationalResourcesUpdate(String resourceId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/operational_resources/" + serializePathParameter(resourceId, new PathParameterSpec("resourceId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth operational Resources publishes create. */
    public AppbaseApiResult operationalResourcesPublishesCreate(String resourceId, Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/operational_resources/" + serializePathParameter(resourceId, new PathParameterSpec("resourceId", "simple", false)) + "/publishes"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth operator Platforms list. */
    public AppbaseApiResult operatorPlatformsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/operator_platforms"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth operator Platforms create. */
    public AppbaseApiResult operatorPlatformsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/operator_platforms"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth operator Platforms update. */
    public AppbaseApiResult operatorPlatformsUpdate(String operatorPlatformId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/operator_platforms/" + serializePathParameter(operatorPlatformId, new PathParameterSpec("operatorPlatformId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth operator Platforms pre Authorizations create. */
    public AppbaseApiResult operatorPlatformsPreAuthorizationsCreate(String operatorPlatformId, Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/operator_platforms/" + serializePathParameter(operatorPlatformId, new PathParameterSpec("operatorPlatformId", "simple", false)) + "/pre_authorizations"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth policies list. */
    public AppbaseApiResult policiesList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/policies"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth policies create. */
    public AppbaseApiResult policiesCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/policies"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth policies update. */
    public AppbaseApiResult policiesUpdate(String policyId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/policies/" + serializePathParameter(policyId, new PathParameterSpec("policyId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth provider Catalog list. */
    public AppbaseApiResult providerCatalogList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/provider_catalog"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth provider Catalog create. */
    public AppbaseApiResult providerCatalogCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/provider_catalog"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth provider Catalog retrieve. */
    public AppbaseApiResult providerCatalogRetrieve(String providerCatalogId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/oauth/provider_catalog/" + serializePathParameter(providerCatalogId, new PathParameterSpec("providerCatalogId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth provider Catalog update. */
    public AppbaseApiResult providerCatalogUpdate(String providerCatalogId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/provider_catalog/" + serializePathParameter(providerCatalogId, new PathParameterSpec("providerCatalogId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth resource Accounts list. */
    public AppbaseApiResult resourceAccountsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/resource_accounts"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth resource Accounts create. */
    public AppbaseApiResult resourceAccountsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/resource_accounts"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth resource Accounts update. */
    public AppbaseApiResult resourceAccountsUpdate(String resourceAccountId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/resource_accounts/" + serializePathParameter(resourceAccountId, new PathParameterSpec("resourceAccountId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth resource Accounts authorization Refreshes create. */
    public AppbaseApiResult resourceAccountsAuthorizationRefreshesCreate(String resourceAccountId, Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/resource_accounts/" + serializePathParameter(resourceAccountId, new PathParameterSpec("resourceAccountId", "simple", false)) + "/authorization_refreshes"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth resource Accounts mini Program Login Checks create. */
    public AppbaseApiResult resourceAccountsMiniProgramLoginChecksCreate(String resourceAccountId, Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/resource_accounts/" + serializePathParameter(resourceAccountId, new PathParameterSpec("resourceAccountId", "simple", false)) + "/mini_program_login_checks"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth resource Accounts verifications create. */
    public AppbaseApiResult resourceAccountsVerificationsCreate(String resourceAccountId, Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/resource_accounts/" + serializePathParameter(resourceAccountId, new PathParameterSpec("resourceAccountId", "simple", false)) + "/verifications"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth resource Authorizations list. */
    public AppbaseApiResult resourceAuthorizationsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/resource_authorizations"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth resource Authorizations create. */
    public AppbaseApiResult resourceAuthorizationsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/resource_authorizations"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth resource Authorizations update. */
    public AppbaseApiResult resourceAuthorizationsUpdate(String authorizationId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/resource_authorizations/" + serializePathParameter(authorizationId, new PathParameterSpec("authorizationId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth scope Profiles list. */
    public AppbaseApiResult scopeProfilesList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/scope_profiles"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth scope Profiles create. */
    public AppbaseApiResult scopeProfilesCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/scope_profiles"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth scope Profiles update. */
    public AppbaseApiResult scopeProfilesUpdate(String scopeProfileId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/scope_profiles/" + serializePathParameter(scopeProfileId, new PathParameterSpec("scopeProfileId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth secrets list. */
    public AppbaseApiResult secretsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/secrets"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth secrets create. */
    public AppbaseApiResult secretsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/secrets"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth secrets delete. */
    public AppbaseApiResult secretsDelete(String secretId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/oauth/secrets/" + serializePathParameter(secretId, new PathParameterSpec("secretId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth surfaces list. */
    public AppbaseApiResult surfacesList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/surfaces"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth surfaces create. */
    public AppbaseApiResult surfacesCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/surfaces"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth surfaces delete. */
    public AppbaseApiResult surfacesDelete(String surfaceId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/oauth/surfaces/" + serializePathParameter(surfaceId, new PathParameterSpec("surfaceId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth surfaces update. */
    public AppbaseApiResult surfacesUpdate(String surfaceId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/surfaces/" + serializePathParameter(surfaceId, new PathParameterSpec("surfaceId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth tenant Bindings list. */
    public AppbaseApiResult tenantBindingsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/tenant_bindings"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth tenant Bindings create. */
    public AppbaseApiResult tenantBindingsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/tenant_bindings"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth tenant Bindings update. */
    public AppbaseApiResult tenantBindingsUpdate(String bindingId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/tenant_bindings/" + serializePathParameter(bindingId, new PathParameterSpec("bindingId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth webhook Configs list. */
    public AppbaseApiResult webhookConfigsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/oauth/webhook_configs"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth webhook Configs create. */
    public AppbaseApiResult webhookConfigsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/webhook_configs"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth webhook Configs update. */
    public AppbaseApiResult webhookConfigsUpdate(String webhookConfigId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/oauth/webhook_configs/" + serializePathParameter(webhookConfigId, new PathParameterSpec("webhookConfigId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Iam oauth webhook Configs verifications create. */
    public AppbaseApiResult webhookConfigsVerificationsCreate(String webhookConfigId, Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/oauth/webhook_configs/" + serializePathParameter(webhookConfigId, new PathParameterSpec("webhookConfigId", "simple", false)) + "/verifications"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    private record PathParameterSpec(String name, String style, boolean explode) {}

    private static String serializePathParameter(Object value, PathParameterSpec spec) {
        if (value == null) {
            return "";
        }
        String style = spec.style() == null || spec.style().isBlank() ? "simple" : spec.style();
        if (value instanceof Iterable<?> iterable) {
            return serializePathArray(spec.name(), iterable, style, spec.explode());
        }
        if (value instanceof Map<?, ?> map) {
            return serializePathObject(spec.name(), map, style, spec.explode());
        }
        return pathPrimitivePrefix(spec.name(), style) + pathEncode(String.valueOf(value));
    }

    private static String serializePathArray(String name, Iterable<?> values, String style, boolean explode) {
        List<String> serialized = new java.util.ArrayList<>();
        for (Object item : values) {
            if (item != null) {
                serialized.add(pathEncode(String.valueOf(item)));
            }
        }
        if (serialized.isEmpty()) {
            return pathPrefix(name, style);
        }
        if ("matrix".equals(style)) {
            if (explode) {
                List<String> parts = new java.util.ArrayList<>();
                for (String item : serialized) {
                    parts.add(";" + name + "=" + item);
                }
                return String.join("", parts);
            }
            return ";" + name + "=" + String.join(",", serialized);
        }
        String separator = explode ? "." : ",";
        return pathPrefix(name, style) + String.join(separator, serialized);
    }

    private static String serializePathObject(String name, Map<?, ?> values, String style, boolean explode) {
        List<String> entries = new java.util.ArrayList<>();
        List<String> exploded = new java.util.ArrayList<>();
        values.forEach((key, value) -> {
            if (value == null) {
                return;
            }
            String escapedKey = pathEncode(String.valueOf(key));
            String escapedValue = pathEncode(String.valueOf(value));
            if (explode) {
                if ("matrix".equals(style)) {
                    exploded.add(";" + escapedKey + "=" + escapedValue);
                } else {
                    exploded.add(escapedKey + "=" + escapedValue);
                }
            } else {
                entries.add(escapedKey);
                entries.add(escapedValue);
            }
        });
        if ("matrix".equals(style)) {
            if (explode) {
                return String.join("", exploded);
            }
            return ";" + name + "=" + String.join(",", entries);
        }
        if (explode) {
            String separator = "label".equals(style) ? "." : ",";
            return pathPrefix(name, style) + String.join(separator, exploded);
        }
        return pathPrefix(name, style) + String.join(",", entries);
    }

    private static String pathPrefix(String name, String style) {
        if ("label".equals(style)) {
            return ".";
        }
        if ("matrix".equals(style)) {
            return ";" + name;
        }
        return "";
    }

    private static String pathPrimitivePrefix(String name, String style) {
        if ("matrix".equals(style)) {
            return ";" + name + "=";
        }
        return pathPrefix(name, style);
    }

    private static String pathEncode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
    }

    private record QueryParameterSpec(String name, Object value, String style, boolean explode, boolean allowReserved, String contentType) {}

    private static String buildQueryString(List<QueryParameterSpec> parameters) throws Exception {
        List<String> pairs = new java.util.ArrayList<>();
        for (QueryParameterSpec parameter : parameters) {
            appendSerializedParameter(pairs, parameter);
        }
        return String.join("&", pairs);
    }

    private static void appendSerializedParameter(List<String> pairs, QueryParameterSpec parameter) throws Exception {
        if (parameter.value() == null) {
            return;
        }
        if (parameter.contentType() != null && !parameter.contentType().isBlank()) {
            String json = clientObjectMapper().writeValueAsString(parameter.value());
            pairs.add(urlEncode(parameter.name()) + "=" + encodeQueryValue(json, parameter.allowReserved()));
            return;
        }

        String style = parameter.style() == null || parameter.style().isBlank() ? "form" : parameter.style();
        Object value = parameter.value();
        if ("deepObject".equals(style) && value instanceof Map<?, ?> map) {
            appendDeepObjectParameter(pairs, parameter.name(), map, parameter.allowReserved());
        } else if (value instanceof Iterable<?> iterable) {
            appendArrayParameter(pairs, parameter.name(), iterable, style, parameter.explode(), parameter.allowReserved());
        } else if (value instanceof Map<?, ?> map) {
            appendObjectParameter(pairs, parameter.name(), map, style, parameter.explode(), parameter.allowReserved());
        } else {
            pairs.add(urlEncode(parameter.name()) + "=" + encodeQueryValue(String.valueOf(value), parameter.allowReserved()));
        }
    }

    private static void appendArrayParameter(List<String> pairs, String name, Iterable<?> values, String style, boolean explode, boolean allowReserved) {
        List<String> serialized = new java.util.ArrayList<>();
        for (Object item : values) {
            if (item != null) {
                serialized.add(String.valueOf(item));
            }
        }
        if (serialized.isEmpty()) {
            return;
        }
        if ("form".equals(style) && explode) {
            for (String item : serialized) {
                pairs.add(urlEncode(name) + "=" + encodeQueryValue(item, allowReserved));
            }
            return;
        }
        pairs.add(urlEncode(name) + "=" + encodeQueryValue(String.join(",", serialized), allowReserved));
    }

    private static void appendObjectParameter(List<String> pairs, String name, Map<?, ?> values, String style, boolean explode, boolean allowReserved) {
        List<String> serialized = new java.util.ArrayList<>();
        values.forEach((key, value) -> {
            if (value == null) {
                return;
            }
            if ("form".equals(style) && explode) {
                pairs.add(urlEncode(String.valueOf(key)) + "=" + encodeQueryValue(String.valueOf(value), allowReserved));
            } else {
                serialized.add(String.valueOf(key));
                serialized.add(String.valueOf(value));
            }
        });
        if (!serialized.isEmpty()) {
            pairs.add(urlEncode(name) + "=" + encodeQueryValue(String.join(",", serialized), allowReserved));
        }
    }

    private static void appendDeepObjectParameter(List<String> pairs, String name, Map<?, ?> values, boolean allowReserved) {
        values.forEach((key, value) -> {
            if (value != null) {
                pairs.add(urlEncode(name + "[" + key + "]") + "=" + encodeQueryValue(String.valueOf(value), allowReserved));
            }
        });
    }

    private static String encodeQueryValue(String value, boolean allowReserved) {
        String encoded = urlEncode(value);
        if (!allowReserved) {
            return encoded;
        }
        return encoded
            .replace("%3A", ":").replace("%2F", "/").replace("%3F", "?").replace("%23", "#")
            .replace("%5B", "[").replace("%5D", "]").replace("%40", "@").replace("%21", "!")
            .replace("%24", "$").replace("%26", "&").replace("%27", "'").replace("%28", "(")
            .replace("%29", ")").replace("%2A", "*").replace("%2B", "+").replace("%2C", ",")
            .replace("%3B", ";").replace("%3D", "=");
    }

    private static com.fasterxml.jackson.databind.ObjectMapper clientObjectMapper() {
        return new com.fasterxml.jackson.databind.ObjectMapper();
    }


    private static String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }
}
