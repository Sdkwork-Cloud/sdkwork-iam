import Foundation

public class SystemApi {
    private let client: HttpClient
    
    public init(client: HttpClient) {
        self.client = client
    }

    /// Iam account Binding Policy retrieve.
    public func iamAccountBindingPolicyRetrieve() async throws -> AppbaseApiResult? {
        return try await client.request("GET", ApiPaths.appPath("/system/iam/account_binding_policy"), body: nil, params: nil, headers: nil, skipAuth: true, responseType: AppbaseApiResult.self)
    }

    /// Iam runtime retrieve.
    public func iamRuntimeRetrieve() async throws -> AppbaseApiResult? {
        return try await client.request("GET", ApiPaths.appPath("/system/iam/runtime"), body: nil, params: nil, headers: nil, skipAuth: true, responseType: AppbaseApiResult.self)
    }

    /// Iam verification Policy retrieve.
    public func iamVerificationPolicyRetrieve() async throws -> AppbaseApiResult? {
        return try await client.request("GET", ApiPaths.appPath("/system/iam/verification_policy"), body: nil, params: nil, headers: nil, skipAuth: true, responseType: AppbaseApiResult.self)
    }



}
