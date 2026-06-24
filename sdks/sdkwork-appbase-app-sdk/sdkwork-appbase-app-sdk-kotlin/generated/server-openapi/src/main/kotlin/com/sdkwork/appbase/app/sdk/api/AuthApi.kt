package com.sdkwork.appbase.app.sdk.api

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.sdkwork.appbase.app.sdk.*
import com.sdkwork.appbase.app.sdk.http.HttpClient

class AuthApi(private val client: HttpClient) {

    /** Password Reset Requests create. */
    suspend fun passwordResetRequestsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/password_reset_requests"), body, null, null, "application/json", true)
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Password Resets create. */
    suspend fun passwordResetsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/password_resets"), body, null, null, "application/json", true)
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Registrations create. */
    suspend fun registrationsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/registrations"), body, null, null, "application/json", true)
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Sessions create. */
    suspend fun sessionsCreate(body: AppbaseSessionCreateCommand): AppbaseApiResult? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/sessions"), body, null, null, "application/json", true)
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Sessions current delete. */
    suspend fun sessionsCurrentDelete(): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.appPath("/auth/sessions/current"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Sessions current retrieve. */
    suspend fun sessionsCurrentRetrieve(): AppbaseApiResult? {
        val raw = client.get(ApiPaths.appPath("/auth/sessions/current"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Sessions current update. */
    suspend fun sessionsCurrentUpdate(body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.appPath("/auth/sessions/current"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Sessions login Context Selection create. */
    suspend fun sessionsLoginContextSelectionCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/sessions/login_context_selection"), body, null, null, "application/json", true)
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Sessions organization Selection create. */
    suspend fun sessionsOrganizationSelectionCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/sessions/organization_selection"), body, null, null, "application/json", true)
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Sessions refresh. */
    suspend fun sessionsRefresh(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.request("POST", ApiPaths.appPath("/auth/sessions/refresh"), body, null, null, "application/json", true)
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }



}
