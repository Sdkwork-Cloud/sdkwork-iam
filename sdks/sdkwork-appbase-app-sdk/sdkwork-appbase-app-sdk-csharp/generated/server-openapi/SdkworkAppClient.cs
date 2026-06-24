using System;
using SDKwork.Common.Core;
using SdkHttpClient = SDKWork.Appbase.AppSdk.Http.HttpClient;
using SDKWork.Appbase.AppSdk.Api;

namespace SDKWork.Appbase.AppSdk
{
    public class SdkworkAppClient
    {
        private readonly SdkHttpClient _httpClient;

        public AuthApi Auth { get; }
        public IamApi Iam { get; }
        public OauthApi Oauth { get; }
        public SystemApi System { get; }

        public SdkworkAppClient(string baseUrl)
        {
            _httpClient = new SdkHttpClient(baseUrl);
            Auth = new AuthApi(_httpClient);
            Iam = new IamApi(_httpClient);
            Oauth = new OauthApi(_httpClient);
            System = new SystemApi(_httpClient);
        }

        public SdkworkAppClient(SdkConfig config)
        {
            _httpClient = new SdkHttpClient(config);
            Auth = new AuthApi(_httpClient);
            Iam = new IamApi(_httpClient);
            Oauth = new OauthApi(_httpClient);
            System = new SystemApi(_httpClient);
        }
        public SdkworkAppClient SetAuthToken(string token)
        {
            _httpClient.SetAuthToken(token);
            return this;
        }

        public SdkworkAppClient SetAccessToken(string token)
        {
            _httpClient.SetAccessToken(token);
            return this;
        }

        public SdkworkAppClient SetHeader(string key, string value)
        {
            _httpClient.SetHeader(key, value);
            return this;
        }
    }
}
