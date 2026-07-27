package com.sdkwork.iam.app.sdk.api

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.sdkwork.iam.app.sdk.*
import com.sdkwork.iam.app.sdk.http.HttpClient

class AuthApi(private val client: HttpClient) {

    /** Password Reset Requests create. */
    suspend fun passwordResetRequestsCreate(body: Map<String, Any>): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/password_reset_requests"), body, null, null, "application/json", false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Password Resets create. */
    suspend fun passwordResetsCreate(body: Map<String, Any>): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/password_resets"), body, null, null, "application/json", false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Registrations create. */
    suspend fun registrationsCreate(body: Map<String, Any>): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/registrations"), body, null, null, "application/json", false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Sessions create. */
    suspend fun sessionsCreate(body: AppbaseSessionCreateCommand): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/sessions"), body, null, null, "application/json", false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Sessions current delete. */
    suspend fun sessionsCurrentDelete(): Unit {
        client.delete(ApiPaths.appPath("/auth/sessions/current"))
    }

    /** Sessions current retrieve. */
    suspend fun sessionsCurrentRetrieve(): SdkWorkResourceResponse? {
        val raw = client.get(ApiPaths.appPath("/auth/sessions/current"))
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Sessions current update. */
    suspend fun sessionsCurrentUpdate(body: Map<String, Any>? = null): SdkWorkResourceResponse? {
        val raw = client.patch(ApiPaths.appPath("/auth/sessions/current"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Sessions login Context Selection create. */
    suspend fun sessionsLoginContextSelectionCreate(body: Map<String, Any>): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/sessions/login_context_selection"), body, null, null, "application/json", false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Sessions organization Selection create. */
    suspend fun sessionsOrganizationSelectionCreate(body: Map<String, Any>): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/sessions/organization_selection"), body, null, null, "application/json", false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Sessions refresh. */
    suspend fun sessionsRefresh(body: Map<String, Any>): SdkWorkCommandResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/sessions/refresh"), body, null, null, "application/json", true, false)
        return client.convertValue(raw, object : TypeReference<SdkWorkCommandResponse>() {})
    }



}
