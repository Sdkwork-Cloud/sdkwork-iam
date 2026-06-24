using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SDKWork.Appbase.AppSdk.Models;
using SdkHttpClient = SDKWork.Appbase.AppSdk.Http.HttpClient;

namespace SDKWork.Appbase.AppSdk.Api
{
    public class OauthApi
    {
        private readonly SdkHttpClient _client;

        public OauthApi(SdkHttpClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Oauth account Links list.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> AccountLinksListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.AppPath("/oauth/account_links"), queryString));
        }

        /// <summary>
        /// Oauth account Links delete.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> AccountLinksDeleteAsync(string accountLinkId)
        {
            return await _client.DeleteAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath($"/oauth/account_links/{SerializePathParameter(accountLinkId, new PathParameterSpec("accountLinkId", "simple", false))}"));
        }

        /// <summary>
        /// Oauth authorization Urls create.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> AuthorizationUrlsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.RequestAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>("POST", ApiPaths.AppPath("/oauth/authorization_urls"), body, null, null, "application/json", true);
        }

        /// <summary>
        /// Oauth callbacks handle Get.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> CallbacksHandleGetAsync(string providerCode)
        {
            return await _client.GetAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath($"/oauth/callbacks/{SerializePathParameter(providerCode, new PathParameterSpec("providerCode", "simple", false))}"));
        }

        /// <summary>
        /// Oauth callbacks handle Post.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> CallbacksHandlePostAsync(string providerCode, Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath($"/oauth/callbacks/{SerializePathParameter(providerCode, new PathParameterSpec("providerCode", "simple", false))}"), body, null, null, "application/json");
        }

        /// <summary>
        /// Oauth device Authorizations create.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> DeviceAuthorizationsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.RequestAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>("POST", ApiPaths.AppPath("/oauth/device_authorizations"), body, null, null, "application/json", true);
        }

        /// <summary>
        /// Oauth device Authorizations retrieve.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> DeviceAuthorizationsRetrieveAsync(string deviceAuthorizationId)
        {
            return await _client.RequestAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>("GET", ApiPaths.AppPath($"/oauth/device_authorizations/{SerializePathParameter(deviceAuthorizationId, new PathParameterSpec("deviceAuthorizationId", "simple", false))}"), null, null, null, null, true);
        }

        /// <summary>
        /// Oauth device Authorizations password Completions create.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> DeviceAuthorizationsPasswordCompletionsCreateAsync(string deviceAuthorizationId, Dictionary<string, object> body)
        {
            return await _client.RequestAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>("POST", ApiPaths.AppPath($"/oauth/device_authorizations/{SerializePathParameter(deviceAuthorizationId, new PathParameterSpec("deviceAuthorizationId", "simple", false))}/password_completions"), body, null, null, "application/json", true);
        }

        /// <summary>
        /// Oauth device Authorizations scans create.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> DeviceAuthorizationsScansCreateAsync(string deviceAuthorizationId, Dictionary<string, object> body)
        {
            return await _client.RequestAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>("POST", ApiPaths.AppPath($"/oauth/device_authorizations/{SerializePathParameter(deviceAuthorizationId, new PathParameterSpec("deviceAuthorizationId", "simple", false))}/scans"), body, null, null, "application/json", true);
        }

        /// <summary>
        /// Oauth device Authorizations session Exchanges create.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> DeviceAuthorizationsSessionExchangesCreateAsync(string deviceAuthorizationId, Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath($"/oauth/device_authorizations/{SerializePathParameter(deviceAuthorizationId, new PathParameterSpec("deviceAuthorizationId", "simple", false))}/session_exchanges"), body, null, null, "application/json");
        }

        /// <summary>
        /// Oauth grants list.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> GrantsListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.AppPath("/oauth/grants"), queryString));
        }

        /// <summary>
        /// Oauth grants delete.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> GrantsDeleteAsync(string grantId)
        {
            return await _client.DeleteAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath($"/oauth/grants/{SerializePathParameter(grantId, new PathParameterSpec("grantId", "simple", false))}"));
        }

        /// <summary>
        /// Oauth mini Program Sessions create.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> MiniProgramSessionsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.PostAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/oauth/mini_program_sessions"), body, null, null, "application/json");
        }

        /// <summary>
        /// Oauth providers list.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> ProvidersListAsync(int? page = null, int? pageSize = null, string? cursor = null, string? sort = null, string? q = null)
        {
            var queryString = BuildQueryString(new[]
            {
                new QueryParameterSpec("page", page, "form", true, false, null),
                new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
                new QueryParameterSpec("cursor", cursor, "form", true, false, null),
                new QueryParameterSpec("sort", sort, "form", true, false, null),
                new QueryParameterSpec("q", q, "form", true, false, null),
            });
            return await _client.GetAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppendQueryString(ApiPaths.AppPath("/oauth/providers"), queryString));
        }

        /// <summary>
        /// Oauth sessions create.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> SessionsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.RequestAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>("POST", ApiPaths.AppPath("/oauth/sessions"), body, null, null, "application/json", true);
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
