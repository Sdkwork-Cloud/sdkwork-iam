using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SDKWork.Iam.AppSdk.Models;
using SdkHttpClient = SDKWork.Iam.AppSdk.Http.HttpClient;

namespace SDKWork.Iam.AppSdk.Api
{
    public class AuthApi
    {
        private readonly SdkHttpClient _client;

        public AuthApi(SdkHttpClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Password Reset Requests create.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> PasswordResetRequestsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.RequestAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>("POST", ApiPaths.AppPath("/auth/password_reset_requests"), body, null, null, "application/json", true);
        }

        /// <summary>
        /// Password Resets create.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> PasswordResetsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.RequestAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>("POST", ApiPaths.AppPath("/auth/password_resets"), body, null, null, "application/json", true);
        }

        /// <summary>
        /// Registrations create.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> RegistrationsCreateAsync(Dictionary<string, object> body)
        {
            return await _client.RequestAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>("POST", ApiPaths.AppPath("/auth/registrations"), body, null, null, "application/json", true);
        }

        /// <summary>
        /// Sessions create.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> SessionsCreateAsync(SDKWork.Iam.AppSdk.Models.AppbaseSessionCreateCommand body)
        {
            return await _client.RequestAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>("POST", ApiPaths.AppPath("/auth/sessions"), body, null, null, "application/json", true);
        }

        /// <summary>
        /// Sessions current delete.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> SessionsCurrentDeleteAsync()
        {
            return await _client.DeleteAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/auth/sessions/current"));
        }

        /// <summary>
        /// Sessions current retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> SessionsCurrentRetrieveAsync()
        {
            return await _client.GetAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/auth/sessions/current"));
        }

        /// <summary>
        /// Sessions current update.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> SessionsCurrentUpdateAsync(Dictionary<string, object>? body = null)
        {
            return await _client.PatchAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>(ApiPaths.AppPath("/auth/sessions/current"), body, null, null, "application/json");
        }

        /// <summary>
        /// Sessions login Context Selection create.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> SessionsLoginContextSelectionCreateAsync(Dictionary<string, object> body)
        {
            return await _client.RequestAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>("POST", ApiPaths.AppPath("/auth/sessions/login_context_selection"), body, null, null, "application/json", true);
        }

        /// <summary>
        /// Sessions organization Selection create.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> SessionsOrganizationSelectionCreateAsync(Dictionary<string, object> body)
        {
            return await _client.RequestAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>("POST", ApiPaths.AppPath("/auth/sessions/organization_selection"), body, null, null, "application/json", true);
        }

        /// <summary>
        /// Sessions refresh.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.AppbaseApiResult?> SessionsRefreshAsync(Dictionary<string, object> body)
        {
            return await _client.RequestAsync<SDKWork.Iam.AppSdk.Models.AppbaseApiResult>("POST", ApiPaths.AppPath("/auth/sessions/refresh"), body, null, null, "application/json", true);
        }



    }
}
