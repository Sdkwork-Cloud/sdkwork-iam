import Foundation

public class IamApi {
    private let client: HttpClient
    
    public init(client: HttpClient) {
        self.client = client
    }

    /// Department Assignments list.
    public func departmentAssignmentsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/department_assignments"), query), responseType: AppbaseApiResult.self)
    }

    /// Departments list.
    public func departmentsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/departments"), query), responseType: AppbaseApiResult.self)
    }

    /// Departments tree retrieve.
    public func departmentsTreeRetrieve() async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.appPath("/iam/departments/tree"), responseType: AppbaseApiResult.self)
    }

    /// Organization Memberships list.
    public func organizationMembershipsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/organization_memberships"), query), responseType: AppbaseApiResult.self)
    }

    /// Organizations list.
    public func organizationsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/organizations"), query), responseType: AppbaseApiResult.self)
    }

    /// Organizations tree retrieve.
    public func organizationsTreeRetrieve() async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.appPath("/iam/organizations/tree"), responseType: AppbaseApiResult.self)
    }

    /// Position Assignments list.
    public func positionAssignmentsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/position_assignments"), query), responseType: AppbaseApiResult.self)
    }

    /// Positions list.
    public func positionsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/positions"), query), responseType: AppbaseApiResult.self)
    }

    /// Role Bindings list.
    public func roleBindingsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/role_bindings"), query), responseType: AppbaseApiResult.self)
    }

    /// Users current retrieve.
    public func usersCurrentRetrieve() async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.appPath("/iam/users/current"), responseType: AppbaseApiResult.self)
    }

    /// Users current update.
    public func usersCurrentUpdate(body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.appPath("/iam/users/current"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Users current email Bindings delete.
    public func usersCurrentEmailBindingsDelete() async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.appPath("/iam/users/current/email_bindings"), responseType: AppbaseApiResult.self)
    }

    /// Users current email Bindings create.
    public func usersCurrentEmailBindingsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.appPath("/iam/users/current/email_bindings"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Users current password update.
    public func usersCurrentPasswordUpdate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.appPath("/iam/users/current/password"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Users current phone Bindings delete.
    public func usersCurrentPhoneBindingsDelete() async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.appPath("/iam/users/current/phone_bindings"), responseType: AppbaseApiResult.self)
    }

    /// Users current phone Bindings create.
    public func usersCurrentPhoneBindingsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.appPath("/iam/users/current/phone_bindings"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }


    private struct QueryParameterSpec {
        let name: String
        let value: Any?
        let style: String
        let explode: Bool
        let allowReserved: Bool
        let contentType: String?
    }

    private func buildQueryString(_ parameters: [QueryParameterSpec]) -> String {
        var pairs: [String] = []
        for parameter in parameters {
            appendSerializedParameter(&pairs, parameter)
        }
        return pairs.joined(separator: "&")
    }

    private func appendSerializedParameter(_ pairs: inout [String], _ parameter: QueryParameterSpec) {
        guard let value = parameter.value else { return }
        if let contentType = parameter.contentType, !contentType.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            let data = (try? JSONSerialization.data(withJSONObject: value, options: [])) ?? Data(String(describing: value).utf8)
            let json = String(data: data, encoding: .utf8) ?? String(describing: value)
            pairs.append("\(urlEncode(parameter.name))=\(encodeQueryValue(json, allowReserved: parameter.allowReserved))")
            return
        }

        let style = parameter.style.isEmpty ? "form" : parameter.style
        if style == "deepObject", let object = value as? [String: Any] {
            appendDeepObjectParameter(&pairs, name: parameter.name, values: object, allowReserved: parameter.allowReserved)
        } else if let array = value as? [Any] {
            appendArrayParameter(&pairs, name: parameter.name, values: array, style: style, explode: parameter.explode, allowReserved: parameter.allowReserved)
        } else if let object = value as? [String: Any] {
            appendObjectParameter(&pairs, name: parameter.name, values: object, style: style, explode: parameter.explode, allowReserved: parameter.allowReserved)
        } else {
            pairs.append("\(urlEncode(parameter.name))=\(encodeQueryValue(String(describing: value), allowReserved: parameter.allowReserved))")
        }
    }

    private func appendArrayParameter(
        _ pairs: inout [String],
        name: String,
        values: [Any],
        style: String,
        explode: Bool,
        allowReserved: Bool
    ) {
        let serialized = values.map { String(describing: $0) }
        guard !serialized.isEmpty else { return }
        if style == "form" && explode {
            for item in serialized {
                pairs.append("\(urlEncode(name))=\(encodeQueryValue(item, allowReserved: allowReserved))")
            }
            return
        }
        pairs.append("\(urlEncode(name))=\(encodeQueryValue(serialized.joined(separator: ","), allowReserved: allowReserved))")
    }

    private func appendObjectParameter(
        _ pairs: inout [String],
        name: String,
        values: [String: Any],
        style: String,
        explode: Bool,
        allowReserved: Bool
    ) {
        var serialized: [String] = []
        for (key, value) in values {
            if style == "form" && explode {
                pairs.append("\(urlEncode(key))=\(encodeQueryValue(String(describing: value), allowReserved: allowReserved))")
            } else {
                serialized.append(key)
                serialized.append(String(describing: value))
            }
        }
        if !serialized.isEmpty {
            pairs.append("\(urlEncode(name))=\(encodeQueryValue(serialized.joined(separator: ","), allowReserved: allowReserved))")
        }
    }

    private func appendDeepObjectParameter(_ pairs: inout [String], name: String, values: [String: Any], allowReserved: Bool) {
        for (key, value) in values {
            pairs.append("\(urlEncode("\(name)[\(key)]"))=\(encodeQueryValue(String(describing: value), allowReserved: allowReserved))")
        }
    }

    private func encodeQueryValue(_ value: String, allowReserved: Bool) -> String {
        var encoded = urlEncode(value)
        if !allowReserved { return encoded }
        [
            "%3A": ":", "%2F": "/", "%3F": "?", "%23": "#",
            "%5B": "[", "%5D": "]", "%40": "@", "%21": "!",
            "%24": "$", "%26": "&", "%27": "'", "%28": "(",
            "%29": ")", "%2A": "*", "%2B": "+", "%2C": ",",
            "%3B": ";", "%3D": "=",
        ].forEach { encoded = encoded.replacingOccurrences(of: $0.key, with: $0.value) }
        return encoded
    }

    private func urlEncode(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value
    }

}
