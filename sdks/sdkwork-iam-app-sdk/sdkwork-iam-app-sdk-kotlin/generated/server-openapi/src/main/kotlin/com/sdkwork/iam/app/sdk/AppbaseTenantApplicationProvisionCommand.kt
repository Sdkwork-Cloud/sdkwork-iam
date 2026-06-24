package com.sdkwork.iam.app.sdk

data class AppbaseTenantApplicationProvisionCommand(
    val authToken: String? = null,
    val username: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val password: String? = null,
    val tenantId: String? = null,
    val organizationId: String? = null,
    val templateId: String? = null,
    val appKey: String? = null,
    val instanceKey: String? = null,
    val displayName: String? = null,
    val environment: String? = null,
    val primaryDomain: String? = null,
    val accessPermissions: List<String>? = null,
    val runtimeConfig: Map<String, Any>? = null
)
