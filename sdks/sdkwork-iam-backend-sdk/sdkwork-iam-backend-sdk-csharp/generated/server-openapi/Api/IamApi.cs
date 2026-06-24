using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SDKWork.Iam.BackendSdk.Models;
using SdkHttpClient = SDKWork.Iam.BackendSdk.Http.HttpClient;

namespace SDKWork.Iam.BackendSdk.Api
{
    public class IamApi
    {
        private readonly SdkHttpClient _client;

        public IamApi(SdkHttpClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Access Credentials create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> AccessCredentialsCreateAsync(SDKWork.Iam.BackendSdk.Models.AppbaseAccessCredentialCreateCommand body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/access_credentials"), body, null, null, "application/json");
        }

        /// <summary>
        /// Account Binding Policy retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> AccountBindingPolicyRetrieveAsync()
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/account_binding_policy"));
        }

        /// <summary>
        /// Account Binding Policy update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> AccountBindingPolicyUpdateAsync(Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/account_binding_policy"), body, null, null, "application/json");
        }

        /// <summary>
        /// Api Keys list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ApiKeysListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/api_keys"), queryString));
        }

        /// <summary>
        /// Api Keys revoke.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ApiKeysRevokeAsync(string apiKeyId, Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/api_keys/{SerializePathParameter(apiKeyId, new PathParameterSpec("apiKeyId", "simple", false))}/revoke"), body, null, null, "application/json");
        }

        /// <summary>
        /// Applications register.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ApplicationsRegisterAsync(SDKWork.Iam.BackendSdk.Models.AppbaseApplicationRegisterCommand body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/applications/register"), body, null, null, "application/json");
        }

        /// <summary>
        /// Audit Events list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> AuditEventsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/audit_events"), queryString));
        }

        /// <summary>
        /// Department Assignments list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> DepartmentAssignmentsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/department_assignments"), queryString));
        }

        /// <summary>
        /// Department Assignments create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> DepartmentAssignmentsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/department_assignments"), body, null, null, "application/json");
        }

        /// <summary>
        /// Department Assignments update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> DepartmentAssignmentsUpdateAsync(string assignmentId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/department_assignments/{SerializePathParameter(assignmentId, new PathParameterSpec("assignmentId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Departments list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> DepartmentsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/departments"), queryString));
        }

        /// <summary>
        /// Departments create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> DepartmentsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/departments"), body, null, null, "application/json");
        }

        /// <summary>
        /// Departments delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> DepartmentsDeleteAsync(string departmentId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/departments/{SerializePathParameter(departmentId, new PathParameterSpec("departmentId", "simple", false))}"));
        }

        /// <summary>
        /// Departments retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> DepartmentsRetrieveAsync(string departmentId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/departments/{SerializePathParameter(departmentId, new PathParameterSpec("departmentId", "simple", false))}"));
        }

        /// <summary>
        /// Departments update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> DepartmentsUpdateAsync(string departmentId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/departments/{SerializePathParameter(departmentId, new PathParameterSpec("departmentId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Departments tree retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> DepartmentsTreeRetrieveAsync()
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/departments/tree"));
        }

        /// <summary>
        /// Groups list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> GroupsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/groups"), queryString));
        }

        /// <summary>
        /// Groups create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> GroupsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/groups"), body, null, null, "application/json");
        }

        /// <summary>
        /// Groups delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> GroupsDeleteAsync(string groupId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/groups/{SerializePathParameter(groupId, new PathParameterSpec("groupId", "simple", false))}"));
        }

        /// <summary>
        /// Groups retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> GroupsRetrieveAsync(string groupId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/groups/{SerializePathParameter(groupId, new PathParameterSpec("groupId", "simple", false))}"));
        }

        /// <summary>
        /// Groups update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> GroupsUpdateAsync(string groupId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/groups/{SerializePathParameter(groupId, new PathParameterSpec("groupId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Groups members list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> GroupsMembersListAsync(string groupId, int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath($"/iam/groups/{SerializePathParameter(groupId, new PathParameterSpec("groupId", "simple", false))}/members"), queryString));
        }

        /// <summary>
        /// Groups members create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> GroupsMembersCreateAsync(string groupId, Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/groups/{SerializePathParameter(groupId, new PathParameterSpec("groupId", "simple", false))}/members"), body, null, null, "application/json");
        }

        /// <summary>
        /// Groups members delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> GroupsMembersDeleteAsync(string groupId, string memberId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/groups/{SerializePathParameter(groupId, new PathParameterSpec("groupId", "simple", false))}/members/{SerializePathParameter(memberId, new PathParameterSpec("memberId", "simple", false))}"));
        }

        /// <summary>
        /// Organization Memberships list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OrganizationMembershipsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/organization_memberships"), queryString));
        }

        /// <summary>
        /// Organization Memberships create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OrganizationMembershipsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/organization_memberships"), body, null, null, "application/json");
        }

        /// <summary>
        /// Organization Memberships update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OrganizationMembershipsUpdateAsync(string membershipId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/organization_memberships/{SerializePathParameter(membershipId, new PathParameterSpec("membershipId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Organizations list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OrganizationsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/organizations"), queryString));
        }

        /// <summary>
        /// Organizations create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OrganizationsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/organizations"), body, null, null, "application/json");
        }

        /// <summary>
        /// Organizations delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OrganizationsDeleteAsync(string organizationId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/organizations/{SerializePathParameter(organizationId, new PathParameterSpec("organizationId", "simple", false))}"));
        }

        /// <summary>
        /// Organizations retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OrganizationsRetrieveAsync(string organizationId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/organizations/{SerializePathParameter(organizationId, new PathParameterSpec("organizationId", "simple", false))}"));
        }

        /// <summary>
        /// Organizations update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OrganizationsUpdateAsync(string organizationId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/organizations/{SerializePathParameter(organizationId, new PathParameterSpec("organizationId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Organizations tree retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> OrganizationsTreeRetrieveAsync()
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/organizations/tree"));
        }

        /// <summary>
        /// Permissions list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PermissionsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/permissions"), queryString));
        }

        /// <summary>
        /// Permissions create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PermissionsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/permissions"), body, null, null, "application/json");
        }

        /// <summary>
        /// Permissions delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PermissionsDeleteAsync(string permissionId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/permissions/{SerializePathParameter(permissionId, new PathParameterSpec("permissionId", "simple", false))}"));
        }

        /// <summary>
        /// Permissions retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PermissionsRetrieveAsync(string permissionId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/permissions/{SerializePathParameter(permissionId, new PathParameterSpec("permissionId", "simple", false))}"));
        }

        /// <summary>
        /// Permissions update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PermissionsUpdateAsync(string permissionId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/permissions/{SerializePathParameter(permissionId, new PathParameterSpec("permissionId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Policies list.
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
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/policies"), queryString));
        }

        /// <summary>
        /// Policies create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PoliciesCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/policies"), body, null, null, "application/json");
        }

        /// <summary>
        /// Policies delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PoliciesDeleteAsync(string policyId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/policies/{SerializePathParameter(policyId, new PathParameterSpec("policyId", "simple", false))}"));
        }

        /// <summary>
        /// Policies retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PoliciesRetrieveAsync(string policyId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/policies/{SerializePathParameter(policyId, new PathParameterSpec("policyId", "simple", false))}"));
        }

        /// <summary>
        /// Policies update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PoliciesUpdateAsync(string policyId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/policies/{SerializePathParameter(policyId, new PathParameterSpec("policyId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Position Assignments list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PositionAssignmentsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/position_assignments"), queryString));
        }

        /// <summary>
        /// Position Assignments create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PositionAssignmentsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/position_assignments"), body, null, null, "application/json");
        }

        /// <summary>
        /// Position Assignments update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PositionAssignmentsUpdateAsync(string assignmentId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/position_assignments/{SerializePathParameter(assignmentId, new PathParameterSpec("assignmentId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Positions list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PositionsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/positions"), queryString));
        }

        /// <summary>
        /// Positions create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PositionsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/positions"), body, null, null, "application/json");
        }

        /// <summary>
        /// Positions delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PositionsDeleteAsync(string positionId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/positions/{SerializePathParameter(positionId, new PathParameterSpec("positionId", "simple", false))}"));
        }

        /// <summary>
        /// Positions update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> PositionsUpdateAsync(string positionId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/positions/{SerializePathParameter(positionId, new PathParameterSpec("positionId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Role Bindings list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> RoleBindingsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/role_bindings"), queryString));
        }

        /// <summary>
        /// Role Bindings create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> RoleBindingsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/role_bindings"), body, null, null, "application/json");
        }

        /// <summary>
        /// Role Bindings delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> RoleBindingsDeleteAsync(string roleBindingId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/role_bindings/{SerializePathParameter(roleBindingId, new PathParameterSpec("roleBindingId", "simple", false))}"));
        }

        /// <summary>
        /// Roles list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> RolesListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/roles"), queryString));
        }

        /// <summary>
        /// Roles create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> RolesCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/roles"), body, null, null, "application/json");
        }

        /// <summary>
        /// Roles delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> RolesDeleteAsync(string roleId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/roles/{SerializePathParameter(roleId, new PathParameterSpec("roleId", "simple", false))}"));
        }

        /// <summary>
        /// Roles retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> RolesRetrieveAsync(string roleId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/roles/{SerializePathParameter(roleId, new PathParameterSpec("roleId", "simple", false))}"));
        }

        /// <summary>
        /// Roles update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> RolesUpdateAsync(string roleId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/roles/{SerializePathParameter(roleId, new PathParameterSpec("roleId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Roles permissions list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> RolesPermissionsListAsync(string roleId, int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath($"/iam/roles/{SerializePathParameter(roleId, new PathParameterSpec("roleId", "simple", false))}/permissions"), queryString));
        }

        /// <summary>
        /// Roles permissions create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> RolesPermissionsCreateAsync(string roleId, Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/roles/{SerializePathParameter(roleId, new PathParameterSpec("roleId", "simple", false))}/permissions"), body, null, null, "application/json");
        }

        /// <summary>
        /// Roles permissions delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> RolesPermissionsDeleteAsync(string roleId, string permissionId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/roles/{SerializePathParameter(roleId, new PathParameterSpec("roleId", "simple", false))}/permissions/{SerializePathParameter(permissionId, new PathParameterSpec("permissionId", "simple", false))}"));
        }

        /// <summary>
        /// Security Events list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> SecurityEventsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/security_events"), queryString));
        }

        /// <summary>
        /// Service Accounts list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ServiceAccountsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/service_accounts"), queryString));
        }

        /// <summary>
        /// Service Accounts create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ServiceAccountsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/service_accounts"), body, null, null, "application/json");
        }

        /// <summary>
        /// Service Accounts delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ServiceAccountsDeleteAsync(string serviceAccountId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/service_accounts/{SerializePathParameter(serviceAccountId, new PathParameterSpec("serviceAccountId", "simple", false))}"));
        }

        /// <summary>
        /// Service Accounts retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ServiceAccountsRetrieveAsync(string serviceAccountId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/service_accounts/{SerializePathParameter(serviceAccountId, new PathParameterSpec("serviceAccountId", "simple", false))}"));
        }

        /// <summary>
        /// Service Accounts update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> ServiceAccountsUpdateAsync(string serviceAccountId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/service_accounts/{SerializePathParameter(serviceAccountId, new PathParameterSpec("serviceAccountId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Tenant Applications provision.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantApplicationsProvisionAsync(SDKWork.Iam.BackendSdk.Models.AppbaseTenantApplicationProvisionCommand body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/tenant_applications"), body, null, null, "application/json");
        }

        /// <summary>
        /// Tenant Applications update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantApplicationsUpdateAsync(string tenantApplicationId, SDKWork.Iam.BackendSdk.Models.AppbaseTenantApplicationUpdateCommand? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/tenant_applications/{SerializePathParameter(tenantApplicationId, new PathParameterSpec("tenantApplicationId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Tenant Applications enable.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantApplicationsEnableAsync(string tenantApplicationId, SDKWork.Iam.BackendSdk.Models.AppbaseTenantApplicationEnableCommand body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/tenant_applications/{SerializePathParameter(tenantApplicationId, new PathParameterSpec("tenantApplicationId", "simple", false))}/enable"), body, null, null, "application/json");
        }

        /// <summary>
        /// Tenants list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/tenants"), queryString));
        }

        /// <summary>
        /// Tenants create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/tenants"), body, null, null, "application/json");
        }

        /// <summary>
        /// Tenants delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantsDeleteAsync(string tenantId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/tenants/{SerializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false))}"));
        }

        /// <summary>
        /// Tenants retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantsRetrieveAsync(string tenantId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/tenants/{SerializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false))}"));
        }

        /// <summary>
        /// Tenants update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantsUpdateAsync(string tenantId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/tenants/{SerializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Tenants members list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantsMembersListAsync(string tenantId, int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath($"/iam/tenants/{SerializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false))}/members"), queryString));
        }

        /// <summary>
        /// Tenants members create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantsMembersCreateAsync(string tenantId, Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/tenants/{SerializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false))}/members"), body, null, null, "application/json");
        }

        /// <summary>
        /// Tenants members delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantsMembersDeleteAsync(string tenantId, string userId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/tenants/{SerializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false))}/members/{SerializePathParameter(userId, new PathParameterSpec("userId", "simple", false))}"));
        }

        /// <summary>
        /// Tenants members update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> TenantsMembersUpdateAsync(string tenantId, string userId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/tenants/{SerializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false))}/members/{SerializePathParameter(userId, new PathParameterSpec("userId", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Users list.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> UsersListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.BackendPath("/iam/users"), queryString));
        }

        /// <summary>
        /// Users create.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> UsersCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath("/iam/users"), body, null, null, "application/json");
        }

        /// <summary>
        /// Users delete.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> UsersDeleteAsync(string userId)
        {
            return await _client.DeleteAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/users/{SerializePathParameter(userId, new PathParameterSpec("userId", "simple", false))}"));
        }

        /// <summary>
        /// Users retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> UsersRetrieveAsync(string userId)
        {
            return await _client.GetAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/users/{SerializePathParameter(userId, new PathParameterSpec("userId", "simple", false))}"));
        }

        /// <summary>
        /// Users update.
        /// </summary>
        public async Task<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult?> UsersUpdateAsync(string userId, Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.BackendSdk.Models.AppbaseApiResult>(ApiPaths.BackendPath($"/iam/users/{SerializePathParameter(userId, new PathParameterSpec("userId", "simple", false))}"), body, null, null, "application/json");
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
