package com.sdkwork.appbase.app.sdk.api

import com.sdkwork.appbase.app.sdk.http.HttpClient

/**
 * API modules for sdkwork-appbase-app-sdk
 */
class Api(private val client: HttpClient) {
    val auth: AuthApi = AuthApi(client)
    val iam: IamApi = IamApi(client)
    val oauth: OauthApi = OauthApi(client)
    val system: SystemApi = SystemApi(client)
}
