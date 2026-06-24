import Foundation

public class IamApi {
    private let client: HttpClient
    
    public init(client: HttpClient) {
        self.client = client
    }

    /// Access Credentials create.
    public func accessCredentialsCreate(body: AppbaseAccessCredentialCreateCommand) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/access_credentials"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Account Binding Policy retrieve.
    public func accountBindingPolicyRetrieve() async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/account_binding_policy"), responseType: AppbaseApiResult.self)
    }

    /// Account Binding Policy update.
    public func accountBindingPolicyUpdate(body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/account_binding_policy"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Api Keys list.
    public func apiKeysList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/api_keys"), query), responseType: AppbaseApiResult.self)
    }

    /// Api Keys revoke.
    public func apiKeysRevoke(apiKeyId: String, body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/api_keys/\(serializePathParameter(apiKeyId, PathParameterSpec(name: "apiKeyId", style: "simple", explode: false)))/revoke"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Applications register.
    public func applicationsRegister(body: AppbaseApplicationRegisterCommand) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/applications/register"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Audit Events list.
    public func auditEventsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/audit_events"), query), responseType: AppbaseApiResult.self)
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
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/department_assignments"), query), responseType: AppbaseApiResult.self)
    }

    /// Department Assignments create.
    public func departmentAssignmentsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/department_assignments"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Department Assignments update.
    public func departmentAssignmentsUpdate(assignmentId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/department_assignments/\(serializePathParameter(assignmentId, PathParameterSpec(name: "assignmentId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
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
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/departments"), query), responseType: AppbaseApiResult.self)
    }

    /// Departments create.
    public func departmentsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/departments"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Departments delete.
    public func departmentsDelete(departmentId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/departments/\(serializePathParameter(departmentId, PathParameterSpec(name: "departmentId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Departments retrieve.
    public func departmentsRetrieve(departmentId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/departments/\(serializePathParameter(departmentId, PathParameterSpec(name: "departmentId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Departments update.
    public func departmentsUpdate(departmentId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/departments/\(serializePathParameter(departmentId, PathParameterSpec(name: "departmentId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Departments tree retrieve.
    public func departmentsTreeRetrieve() async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/departments/tree"), responseType: AppbaseApiResult.self)
    }

    /// Groups list.
    public func groupsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/groups"), query), responseType: AppbaseApiResult.self)
    }

    /// Groups create.
    public func groupsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/groups"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Groups delete.
    public func groupsDelete(groupId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/groups/\(serializePathParameter(groupId, PathParameterSpec(name: "groupId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Groups retrieve.
    public func groupsRetrieve(groupId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/groups/\(serializePathParameter(groupId, PathParameterSpec(name: "groupId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Groups update.
    public func groupsUpdate(groupId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/groups/\(serializePathParameter(groupId, PathParameterSpec(name: "groupId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Groups members list.
    public func groupsMembersList(groupId: String, page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/groups/\(serializePathParameter(groupId, PathParameterSpec(name: "groupId", style: "simple", explode: false)))/members"), query), responseType: AppbaseApiResult.self)
    }

    /// Groups members create.
    public func groupsMembersCreate(groupId: String, body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/groups/\(serializePathParameter(groupId, PathParameterSpec(name: "groupId", style: "simple", explode: false)))/members"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Groups members delete.
    public func groupsMembersDelete(groupId: String, memberId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/groups/\(serializePathParameter(groupId, PathParameterSpec(name: "groupId", style: "simple", explode: false)))/members/\(serializePathParameter(memberId, PathParameterSpec(name: "memberId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
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
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/organization_memberships"), query), responseType: AppbaseApiResult.self)
    }

    /// Organization Memberships create.
    public func organizationMembershipsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/organization_memberships"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Organization Memberships update.
    public func organizationMembershipsUpdate(membershipId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/organization_memberships/\(serializePathParameter(membershipId, PathParameterSpec(name: "membershipId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
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
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/organizations"), query), responseType: AppbaseApiResult.self)
    }

    /// Organizations create.
    public func organizationsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/organizations"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Organizations delete.
    public func organizationsDelete(organizationId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/organizations/\(serializePathParameter(organizationId, PathParameterSpec(name: "organizationId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Organizations retrieve.
    public func organizationsRetrieve(organizationId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/organizations/\(serializePathParameter(organizationId, PathParameterSpec(name: "organizationId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Organizations update.
    public func organizationsUpdate(organizationId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/organizations/\(serializePathParameter(organizationId, PathParameterSpec(name: "organizationId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Organizations tree retrieve.
    public func organizationsTreeRetrieve() async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/organizations/tree"), responseType: AppbaseApiResult.self)
    }

    /// Permissions list.
    public func permissionsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/permissions"), query), responseType: AppbaseApiResult.self)
    }

    /// Permissions create.
    public func permissionsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/permissions"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Permissions delete.
    public func permissionsDelete(permissionId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/permissions/\(serializePathParameter(permissionId, PathParameterSpec(name: "permissionId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Permissions retrieve.
    public func permissionsRetrieve(permissionId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/permissions/\(serializePathParameter(permissionId, PathParameterSpec(name: "permissionId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Permissions update.
    public func permissionsUpdate(permissionId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/permissions/\(serializePathParameter(permissionId, PathParameterSpec(name: "permissionId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Policies list.
    public func policiesList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/policies"), query), responseType: AppbaseApiResult.self)
    }

    /// Policies create.
    public func policiesCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/policies"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Policies delete.
    public func policiesDelete(policyId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/policies/\(serializePathParameter(policyId, PathParameterSpec(name: "policyId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Policies retrieve.
    public func policiesRetrieve(policyId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/policies/\(serializePathParameter(policyId, PathParameterSpec(name: "policyId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Policies update.
    public func policiesUpdate(policyId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/policies/\(serializePathParameter(policyId, PathParameterSpec(name: "policyId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
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
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/position_assignments"), query), responseType: AppbaseApiResult.self)
    }

    /// Position Assignments create.
    public func positionAssignmentsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/position_assignments"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Position Assignments update.
    public func positionAssignmentsUpdate(assignmentId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/position_assignments/\(serializePathParameter(assignmentId, PathParameterSpec(name: "assignmentId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
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
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/positions"), query), responseType: AppbaseApiResult.self)
    }

    /// Positions create.
    public func positionsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/positions"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Positions delete.
    public func positionsDelete(positionId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/positions/\(serializePathParameter(positionId, PathParameterSpec(name: "positionId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Positions update.
    public func positionsUpdate(positionId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/positions/\(serializePathParameter(positionId, PathParameterSpec(name: "positionId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
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
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/role_bindings"), query), responseType: AppbaseApiResult.self)
    }

    /// Role Bindings create.
    public func roleBindingsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/role_bindings"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Role Bindings delete.
    public func roleBindingsDelete(roleBindingId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/role_bindings/\(serializePathParameter(roleBindingId, PathParameterSpec(name: "roleBindingId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Roles list.
    public func rolesList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/roles"), query), responseType: AppbaseApiResult.self)
    }

    /// Roles create.
    public func rolesCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/roles"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Roles delete.
    public func rolesDelete(roleId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/roles/\(serializePathParameter(roleId, PathParameterSpec(name: "roleId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Roles retrieve.
    public func rolesRetrieve(roleId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/roles/\(serializePathParameter(roleId, PathParameterSpec(name: "roleId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Roles update.
    public func rolesUpdate(roleId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/roles/\(serializePathParameter(roleId, PathParameterSpec(name: "roleId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Roles permissions list.
    public func rolesPermissionsList(roleId: String, page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/roles/\(serializePathParameter(roleId, PathParameterSpec(name: "roleId", style: "simple", explode: false)))/permissions"), query), responseType: AppbaseApiResult.self)
    }

    /// Roles permissions create.
    public func rolesPermissionsCreate(roleId: String, body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/roles/\(serializePathParameter(roleId, PathParameterSpec(name: "roleId", style: "simple", explode: false)))/permissions"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Roles permissions delete.
    public func rolesPermissionsDelete(roleId: String, permissionId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/roles/\(serializePathParameter(roleId, PathParameterSpec(name: "roleId", style: "simple", explode: false)))/permissions/\(serializePathParameter(permissionId, PathParameterSpec(name: "permissionId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Security Events list.
    public func securityEventsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/security_events"), query), responseType: AppbaseApiResult.self)
    }

    /// Service Accounts list.
    public func serviceAccountsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/service_accounts"), query), responseType: AppbaseApiResult.self)
    }

    /// Service Accounts create.
    public func serviceAccountsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/service_accounts"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Service Accounts delete.
    public func serviceAccountsDelete(serviceAccountId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/service_accounts/\(serializePathParameter(serviceAccountId, PathParameterSpec(name: "serviceAccountId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Service Accounts retrieve.
    public func serviceAccountsRetrieve(serviceAccountId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/service_accounts/\(serializePathParameter(serviceAccountId, PathParameterSpec(name: "serviceAccountId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Service Accounts update.
    public func serviceAccountsUpdate(serviceAccountId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/service_accounts/\(serializePathParameter(serviceAccountId, PathParameterSpec(name: "serviceAccountId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Tenant Applications provision.
    public func tenantApplicationsProvision(body: AppbaseTenantApplicationProvisionCommand) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/tenant_applications"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Tenant Applications update.
    public func tenantApplicationsUpdate(tenantApplicationId: String, body: AppbaseTenantApplicationUpdateCommand? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/tenant_applications/\(serializePathParameter(tenantApplicationId, PathParameterSpec(name: "tenantApplicationId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Tenant Applications enable.
    public func tenantApplicationsEnable(tenantApplicationId: String, body: AppbaseTenantApplicationEnableCommand) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/tenant_applications/\(serializePathParameter(tenantApplicationId, PathParameterSpec(name: "tenantApplicationId", style: "simple", explode: false)))/enable"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Tenants list.
    public func tenantsList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/tenants"), query), responseType: AppbaseApiResult.self)
    }

    /// Tenants create.
    public func tenantsCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/tenants"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Tenants delete.
    public func tenantsDelete(tenantId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/tenants/\(serializePathParameter(tenantId, PathParameterSpec(name: "tenantId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Tenants retrieve.
    public func tenantsRetrieve(tenantId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/tenants/\(serializePathParameter(tenantId, PathParameterSpec(name: "tenantId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Tenants update.
    public func tenantsUpdate(tenantId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/tenants/\(serializePathParameter(tenantId, PathParameterSpec(name: "tenantId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Tenants members list.
    public func tenantsMembersList(tenantId: String, page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/tenants/\(serializePathParameter(tenantId, PathParameterSpec(name: "tenantId", style: "simple", explode: false)))/members"), query), responseType: AppbaseApiResult.self)
    }

    /// Tenants members create.
    public func tenantsMembersCreate(tenantId: String, body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/tenants/\(serializePathParameter(tenantId, PathParameterSpec(name: "tenantId", style: "simple", explode: false)))/members"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Tenants members delete.
    public func tenantsMembersDelete(tenantId: String, userId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/tenants/\(serializePathParameter(tenantId, PathParameterSpec(name: "tenantId", style: "simple", explode: false)))/members/\(serializePathParameter(userId, PathParameterSpec(name: "userId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Tenants members update.
    public func tenantsMembersUpdate(tenantId: String, userId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/tenants/\(serializePathParameter(tenantId, PathParameterSpec(name: "tenantId", style: "simple", explode: false)))/members/\(serializePathParameter(userId, PathParameterSpec(name: "userId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Users list.
    public func usersList(page: Int? = nil, pageSize: Int? = nil, cursor: String? = nil, sort: String? = nil, q: String? = nil) async throws -> AppbaseApiResult? {
        let query = buildQueryString([
            QueryParameterSpec(name: "page", value: page, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "page_size", value: pageSize, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "cursor", value: cursor, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "sort", value: sort, style: "form", explode: true, allowReserved: false, contentType: nil),
            QueryParameterSpec(name: "q", value: q, style: "form", explode: true, allowReserved: false, contentType: nil)
        ])
        return try await client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/users"), query), responseType: AppbaseApiResult.self)
    }

    /// Users create.
    public func usersCreate(body: [String: Any]) async throws -> AppbaseApiResult? {
        return try await client.post(ApiPaths.backendPath("/iam/users"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    /// Users delete.
    public func usersDelete(userId: String) async throws -> AppbaseApiResult? {
        return try await client.delete(ApiPaths.backendPath("/iam/users/\(serializePathParameter(userId, PathParameterSpec(name: "userId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Users retrieve.
    public func usersRetrieve(userId: String) async throws -> AppbaseApiResult? {
        return try await client.get(ApiPaths.backendPath("/iam/users/\(serializePathParameter(userId, PathParameterSpec(name: "userId", style: "simple", explode: false)))"), responseType: AppbaseApiResult.self)
    }

    /// Users update.
    public func usersUpdate(userId: String, body: [String: Any]? = nil) async throws -> AppbaseApiResult? {
        return try await client.patch(ApiPaths.backendPath("/iam/users/\(serializePathParameter(userId, PathParameterSpec(name: "userId", style: "simple", explode: false)))"), body: body, params: nil, headers: nil, contentType: "application/json", responseType: AppbaseApiResult.self)
    }

    private struct PathParameterSpec {
        let name: String
        let style: String
        let explode: Bool
    }

    private func serializePathParameter(_ value: Any?, _ spec: PathParameterSpec) -> String {
        guard let value else { return "" }
        let style = spec.style.isEmpty ? "simple" : spec.style
        if let array = value as? [Any] {
            return serializePathArray(spec.name, array, style, spec.explode)
        }
        if let object = value as? [String: Any] {
            return serializePathObject(spec.name, object, style, spec.explode)
        }
        return pathPrimitivePrefix(spec.name, style) + pathEncode(String(describing: value))
    }

    private func serializePathArray(_ name: String, _ values: [Any], _ style: String, _ explode: Bool) -> String {
        let serialized = values.map { pathEncode(String(describing: $0)) }
        if serialized.isEmpty { return pathPrefix(name, style) }
        if style == "matrix" {
            if explode {
                return serialized.map { ";\(name)=\($0)" }.joined()
            }
            return ";\(name)=" + serialized.joined(separator: ",")
        }
        let separator = explode ? "." : ","
        return pathPrefix(name, style) + serialized.joined(separator: separator)
    }

    private func serializePathObject(_ name: String, _ values: [String: Any], _ style: String, _ explode: Bool) -> String {
        var entries: [String] = []
        var exploded: [String] = []
        for (key, value) in values {
            let escapedKey = pathEncode(key)
            let escapedValue = pathEncode(String(describing: value))
            if explode {
                if style == "matrix" {
                    exploded.append(";\(escapedKey)=\(escapedValue)")
                } else {
                    exploded.append("\(escapedKey)=\(escapedValue)")
                }
            } else {
                entries.append(escapedKey)
                entries.append(escapedValue)
            }
        }
        if style == "matrix" {
            if explode {
                return exploded.joined()
            }
            return ";\(name)=" + entries.joined(separator: ",")
        }
        if explode {
            let separator = style == "label" ? "." : ","
            return pathPrefix(name, style) + exploded.joined(separator: separator)
        }
        return pathPrefix(name, style) + entries.joined(separator: ",")
    }

    private func pathPrefix(_ name: String, _ style: String) -> String {
        if style == "label" { return "." }
        if style == "matrix" { return ";\(name)" }
        return ""
    }

    private func pathPrimitivePrefix(_ name: String, _ style: String) -> String {
        style == "matrix" ? ";\(name)=" : pathPrefix(name, style)
    }

    private func pathEncode(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? value
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
