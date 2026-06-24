using System;
using SDKwork.Common.Core;
using SdkHttpClient = SDKWork.Iam.BackendSdk.Http.HttpClient;
using SDKWork.Iam.BackendSdk.Api;

namespace SDKWork.Iam.BackendSdk
{
    public class SdkworkBackendClient
    {
        private readonly SdkHttpClient _httpClient;

        public IamApi Iam { get; }
        public IamOauthApi IamOauth { get; }

        public SdkworkBackendClient(string baseUrl)
        {
            _httpClient = new SdkHttpClient(baseUrl);
            Iam = new IamApi(_httpClient);
            IamOauth = new IamOauthApi(_httpClient);
        }

        public SdkworkBackendClient(SdkConfig config)
        {
            _httpClient = new SdkHttpClient(config);
            Iam = new IamApi(_httpClient);
            IamOauth = new IamOauthApi(_httpClient);
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
