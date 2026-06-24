package com.sdkwork.appbase.app.sdk.api

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.sdkwork.appbase.app.sdk.*
import com.sdkwork.appbase.app.sdk.http.HttpClient

class IamApi(private val client: HttpClient) {

    /** Department Assignments list. */
    suspend fun departmentAssignmentsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/department_assignments"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Departments list. */
    suspend fun departmentsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/departments"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Departments tree retrieve. */
    suspend fun departmentsTreeRetrieve(): AppbaseApiResult? {
        val raw = client.get(ApiPaths.appPath("/iam/departments/tree"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Organization Memberships list. */
    suspend fun organizationMembershipsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/organization_memberships"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Organizations list. */
    suspend fun organizationsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/organizations"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Organizations tree retrieve. */
    suspend fun organizationsTreeRetrieve(): AppbaseApiResult? {
        val raw = client.get(ApiPaths.appPath("/iam/organizations/tree"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Position Assignments list. */
    suspend fun positionAssignmentsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/position_assignments"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Positions list. */
    suspend fun positionsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/positions"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Role Bindings list. */
    suspend fun roleBindingsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/role_bindings"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Users current retrieve. */
    suspend fun usersCurrentRetrieve(): AppbaseApiResult? {
        val raw = client.get(ApiPaths.appPath("/iam/users/current"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Users current update. */
    suspend fun usersCurrentUpdate(body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.appPath("/iam/users/current"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Users current email Bindings delete. */
    suspend fun usersCurrentEmailBindingsDelete(): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.appPath("/iam/users/current/email_bindings"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Users current email Bindings create. */
    suspend fun usersCurrentEmailBindingsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.appPath("/iam/users/current/email_bindings"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Users current password update. */
    suspend fun usersCurrentPasswordUpdate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.appPath("/iam/users/current/password"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Users current phone Bindings delete. */
    suspend fun usersCurrentPhoneBindingsDelete(): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.appPath("/iam/users/current/phone_bindings"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Users current phone Bindings create. */
    suspend fun usersCurrentPhoneBindingsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.appPath("/iam/users/current/phone_bindings"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }


    private data class QueryParameterSpec(
        val name: String,
        val value: Any?,
        val style: String,
        val explode: Boolean,
        val allowReserved: Boolean,
        val contentType: String?,
    )

    private val queryObjectMapper = ObjectMapper().registerKotlinModule()

    private fun buildQueryString(parameters: List<QueryParameterSpec>): String {
        val pairs = mutableListOf<String>()
        parameters.forEach { appendSerializedParameter(pairs, it) }
        return pairs.joinToString("&")
    }

    private fun appendSerializedParameter(pairs: MutableList<String>, parameter: QueryParameterSpec) {
        val value = parameter.value ?: return
        if (!parameter.contentType.isNullOrBlank()) {
            val json = queryObjectMapper.writeValueAsString(value)
            pairs += urlEncode(parameter.name) + "=" + encodeQueryValue(json, parameter.allowReserved)
            return
        }

        val style = parameter.style.ifBlank { "form" }
        when (value) {
            is Iterable<*> -> appendArrayParameter(pairs, parameter.name, value, style, parameter.explode, parameter.allowReserved)
            is Map<*, *> -> if (style == "deepObject") {
                appendDeepObjectParameter(pairs, parameter.name, value, parameter.allowReserved)
            } else {
                appendObjectParameter(pairs, parameter.name, value, style, parameter.explode, parameter.allowReserved)
            }
            else -> pairs += urlEncode(parameter.name) + "=" + encodeQueryValue(value.toString(), parameter.allowReserved)
        }
    }

    private fun appendArrayParameter(
        pairs: MutableList<String>,
        name: String,
        values: Iterable<*>,
        style: String,
        explode: Boolean,
        allowReserved: Boolean,
    ) {
        val serialized = values.mapNotNull { it?.toString() }
        if (serialized.isEmpty()) return
        if (style == "form" && explode) {
            serialized.forEach { pairs += urlEncode(name) + "=" + encodeQueryValue(it, allowReserved) }
            return
        }
        pairs += urlEncode(name) + "=" + encodeQueryValue(serialized.joinToString(","), allowReserved)
    }

    private fun appendObjectParameter(
        pairs: MutableList<String>,
        name: String,
        values: Map<*, *>,
        style: String,
        explode: Boolean,
        allowReserved: Boolean,
    ) {
        val serialized = mutableListOf<String>()
        values.forEach { (key, value) ->
            if (value == null) return@forEach
            if (style == "form" && explode) {
                pairs += urlEncode(key.toString()) + "=" + encodeQueryValue(value.toString(), allowReserved)
            } else {
                serialized += key.toString()
                serialized += value.toString()
            }
        }
        if (serialized.isNotEmpty()) {
            pairs += urlEncode(name) + "=" + encodeQueryValue(serialized.joinToString(","), allowReserved)
        }
    }

    private fun appendDeepObjectParameter(pairs: MutableList<String>, name: String, values: Map<*, *>, allowReserved: Boolean) {
        values.forEach { (key, value) ->
            if (value != null) {
                pairs += urlEncode("$name[$key]") + "=" + encodeQueryValue(value.toString(), allowReserved)
            }
        }
    }

    private fun encodeQueryValue(value: String, allowReserved: Boolean): String {
        var encoded = urlEncode(value)
        if (!allowReserved) return encoded
        mapOf(
            "%3A" to ":", "%2F" to "/", "%3F" to "?", "%23" to "#",
            "%5B" to "[", "%5D" to "]", "%40" to "@", "%21" to "!",
            "%24" to "$", "%26" to "&", "%27" to "'", "%28" to "(",
            "%29" to ")", "%2A" to "*", "%2B" to "+", "%2C" to ",",
            "%3B" to ";", "%3D" to "=",
        ).forEach { (escaped, reserved) -> encoded = encoded.replace(escaped, reserved) }
        return encoded
    }

    private fun urlEncode(value: String): String {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8)
    }

}
