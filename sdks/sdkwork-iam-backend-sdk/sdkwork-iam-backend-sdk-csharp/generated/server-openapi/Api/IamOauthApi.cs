using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SDKWork.Iam.BackendSdk.Models;
using SdkHttpClient = SDKWork.Iam.BackendSdk.Http.HttpClient;

namespace SDKWork.Iam.BackendSdk.Api
{
    public class IamOauthApi
    {
        private readonly SdkHttpClient _client;

        public IamOauthApi(SdkHttpClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Iam oauth account Links list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> AccountLinksListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/account_links"), queryString));
        }

        /// <summary>
        /// Iam oauth account Links update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> AccountLinksUpdateAsync(string accountLinkId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/account_links/{SerializePathParameter(accountLinkId, new PathParameterSpec("accountLinkId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth callback Events list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> CallbackEventsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/callback_events"), queryString));
        }

        /// <summary>
        /// Iam oauth claim Mappings list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ClaimMappingsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/claim_mappings"), queryString));
        }

        /// <summary>
        /// Iam oauth claim Mappings create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ClaimMappingsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/claim_mappings"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth claim Mappings update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ClaimMappingsUpdateAsync(string mappingId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/claim_mappings/{SerializePathParameter(mappingId, new PathParameterSpec("mappingId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth clients list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ClientsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/clients"), queryString));
        }

        /// <summary>
        /// Iam oauth clients create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ClientsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/clients"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth clients delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ClientsDeleteAsync(string oauthClientId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/clients/{SerializePathParameter(oauthClientId, new PathParameterSpec("oauthClientId", "simple", false))}"));
        }

        /// <summary>
        /// Iam oauth clients retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ClientsRetrieveAsync(string oauthClientId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/clients/{SerializePathParameter(oauthClientId, new PathParameterSpec("oauthClientId", "simple", false))}"));
        }

        /// <summary>
        /// Iam oauth clients update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ClientsUpdateAsync(string oauthClientId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/clients/{SerializePathParameter(oauthClientId, new PathParameterSpec("oauthClientId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth diagnostic Runs list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> DiagnosticRunsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/diagnostic_runs"), queryString));
        }

        /// <summary>
        /// Iam oauth diagnostic Runs create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> DiagnosticRunsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/diagnostic_runs"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth diagnostic Runs retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> DiagnosticRunsRetrieveAsync(string diagnosticRunId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/diagnostic_runs/{SerializePathParameter(diagnosticRunId, new PathParameterSpec("diagnosticRunId", "simple", false))}"));
        }

        /// <summary>
        /// Iam oauth flow Configs list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> FlowConfigsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/flow_configs"), queryString));
        }

        /// <summary>
        /// Iam oauth flow Configs create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> FlowConfigsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/flow_configs"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth flow Configs update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> FlowConfigsUpdateAsync(string flowConfigId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/flow_configs/{SerializePathParameter(flowConfigId, new PathParameterSpec("flowConfigId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth grants list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> GrantsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/grants"), queryString));
        }

        /// <summary>
        /// Iam oauth grants delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> GrantsDeleteAsync(string grantId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/grants/{SerializePathParameter(grantId, new PathParameterSpec("grantId", "simple", false))}"));
        }

        /// <summary>
        /// Iam oauth integrations list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> IntegrationsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/integrations"), queryString));
        }

        /// <summary>
        /// Iam oauth integrations create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> IntegrationsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/integrations"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth integrations delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> IntegrationsDeleteAsync(string integrationId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/integrations/{SerializePathParameter(integrationId, new PathParameterSpec("integrationId", "simple", false))}"));
        }

        /// <summary>
        /// Iam oauth integrations retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> IntegrationsRetrieveAsync(string integrationId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/integrations/{SerializePathParameter(integrationId, new PathParameterSpec("integrationId", "simple", false))}"));
        }

        /// <summary>
        /// Iam oauth integrations update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> IntegrationsUpdateAsync(string integrationId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/integrations/{SerializePathParameter(integrationId, new PathParameterSpec("integrationId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth operational Resources list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OperationalResourcesListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/operational_resources"), queryString));
        }

        /// <summary>
        /// Iam oauth operational Resources create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OperationalResourcesCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/operational_resources"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth operational Resources delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OperationalResourcesDeleteAsync(string resourceId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/operational_resources/{SerializePathParameter(resourceId, new PathParameterSpec("resourceId", "simple", false))}"));
        }

        /// <summary>
        /// Iam oauth operational Resources update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OperationalResourcesUpdateAsync(string resourceId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/operational_resources/{SerializePathParameter(resourceId, new PathParameterSpec("resourceId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth operational Resources publishes create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OperationalResourcesPublishesCreateAsync(string resourceId, Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/operational_resources/{SerializePathParameter(resourceId, new PathParameterSpec("resourceId", "simple", false))}/publishes"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth operator Platforms list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OperatorPlatformsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/operator_platforms"), queryString));
        }

        /// <summary>
        /// Iam oauth operator Platforms create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OperatorPlatformsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/operator_platforms"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth operator Platforms update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OperatorPlatformsUpdateAsync(string operatorPlatformId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/operator_platforms/{SerializePathParameter(operatorPlatformId, new PathParameterSpec("operatorPlatformId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth operator Platforms pre Authorizations create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OperatorPlatformsPreAuthorizationsCreateAsync(string operatorPlatformId, Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/operator_platforms/{SerializePathParameter(operatorPlatformId, new PathParameterSpec("operatorPlatformId", "simple", false))}/pre_authorizations"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth policies list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PoliciesListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/policies"), queryString));
        }

        /// <summary>
        /// Iam oauth policies create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PoliciesCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/policies"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth policies update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PoliciesUpdateAsync(string policyId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/policies/{SerializePathParameter(policyId, new PathParameterSpec("policyId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth provider Catalog list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ProviderCatalogListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/provider_catalog"), queryString));
        }

        /// <summary>
        /// Iam oauth provider Catalog create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ProviderCatalogCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/provider_catalog"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth provider Catalog retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ProviderCatalogRetrieveAsync(string providerCatalogId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/provider_catalog/{SerializePathParameter(providerCatalogId, new PathParameterSpec("providerCatalogId", "simple", false))}"));
        }

        /// <summary>
        /// Iam oauth provider Catalog update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ProviderCatalogUpdateAsync(string providerCatalogId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/provider_catalog/{SerializePathParameter(providerCatalogId, new PathParameterSpec("providerCatalogId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth resource Accounts list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ResourceAccountsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/resource_accounts"), queryString));
        }

        /// <summary>
        /// Iam oauth resource Accounts create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ResourceAccountsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/resource_accounts"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth resource Accounts update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ResourceAccountsUpdateAsync(string resourceAccountId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/resource_accounts/{SerializePathParameter(resourceAccountId, new PathParameterSpec("resourceAccountId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth resource Accounts authorization Refreshes create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ResourceAccountsAuthorizationRefreshesCreateAsync(string resourceAccountId, Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/resource_accounts/{SerializePathParameter(resourceAccountId, new PathParameterSpec("resourceAccountId", "simple", false))}/authorization_refreshes"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth resource Accounts mini Program Login Checks create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ResourceAccountsMiniProgramLoginChecksCreateAsync(string resourceAccountId, Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/resource_accounts/{SerializePathParameter(resourceAccountId, new PathParameterSpec("resourceAccountId", "simple", false))}/mini_program_login_checks"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth resource Accounts verifications create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ResourceAccountsVerificationsCreateAsync(string resourceAccountId, Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/resource_accounts/{SerializePathParameter(resourceAccountId, new PathParameterSpec("resourceAccountId", "simple", false))}/verifications"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth resource Authorizations list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ResourceAuthorizationsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/resource_authorizations"), queryString));
        }

        /// <summary>
        /// Iam oauth resource Authorizations create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ResourceAuthorizationsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/resource_authorizations"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth resource Authorizations update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ResourceAuthorizationsUpdateAsync(string authorizationId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/resource_authorizations/{SerializePathParameter(authorizationId, new PathParameterSpec("authorizationId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth scope Profiles list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ScopeProfilesListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/scope_profiles"), queryString));
        }

        /// <summary>
        /// Iam oauth scope Profiles create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ScopeProfilesCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/scope_profiles"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth scope Profiles update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ScopeProfilesUpdateAsync(string scopeProfileId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/scope_profiles/{SerializePathParameter(scopeProfileId, new PathParameterSpec("scopeProfileId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth secrets list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> SecretsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/secrets"), queryString));
        }

        /// <summary>
        /// Iam oauth secrets create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> SecretsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/secrets"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth secrets delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> SecretsDeleteAsync(string secretId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/secrets/{SerializePathParameter(secretId, new PathParameterSpec("secretId", "simple", false))}"));
        }

        /// <summary>
        /// Iam oauth surfaces list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> SurfacesListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/surfaces"), queryString));
        }

        /// <summary>
        /// Iam oauth surfaces create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> SurfacesCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/surfaces"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth surfaces delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> SurfacesDeleteAsync(string surfaceId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/surfaces/{SerializePathParameter(surfaceId, new PathParameterSpec("surfaceId", "simple", false))}"));
        }

        /// <summary>
        /// Iam oauth surfaces update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> SurfacesUpdateAsync(string surfaceId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/surfaces/{SerializePathParameter(surfaceId, new PathParameterSpec("surfaceId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth tenant Bindings list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantBindingsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/tenant_bindings"), queryString));
        }

        /// <summary>
        /// Iam oauth tenant Bindings create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantBindingsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/tenant_bindings"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth tenant Bindings update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantBindingsUpdateAsync(string bindingId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/tenant_bindings/{SerializePathParameter(bindingId, new PathParameterSpec("bindingId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth webhook Configs list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> WebhookConfigsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/oauth/webhook_configs"), queryString));
        }

        /// <summary>
        /// Iam oauth webhook Configs create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> WebhookConfigsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/oauth/webhook_configs"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth webhook Configs update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> WebhookConfigsUpdateAsync(string webhookConfigId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/webhook_configs/{SerializePathParameter(webhookConfigId, new PathParameterSpec("webhookConfigId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Iam oauth webhook Configs verifications create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> WebhookConfigsVerificationsCreateAsync(string webhookConfigId, Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/oauth/webhook_configs/{SerializePathParameter(webhookConfigId, new PathParameterSpec("webhookConfigId", "simple", false))}/verifications"), body, null, null, "application/json");
        }

        private sealed record PathParameterSpec(string Name, string Style, bool Explode);

        private static string SerializePathParameter(object? value, PathParameterSpec spec)
        {
            if (value is null)
            {
                return string.Empty;
            }
            var style = string.IsNullOrWhiteSpace(spec.Style) ? "simple" : spec.Style;
            if (value is System.Collections.IDictionary dictionary)
            {
                return SerializePathObject(spec.Name, dictionary, style, spec.Explode);
            }
            if (value is System.Collections.IEnumerable enumerable && value is not string)
            {
                return SerializePathArray(spec.Name, enumerable, style, spec.Explode);
            }
            return PathPrimitivePrefix(spec.Name, style) + Uri.EscapeDataString(value.ToString() ?? string.Empty);
        }

        private static string SerializePathArray(string name, System.Collections.IEnumerable values, string style, bool explode)
        {
            var serialized = new List<string>();
            foreach (var item in values)
            {
                if (item is not null)
                {
                    serialized.Add(Uri.EscapeDataString(item.ToString() ?? string.Empty));
                }
            }
            if (serialized.Count == 0)
            {
                return PathPrefix(name, style);
            }
            if (style == "matrix")
            {
                if (explode)
                {
                    var parts = new List<string>();
                    foreach (var item in serialized)
                    {
                        parts.Add(";" + name + "=" + item);
                    }
                    return string.Join(string.Empty, parts);
                }
                return ";" + name + "=" + string.Join(",", serialized);
            }
            var separator = explode ? "." : ",";
            return PathPrefix(name, style) + string.Join(separator, serialized);
        }

        private static string SerializePathObject(string name, System.Collections.IDictionary values, string style, bool explode)
        {
            var entries = new List<string>();
            var exploded = new List<string>();
            foreach (System.Collections.DictionaryEntry item in values)
            {
                if (item.Value is null)
                {
                    continue;
                }
                var escapedKey = Uri.EscapeDataString(item.Key.ToString() ?? string.Empty);
                var escapedValue = Uri.EscapeDataString(item.Value.ToString() ?? string.Empty);
                if (explode)
                {
                    exploded.Add(style == "matrix" ? ";" + escapedKey + "=" + escapedValue : escapedKey + "=" + escapedValue);
                }
                else
                {
                    entries.Add(escapedKey);
                    entries.Add(escapedValue);
                }
            }
            if (style == "matrix")
            {
                return explode ? string.Join(string.Empty, exploded) : ";" + name + "=" + string.Join(",", entries);
            }
            if (explode)
            {
                var separator = style == "label" ? "." : ",";
                return PathPrefix(name, style) + string.Join(separator, exploded);
            }
            return PathPrefix(name, style) + string.Join(",", entries);
        }

        private static string PathPrefix(string name, string style)
        {
            return style switch
            {
                "label" => ".",
                "matrix" => ";" + name,
                _ => string.Empty,
            };
        }

        private static string PathPrimitivePrefix(string name, string style)
        {
            return style == "matrix" ? ";" + name + "=" : PathPrefix(name, style);
        }

        private sealed record QueryParameterSpec(
            string Name,
            object? Value,
            string Style,
            bool Explode,
            bool AllowReserved,
            string? ContentType);

        private static string BuildQueryString(IEnumerable<QueryParameterSpec> parameters)
        {
            var pairs = new List<string>();
            foreach (var parameter in parameters)
            {
                AppendSerializedParameter(pairs, parameter);
            }
            return string.Join("&", pairs);
        }

        private static void AppendSerializedParameter(List<string> pairs, QueryParameterSpec parameter)
        {
            if (parameter.Value is null)
            {
                return;
            }

            if (!string.IsNullOrWhiteSpace(parameter.ContentType))
            {
                var json = System.Text.Json.JsonSerializer.Serialize(parameter.Value);
                pairs.Add(Uri.EscapeDataString(parameter.Name) + "=" + EncodeQueryValue(json, parameter.AllowReserved));
                return;
            }

            var style = string.IsNullOrWhiteSpace(parameter.Style) ? "form" : parameter.Style;
            if (style == "deepObject" && parameter.Value is System.Collections.IDictionary deepObject)
            {
                AppendDeepObjectParameter(pairs, parameter.Name, deepObject, parameter.AllowReserved);
            }
            else if (parameter.Value is System.Collections.IEnumerable enumerable && parameter.Value is not string && parameter.Value is not System.Collections.IDictionary)
            {
                AppendArrayParameter(pairs, parameter.Name, enumerable, style, parameter.Explode, parameter.AllowReserved);
            }
            else if (parameter.Value is System.Collections.IDictionary dictionary)
            {
                AppendObjectParameter(pairs, parameter.Name, dictionary, style, parameter.Explode, parameter.AllowReserved);
            }
            else
            {
                pairs.Add(Uri.EscapeDataString(parameter.Name) + "=" + EncodeQueryValue(parameter.Value.ToString() ?? string.Empty, parameter.AllowReserved));
            }
        }

        private static void AppendArrayParameter(List<string> pairs, string name, System.Collections.IEnumerable values, string style, bool explode, bool allowReserved)
        {
            var serialized = new List<string>();
            foreach (var item in values)
            {
                if (item is not null)
                {
                    serialized.Add(item.ToString() ?? string.Empty);
                }
            }
            if (serialized.Count == 0)
            {
                return;
            }
            if (style == "form" && explode)
            {
                foreach (var item in serialized)
                {
                    pairs.Add(Uri.EscapeDataString(name) + "=" + EncodeQueryValue(item, allowReserved));
                }
                return;
            }
            pairs.Add(Uri.EscapeDataString(name) + "=" + EncodeQueryValue(string.Join(",", serialized), allowReserved));
        }

        private static void AppendObjectParameter(List<string> pairs, string name, System.Collections.IDictionary values, string style, bool explode, bool allowReserved)
        {
            var serialized = new List<string>();
            foreach (System.Collections.DictionaryEntry item in values)
            {
                if (item.Value is null)
                {
                    continue;
                }
                if (style == "form" && explode)
                {
                    pairs.Add(Uri.EscapeDataString(item.Key.ToString() ?? string.Empty) + "=" + EncodeQueryValue(item.Value.ToString() ?? string.Empty, allowReserved));
                }
                else
                {
                    serialized.Add(item.Key.ToString() ?? string.Empty);
                    serialized.Add(item.Value.ToString() ?? string.Empty);
                }
            }
            if (serialized.Count > 0)
            {
                pairs.Add(Uri.EscapeDataString(name) + "=" + EncodeQueryValue(string.Join(",", serialized), allowReserved));
            }
        }

        private static void AppendDeepObjectParameter(List<string> pairs, string name, System.Collections.IDictionary values, bool allowReserved)
        {
            foreach (System.Collections.DictionaryEntry item in values)
            {
                if (item.Value is not null)
                {
                    pairs.Add(Uri.EscapeDataString(name + "[" + item.Key + "]") + "=" + EncodeQueryValue(item.Value.ToString() ?? string.Empty, allowReserved));
                }
            }
        }

        private static string EncodeQueryValue(string value, bool allowReserved)
        {
            var encoded = Uri.EscapeDataString(value);
            if (!allowReserved)
            {
                return encoded;
            }
            return encoded
                .Replace("%3A", ":").Replace("%2F", "/").Replace("%3F", "?").Replace("%23", "#")
                .Replace("%5B", "[").Replace("%5D", "]").Replace("%40", "@").Replace("%21", "!")
                .Replace("%24", "$").Replace("%26", "&").Replace("%27", "'").Replace("%28", "(")
                .Replace("%29", ")").Replace("%2A", "*").Replace("%2B", "+").Replace("%2C", ",")
                .Replace("%3B", ";").Replace("%3D", "=");
        }

    }
}
