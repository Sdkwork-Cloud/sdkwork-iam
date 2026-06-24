package com.sdkwork.appbase.backend.sdk.api

import com.sdkwork.appbase.backend.sdk.http.HttpClient

/**
 * API modules for sdkwork-appbase-backend-sdk
 */
class Api(private val client: HttpClient) {
    val iam: IamApi = IamApi(client)
}
