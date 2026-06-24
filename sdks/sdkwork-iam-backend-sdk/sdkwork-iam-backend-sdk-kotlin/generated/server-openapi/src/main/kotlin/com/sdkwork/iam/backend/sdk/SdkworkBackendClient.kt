package com.sdkwork.iam.backend.sdk

import com.sdkwork.common.core.SdkConfig
import com.sdkwork.iam.backend.sdk.http.HttpClient
import com.sdkwork.iam.backend.sdk.api.IamApi
import com.sdkwork.iam.backend.sdk.api.IamOauthApi

open class SdkworkBackendClient {
    private val httpClient: HttpClient

    lateinit var iam: IamApi
    lateinit var iamOauth: IamOauthApi

    constructor(baseUrl: String) {
        this.httpClient = HttpClient(baseUrl)
        iam = IamApi(httpClient)
        iamOauth = IamOauthApi(httpClient)
    }

    constructor(config: SdkConfig) {
        this.httpClient = HttpClient(config)
        iam = IamApi(httpClient)
        iamOauth = IamOauthApi(httpClient)
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
