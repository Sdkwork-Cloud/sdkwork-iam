package com.sdkwork.appbase.backend.sdk

import com.sdkwork.common.core.SdkConfig
import com.sdkwork.appbase.backend.sdk.http.HttpClient
import com.sdkwork.appbase.backend.sdk.api.IamApi

class SdkworkBackendClient {
    private val httpClient: HttpClient

    lateinit var iam: IamApi

    constructor(baseUrl: String) {
        this.httpClient = HttpClient(baseUrl)
        iam = IamApi(httpClient)
    }

    constructor(config: SdkConfig) {
        this.httpClient = HttpClient(config)
        iam = IamApi(httpClient)
    }

    fun setApiKey(apiKey: String): SdkworkBackendClient {
        httpClient.setApiKey(apiKey)
        return this
    }

    fun setAuthToken(token: String): SdkworkBackendClient {
        httpClient.setAuthToken(token)
        return this
    }

    fun setAccessToken(token: String): SdkworkBackendClient {
        httpClient.setAccessToken(token)
        return this
    }

    fun setHeader(key: String, value: String): SdkworkBackendClient {
        httpClient.setHeader(key, value)
        return this
    }
}
