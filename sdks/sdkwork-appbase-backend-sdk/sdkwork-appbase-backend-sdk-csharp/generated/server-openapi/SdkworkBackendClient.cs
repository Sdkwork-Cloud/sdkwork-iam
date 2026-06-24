using System;
using SDKwork.Common.Core;
using SdkHttpClient = SDKWork.Appbase.BackendSdk.Http.HttpClient;
using SDKWork.Appbase.BackendSdk.Api;

namespace SDKWork.Appbase.BackendSdk
{
    public class SdkworkBackendClient
    {
        private readonly SdkHttpClient _httpClient;

        public IamApi Iam { get; }

        public SdkworkBackendClient(string baseUrl)
        {
            _httpClient = new SdkHttpClient(baseUrl);
            Iam = new IamApi(_httpClient);
        }

        public SdkworkBackendClient(SdkConfig config)
        {
            _httpClient = new SdkHttpClient(config);
            Iam = new IamApi(_httpClient);
        }

        public SdkworkBackendClient SetApiKey(string apiKey)
        {
            _httpClient.SetApiKey(apiKey);
            return this;
        }

        public SdkworkBackendClient SetAuthToken(string token)
        {
            _httpClient.SetAuthToken(token);
            return this;
        }

        public SdkworkBackendClient SetAccessToken(string token)
        {
            _httpClient.SetAccessToken(token);
            return this;
        }

        public SdkworkBackendClient SetHeader(string key, string value)
        {
            _httpClient.SetHeader(key, value);
            return this;
        }
    }
}
