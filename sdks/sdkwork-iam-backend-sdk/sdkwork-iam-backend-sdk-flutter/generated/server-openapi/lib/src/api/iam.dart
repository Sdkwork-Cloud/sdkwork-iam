import 'dart:convert';
import '../http/client.dart';
import '../models.dart';

import 'paths.dart';
import 'response_helpers.dart';


class IamApi {
  final HttpClient _client;

  IamApi(this._client);

  /// Access Credentials create.
  Future<AppbaseApiResult?> accessCredentialsCreate(AppbaseAccessCredentialCreateCommand body) async {
    final payload = body.toJson();
    final response = await _client.post(ApiPaths.backendPath('/iam/access_credentials'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Account Binding Policy retrieve.
  Future<AppbaseApiResult?> accountBindingPolicyRetrieve() async {
    final response = await _client.get(ApiPaths.backendPath('/iam/account_binding_policy'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Account Binding Policy update.
  Future<AppbaseApiResult?> accountBindingPolicyUpdate([Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/account_binding_policy'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Api Keys list.
  Future<AppbaseApiResult?> apiKeysList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/api_keys'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Api Keys revoke.
  Future<AppbaseApiResult?> apiKeysRevoke(String apiKeyId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/api_keys/${serializePathParameter(apiKeyId, const PathParameterSpec('apiKeyId', 'simple', false))}/revoke'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Applications register.
  Future<AppbaseApiResult?> applicationsRegister(AppbaseApplicationRegisterCommand body) async {
    final payload = body.toJson();
    final response = await _client.post(ApiPaths.backendPath('/iam/applications/register'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Audit Events list.
  Future<AppbaseApiResult?> auditEventsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/audit_events'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Department Assignments list.
  Future<AppbaseApiResult?> departmentAssignmentsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/department_assignments'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Department Assignments create.
  Future<AppbaseApiResult?> departmentAssignmentsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/department_assignments'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Department Assignments update.
  Future<AppbaseApiResult?> departmentAssignmentsUpdate(String assignmentId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/department_assignments/${serializePathParameter(assignmentId, const PathParameterSpec('assignmentId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Departments list.
  Future<AppbaseApiResult?> departmentsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/departments'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Departments create.
  Future<AppbaseApiResult?> departmentsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/departments'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Departments delete.
  Future<AppbaseApiResult?> departmentsDelete(String departmentId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/departments/${serializePathParameter(departmentId, const PathParameterSpec('departmentId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Departments retrieve.
  Future<AppbaseApiResult?> departmentsRetrieve(String departmentId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/departments/${serializePathParameter(departmentId, const PathParameterSpec('departmentId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Departments update.
  Future<AppbaseApiResult?> departmentsUpdate(String departmentId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/departments/${serializePathParameter(departmentId, const PathParameterSpec('departmentId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Departments tree retrieve.
  Future<AppbaseApiResult?> departmentsTreeRetrieve() async {
    final response = await _client.get(ApiPaths.backendPath('/iam/departments/tree'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Groups list.
  Future<AppbaseApiResult?> groupsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/groups'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Groups create.
  Future<AppbaseApiResult?> groupsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/groups'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Groups delete.
  Future<AppbaseApiResult?> groupsDelete(String groupId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/groups/${serializePathParameter(groupId, const PathParameterSpec('groupId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Groups retrieve.
  Future<AppbaseApiResult?> groupsRetrieve(String groupId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/groups/${serializePathParameter(groupId, const PathParameterSpec('groupId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Groups update.
  Future<AppbaseApiResult?> groupsUpdate(String groupId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/groups/${serializePathParameter(groupId, const PathParameterSpec('groupId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Groups members list.
  Future<AppbaseApiResult?> groupsMembersList(String groupId, [int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/groups/${serializePathParameter(groupId, const PathParameterSpec('groupId', 'simple', false))}/members'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Groups members create.
  Future<AppbaseApiResult?> groupsMembersCreate(String groupId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/groups/${serializePathParameter(groupId, const PathParameterSpec('groupId', 'simple', false))}/members'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Groups members delete.
  Future<AppbaseApiResult?> groupsMembersDelete(String groupId, String memberId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/groups/${serializePathParameter(groupId, const PathParameterSpec('groupId', 'simple', false))}/members/${serializePathParameter(memberId, const PathParameterSpec('memberId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Organization Memberships list.
  Future<AppbaseApiResult?> organizationMembershipsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/organization_memberships'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Organization Memberships create.
  Future<AppbaseApiResult?> organizationMembershipsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/organization_memberships'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Organization Memberships update.
  Future<AppbaseApiResult?> organizationMembershipsUpdate(String membershipId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/organization_memberships/${serializePathParameter(membershipId, const PathParameterSpec('membershipId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Organizations list.
  Future<AppbaseApiResult?> organizationsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/organizations'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Organizations create.
  Future<AppbaseApiResult?> organizationsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/organizations'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Organizations delete.
  Future<AppbaseApiResult?> organizationsDelete(String organizationId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/organizations/${serializePathParameter(organizationId, const PathParameterSpec('organizationId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Organizations retrieve.
  Future<AppbaseApiResult?> organizationsRetrieve(String organizationId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/organizations/${serializePathParameter(organizationId, const PathParameterSpec('organizationId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Organizations update.
  Future<AppbaseApiResult?> organizationsUpdate(String organizationId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/organizations/${serializePathParameter(organizationId, const PathParameterSpec('organizationId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Organizations tree retrieve.
  Future<AppbaseApiResult?> organizationsTreeRetrieve() async {
    final response = await _client.get(ApiPaths.backendPath('/iam/organizations/tree'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Permissions list.
  Future<AppbaseApiResult?> permissionsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/permissions'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Permissions create.
  Future<AppbaseApiResult?> permissionsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/permissions'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Permissions delete.
  Future<AppbaseApiResult?> permissionsDelete(String permissionId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/permissions/${serializePathParameter(permissionId, const PathParameterSpec('permissionId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Permissions retrieve.
  Future<AppbaseApiResult?> permissionsRetrieve(String permissionId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/permissions/${serializePathParameter(permissionId, const PathParameterSpec('permissionId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Permissions update.
  Future<AppbaseApiResult?> permissionsUpdate(String permissionId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/permissions/${serializePathParameter(permissionId, const PathParameterSpec('permissionId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Policies list.
  Future<AppbaseApiResult?> policiesList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/policies'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Policies create.
  Future<AppbaseApiResult?> policiesCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/policies'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Policies delete.
  Future<AppbaseApiResult?> policiesDelete(String policyId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/policies/${serializePathParameter(policyId, const PathParameterSpec('policyId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Policies retrieve.
  Future<AppbaseApiResult?> policiesRetrieve(String policyId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/policies/${serializePathParameter(policyId, const PathParameterSpec('policyId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Policies update.
  Future<AppbaseApiResult?> policiesUpdate(String policyId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/policies/${serializePathParameter(policyId, const PathParameterSpec('policyId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Position Assignments list.
  Future<AppbaseApiResult?> positionAssignmentsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/position_assignments'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Position Assignments create.
  Future<AppbaseApiResult?> positionAssignmentsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/position_assignments'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Position Assignments update.
  Future<AppbaseApiResult?> positionAssignmentsUpdate(String assignmentId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/position_assignments/${serializePathParameter(assignmentId, const PathParameterSpec('assignmentId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Positions list.
  Future<AppbaseApiResult?> positionsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/positions'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Positions create.
  Future<AppbaseApiResult?> positionsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/positions'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Positions delete.
  Future<AppbaseApiResult?> positionsDelete(String positionId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/positions/${serializePathParameter(positionId, const PathParameterSpec('positionId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Positions update.
  Future<AppbaseApiResult?> positionsUpdate(String positionId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/positions/${serializePathParameter(positionId, const PathParameterSpec('positionId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Role Bindings list.
  Future<AppbaseApiResult?> roleBindingsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/role_bindings'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Role Bindings create.
  Future<AppbaseApiResult?> roleBindingsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/role_bindings'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Role Bindings delete.
  Future<AppbaseApiResult?> roleBindingsDelete(String roleBindingId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/role_bindings/${serializePathParameter(roleBindingId, const PathParameterSpec('roleBindingId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Roles list.
  Future<AppbaseApiResult?> rolesList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/roles'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Roles create.
  Future<AppbaseApiResult?> rolesCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/roles'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Roles delete.
  Future<AppbaseApiResult?> rolesDelete(String roleId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/roles/${serializePathParameter(roleId, const PathParameterSpec('roleId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Roles retrieve.
  Future<AppbaseApiResult?> rolesRetrieve(String roleId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/roles/${serializePathParameter(roleId, const PathParameterSpec('roleId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Roles update.
  Future<AppbaseApiResult?> rolesUpdate(String roleId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/roles/${serializePathParameter(roleId, const PathParameterSpec('roleId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Roles permissions list.
  Future<AppbaseApiResult?> rolesPermissionsList(String roleId, [int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/roles/${serializePathParameter(roleId, const PathParameterSpec('roleId', 'simple', false))}/permissions'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Roles permissions create.
  Future<AppbaseApiResult?> rolesPermissionsCreate(String roleId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/roles/${serializePathParameter(roleId, const PathParameterSpec('roleId', 'simple', false))}/permissions'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Roles permissions delete.
  Future<AppbaseApiResult?> rolesPermissionsDelete(String roleId, String permissionId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/roles/${serializePathParameter(roleId, const PathParameterSpec('roleId', 'simple', false))}/permissions/${serializePathParameter(permissionId, const PathParameterSpec('permissionId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Security Events list.
  Future<AppbaseApiResult?> securityEventsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/security_events'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Service Accounts list.
  Future<AppbaseApiResult?> serviceAccountsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/service_accounts'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Service Accounts create.
  Future<AppbaseApiResult?> serviceAccountsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/service_accounts'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Service Accounts delete.
  Future<AppbaseApiResult?> serviceAccountsDelete(String serviceAccountId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/service_accounts/${serializePathParameter(serviceAccountId, const PathParameterSpec('serviceAccountId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Service Accounts retrieve.
  Future<AppbaseApiResult?> serviceAccountsRetrieve(String serviceAccountId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/service_accounts/${serializePathParameter(serviceAccountId, const PathParameterSpec('serviceAccountId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Service Accounts update.
  Future<AppbaseApiResult?> serviceAccountsUpdate(String serviceAccountId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/service_accounts/${serializePathParameter(serviceAccountId, const PathParameterSpec('serviceAccountId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Tenant Applications provision.
  Future<AppbaseApiResult?> tenantApplicationsProvision(AppbaseTenantApplicationProvisionCommand body) async {
    final payload = body.toJson();
    final response = await _client.post(ApiPaths.backendPath('/iam/tenant_applications'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Tenant Applications update.
  Future<AppbaseApiResult?> tenantApplicationsUpdate(String tenantApplicationId, [AppbaseTenantApplicationUpdateCommand? body]) async {
    final payload = body?.toJson();
    final response = await _client.patch(ApiPaths.backendPath('/iam/tenant_applications/${serializePathParameter(tenantApplicationId, const PathParameterSpec('tenantApplicationId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Tenant Applications enable.
  Future<AppbaseApiResult?> tenantApplicationsEnable(String tenantApplicationId, AppbaseTenantApplicationEnableCommand body) async {
    final payload = body.toJson();
    final response = await _client.post(ApiPaths.backendPath('/iam/tenant_applications/${serializePathParameter(tenantApplicationId, const PathParameterSpec('tenantApplicationId', 'simple', false))}/enable'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Tenants list.
  Future<AppbaseApiResult?> tenantsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/tenants'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Tenants create.
  Future<AppbaseApiResult?> tenantsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/tenants'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Tenants delete.
  Future<AppbaseApiResult?> tenantsDelete(String tenantId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/tenants/${serializePathParameter(tenantId, const PathParameterSpec('tenantId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Tenants retrieve.
  Future<AppbaseApiResult?> tenantsRetrieve(String tenantId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/tenants/${serializePathParameter(tenantId, const PathParameterSpec('tenantId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Tenants update.
  Future<AppbaseApiResult?> tenantsUpdate(String tenantId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/tenants/${serializePathParameter(tenantId, const PathParameterSpec('tenantId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Tenants members list.
  Future<AppbaseApiResult?> tenantsMembersList(String tenantId, [int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/tenants/${serializePathParameter(tenantId, const PathParameterSpec('tenantId', 'simple', false))}/members'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Tenants members create.
  Future<AppbaseApiResult?> tenantsMembersCreate(String tenantId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/tenants/${serializePathParameter(tenantId, const PathParameterSpec('tenantId', 'simple', false))}/members'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Tenants members delete.
  Future<AppbaseApiResult?> tenantsMembersDelete(String tenantId, String userId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/tenants/${serializePathParameter(tenantId, const PathParameterSpec('tenantId', 'simple', false))}/members/${serializePathParameter(userId, const PathParameterSpec('userId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Tenants members update.
  Future<AppbaseApiResult?> tenantsMembersUpdate(String tenantId, String userId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/tenants/${serializePathParameter(tenantId, const PathParameterSpec('tenantId', 'simple', false))}/members/${serializePathParameter(userId, const PathParameterSpec('userId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Users list.
  Future<AppbaseApiResult?> usersList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/users'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Users create.
  Future<AppbaseApiResult?> usersCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/users'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Users delete.
  Future<AppbaseApiResult?> usersDelete(String userId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/users/${serializePathParameter(userId, const PathParameterSpec('userId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Users retrieve.
  Future<AppbaseApiResult?> usersRetrieve(String userId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/users/${serializePathParameter(userId, const PathParameterSpec('userId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Users update.
  Future<AppbaseApiResult?> usersUpdate(String userId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/users/${serializePathParameter(userId, const PathParameterSpec('userId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }
}

class PathParameterSpec {
  final String name;
  final String style;
  final bool explode;

  const PathParameterSpec(this.name, this.style, this.explode);
}

String serializePathParameter(dynamic value, PathParameterSpec spec) {
  if (value == null) return '';
  final style = spec.style.trim().isEmpty ? 'simple' : spec.style;
  if (value is Iterable) {
    return serializePathArray(spec.name, value, style, spec.explode);
  }
  if (value is Map) {
    return serializePathObject(spec.name, value, style, spec.explode);
  }
  return pathPrimitivePrefix(spec.name, style) + Uri.encodeComponent(value.toString());
}

String serializePathArray(String name, Iterable values, String style, bool explode) {
  final serialized = values.where((item) => item != null).map((item) => Uri.encodeComponent(item.toString())).toList();
  if (serialized.isEmpty) return pathPrefix(name, style);
  if (style == 'matrix') {
    if (explode) {
      return serialized.map((item) => ';$name=$item').join();
    }
    return ';$name=${serialized.join(',')}';
  }
  final separator = explode ? '.' : ',';
  return pathPrefix(name, style) + serialized.join(separator);
}

String serializePathObject(String name, Map values, String style, bool explode) {
  final entries = <String>[];
  final exploded = <String>[];
  values.forEach((key, value) {
    if (value == null) return;
    final escapedKey = Uri.encodeComponent(key.toString());
    final escapedValue = Uri.encodeComponent(value.toString());
    if (explode) {
      if (style == 'matrix') {
        exploded.add(';$escapedKey=$escapedValue');
      } else {
        exploded.add('$escapedKey=$escapedValue');
      }
    } else {
      entries.add(escapedKey);
      entries.add(escapedValue);
    }
  });
  if (style == 'matrix') {
    if (explode) return exploded.join();
    return ';$name=${entries.join(',')}';
  }
  if (explode) {
    final separator = style == 'label' ? '.' : ',';
    return pathPrefix(name, style) + exploded.join(separator);
  }
  return pathPrefix(name, style) + entries.join(',');
}

String pathPrefix(String name, String style) {
  if (style == 'label') return '.';
  if (style == 'matrix') return ';$name';
  return '';
}

String pathPrimitivePrefix(String name, String style) {
  return style == 'matrix' ? ';$name=' : pathPrefix(name, style);
}
class QueryParameterSpec {
  final String name;
  final dynamic value;
  final String style;
  final bool explode;
  final bool allowReserved;
  final String? contentType;

  const QueryParameterSpec(
    this.name,
    this.value,
    this.style,
    this.explode,
    this.allowReserved,
    this.contentType,
  );
}

String buildQueryString(List<QueryParameterSpec> parameters) {
  final pairs = <String>[];
  for (final parameter in parameters) {
    appendSerializedParameter(pairs, parameter);
  }
  return pairs.join('&');
}

void appendSerializedParameter(List<String> pairs, QueryParameterSpec parameter) {
  final value = parameter.value;
  if (value == null) return;

  final contentType = parameter.contentType;
  if (contentType != null && contentType.trim().isNotEmpty) {
    pairs.add('${urlEncode(parameter.name)}=${encodeQueryValue(jsonEncode(value), parameter.allowReserved)}');
    return;
  }

  final style = parameter.style.trim().isEmpty ? 'form' : parameter.style;
  if (style == 'deepObject' && value is Map) {
    appendDeepObjectParameter(pairs, parameter.name, value, parameter.allowReserved);
    return;
  }
  if (value is Iterable) {
    appendArrayParameter(pairs, parameter.name, value, style, parameter.explode, parameter.allowReserved);
    return;
  }
  if (value is Map) {
    appendObjectParameter(pairs, parameter.name, value, style, parameter.explode, parameter.allowReserved);
    return;
  }
  pairs.add('${urlEncode(parameter.name)}=${encodeQueryValue(value.toString(), parameter.allowReserved)}');
}

void appendArrayParameter(
  List<String> pairs,
  String name,
  Iterable values,
  String style,
  bool explode,
  bool allowReserved,
) {
  final serialized = values.where((item) => item != null).map((item) => item.toString()).toList();
  if (serialized.isEmpty) return;
  if (style == 'form' && explode) {
    for (final item in serialized) {
      pairs.add('${urlEncode(name)}=${encodeQueryValue(item, allowReserved)}');
    }
    return;
  }
  pairs.add('${urlEncode(name)}=${encodeQueryValue(serialized.join(','), allowReserved)}');
}

void appendObjectParameter(
  List<String> pairs,
  String name,
  Map values,
  String style,
  bool explode,
  bool allowReserved,
) {
  final serialized = <String>[];
  values.forEach((key, value) {
    if (value == null) return;
    if (style == 'form' && explode) {
      pairs.add('${urlEncode(key.toString())}=${encodeQueryValue(value.toString(), allowReserved)}');
      return;
    }
    serialized.add(key.toString());
    serialized.add(value.toString());
  });
  if (serialized.isNotEmpty) {
    pairs.add('${urlEncode(name)}=${encodeQueryValue(serialized.join(','), allowReserved)}');
  }
}

void appendDeepObjectParameter(List<String> pairs, String name, Map values, bool allowReserved) {
  values.forEach((key, value) {
    if (value != null) {
      pairs.add('${urlEncode('$name[$key]')}=${encodeQueryValue(value.toString(), allowReserved)}');
    }
  });
}

String encodeQueryValue(String value, bool allowReserved) {
  var encoded = urlEncode(value);
  if (!allowReserved) return encoded;
  const replacements = <String, String>{
    '%3A': ':',
    '%2F': '/',
    '%3F': '?',
    '%23': '#',
    '%5B': '[',
    '%5D': ']',
    '%40': '@',
    '%21': '!',
    '%24': r'$',
    '%26': '&',
    '%27': "'",
    '%28': '(',
    '%29': ')',
    '%2A': '*',
    '%2B': '+',
    '%2C': ',',
    '%3B': ';',
    '%3D': '=',
  };
  replacements.forEach((escaped, reserved) {
    encoded = encoded.replaceAll(escaped, reserved);
  });
  return encoded;
}

String urlEncode(String value) => Uri.encodeQueryComponent(value);
