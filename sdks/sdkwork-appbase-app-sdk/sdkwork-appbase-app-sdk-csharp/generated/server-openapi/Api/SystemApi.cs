using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SDKWork.Appbase.AppSdk.Models;
using SdkHttpClient = SDKWork.Appbase.AppSdk.Http.HttpClient;

namespace SDKWork.Appbase.AppSdk.Api
{
    public class SystemApi
    {
        private readonly SdkHttpClient _client;

        public SystemApi(SdkHttpClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Iam account Binding Policy retrieve.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> IamAccountBindingPolicyRetrieveAsync()
        {
            return await _client.RequestAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>("GET", ApiPaths.AppPath("/system/iam/account_binding_policy"), null, null, null, null, true);
        }

        /// <summary>
        /// Iam runtime retrieve.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> IamRuntimeRetrieveAsync()
        {
            return await _client.RequestAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>("GET", ApiPaths.AppPath("/system/iam/runtime"), null, null, null, null, true);
        }

        /// <summary>
        /// Iam verification Policy retrieve.
        /// </summary>
        public async Task<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult?> IamVerificationPolicyRetrieveAsync()
        {
            return await _client.RequestAsync<SDKWork.Appbase.AppSdk.Models.AppbaseApiResult>("GET", ApiPaths.AppPath("/system/iam/verification_policy"), null, null, null, null, true);
        }



    }
}
