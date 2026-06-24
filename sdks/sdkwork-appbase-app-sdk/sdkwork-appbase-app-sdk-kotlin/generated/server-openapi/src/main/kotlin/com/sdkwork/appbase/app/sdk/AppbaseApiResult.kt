package com.sdkwork.appbase.app.sdk

data class AppbaseApiResult(
    val code: String? = null,
    val message: String? = null,
    val requestId: String? = null,
    val data_: Map<String, Any>? = null
)
