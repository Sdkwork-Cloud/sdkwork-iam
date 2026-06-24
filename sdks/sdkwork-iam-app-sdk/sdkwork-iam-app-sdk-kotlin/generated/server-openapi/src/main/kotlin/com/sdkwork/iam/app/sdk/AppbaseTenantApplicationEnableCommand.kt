package com.sdkwork.iam.app.sdk

data class AppbaseTenantApplicationEnableCommand(
    val authToken: String? = null,
    val username: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val password: String? = null
)
