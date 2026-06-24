package com.sdkwork.appbase.open.sdk.api

import com.sdkwork.appbase.open.sdk.http.HttpClient

/**
 * API modules for sdkwork-appbase-open-sdk
 */
class Api(private val client: HttpClient) {
    val iamOauth: IamOauthApi = IamOauthApi(client)
}
