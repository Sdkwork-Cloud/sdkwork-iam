using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SDKWork.Iam.AppSdk.Models;
using SdkHttpClient = SDKWork.Iam.AppSdk.Http.HttpClient;

namespace SDKWork.Iam.AppSdk.Api
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
        public async Task<SDKWork.Iam.AppSdk.Models.SdkWorkResourceResponse?> IamAccountBindingPolicyRetrieveAsync()
        {
            return await _client.RequestAsync<SDKWork.Iam.AppSdk.Models.SdkWorkResourceResponse>("GET", ApiPaths.AppPath("/system/iam/account_binding_policy"), null, null, null, null, false, true);
        }

        /// <summary>
        /// Iam runtime retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.SdkWorkResourceResponse?> IamRuntimeRetrieveAsync()
        {
            return await _client.RequestAsync<SDKWork.Iam.AppSdk.Models.SdkWorkResourceResponse>("GET", ApiPaths.AppPath("/system/iam/runtime"), null, null, null, null, false, true);
        }

        /// <summary>
        /// Iam verification Policy retrieve.
        /// </summary>
        public async Task<SDKWork.Iam.AppSdk.Models.SdkWorkResourceResponse?> IamVerificationPolicyRetrieveAsync()
        {
            return await _client.RequestAsync<SDKWork.Iam.AppSdk.Models.SdkWorkResourceResponse>("GET", ApiPaths.AppPath("/system/iam/verification_policy"), null, null, null, null, false, true);
        }



    }
}
