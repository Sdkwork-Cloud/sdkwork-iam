package com.sdkwork.iam.app.sdk.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.sdkwork.iam.app.sdk.http.HttpClient;
import com.sdkwork.iam.app.sdk.model.*;
import java.util.List;
import java.util.Map;

public class AuthApi {
    private final HttpClient client;

    public AuthApi(HttpClient client) {
        this.client = client;
    }

    /** Password Reset Requests create. */
    public SdkWorkResourceResponse passwordResetRequestsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/password_reset_requests"), body, null, null, "application/json", false, true);
        return client.convertValue(raw, new TypeReference<SdkWorkResourceResponse>() {});
    }

    /** Password Resets create. */
    public SdkWorkResourceResponse passwordResetsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/password_resets"), body, null, null, "application/json", false, true);
        return client.convertValue(raw, new TypeReference<SdkWorkResourceResponse>() {});
    }

    /** Registrations create. */
    public SdkWorkResourceResponse registrationsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/registrations"), body, null, null, "application/json", false, true);
        return client.convertValue(raw, new TypeReference<SdkWorkResourceResponse>() {});
    }

    /** Sessions create. */
    public SdkWorkResourceResponse sessionsCreate(AppbaseSessionCreateCommand body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/sessions"), body, null, null, "application/json", false, true);
        return client.convertValue(raw, new TypeReference<SdkWorkResourceResponse>() {});
    }

    /** Sessions current delete. */
    public Void sessionsCurrentDelete() throws Exception {
        client.delete(ApiPaths.appPath("/auth/sessions/current"));
        return null;
    }

    /** Sessions current retrieve. */
    public SdkWorkResourceResponse sessionsCurrentRetrieve() throws Exception {
        Object raw = client.get(ApiPaths.appPath("/auth/sessions/current"));
        return client.convertValue(raw, new TypeReference<SdkWorkResourceResponse>() {});
    }

    /** Sessions current update. */
    public SdkWorkResourceResponse sessionsCurrentUpdate(Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.appPath("/auth/sessions/current"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<SdkWorkResourceResponse>() {});
    }

    /** Sessions login Context Selection create. */
    public SdkWorkResourceResponse sessionsLoginContextSelectionCreate(Map<String, Object> body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/sessions/login_context_selection"), body, null, null, "application/json", false, true);
        return client.convertValue(raw, new TypeReference<SdkWorkResourceResponse>() {});
    }

    /** Sessions organization Selection create. */
    public SdkWorkResourceResponse sessionsOrganizationSelectionCreate(Map<String, Object> body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/sessions/organization_selection"), body, null, null, "application/json", false, true);
        return client.convertValue(raw, new TypeReference<SdkWorkResourceResponse>() {});
    }

    /** Sessions refresh. */
    public SdkWorkCommandResponse sessionsRefresh(Map<String, Object> body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/sessions/refresh"), body, null, null, "application/json", true, false);
        return client.convertValue(raw, new TypeReference<SdkWorkCommandResponse>() {});
    }




}
