package com.sdkwork.iam.app.sdk.api

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.sdkwork.iam.app.sdk.*
import com.sdkwork.iam.app.sdk.http.HttpClient

class SystemApi(private val client: HttpClient) {

    /** Iam account Binding Policy retrieve. */
    suspend fun iamAccountBindingPolicyRetrieve(): SdkWorkResourceResponse? {
        val raw = client.request("GET", ApiPaths.appPath("/system/iam/account_binding_policy"), null, null, null, null, false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Iam runtime retrieve. */
    suspend fun iamRuntimeRetrieve(): SdkWorkResourceResponse? {
        val raw = client.request("GET", ApiPaths.appPath("/system/iam/runtime"), null, null, null, null, false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Iam verification Policy retrieve. */
    suspend fun iamVerificationPolicyRetrieve(): SdkWorkResourceResponse? {
        val raw = client.request("GET", ApiPaths.appPath("/system/iam/verification_policy"), null, null, null, null, false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }



}
