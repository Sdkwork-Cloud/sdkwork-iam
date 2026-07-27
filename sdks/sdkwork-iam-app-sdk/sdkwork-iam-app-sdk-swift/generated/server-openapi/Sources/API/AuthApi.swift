import Foundation

public class AuthApi {
    private let client: HttpClient
    
    public init(client: HttpClient) {
        self.client = client
    }

    /// Password Reset Requests create.
    public func passwordResetRequestsCreate(body: [String: Any]) async throws -> SdkWorkResourceResponse? {
        return try await client.request("POST", ApiPaths.appPath("/auth/password_reset_requests"), body: body, params: nil, headers: nil, contentType: "application/json", accessTokenOnly: true, responseType: SdkWorkResourceResponse.self)
    }

    /// Password Resets create.
    public func passwordResetsCreate(body: [String: Any]) async throws -> SdkWorkResourceResponse? {
        return try await client.request("POST", ApiPaths.appPath("/auth/password_resets"), body: body, params: nil, headers: nil, contentType: "application/json", accessTokenOnly: true, responseType: SdkWorkResourceResponse.self)
    }

    /// Registrations create.
    public func registrationsCreate(body: [String: Any]) async throws -> SdkWorkResourceResponse? {
        return try await client.request("POST", ApiPaths.appPath("/auth/registrations"), body: body, params: nil, headers: nil, contentType: "application/json", accessTokenOnly: true, responseType: SdkWorkResourceResponse.self)
    }

    /// Sessions create.
    public func sessionsCreate(body: AppbaseSessionCreateCommand) async throws -> SdkWorkResourceResponse? {
        return try await client.request("POST", ApiPaths.appPath("/auth/sessions"), body: body, params: nil, headers: nil, contentType: "application/json", accessTokenOnly: true, responseType: SdkWorkResourceResponse.self)
    }

    /// Sessions current delete.
    public func sessionsCurrentDelete() async throws -> Void {
        _ = try await client.delete(ApiPaths.appPath("/auth/sessions/current"))
    }

    /// Sessions current retrieve.
    public func sessionsCurrentRetrieve() async throws -> SdkWorkResourceResponse? {
        return try await client.get(ApiPaths.appPath("/auth/sessions/current"), responseType: SdkWorkResourceResponse.self)
    }

    /// Sessions current update.
    public func sessionsCurrentUpdate(body: [String: Any]? = nil) async throws -> SdkWorkResourceResponse? {
        return try await client.patch(ApiPaths.appPath("/auth/sessions/current"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: SdkWorkResourceResponse.self)
    }

    /// Sessions login Context Selection create.
    public func sessionsLoginContextSelectionCreate(body: [String: Any]) async throws -> SdkWorkResourceResponse? {
        return try await client.request("POST", ApiPaths.appPath("/auth/sessions/login_context_selection"), body: body, params: nil, headers: nil, contentType: "application/json", accessTokenOnly: true, responseType: SdkWorkResourceResponse.self)
    }

    /// Sessions organization Selection create.
    public func sessionsOrganizationSelectionCreate(body: [String: Any]) async throws -> SdkWorkResourceResponse? {
        return try await client.request("POST", ApiPaths.appPath("/auth/sessions/organization_selection"), body: body, params: nil, headers: nil, contentType: "application/json", accessTokenOnly: true, responseType: SdkWorkResourceResponse.self)
    }

    /// Sessions refresh.
    public func sessionsRefresh(body: [String: Any]) async throws -> SdkWorkCommandResponse? {
        return try await client.request("POST", ApiPaths.appPath("/auth/sessions/refresh"), body: body, params: nil, headers: nil, contentType: "application/json", skipAuth: true, responseType: SdkWorkCommandResponse.self)
    }



}
