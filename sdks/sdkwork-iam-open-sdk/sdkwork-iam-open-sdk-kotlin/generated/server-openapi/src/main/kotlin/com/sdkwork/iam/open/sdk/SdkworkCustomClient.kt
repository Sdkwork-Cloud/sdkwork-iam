package com.sdkwork.iam.open.sdk

import com.sdkwork.common.core.SdkConfig
import com.sdkwork.iam.open.sdk.http.HttpClient
import com.sdkwork.iam.open.sdk.api.IamOauthApi

open class SdkworkCustomClient {
    private val httpClient: HttpClient

    lateinit var iamOauth: IamOauthApi

    constructor(baseUrl: String) {
        this.httpClient = HttpClient(baseUrl)
        iamOauth = IamOauthApi(httpClient)
    }

    constructor(config: SdkConfig) {
        this.httpClient = HttpClient(config)
        iamOauth = IamOauthApi(httpClient)
    }

    fun setApiKey(apiKey: String): SdkworkCustomClient {
        httpClient.setApiKey(apiKey)
        return this
    }

    fun setAuthToken(token: String): SdkworkCustomClient {
        httpClient.setAuthToken(token)
        return this
    }

    fun setAccessToken(token: String): SdkworkCustomClient {
        httpClient.setAccessToken(token)
        return this
    }

    fun setHeader(key: String, value: String): SdkworkCustomClient {
        httpClient.setHeader(key, value)
        return this
    }
}
