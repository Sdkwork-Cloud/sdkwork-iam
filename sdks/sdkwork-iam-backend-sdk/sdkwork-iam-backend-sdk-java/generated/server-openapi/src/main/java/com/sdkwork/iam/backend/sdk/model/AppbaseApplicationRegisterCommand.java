package com.sdkwork.iam.backend.sdk.model;

import java.util.List;
import java.util.Map;

public class AppbaseApplicationRegisterCommand {
    private String authToken;
    private String username;
    private String email;
    private String phone;
    private String password;
    private String ownerTenantId;
    private String appKey;
    private String name;
    private String displayName;
    private String appType;
    private String packageName;
    private String bundleId;
    private String desktopAppId;
    private String version;
    private String channel;
    private String manifestHash;
    private List<String> defaultAccessPermissions;
    private Map<String, Object> config;
    private List<Map<String, Object>> packages;

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

    public String getOwnerTenantId() {
        return this.ownerTenantId;
    }

    public void setOwnerTenantId(String ownerTenantId) {
        this.ownerTenantId = ownerTenantId;
    }

    public String getAppKey() {
        return this.appKey;
    }

    public void setAppKey(String appKey) {
        this.appKey = appKey;
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDisplayName() {
        return this.displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAppType() {
        return this.appType;
    }

    public void setAppType(String appType) {
        this.appType = appType;
    }

    public String getPackageName() {
        return this.packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public String getBundleId() {
        return this.bundleId;
    }

    public void setBundleId(String bundleId) {
        this.bundleId = bundleId;
    }

    public String getDesktopAppId() {
        return this.desktopAppId;
    }

    public void setDesktopAppId(String desktopAppId) {
        this.desktopAppId = desktopAppId;
    }

    public String getVersion() {
        return this.version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getChannel() {
        return this.channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getManifestHash() {
        return this.manifestHash;
    }

    public void setManifestHash(String manifestHash) {
        this.manifestHash = manifestHash;
    }

    public List<String> getDefaultAccessPermissions() {
        return this.defaultAccessPermissions;
    }

    public void setDefaultAccessPermissions(List<String> defaultAccessPermissions) {
        this.defaultAccessPermissions = defaultAccessPermissions;
    }

    public Map<String, Object> getConfig() {
        return this.config;
    }

    public void setConfig(Map<String, Object> config) {
        this.config = config;
    }

    public List<Map<String, Object>> getPackages() {
        return this.packages;
    }

    public void setPackages(List<Map<String, Object>> packages) {
        this.packages = packages;
    }
}
