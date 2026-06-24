package com.sdkwork.iam.open.sdk.api

import com.sdkwork.iam.open.sdk.http.HttpClient

/**
 * API modules for sdkwork-iam-open-sdk
 */
class Api(private val client: HttpClient) {
    val iamOauth: IamOauthApi = IamOauthApi(client)
}
