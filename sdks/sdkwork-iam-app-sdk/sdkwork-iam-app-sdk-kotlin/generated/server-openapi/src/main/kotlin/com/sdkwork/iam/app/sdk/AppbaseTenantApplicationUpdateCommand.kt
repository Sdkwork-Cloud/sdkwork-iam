package com.sdkwork.iam.app.sdk

data class AppbaseTenantApplicationUpdateCommand(
    val authToken: String? = null,
    val username: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val password: String? = null,
    val primaryDomain: String? = null,
    val domainConfig: Map<String, Any>? = null,
    val accessPermissions: List<String>? = null,
    val runtimeConfig: Map<String, Any>? = null
)
