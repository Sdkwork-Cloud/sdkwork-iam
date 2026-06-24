package com.sdkwork.appbase.app.sdk

import com.sdkwork.common.core.SdkConfig
import com.sdkwork.appbase.app.sdk.http.HttpClient
import com.sdkwork.appbase.app.sdk.api.AuthApi
import com.sdkwork.appbase.app.sdk.api.IamApi
import com.sdkwork.appbase.app.sdk.api.OauthApi
import com.sdkwork.appbase.app.sdk.api.SystemApi

open class SdkworkAppClient {
    private val httpClient: HttpClient

    lateinit var auth: AuthApi
    lateinit var iam: IamApi
    lateinit var oauth: OauthApi
    lateinit var system: SystemApi

    constructor(baseUrl: String) {
        this.httpClient = HttpClient(baseUrl)
        auth = AuthApi(httpClient)
        iam = IamApi(httpClient)
        oauth = OauthApi(httpClient)
        system = SystemApi(httpClient)
    }

    constructor(config: SdkConfig) {
        this.httpClient = HttpClient(config)
        auth = AuthApi(httpClient)
        iam = IamApi(httpClient)
        oauth = OauthApi(httpClient)
        system = SystemApi(httpClient)
    }
    fun setAuthToken(token: String): SdkworkAppClient {
        httpClient.setAuthToken(token)
        return this
    }

    fun setAccessToken(token: String): SdkworkAppClient {
        httpClient.setAccessToken(token)
        return this
    }

    fun setHeader(key: String, value: String): SdkworkAppClient {
        httpClient.setHeader(key, value)
        return this
    }
}
