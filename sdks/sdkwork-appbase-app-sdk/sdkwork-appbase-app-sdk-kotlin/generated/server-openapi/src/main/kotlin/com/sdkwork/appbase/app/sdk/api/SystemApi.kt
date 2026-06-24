package com.sdkwork.appbase.app.sdk.api

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.sdkwork.appbase.app.sdk.*
import com.sdkwork.appbase.app.sdk.http.HttpClient

class SystemApi(private val client: HttpClient) {

    /** Iam account Binding Policy retrieve. */
    suspend fun iamAccountBindingPolicyRetrieve(): AppbaseApiResult? {
        val raw = client.request("GET", ApiPaths.appPath("/system/iam/account_binding_policy"), null, null, null, null, true)
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam runtime retrieve. */
    suspend fun iamRuntimeRetrieve(): AppbaseApiResult? {
        val raw = client.request("GET", ApiPaths.appPath("/system/iam/runtime"), null, null, null, null, true)
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Iam verification Policy retrieve. */
    suspend fun iamVerificationPolicyRetrieve(): AppbaseApiResult? {
        val raw = client.request("GET", ApiPaths.appPath("/system/iam/verification_policy"), null, null, null, null, true)
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }



}
