package com.sdkwork.iam.backend.sdk.api

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.sdkwork.iam.backend.sdk.*
import com.sdkwork.iam.backend.sdk.http.HttpClient

class IamApi(private val client: HttpClient) {

    /** Access Credentials create. */
    suspend fun accessCredentialsCreate(body: AppbaseAccessCredentialCreateCommand): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/access_credentials"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Account Binding Policy retrieve. */
    suspend fun accountBindingPolicyRetrieve(): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/account_binding_policy"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Account Binding Policy update. */
    suspend fun accountBindingPolicyUpdate(body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/account_binding_policy"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Api Keys list. */
    suspend fun apiKeysList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/api_keys"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Api Keys revoke. */
    suspend fun apiKeysRevoke(apiKeyId: String, body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/api_keys/${serializePathParameter(apiKeyId, PathParameterSpec("apiKeyId", "simple", false))}/revoke"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Applications register. */
    suspend fun applicationsRegister(body: AppbaseApplicationRegisterCommand): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/applications/register"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Audit Events list. */
    suspend fun auditEventsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/audit_events"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Department Assignments list. */
    suspend fun departmentAssignmentsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/department_assignments"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Department Assignments create. */
    suspend fun departmentAssignmentsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/department_assignments"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Department Assignments update. */
    suspend fun departmentAssignmentsUpdate(assignmentId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/department_assignments/${serializePathParameter(assignmentId, PathParameterSpec("assignmentId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Departments list. */
    suspend fun departmentsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/departments"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Departments create. */
    suspend fun departmentsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/departments"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Departments delete. */
    suspend fun departmentsDelete(departmentId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/departments/${serializePathParameter(departmentId, PathParameterSpec("departmentId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Departments retrieve. */
    suspend fun departmentsRetrieve(departmentId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/departments/${serializePathParameter(departmentId, PathParameterSpec("departmentId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Departments update. */
    suspend fun departmentsUpdate(departmentId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/departments/${serializePathParameter(departmentId, PathParameterSpec("departmentId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Departments tree retrieve. */
    suspend fun departmentsTreeRetrieve(): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/departments/tree"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Groups list. */
    suspend fun groupsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/groups"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Groups create. */
    suspend fun groupsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/groups"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Groups delete. */
    suspend fun groupsDelete(groupId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/groups/${serializePathParameter(groupId, PathParameterSpec("groupId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Groups retrieve. */
    suspend fun groupsRetrieve(groupId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/groups/${serializePathParameter(groupId, PathParameterSpec("groupId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Groups update. */
    suspend fun groupsUpdate(groupId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/groups/${serializePathParameter(groupId, PathParameterSpec("groupId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Groups members list. */
    suspend fun groupsMembersList(groupId: String, page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/groups/${serializePathParameter(groupId, PathParameterSpec("groupId", "simple", false))}/members"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Groups members create. */
    suspend fun groupsMembersCreate(groupId: String, body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/groups/${serializePathParameter(groupId, PathParameterSpec("groupId", "simple", false))}/members"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Groups members delete. */
    suspend fun groupsMembersDelete(groupId: String, memberId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/groups/${serializePathParameter(groupId, PathParameterSpec("groupId", "simple", false))}/members/${serializePathParameter(memberId, PathParameterSpec("memberId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Organization Memberships list. */
    suspend fun organizationMembershipsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/organization_memberships"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Organization Memberships create. */
    suspend fun organizationMembershipsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/organization_memberships"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Organization Memberships update. */
    suspend fun organizationMembershipsUpdate(membershipId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/organization_memberships/${serializePathParameter(membershipId, PathParameterSpec("membershipId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Organizations list. */
    suspend fun organizationsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/organizations"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Organizations create. */
    suspend fun organizationsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/organizations"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Organizations delete. */
    suspend fun organizationsDelete(organizationId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/organizations/${serializePathParameter(organizationId, PathParameterSpec("organizationId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Organizations retrieve. */
    suspend fun organizationsRetrieve(organizationId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/organizations/${serializePathParameter(organizationId, PathParameterSpec("organizationId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Organizations update. */
    suspend fun organizationsUpdate(organizationId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/organizations/${serializePathParameter(organizationId, PathParameterSpec("organizationId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Organizations tree retrieve. */
    suspend fun organizationsTreeRetrieve(): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/organizations/tree"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Permissions list. */
    suspend fun permissionsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/permissions"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Permissions create. */
    suspend fun permissionsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/permissions"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Permissions delete. */
    suspend fun permissionsDelete(permissionId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/permissions/${serializePathParameter(permissionId, PathParameterSpec("permissionId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Permissions retrieve. */
    suspend fun permissionsRetrieve(permissionId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/permissions/${serializePathParameter(permissionId, PathParameterSpec("permissionId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Permissions update. */
    suspend fun permissionsUpdate(permissionId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/permissions/${serializePathParameter(permissionId, PathParameterSpec("permissionId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Policies list. */
    suspend fun policiesList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/policies"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Policies create. */
    suspend fun policiesCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/policies"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Policies delete. */
    suspend fun policiesDelete(policyId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/policies/${serializePathParameter(policyId, PathParameterSpec("policyId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Policies retrieve. */
    suspend fun policiesRetrieve(policyId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/policies/${serializePathParameter(policyId, PathParameterSpec("policyId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Policies update. */
    suspend fun policiesUpdate(policyId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/policies/${serializePathParameter(policyId, PathParameterSpec("policyId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Position Assignments list. */
    suspend fun positionAssignmentsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/position_assignments"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Position Assignments create. */
    suspend fun positionAssignmentsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/position_assignments"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Position Assignments update. */
    suspend fun positionAssignmentsUpdate(assignmentId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/position_assignments/${serializePathParameter(assignmentId, PathParameterSpec("assignmentId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Positions list. */
    suspend fun positionsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/positions"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Positions create. */
    suspend fun positionsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/positions"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Positions delete. */
    suspend fun positionsDelete(positionId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/positions/${serializePathParameter(positionId, PathParameterSpec("positionId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Positions update. */
    suspend fun positionsUpdate(positionId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/positions/${serializePathParameter(positionId, PathParameterSpec("positionId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Role Bindings list. */
    suspend fun roleBindingsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/role_bindings"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Role Bindings create. */
    suspend fun roleBindingsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/role_bindings"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Role Bindings delete. */
    suspend fun roleBindingsDelete(roleBindingId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/role_bindings/${serializePathParameter(roleBindingId, PathParameterSpec("roleBindingId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Roles list. */
    suspend fun rolesList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/roles"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Roles create. */
    suspend fun rolesCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/roles"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Roles delete. */
    suspend fun rolesDelete(roleId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/roles/${serializePathParameter(roleId, PathParameterSpec("roleId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Roles retrieve. */
    suspend fun rolesRetrieve(roleId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/roles/${serializePathParameter(roleId, PathParameterSpec("roleId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Roles update. */
    suspend fun rolesUpdate(roleId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/roles/${serializePathParameter(roleId, PathParameterSpec("roleId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Roles permissions list. */
    suspend fun rolesPermissionsList(roleId: String, page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/roles/${serializePathParameter(roleId, PathParameterSpec("roleId", "simple", false))}/permissions"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Roles permissions create. */
    suspend fun rolesPermissionsCreate(roleId: String, body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/roles/${serializePathParameter(roleId, PathParameterSpec("roleId", "simple", false))}/permissions"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Roles permissions delete. */
    suspend fun rolesPermissionsDelete(roleId: String, permissionId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/roles/${serializePathParameter(roleId, PathParameterSpec("roleId", "simple", false))}/permissions/${serializePathParameter(permissionId, PathParameterSpec("permissionId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Security Events list. */
    suspend fun securityEventsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/security_events"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Service Accounts list. */
    suspend fun serviceAccountsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/service_accounts"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Service Accounts create. */
    suspend fun serviceAccountsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/service_accounts"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Service Accounts delete. */
    suspend fun serviceAccountsDelete(serviceAccountId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/service_accounts/${serializePathParameter(serviceAccountId, PathParameterSpec("serviceAccountId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Service Accounts retrieve. */
    suspend fun serviceAccountsRetrieve(serviceAccountId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/service_accounts/${serializePathParameter(serviceAccountId, PathParameterSpec("serviceAccountId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Service Accounts update. */
    suspend fun serviceAccountsUpdate(serviceAccountId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/service_accounts/${serializePathParameter(serviceAccountId, PathParameterSpec("serviceAccountId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Tenant Applications provision. */
    suspend fun tenantApplicationsProvision(body: AppbaseTenantApplicationProvisionCommand): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/tenant_applications"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Tenant Applications update. */
    suspend fun tenantApplicationsUpdate(tenantApplicationId: String, body: AppbaseTenantApplicationUpdateCommand? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/tenant_applications/${serializePathParameter(tenantApplicationId, PathParameterSpec("tenantApplicationId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Tenant Applications enable. */
    suspend fun tenantApplicationsEnable(tenantApplicationId: String, body: AppbaseTenantApplicationEnableCommand): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/tenant_applications/${serializePathParameter(tenantApplicationId, PathParameterSpec("tenantApplicationId", "simple", false))}/enable"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Tenants list. */
    suspend fun tenantsList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/tenants"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Tenants create. */
    suspend fun tenantsCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/tenants"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Tenants delete. */
    suspend fun tenantsDelete(tenantId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/tenants/${serializePathParameter(tenantId, PathParameterSpec("tenantId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Tenants retrieve. */
    suspend fun tenantsRetrieve(tenantId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/tenants/${serializePathParameter(tenantId, PathParameterSpec("tenantId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Tenants update. */
    suspend fun tenantsUpdate(tenantId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/tenants/${serializePathParameter(tenantId, PathParameterSpec("tenantId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Tenants members list. */
    suspend fun tenantsMembersList(tenantId: String, page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/tenants/${serializePathParameter(tenantId, PathParameterSpec("tenantId", "simple", false))}/members"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Tenants members create. */
    suspend fun tenantsMembersCreate(tenantId: String, body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/tenants/${serializePathParameter(tenantId, PathParameterSpec("tenantId", "simple", false))}/members"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Tenants members delete. */
    suspend fun tenantsMembersDelete(tenantId: String, userId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/tenants/${serializePathParameter(tenantId, PathParameterSpec("tenantId", "simple", false))}/members/${serializePathParameter(userId, PathParameterSpec("userId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Tenants members update. */
    suspend fun tenantsMembersUpdate(tenantId: String, userId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/tenants/${serializePathParameter(tenantId, PathParameterSpec("tenantId", "simple", false))}/members/${serializePathParameter(userId, PathParameterSpec("userId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Users list. */
    suspend fun usersList(page: Int? = null, pageSize: Int? = null, cursor: String? = null, sort: String? = null, q: String? = null): AppbaseApiResult? {
        val query = buildQueryString(listOf(
            QueryParameterSpec("page", page, "form", true, false, null),
            QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            QueryParameterSpec("cursor", cursor, "form", true, false, null),
            QueryParameterSpec("sort", sort, "form", true, false, null),
            QueryParameterSpec("q", q, "form", true, false, null)
        ))
        val raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/users"), query))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Users create. */
    suspend fun usersCreate(body: Map<String, Any>): AppbaseApiResult? {
        val raw = client.post(ApiPaths.backendPath("/iam/users"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Users delete. */
    suspend fun usersDelete(userId: String): AppbaseApiResult? {
        val raw = client.delete(ApiPaths.backendPath("/iam/users/${serializePathParameter(userId, PathParameterSpec("userId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Users retrieve. */
    suspend fun usersRetrieve(userId: String): AppbaseApiResult? {
        val raw = client.get(ApiPaths.backendPath("/iam/users/${serializePathParameter(userId, PathParameterSpec("userId", "simple", false))}"))
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    /** Users update. */
    suspend fun usersUpdate(userId: String, body: Map<String, Any>? = null): AppbaseApiResult? {
        val raw = client.patch(ApiPaths.backendPath("/iam/users/${serializePathParameter(userId, PathParameterSpec("userId", "simple", false))}"), body, null, null, "application/json")
        return client.convertValue(raw, object : TypeReference<AppbaseApiResult>() {})
    }

    private data class PathParameterSpec(val name: String, val style: String, val explode: Boolean)

    private fun serializePathParameter(value: Any?, spec: PathParameterSpec): String {
        if (value == null) return ""
        val style = spec.style.ifBlank { "simple" }
        return when (value) {
            is Iterable<*> -> serializePathArray(spec.name, value, style, spec.explode)
            is Map<*, *> -> serializePathObject(spec.name, value, style, spec.explode)
            else -> pathPrimitivePrefix(spec.name, style) + pathEncode(value.toString())
        }
    }

    private fun serializePathArray(name: String, values: Iterable<*>, style: String, explode: Boolean): String {
        val serialized = values.mapNotNull { it?.toString()?.let(::pathEncode) }
        if (serialized.isEmpty()) return pathPrefix(name, style)
        if (style == "matrix") {
            if (explode) {
                return serialized.joinToString("") { ";$name=$it" }
            }
            return ";$name=" + serialized.joinToString(",")
        }
        val separator = if (explode) "." else ","
        return pathPrefix(name, style) + serialized.joinToString(separator)
    }

    private fun serializePathObject(name: String, values: Map<*, *>, style: String, explode: Boolean): String {
        val entries = mutableListOf<String>()
        val exploded = mutableListOf<String>()
        values.forEach { (key, value) ->
            if (value == null) return@forEach
            val escapedKey = pathEncode(key.toString())
            val escapedValue = pathEncode(value.toString())
            if (explode) {
                if (style == "matrix") {
                    exploded += ";$escapedKey=$escapedValue"
                } else {
                    exploded += "$escapedKey=$escapedValue"
                }
            } else {
                entries += escapedKey
                entries += escapedValue
            }
        }
        if (style == "matrix") {
            if (explode) return exploded.joinToString("")
            return ";$name=" + entries.joinToString(",")
        }
        if (explode) {
            val separator = if (style == "label") "." else ","
            return pathPrefix(name, style) + exploded.joinToString(separator)
        }
        return pathPrefix(name, style) + entries.joinToString(",")
    }

    private fun pathPrefix(name: String, style: String): String {
        return when (style) {
            "label" -> "."
            "matrix" -> ";$name"
            else -> ""
        }
    }

    private fun pathPrimitivePrefix(name: String, style: String): String {
        return if (style == "matrix") ";$name=" else pathPrefix(name, style)
    }

    private fun pathEncode(value: String): String {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20")
    }

    private data class QueryParameterSpec(
        val name: String,
        val value: Any?,
        val style: String,
        val explode: Boolean,
        val allowReserved: Boolean,
        val contentType: String?,
    )

    private val queryObjectMapper = ObjectMapper().registerKotlinModule()

    private fun buildQueryString(parameters: List<QueryParameterSpec>): String {
        val pairs = mutableListOf<String>()
        parameters.forEach { appendSerializedParameter(pairs, it) }
        return pairs.joinToString("&")
    }

    private fun appendSerializedParameter(pairs: MutableList<String>, parameter: QueryParameterSpec) {
        val value = parameter.value ?: return
        if (!parameter.contentType.isNullOrBlank()) {
            val json = queryObjectMapper.writeValueAsString(value)
            pairs += urlEncode(parameter.name) + "=" + encodeQueryValue(json, parameter.allowReserved)
            return
        }

        val style = parameter.style.ifBlank { "form" }
        when (value) {
            is Iterable<*> -> appendArrayParameter(pairs, parameter.name, value, style, parameter.explode, parameter.allowReserved)
            is Map<*, *> -> if (style == "deepObject") {
                appendDeepObjectParameter(pairs, parameter.name, value, parameter.allowReserved)
            } else {
                appendObjectParameter(pairs, parameter.name, value, style, parameter.explode, parameter.allowReserved)
            }
            else -> pairs += urlEncode(parameter.name) + "=" + encodeQueryValue(value.toString(), parameter.allowReserved)
        }
    }

    private fun appendArrayParameter(
        pairs: MutableList<String>,
        name: String,
        values: Iterable<*>,
        style: String,
        explode: Boolean,
        allowReserved: Boolean,
    ) {
        val serialized = values.mapNotNull { it?.toString() }
        if (serialized.isEmpty()) return
        if (style == "form" && explode) {
            serialized.forEach { pairs += urlEncode(name) + "=" + encodeQueryValue(it, allowReserved) }
            return
        }
        pairs += urlEncode(name) + "=" + encodeQueryValue(serialized.joinToString(","), allowReserved)
    }

    private fun appendObjectParameter(
        pairs: MutableList<String>,
        name: String,
        values: Map<*, *>,
        style: String,
        explode: Boolean,
        allowReserved: Boolean,
    ) {
        val serialized = mutableListOf<String>()
        values.forEach { (key, value) ->
            if (value == null) return@forEach
            if (style == "form" && explode) {
                pairs += urlEncode(key.toString()) + "=" + encodeQueryValue(value.toString(), allowReserved)
            } else {
                serialized += key.toString()
                serialized += value.toString()
            }
        }
        if (serialized.isNotEmpty()) {
            pairs += urlEncode(name) + "=" + encodeQueryValue(serialized.joinToString(","), allowReserved)
        }
    }

    private fun appendDeepObjectParameter(pairs: MutableList<String>, name: String, values: Map<*, *>, allowReserved: Boolean) {
        values.forEach { (key, value) ->
            if (value != null) {
                pairs += urlEncode("$name[$key]") + "=" + encodeQueryValue(value.toString(), allowReserved)
            }
        }
    }

    private fun encodeQueryValue(value: String, allowReserved: Boolean): String {
        var encoded = urlEncode(value)
        if (!allowReserved) return encoded
        mapOf(
            "%3A" to ":", "%2F" to "/", "%3F" to "?", "%23" to "#",
            "%5B" to "[", "%5D" to "]", "%40" to "@", "%21" to "!",
            "%24" to "$", "%26" to "&", "%27" to "'", "%28" to "(",
            "%29" to ")", "%2A" to "*", "%2B" to "+", "%2C" to ",",
            "%3B" to ";", "%3D" to "=",
        ).forEach { (escaped, reserved) -> encoded = encoded.replace(escaped, reserved) }
        return encoded
    }

    private fun urlEncode(value: String): String {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8)
    }

}
