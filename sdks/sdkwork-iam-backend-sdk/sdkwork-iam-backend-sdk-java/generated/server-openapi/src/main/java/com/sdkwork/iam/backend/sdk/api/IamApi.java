package com.sdkwork.iam.backend.sdk.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.sdkwork.iam.backend.sdk.http.HttpClient;
import com.sdkwork.iam.backend.sdk.model.*;
import java.util.List;
import java.util.Map;

public class IamApi {
    private final HttpClient client;

    public IamApi(HttpClient client) {
        this.client = client;
    }

    /** Access Credentials create. */
    public AppbaseApiResult accessCredentialsCreate(AppbaseAccessCredentialCreateCommand body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/access_credentials"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Account Binding Policy retrieve. */
    public AppbaseApiResult accountBindingPolicyRetrieve() throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/account_binding_policy"));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Account Binding Policy update. */
    public AppbaseApiResult accountBindingPolicyUpdate(Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/account_binding_policy"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Api Keys list. */
    public AppbaseApiResult apiKeysList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/api_keys"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Api Keys revoke. */
    public AppbaseApiResult apiKeysRevoke(String apiKeyId, Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/api_keys/" + serializePathParameter(apiKeyId, new PathParameterSpec("apiKeyId", "simple", false)) + "/revoke"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Applications register. */
    public AppbaseApiResult applicationsRegister(AppbaseApplicationRegisterCommand body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/applications/register"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Audit Events list. */
    public AppbaseApiResult auditEventsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/audit_events"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Department Assignments list. */
    public AppbaseApiResult departmentAssignmentsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/department_assignments"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Department Assignments create. */
    public AppbaseApiResult departmentAssignmentsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/department_assignments"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Department Assignments update. */
    public AppbaseApiResult departmentAssignmentsUpdate(String assignmentId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/department_assignments/" + serializePathParameter(assignmentId, new PathParameterSpec("assignmentId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Departments list. */
    public AppbaseApiResult departmentsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/departments"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Departments create. */
    public AppbaseApiResult departmentsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/departments"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Departments delete. */
    public AppbaseApiResult departmentsDelete(String departmentId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/departments/" + serializePathParameter(departmentId, new PathParameterSpec("departmentId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Departments retrieve. */
    public AppbaseApiResult departmentsRetrieve(String departmentId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/departments/" + serializePathParameter(departmentId, new PathParameterSpec("departmentId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Departments update. */
    public AppbaseApiResult departmentsUpdate(String departmentId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/departments/" + serializePathParameter(departmentId, new PathParameterSpec("departmentId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Departments tree retrieve. */
    public AppbaseApiResult departmentsTreeRetrieve() throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/departments/tree"));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Groups list. */
    public AppbaseApiResult groupsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/groups"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Groups create. */
    public AppbaseApiResult groupsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/groups"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Groups delete. */
    public AppbaseApiResult groupsDelete(String groupId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/groups/" + serializePathParameter(groupId, new PathParameterSpec("groupId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Groups retrieve. */
    public AppbaseApiResult groupsRetrieve(String groupId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/groups/" + serializePathParameter(groupId, new PathParameterSpec("groupId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Groups update. */
    public AppbaseApiResult groupsUpdate(String groupId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/groups/" + serializePathParameter(groupId, new PathParameterSpec("groupId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Groups members list. */
    public AppbaseApiResult groupsMembersList(String groupId, Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/groups/" + serializePathParameter(groupId, new PathParameterSpec("groupId", "simple", false)) + "/members"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Groups members create. */
    public AppbaseApiResult groupsMembersCreate(String groupId, Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/groups/" + serializePathParameter(groupId, new PathParameterSpec("groupId", "simple", false)) + "/members"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Groups members delete. */
    public AppbaseApiResult groupsMembersDelete(String groupId, String memberId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/groups/" + serializePathParameter(groupId, new PathParameterSpec("groupId", "simple", false)) + "/members/" + serializePathParameter(memberId, new PathParameterSpec("memberId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Organization Memberships list. */
    public AppbaseApiResult organizationMembershipsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/organization_memberships"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Organization Memberships create. */
    public AppbaseApiResult organizationMembershipsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/organization_memberships"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Organization Memberships update. */
    public AppbaseApiResult organizationMembershipsUpdate(String membershipId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/organization_memberships/" + serializePathParameter(membershipId, new PathParameterSpec("membershipId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Organizations list. */
    public AppbaseApiResult organizationsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/organizations"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Organizations create. */
    public AppbaseApiResult organizationsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/organizations"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Organizations delete. */
    public AppbaseApiResult organizationsDelete(String organizationId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/organizations/" + serializePathParameter(organizationId, new PathParameterSpec("organizationId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Organizations retrieve. */
    public AppbaseApiResult organizationsRetrieve(String organizationId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/organizations/" + serializePathParameter(organizationId, new PathParameterSpec("organizationId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Organizations update. */
    public AppbaseApiResult organizationsUpdate(String organizationId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/organizations/" + serializePathParameter(organizationId, new PathParameterSpec("organizationId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Organizations tree retrieve. */
    public AppbaseApiResult organizationsTreeRetrieve() throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/organizations/tree"));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Permissions list. */
    public AppbaseApiResult permissionsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/permissions"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Permissions create. */
    public AppbaseApiResult permissionsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/permissions"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Permissions delete. */
    public AppbaseApiResult permissionsDelete(String permissionId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/permissions/" + serializePathParameter(permissionId, new PathParameterSpec("permissionId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Permissions retrieve. */
    public AppbaseApiResult permissionsRetrieve(String permissionId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/permissions/" + serializePathParameter(permissionId, new PathParameterSpec("permissionId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Permissions update. */
    public AppbaseApiResult permissionsUpdate(String permissionId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/permissions/" + serializePathParameter(permissionId, new PathParameterSpec("permissionId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Policies list. */
    public AppbaseApiResult policiesList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/policies"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Policies create. */
    public AppbaseApiResult policiesCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/policies"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Policies delete. */
    public AppbaseApiResult policiesDelete(String policyId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/policies/" + serializePathParameter(policyId, new PathParameterSpec("policyId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Policies retrieve. */
    public AppbaseApiResult policiesRetrieve(String policyId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/policies/" + serializePathParameter(policyId, new PathParameterSpec("policyId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Policies update. */
    public AppbaseApiResult policiesUpdate(String policyId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/policies/" + serializePathParameter(policyId, new PathParameterSpec("policyId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Position Assignments list. */
    public AppbaseApiResult positionAssignmentsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/position_assignments"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Position Assignments create. */
    public AppbaseApiResult positionAssignmentsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/position_assignments"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Position Assignments update. */
    public AppbaseApiResult positionAssignmentsUpdate(String assignmentId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/position_assignments/" + serializePathParameter(assignmentId, new PathParameterSpec("assignmentId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Positions list. */
    public AppbaseApiResult positionsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/positions"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Positions create. */
    public AppbaseApiResult positionsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/positions"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Positions delete. */
    public AppbaseApiResult positionsDelete(String positionId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/positions/" + serializePathParameter(positionId, new PathParameterSpec("positionId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Positions update. */
    public AppbaseApiResult positionsUpdate(String positionId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/positions/" + serializePathParameter(positionId, new PathParameterSpec("positionId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Role Bindings list. */
    public AppbaseApiResult roleBindingsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/role_bindings"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Role Bindings create. */
    public AppbaseApiResult roleBindingsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/role_bindings"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Role Bindings delete. */
    public AppbaseApiResult roleBindingsDelete(String roleBindingId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/role_bindings/" + serializePathParameter(roleBindingId, new PathParameterSpec("roleBindingId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Roles list. */
    public AppbaseApiResult rolesList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/roles"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Roles create. */
    public AppbaseApiResult rolesCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/roles"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Roles delete. */
    public AppbaseApiResult rolesDelete(String roleId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/roles/" + serializePathParameter(roleId, new PathParameterSpec("roleId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Roles retrieve. */
    public AppbaseApiResult rolesRetrieve(String roleId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/roles/" + serializePathParameter(roleId, new PathParameterSpec("roleId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Roles update. */
    public AppbaseApiResult rolesUpdate(String roleId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/roles/" + serializePathParameter(roleId, new PathParameterSpec("roleId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Roles permissions list. */
    public AppbaseApiResult rolesPermissionsList(String roleId, Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/roles/" + serializePathParameter(roleId, new PathParameterSpec("roleId", "simple", false)) + "/permissions"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Roles permissions create. */
    public AppbaseApiResult rolesPermissionsCreate(String roleId, Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/roles/" + serializePathParameter(roleId, new PathParameterSpec("roleId", "simple", false)) + "/permissions"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Roles permissions delete. */
    public AppbaseApiResult rolesPermissionsDelete(String roleId, String permissionId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/roles/" + serializePathParameter(roleId, new PathParameterSpec("roleId", "simple", false)) + "/permissions/" + serializePathParameter(permissionId, new PathParameterSpec("permissionId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Security Events list. */
    public AppbaseApiResult securityEventsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/security_events"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Service Accounts list. */
    public AppbaseApiResult serviceAccountsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/service_accounts"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Service Accounts create. */
    public AppbaseApiResult serviceAccountsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/service_accounts"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Service Accounts delete. */
    public AppbaseApiResult serviceAccountsDelete(String serviceAccountId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/service_accounts/" + serializePathParameter(serviceAccountId, new PathParameterSpec("serviceAccountId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Service Accounts retrieve. */
    public AppbaseApiResult serviceAccountsRetrieve(String serviceAccountId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/service_accounts/" + serializePathParameter(serviceAccountId, new PathParameterSpec("serviceAccountId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Service Accounts update. */
    public AppbaseApiResult serviceAccountsUpdate(String serviceAccountId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/service_accounts/" + serializePathParameter(serviceAccountId, new PathParameterSpec("serviceAccountId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Tenant Applications provision. */
    public AppbaseApiResult tenantApplicationsProvision(AppbaseTenantApplicationProvisionCommand body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/tenant_applications"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Tenant Applications update. */
    public AppbaseApiResult tenantApplicationsUpdate(String tenantApplicationId, AppbaseTenantApplicationUpdateCommand body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/tenant_applications/" + serializePathParameter(tenantApplicationId, new PathParameterSpec("tenantApplicationId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Tenant Applications enable. */
    public AppbaseApiResult tenantApplicationsEnable(String tenantApplicationId, AppbaseTenantApplicationEnableCommand body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/tenant_applications/" + serializePathParameter(tenantApplicationId, new PathParameterSpec("tenantApplicationId", "simple", false)) + "/enable"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Tenants list. */
    public AppbaseApiResult tenantsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/tenants"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Tenants create. */
    public AppbaseApiResult tenantsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/tenants"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Tenants delete. */
    public AppbaseApiResult tenantsDelete(String tenantId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/tenants/" + serializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Tenants retrieve. */
    public AppbaseApiResult tenantsRetrieve(String tenantId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/tenants/" + serializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Tenants update. */
    public AppbaseApiResult tenantsUpdate(String tenantId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/tenants/" + serializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Tenants members list. */
    public AppbaseApiResult tenantsMembersList(String tenantId, Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/tenants/" + serializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false)) + "/members"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Tenants members create. */
    public AppbaseApiResult tenantsMembersCreate(String tenantId, Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/tenants/" + serializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false)) + "/members"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Tenants members delete. */
    public AppbaseApiResult tenantsMembersDelete(String tenantId, String userId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/tenants/" + serializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false)) + "/members/" + serializePathParameter(userId, new PathParameterSpec("userId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Tenants members update. */
    public AppbaseApiResult tenantsMembersUpdate(String tenantId, String userId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/tenants/" + serializePathParameter(tenantId, new PathParameterSpec("tenantId", "simple", false)) + "/members/" + serializePathParameter(userId, new PathParameterSpec("userId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Users list. */
    public AppbaseApiResult usersList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.backendPath("/iam/users"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Users create. */
    public AppbaseApiResult usersCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.backendPath("/iam/users"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Users delete. */
    public AppbaseApiResult usersDelete(String userId) throws Exception {
        Object raw = client.delete(ApiPaths.backendPath("/iam/users/" + serializePathParameter(userId, new PathParameterSpec("userId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Users retrieve. */
    public AppbaseApiResult usersRetrieve(String userId) throws Exception {
        Object raw = client.get(ApiPaths.backendPath("/iam/users/" + serializePathParameter(userId, new PathParameterSpec("userId", "simple", false)) + ""));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Users update. */
    public AppbaseApiResult usersUpdate(String userId, Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.backendPath("/iam/users/" + serializePathParameter(userId, new PathParameterSpec("userId", "simple", false)) + ""), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    private record PathParameterSpec(String name, String style, boolean explode) {}

    private static String serializePathParameter(Object value, PathParameterSpec spec) {
        if (value == null) {
            return "";
        }
        String style = spec.style() == null || spec.style().isBlank() ? "simple" : spec.style();
        if (value instanceof Iterable<?> iterable) {
            return serializePathArray(spec.name(), iterable, style, spec.explode());
        }
        if (value instanceof Map<?, ?> map) {
            return serializePathObject(spec.name(), map, style, spec.explode());
        }
        return pathPrimitivePrefix(spec.name(), style) + pathEncode(String.valueOf(value));
    }

    private static String serializePathArray(String name, Iterable<?> values, String style, boolean explode) {
        List<String> serialized = new java.util.ArrayList<>();
        for (Object item : values) {
            if (item != null) {
                serialized.add(pathEncode(String.valueOf(item)));
            }
        }
        if (serialized.isEmpty()) {
            return pathPrefix(name, style);
        }
        if ("matrix".equals(style)) {
            if (explode) {
                List<String> parts = new java.util.ArrayList<>();
                for (String item : serialized) {
                    parts.add(";" + name + "=" + item);
                }
                return String.join("", parts);
            }
            return ";" + name + "=" + String.join(",", serialized);
        }
        String separator = explode ? "." : ",";
        return pathPrefix(name, style) + String.join(separator, serialized);
    }

    private static String serializePathObject(String name, Map<?, ?> values, String style, boolean explode) {
        List<String> entries = new java.util.ArrayList<>();
        List<String> exploded = new java.util.ArrayList<>();
        values.forEach((key, value) -> {
            if (value == null) {
                return;
            }
            String escapedKey = pathEncode(String.valueOf(key));
            String escapedValue = pathEncode(String.valueOf(value));
            if (explode) {
                if ("matrix".equals(style)) {
                    exploded.add(";" + escapedKey + "=" + escapedValue);
                } else {
                    exploded.add(escapedKey + "=" + escapedValue);
                }
            } else {
                entries.add(escapedKey);
                entries.add(escapedValue);
            }
        });
        if ("matrix".equals(style)) {
            if (explode) {
                return String.join("", exploded);
            }
            return ";" + name + "=" + String.join(",", entries);
        }
        if (explode) {
            String separator = "label".equals(style) ? "." : ",";
            return pathPrefix(name, style) + String.join(separator, exploded);
        }
        return pathPrefix(name, style) + String.join(",", entries);
    }

    private static String pathPrefix(String name, String style) {
        if ("label".equals(style)) {
            return ".";
        }
        if ("matrix".equals(style)) {
            return ";" + name;
        }
        return "";
    }

    private static String pathPrimitivePrefix(String name, String style) {
        if ("matrix".equals(style)) {
            return ";" + name + "=";
        }
        return pathPrefix(name, style);
    }

    private static String pathEncode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
    }

    private record QueryParameterSpec(String name, Object value, String style, boolean explode, boolean allowReserved, String contentType) {}

    private static String buildQueryString(List<QueryParameterSpec> parameters) throws Exception {
        List<String> pairs = new java.util.ArrayList<>();
        for (QueryParameterSpec parameter : parameters) {
            appendSerializedParameter(pairs, parameter);
        }
        return String.join("&", pairs);
    }

    private static void appendSerializedParameter(List<String> pairs, QueryParameterSpec parameter) throws Exception {
        if (parameter.value() == null) {
            return;
        }
        if (parameter.contentType() != null && !parameter.contentType().isBlank()) {
            String json = clientObjectMapper().writeValueAsString(parameter.value());
            pairs.add(urlEncode(parameter.name()) + "=" + encodeQueryValue(json, parameter.allowReserved()));
            return;
        }

        String style = parameter.style() == null || parameter.style().isBlank() ? "form" : parameter.style();
        Object value = parameter.value();
        if ("deepObject".equals(style) && value instanceof Map<?, ?> map) {
            appendDeepObjectParameter(pairs, parameter.name(), map, parameter.allowReserved());
        } else if (value instanceof Iterable<?> iterable) {
            appendArrayParameter(pairs, parameter.name(), iterable, style, parameter.explode(), parameter.allowReserved());
        } else if (value instanceof Map<?, ?> map) {
            appendObjectParameter(pairs, parameter.name(), map, style, parameter.explode(), parameter.allowReserved());
        } else {
            pairs.add(urlEncode(parameter.name()) + "=" + encodeQueryValue(String.valueOf(value), parameter.allowReserved()));
        }
    }

    private static void appendArrayParameter(List<String> pairs, String name, Iterable<?> values, String style, boolean explode, boolean allowReserved) {
        List<String> serialized = new java.util.ArrayList<>();
        for (Object item : values) {
            if (item != null) {
                serialized.add(String.valueOf(item));
            }
        }
        if (serialized.isEmpty()) {
            return;
        }
        if ("form".equals(style) && explode) {
            for (String item : serialized) {
                pairs.add(urlEncode(name) + "=" + encodeQueryValue(item, allowReserved));
            }
            return;
        }
        pairs.add(urlEncode(name) + "=" + encodeQueryValue(String.join(",", serialized), allowReserved));
    }

    private static void appendObjectParameter(List<String> pairs, String name, Map<?, ?> values, String style, boolean explode, boolean allowReserved) {
        List<String> serialized = new java.util.ArrayList<>();
        values.forEach((key, value) -> {
            if (value == null) {
                return;
            }
            if ("form".equals(style) && explode) {
                pairs.add(urlEncode(String.valueOf(key)) + "=" + encodeQueryValue(String.valueOf(value), allowReserved));
            } else {
                serialized.add(String.valueOf(key));
                serialized.add(String.valueOf(value));
            }
        });
        if (!serialized.isEmpty()) {
            pairs.add(urlEncode(name) + "=" + encodeQueryValue(String.join(",", serialized), allowReserved));
        }
    }

    private static void appendDeepObjectParameter(List<String> pairs, String name, Map<?, ?> values, boolean allowReserved) {
        values.forEach((key, value) -> {
            if (value != null) {
                pairs.add(urlEncode(name + "[" + key + "]") + "=" + encodeQueryValue(String.valueOf(value), allowReserved));
            }
        });
    }

    private static String encodeQueryValue(String value, boolean allowReserved) {
        String encoded = urlEncode(value);
        if (!allowReserved) {
            return encoded;
        }
        return encoded
            .replace("%3A", ":").replace("%2F", "/").replace("%3F", "?").replace("%23", "#")
            .replace("%5B", "[").replace("%5D", "]").replace("%40", "@").replace("%21", "!")
            .replace("%24", "$").replace("%26", "&").replace("%27", "'").replace("%28", "(")
            .replace("%29", ")").replace("%2A", "*").replace("%2B", "+").replace("%2C", ",")
            .replace("%3B", ";").replace("%3D", "=");
    }

    private static com.fasterxml.jackson.databind.ObjectMapper clientObjectMapper() {
        return new com.fasterxml.jackson.databind.ObjectMapper();
    }


    private static String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }
}
