package com.sdkwork.iam.app.sdk.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.sdkwork.iam.app.sdk.http.HttpClient;
import com.sdkwork.iam.app.sdk.model.*;
import java.util.List;
import java.util.Map;

public class SystemApi {
    private final HttpClient client;

    public SystemApi(HttpClient client) {
        this.client = client;
    }

    /** Iam account Binding Policy retrieve. */
    public SdkWorkResourceResponse iamAccountBindingPolicyRetrieve() throws Exception {
        Object raw = client.request("GET", ApiPaths.appPath("/system/iam/account_binding_policy"), null, null, null, null, false, true);
        return client.convertValue(raw, new TypeReference<SdkWorkResourceResponse>() {});
    }

    /** Iam runtime retrieve. */
    public SdkWorkResourceResponse iamRuntimeRetrieve() throws Exception {
        Object raw = client.request("GET", ApiPaths.appPath("/system/iam/runtime"), null, null, null, null, false, true);
        return client.convertValue(raw, new TypeReference<SdkWorkResourceResponse>() {});
    }

    /** Iam verification Policy retrieve. */
    public SdkWorkResourceResponse iamVerificationPolicyRetrieve() throws Exception {
        Object raw = client.request("GET", ApiPaths.appPath("/system/iam/verification_policy"), null, null, null, null, false, true);
        return client.convertValue(raw, new TypeReference<SdkWorkResourceResponse>() {});
    }




}
