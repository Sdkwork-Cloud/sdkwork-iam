import Foundation

public class SystemApi {
    private let client: HttpClient
    
    public init(client: HttpClient) {
        self.client = client
    }

    /// Iam account Binding Policy retrieve.
    public func iamAccountBindingPolicyRetrieve() async throws -> SdkWorkResourceResponse? {
        return try await client.request("GET", ApiPaths.appPath("/system/iam/account_binding_policy"), body: nil, params: nil, headers: nil, accessTokenOnly: true, responseType: SdkWorkResourceResponse.self)
    }

    /// Iam runtime retrieve.
    public func iamRuntimeRetrieve() async throws -> SdkWorkResourceResponse? {
        return try await client.request("GET", ApiPaths.appPath("/system/iam/runtime"), body: nil, params: nil, headers: nil, accessTokenOnly: true, responseType: SdkWorkResourceResponse.self)
    }

    /// Iam verification Policy retrieve.
    public func iamVerificationPolicyRetrieve() async throws -> SdkWorkResourceResponse? {
        return try await client.request("GET", ApiPaths.appPath("/system/iam/verification_policy"), body: nil, params: nil, headers: nil, accessTokenOnly: true, responseType: SdkWorkResourceResponse.self)
    }



}
