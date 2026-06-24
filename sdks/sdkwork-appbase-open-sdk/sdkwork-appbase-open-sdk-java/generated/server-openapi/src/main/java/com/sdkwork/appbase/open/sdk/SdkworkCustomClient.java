package com.sdkwork.appbase.open.sdk;

import com.sdkwork.common.core.Types;
import com.sdkwork.appbase.open.sdk.http.HttpClient;
import com.sdkwork.appbase.open.sdk.api.IamOauthApi;

public class SdkworkCustomClient {
    private final HttpClient httpClient;
    private IamOauthApi iamOauth;

    public SdkworkCustomClient(String baseUrl) {
        this.httpClient = new HttpClient(baseUrl);
        this.iamOauth = new IamOauthApi(httpClient);
    }

    public SdkworkCustomClient(Types.SdkConfig config) {
        this.httpClient = new HttpClient(config);
        this.iamOauth = new IamOauthApi(httpClient);
    }

    public IamOauthApi getIamOauth() {
        return this.iamOauth;
    }

    public SdkworkCustomClient setApiKey(String apiKey) {
        httpClient.setApiKey(apiKey);
        return this;
    }

    public SdkworkCustomClient setAuthToken(String token) {
        httpClient.setAuthToken(token);
        return this;
    }

    public SdkworkCustomClient setAccessToken(String token) {
        httpClient.setAccessToken(token);
        return this;
    }

    public SdkworkCustomClient setHeader(String key, String value) {
        httpClient.setHeader(key, value);
        return this;
    }

    public HttpClient getHttpClient() {
        return httpClient;
    }
}
