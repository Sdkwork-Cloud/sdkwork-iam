package com.sdkwork.iam.backend.sdk;

import com.sdkwork.common.core.Types;
import com.sdkwork.iam.backend.sdk.http.HttpClient;
import com.sdkwork.iam.backend.sdk.api.IamApi;
import com.sdkwork.iam.backend.sdk.api.IamOauthApi;

public class SdkworkBackendClient {
    private final HttpClient httpClient;
    private IamApi iam;
    private IamOauthApi iamOauth;

    public SdkworkBackendClient(String baseUrl) {
        this.httpClient = new HttpClient(baseUrl);
        this.iam = new IamApi(httpClient);
        this.iamOauth = new IamOauthApi(httpClient);
    }

    public SdkworkBackendClient(Types.SdkConfig config) {
        this.httpClient = new HttpClient(config);
        this.iam = new IamApi(httpClient);
        this.iamOauth = new IamOauthApi(httpClient);
    }

    public IamApi getIam() {
        return this.iam;
    }

    public IamOauthApi getIamOauth() {
        return this.iamOauth;
    }
    public SdkworkBackendClient setAuthToken(String token) {
        httpClient.setAuthToken(token);
        return this;
    }

    public SdkworkBackendClient setAccessToken(String token) {
        httpClient.setAccessToken(token);
        return this;
    }

    public SdkworkBackendClient setHeader(String key, String value) {
        httpClient.setHeader(key, value);
        return this;
    }

    public HttpClient getHttpClient() {
        return httpClient;
    }
}
