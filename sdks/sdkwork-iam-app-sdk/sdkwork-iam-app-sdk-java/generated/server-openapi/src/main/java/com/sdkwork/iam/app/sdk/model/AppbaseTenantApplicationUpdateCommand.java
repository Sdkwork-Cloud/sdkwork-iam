package com.sdkwork.iam.app.sdk.model;

import java.util.List;
import java.util.Map;

public class AppbaseTenantApplicationUpdateCommand {
    private String authToken;
    private String username;
    private String email;
    private String phone;
    private String password;
    private String primaryDomain;
    private Map<String, Object> domainConfig;
    private List<String> accessPermissions;
    private Map<String, Object> runtimeConfig;

    public String getAuthToken() {
        return this.authToken;
    }

    public void setAuthToken(String authToken) {
        this.authToken = authToken;
    }

    public String getUsername() {
        return this.username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return this.phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return this.password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPrimaryDomain() {
        return this.primaryDomain;
    }

    public void setPrimaryDomain(String primaryDomain) {
        this.primaryDomain = primaryDomain;
    }

    public Map<String, Object> getDomainConfig() {
        return this.domainConfig;
    }

    public void setDomainConfig(Map<String, Object> domainConfig) {
        this.domainConfig = domainConfig;
    }

    public List<String> getAccessPermissions() {
        return this.accessPermissions;
    }

    public void setAccessPermissions(List<String> accessPermissions) {
        this.accessPermissions = accessPermissions;
    }

    public Map<String, Object> getRuntimeConfig() {
        return this.runtimeConfig;
    }

    public void setRuntimeConfig(Map<String, Object> runtimeConfig) {
        this.runtimeConfig = runtimeConfig;
    }
}
