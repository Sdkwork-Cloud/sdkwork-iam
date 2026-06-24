package com.sdkwork.appbase.app.sdk

data class AppbaseApplicationRegisterCommand(
    val authToken: String? = null,
    val username: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val password: String? = null,
    val ownerTenantId: String? = null,
    val appKey: String? = null,
    val name: String? = null,
    val displayName: String? = null,
    val appType: String? = null,
    val packageName: String? = null,
    val bundleId: String? = null,
    val desktopAppId: String? = null,
    val version: String? = null,
    val channel: String? = null,
    val manifestHash: String? = null,
    val defaultAccessPermissions: List<String>? = null,
    val config: Map<String, Any>? = null,
    val packages: List<Map<String, Any>>? = null
)
