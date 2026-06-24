using System;
using SDKwork.Common.Core;
using SdkHttpClient = SDKWork.Appbase.OpenSdk.Http.HttpClient;
using SDKWork.Appbase.OpenSdk.Api;

namespace SDKWork.Appbase.OpenSdk
{
    public class SdkworkCustomClient
    {
        private readonly SdkHttpClient _httpClient;

        public IamOauthApi IamOauth { get; }

        public SdkworkCustomClient(string baseUrl)
        {
            _httpClient = new SdkHttpClient(baseUrl);
            IamOauth = new IamOauthApi(_httpClient);
        }

        public SdkworkCustomClient(SdkConfig config)
        {
            _httpClient = new SdkHttpClient(config);
            IamOauth = new IamOauthApi(_httpClient);
        }

        public SdkworkCustomClient SetApiKey(string apiKey)
        {
            _httpClient.SetApiKey(apiKey);
            return this;
        }

        public SdkworkCustomClient SetAuthToken(string token)
        {
            _httpClient.SetAuthToken(token);
            return this;
        }

        public SdkworkCustomClient SetAccessToken(string token)
        {
            _httpClient.SetAccessToken(token);
            return this;
        }

        public SdkworkCustomClient SetHeader(string key, string value)
        {
            _httpClient.SetHeader(key, value);
            return this;
        }
    }
}
