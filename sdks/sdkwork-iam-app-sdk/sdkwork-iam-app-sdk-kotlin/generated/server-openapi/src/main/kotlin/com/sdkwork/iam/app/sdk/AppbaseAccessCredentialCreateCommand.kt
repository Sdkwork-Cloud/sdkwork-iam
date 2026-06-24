package com.sdkwork.iam.app.sdk

data class AppbaseAccessCredentialCreateCommand(
    val authToken: String? = null,
    val username: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val password: String? = null,
    val tenantId: String? = null,
    val organizationId: String? = null,
    val tenantApplicationId: String? = null,
    val appId: String? = null,
    val instanceKey: String? = null
)
