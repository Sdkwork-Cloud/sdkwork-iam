package com.sdkwork.iam.app.sdk.api

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.sdkwork.iam.app.sdk.*
import com.sdkwork.iam.app.sdk.http.HttpClient

class OauthApi(private val client: HttpClient) {

    /** Account Links list. */
    suspend fun accountLinksList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): SdkWorkListResponse? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/oauth/account_links"), query))
        return client.convertValue(raw, object : TypeReference<SdkWorkListResponse>() {})
    }

    /** Account Links delete. */
    suspend fun accountLinksDelete(accountLinkId: String): Unit {
        client.delete(ApiPaths.appPath("/oauth/account_links/${serializePathParameter(accountLinkId, PathParameterSpec("accountLinkId", "simple", false))}"))
    }

    /** Authorization Urls create. */
    suspend fun authorizationUrlsCreate(body: Map<String, Any>): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/oauth/authorization_urls"), body, null, null, "application/json", false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Authorizations completions create. */
    suspend fun authorizationsCompletionsCreate(authorizationStateId: String, body: Map<String, Any>): SdkWorkResourceResponse? {
        val raw = client.post(ApiPaths.appPath("/oauth/authorizations/${serializePathParameter(authorizationStateId, PathParameterSpec("authorizationStateId", "simple", false))}/completions"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Callbacks retrieve. */
    suspend fun callbacksRetrieve(providerCode: String): SdkWorkResourceResponse? {
        val raw = client.request("GET", ApiPaths.appPath("/oauth/callbacks/${serializePathParameter(providerCode, PathParameterSpec("providerCode", "simple", false))}"), null, null, null, null, false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Callbacks create. */
    suspend fun callbacksCreate(providerCode: String, body: Map<String, Any>): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/oauth/callbacks/${serializePathParameter(providerCode, PathParameterSpec("providerCode", "simple", false))}"), body, null, null, "application/json", false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Device Authorizations create. */
    suspend fun deviceAuthorizationsCreate(body: Map<String, Any>): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/oauth/device_authorizations"), body, null, null, "application/json", true, false)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Device Authorizations retrieve. */
    suspend fun deviceAuthorizationsRetrieve(deviceAuthorizationId: String): SdkWorkResourceResponse? {
        val raw = client.request("GET", ApiPaths.appPath("/oauth/device_authorizations/${serializePathParameter(deviceAuthorizationId, PathParameterSpec("deviceAuthorizationId", "simple", false))}"), null, null, null, null, true, false)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Device Authorizations password Completions create. */
    suspend fun deviceAuthorizationsPasswordCompletionsCreate(deviceAuthorizationId: String, body: Map<String, Any>): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/oauth/device_authorizations/${serializePathParameter(deviceAuthorizationId, PathParameterSpec("deviceAuthorizationId", "simple", false))}/password_completions"), body, null, null, "application/json", false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Device Authorizations scans create. */
    suspend fun deviceAuthorizationsScansCreate(deviceAuthorizationId: String, body: Map<String, Any>): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/oauth/device_authorizations/${serializePathParameter(deviceAuthorizationId, PathParameterSpec("deviceAuthorizationId", "simple", false))}/scans"), body, null, null, "application/json", false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Device Authorizations session Exchanges create. */
    suspend fun deviceAuthorizationsSessionExchangesCreate(deviceAuthorizationId: String, body: Map<String, Any>): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/oauth/device_authorizations/${serializePathParameter(deviceAuthorizationId, PathParameterSpec("deviceAuthorizationId", "simple", false))}/session_exchanges"), body, null, null, "application/json", true, false)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Grants list. */
    suspend fun grantsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): SdkWorkListResponse? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/oauth/grants"), query))
        return client.convertValue(raw, object : TypeReference<SdkWorkListResponse>() {})
    }

    /** Grants delete. */
    suspend fun grantsDelete(grantId: String): Unit {
        client.delete(ApiPaths.appPath("/oauth/grants/${serializePathParameter(grantId, PathParameterSpec("grantId", "simple", false))}"))
    }

    /** Mini Program Sessions create. */
    suspend fun miniProgramSessionsCreate(body: WechatMiniProgramSessionCreateCommand): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/oauth/mini_program_sessions"), body, null, null, "application/json", false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    /** Providers list. */
    suspend fun providersList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): SdkWorkListResponse? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.request("GET", ApiPaths.appendQueryString(ApiPaths.appPath("/oauth/providers"), query), null, null, null, null, false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkListResponse>() {})
    }

    /** Sessions create. */
    suspend fun sessionsCreate(body: AppbaseSessionCreateCommand): SdkWorkResourceResponse? {
        val raw = client.request("POST", ApiPaths.appPath("/oauth/sessions"), body, null, null, "application/json", false, true)
        return client.convertValue(raw, object : TypeReference<SdkWorkResourceResponse>() {})
    }

    private data class PathParameterSpec(val name: String, val style: String, val explode: Boolean)

    private fun serializePathParameter(value: Any?, spec: PathParameterSpec): String {
        if (value == null) return ""
        val style = spec.style.ifBlank { "simple" }
        return when (value) {
            is Iterable<*> -> serializePathArray(spec.name, value, style, spec.explode)
            is Map<*, *> -> serializePathObject(spec.name, value, style, spec.explode)
            else -> pathPrimitivePrefix(spec.name, style) + pathEncode(value.toString())
        }
    }

    private fun serializePathArray(name: String, values: Iterable<*>, style: String, explode: Boolean): String {
        val serialized = values.mapNotNull { it?.toString()?.let(::pathEncode) }
        if (serialized.isEmpty()) return pathPrefix(name, style)
        if (style == "matrix") {
            if (explode) {
                return serialized.joinToString("") { ";$name=$it" }
            }
            return ";$name=" + serialized.joinToString(",")
        }
        val separator = if (explode) "." else ","
        return pathPrefix(name, style) + serialized.joinToString(separator)
    }

    private fun serializePathObject(name: String, values: Map<*, *>, style: String, explode: Boolean): String {
        val entries = mutableListOf<String>()
        val exploded = mutableListOf<String>()
        values.forEach { (key, value) ->
            if (value == null) return@forEach
            val escapedKey = pathEncode(key.toString())
            val escapedValue = pathEncode(value.toString())
            if (explode) {
                if (style == "matrix") {
                    exploded += ";$escapedKey=$escapedValue"
                } else {
                    exploded += "$escapedKey=$escapedValue"
                }
            } else {
                entries += escapedKey
                entries += escapedValue
            }
        }
        if (style == "matrix") {
            if (explode) return exploded.joinToString("")
            return ";$name=" + entries.joinToString(",")
        }
        if (explode) {
            val separator = if (style == "label") "." else ","
            return pathPrefix(name, style) + exploded.joinToString(separator)
        }
        return pathPrefix(name, style) + entries.joinToString(",")
    }

    private fun pathPrefix(name: String, style: String): String {
        return when (style) {
            "label" -> "."
            "matrix" -> ";$name"
            else -> ""
        }
    }

    private fun pathPrimitivePrefix(name: String, style: String): String {
        return if (style == "matrix") ";$name=" else pathPrefix(name, style)
    }

    private fun pathEncode(value: String): String {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20")
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
