package com.sdkwork.appbase.app.sdk.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.sdkwork.appbase.app.sdk.http.HttpClient;
import com.sdkwork.appbase.app.sdk.model.*;
import java.util.List;
import java.util.Map;

public class AuthApi {
    private final HttpClient client;

    public AuthApi(HttpClient client) {
        this.client = client;
    }

    /** Password Reset Requests create. */
    public AppbaseApiResult passwordResetRequestsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/password_reset_requests"), body, null, null, "application/json", true);
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Password Resets create. */
    public AppbaseApiResult passwordResetsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/password_resets"), body, null, null, "application/json", true);
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Registrations create. */
    public AppbaseApiResult registrationsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/registrations"), body, null, null, "application/json", true);
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Sessions create. */
    public AppbaseApiResult sessionsCreate(AppbaseSessionCreateCommand body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/sessions"), body, null, null, "application/json", true);
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Sessions current delete. */
    public AppbaseApiResult sessionsCurrentDelete() throws Exception {
        Object raw = client.delete(ApiPaths.appPath("/auth/sessions/current"));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Sessions current retrieve. */
    public AppbaseApiResult sessionsCurrentRetrieve() throws Exception {
        Object raw = client.get(ApiPaths.appPath("/auth/sessions/current"));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Sessions current update. */
    public AppbaseApiResult sessionsCurrentUpdate(Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.appPath("/auth/sessions/current"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Sessions login Context Selection create. */
    public AppbaseApiResult sessionsLoginContextSelectionCreate(Map<String, Object> body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/sessions/login_context_selection"), body, null, null, "application/json", true);
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Sessions organization Selection create. */
    public AppbaseApiResult sessionsOrganizationSelectionCreate(Map<String, Object> body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/sessions/organization_selection"), body, null, null, "application/json", true);
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Sessions refresh. */
    public AppbaseApiResult sessionsRefresh(Map<String, Object> body) throws Exception {
        Object raw = client.request("POST", ApiPaths.appPath("/auth/sessions/refresh"), body, null, null, "application/json", true);
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }




}
