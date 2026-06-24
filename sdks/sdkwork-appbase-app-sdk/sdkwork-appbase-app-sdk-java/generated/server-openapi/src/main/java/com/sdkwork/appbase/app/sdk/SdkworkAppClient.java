package com.sdkwork.appbase.app.sdk;

import com.sdkwork.common.core.Types;
import com.sdkwork.appbase.app.sdk.http.HttpClient;
import com.sdkwork.appbase.app.sdk.api.AuthApi;
import com.sdkwork.appbase.app.sdk.api.IamApi;
import com.sdkwork.appbase.app.sdk.api.OauthApi;
import com.sdkwork.appbase.app.sdk.api.SystemApi;

public class SdkworkAppClient {
    private final HttpClient httpClient;
    private AuthApi auth;
    private IamApi iam;
    private OauthApi oauth;
    private SystemApi system;

    public SdkworkAppClient(String baseUrl) {
        this.httpClient = new HttpClient(baseUrl);
        this.auth = new AuthApi(httpClient);
        this.iam = new IamApi(httpClient);
        this.oauth = new OauthApi(httpClient);
        this.system = new SystemApi(httpClient);
    }

    public SdkworkAppClient(Types.SdkConfig config) {
        this.httpClient = new HttpClient(config);
        this.auth = new AuthApi(httpClient);
        this.iam = new IamApi(httpClient);
        this.oauth = new OauthApi(httpClient);
        this.system = new SystemApi(httpClient);
    }

    public AuthApi getAuth() {
        return this.auth;
    }

    public IamApi getIam() {
        return this.iam;
    }

    public OauthApi getOauth() {
        return this.oauth;
    }

    public SystemApi getSystem() {
        return this.system;
    }
    public SdkworkAppClient setAuthToken(String token) {
        httpClient.setAuthToken(token);
        return this;
    }

    public SdkworkAppClient setAccessToken(String token) {
        httpClient.setAccessToken(token);
        return this;
    }

    public SdkworkAppClient setHeader(String key, String value) {
        httpClient.setHeader(key, value);
        return this;
    }

    public HttpClient getHttpClient() {
        return httpClient;
    }
}
