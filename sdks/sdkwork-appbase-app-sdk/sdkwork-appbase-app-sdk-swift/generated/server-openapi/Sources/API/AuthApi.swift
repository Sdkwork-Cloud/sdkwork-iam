import Foundation

public class AuthApi {
    private let client: HttpClient
    
    public init(client: HttpClient) {
        self.client = client
    }

    /// Password Reset Requests create.
    public func passwordResetRequestsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.request("POST", ApiPaths.appPath("/auth/password_reset_requests"), body: body, params: nil, headers: nil, contentType: "application/json", skipAuth: true, responseType: AppbaseApiResult.self)
    }

    /// Password Resets create.
    public func passwordResetsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.request("POST", ApiPaths.appPath("/auth/password_resets"), body: body, params: nil, headers: nil, contentType: "application/json", skipAuth: true, responseType: AppbaseApiResult.self)
    }

    /// Registrations create.
    public func registrationsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.request("POST", ApiPaths.appPath("/auth/registrations"), body: body, params: nil, headers: nil, contentType: "application/json", skipAuth: true, responseType: AppbaseApiResult.self)
    }

    /// Sessions create.
    public func sessionsCreate(body: AppbaseSessionCreateCommand) async throws -> AppbaseApiResult? {
        return try await client.request("POST", ApiPaths.appPath("/auth/sessions"), body: body, params: nil, headers: nil, contentType: "application/json", skipAuth: true, responseType: AppbaseApiResult.self)
    }

    /// Sessions current delete.
    public func sessionsCurrentDelete() async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.appPath("/auth/sessions/current"), responseType: AppbaseApiResult.self)
    }

    /// Sessions current retrieve.
    public func sessionsCurrentRetrieve() async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.appPath("/auth/sessions/current"), responseType: AppbaseApiResult.self)
    }

    /// Sessions current update.
    public func sessionsCurrentUpdate(body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.appPath("/auth/sessions/current"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Sessions login Context Selection create.
    public func sessionsLoginContextSelectionCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.request("POST", ApiPaths.appPath("/auth/sessions/login_context_selection"), body: body, params: nil, headers: nil, contentType: "application/json", skipAuth: true, responseType: AppbaseApiResult.self)
    }

    /// Sessions organization Selection create.
    public func sessionsOrganizationSelectionCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.request("POST", ApiPaths.appPath("/auth/sessions/organization_selection"), body: body, params: nil, headers: nil, contentType: "application/json", skipAuth: true, responseType: AppbaseApiResult.self)
    }

    /// Sessions refresh.
    public func sessionsRefresh(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.request("POST", ApiPaths.appPath("/auth/sessions/refresh"), body: body, params: nil, headers: nil, contentType: "application/json", skipAuth: true, responseType: AppbaseApiResult.self)
    }



}
