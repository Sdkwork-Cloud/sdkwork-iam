using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SDKWork.Iam.AppSdk.Models;
using SdkHttpClient = SDKWork.Iam.AppSdk.Http.HttpClient;

namespace SDKWork.Iam.AppSdk.Api
{
    public class IamApi
    {
        private readonly SdkHttpClient _client;

        public IamApi(SdkHttpClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Department Assignments list.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> DepartmentAssignmentsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.AppPath("/iam/department_assignments"), queryString));
        }

        /// <summary>
        /// Departments list.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> DepartmentsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.AppPath("/iam/departments"), queryString));
        }

        /// <summary>
        /// Departments tree retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> DepartmentsTreeRetrieveAsync()
        {
            return await _client.GetAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/iam/departments/tree"));
        }

        /// <summary>
        /// Organization Memberships list.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> OrganizationMembershipsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.AppPath("/iam/organization_memberships"), queryString));
        }

        /// <summary>
        /// Organizations list.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> OrganizationsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.AppPath("/iam/organizations"), queryString));
        }

        /// <summary>
        /// Organizations tree retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> OrganizationsTreeRetrieveAsync()
        {
            return await _client.GetAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/iam/organizations/tree"));
        }

        /// <summary>
        /// Position Assignments list.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> PositionAssignmentsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.AppPath("/iam/position_assignments"), queryString));
        }

        /// <summary>
        /// Positions list.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> PositionsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.AppPath("/iam/positions"), queryString));
        }

        /// <summary>
        /// Role Bindings list.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> RoleBindingsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.AppPath("/iam/role_bindings"), queryString));
        }

        /// <summary>
        /// Users current retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> UsersCurrentRetrieveAsync()
        {
            return await _client.GetAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/iam/users/current"));
        }

        /// <summary>
        /// Users current update.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> UsersCurrentUpdateAsync(Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/iam/users/current"), body, null, null, "application/json");
        }

        /// <summary>
        /// Users current email Bindings delete.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> UsersCurrentEmailBindingsDeleteAsync()
        {
            return await _client.DeleteAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/iam/users/current/email_bindings"));
        }

        /// <summary>
        /// Users current email Bindings create.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> UsersCurrentEmailBindingsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/iam/users/current/email_bindings"), body, null, null, "application/json");
        }

        /// <summary>
        /// Users current password update.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> UsersCurrentPasswordUpdateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/iam/users/current/password"), body, null, null, "application/json");
        }

        /// <summary>
        /// Users current phone Bindings delete.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> UsersCurrentPhoneBindingsDeleteAsync()
        {
            return await _client.DeleteAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/iam/users/current/phone_bindings"));
        }

        /// <summary>
        /// Users current phone Bindings create.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> UsersCurrentPhoneBindingsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/iam/users/current/phone_bindings"), body, null, null, "application/json");
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
