package com.sdkwork.appbase.backend.sdk;

import com.sdkwork.common.core.Types;
import com.sdkwork.appbase.backend.sdk.http.HttpClient;
import com.sdkwork.appbase.backend.sdk.api.IamApi;

public class SdkworkBackendClient {
    private final HttpClient httpClient;
    private IamApi iam;

    public SdkworkBackendClient(String baseUrl) {
        this.httpClient = new HttpClient(baseUrl);
        this.iam = new IamApi(httpClient);
    }

    public SdkworkBackendClient(Types.SdkConfig config) {
        this.httpClient = new HttpClient(config);
        this.iam = new IamApi(httpClient);
    }

    public IamApi getIam() {
        return this.iam;
    }

    public SdkworkBackendClient setApiKey(String apiKey) {
        httpClient.setApiKey(apiKey);
        return this;
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
