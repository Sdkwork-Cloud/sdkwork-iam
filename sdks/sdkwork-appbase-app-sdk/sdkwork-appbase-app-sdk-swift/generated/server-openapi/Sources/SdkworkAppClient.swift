import Foundation
import SDKworkCommon

public class SdkworkAppClient {
    private let httpClient: HttpClient
    public let auth: AuthApi
    public let iam: IamApi
    public let oauth: OauthApi
    public let system: SystemApi

    public init(baseURL: String) {
        self.httpClient = HttpClient(baseURL: baseURL)
        self.auth = AuthApi(client: httpClient)
        self.iam = IamApi(client: httpClient)
        self.oauth = OauthApi(client: httpClient)
        self.system = SystemApi(client: httpClient)
    }

    public init(config: SdkConfig) {
        self.httpClient = HttpClient(config: config)
        self.auth = AuthApi(client: httpClient)
        self.iam = IamApi(client: httpClient)
        self.oauth = OauthApi(client: httpClient)
        self.system = SystemApi(client: httpClient)
    }
    public func setAuthToken(_ token: String) -> SdkworkAppClient {
        httpClient.setAuthToken(token)
        return self
    }

    public func setAccessToken(_ token: String) -> SdkworkAppClient {
        httpClient.setAccessToken(token)
        return self
    }

    public func setHeader(_ key: String, value: String) -> SdkworkAppClient {
        httpClient.setHeader(key, value: value)
        return self
    }
}
