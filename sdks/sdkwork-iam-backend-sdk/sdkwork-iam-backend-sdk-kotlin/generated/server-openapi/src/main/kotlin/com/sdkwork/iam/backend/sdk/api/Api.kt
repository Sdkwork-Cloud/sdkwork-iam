package com.sdkwork.iam.backend.sdk.api

import com.sdkwork.iam.backend.sdk.http.HttpClient

/**
 * API modules for sdkwork-iam-backend-sdk
 */
class Api(private val client: HttpClient) {
    val iam: IamApi = IamApi(client)
    val iamOauth: IamOauthApi = IamOauthApi(client)
}
