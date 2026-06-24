import 'dart:convert';
import '../http/client.dart';
import '../models.dart';

import 'paths.dart';
import 'response_helpers.dart';


class IamOauthApi {
  final HttpClient _client;

  IamOauthApi(this._client);

  /// Iam oauth account Links list.
  Future<AppbaseApiResult?> accountLinksList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/account_links'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth account Links update.
  Future<AppbaseApiResult?> accountLinksUpdate(String accountLinkId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/account_links/${serializePathParameter(accountLinkId, const PathParameterSpec('accountLinkId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth callback Events list.
  Future<AppbaseApiResult?> callbackEventsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/callback_events'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth claim Mappings list.
  Future<AppbaseApiResult?> claimMappingsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/claim_mappings'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth claim Mappings create.
  Future<AppbaseApiResult?> claimMappingsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/claim_mappings'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth claim Mappings update.
  Future<AppbaseApiResult?> claimMappingsUpdate(String mappingId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/claim_mappings/${serializePathParameter(mappingId, const PathParameterSpec('mappingId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth clients list.
  Future<AppbaseApiResult?> clientsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/clients'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth clients create.
  Future<AppbaseApiResult?> clientsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/clients'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth clients delete.
  Future<AppbaseApiResult?> clientsDelete(String oauthClientId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/oauth/clients/${serializePathParameter(oauthClientId, const PathParameterSpec('oauthClientId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth clients retrieve.
  Future<AppbaseApiResult?> clientsRetrieve(String oauthClientId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/oauth/clients/${serializePathParameter(oauthClientId, const PathParameterSpec('oauthClientId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth clients update.
  Future<AppbaseApiResult?> clientsUpdate(String oauthClientId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/clients/${serializePathParameter(oauthClientId, const PathParameterSpec('oauthClientId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth diagnostic Runs list.
  Future<AppbaseApiResult?> diagnosticRunsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/diagnostic_runs'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth diagnostic Runs create.
  Future<AppbaseApiResult?> diagnosticRunsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/diagnostic_runs'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth diagnostic Runs retrieve.
  Future<AppbaseApiResult?> diagnosticRunsRetrieve(String diagnosticRunId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/oauth/diagnostic_runs/${serializePathParameter(diagnosticRunId, const PathParameterSpec('diagnosticRunId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth flow Configs list.
  Future<AppbaseApiResult?> flowConfigsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/flow_configs'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth flow Configs create.
  Future<AppbaseApiResult?> flowConfigsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/flow_configs'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth flow Configs update.
  Future<AppbaseApiResult?> flowConfigsUpdate(String flowConfigId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/flow_configs/${serializePathParameter(flowConfigId, const PathParameterSpec('flowConfigId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth grants list.
  Future<AppbaseApiResult?> grantsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/grants'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth grants delete.
  Future<AppbaseApiResult?> grantsDelete(String grantId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/oauth/grants/${serializePathParameter(grantId, const PathParameterSpec('grantId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth integrations list.
  Future<AppbaseApiResult?> integrationsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/integrations'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth integrations create.
  Future<AppbaseApiResult?> integrationsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/integrations'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth integrations delete.
  Future<AppbaseApiResult?> integrationsDelete(String integrationId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/oauth/integrations/${serializePathParameter(integrationId, const PathParameterSpec('integrationId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth integrations retrieve.
  Future<AppbaseApiResult?> integrationsRetrieve(String integrationId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/oauth/integrations/${serializePathParameter(integrationId, const PathParameterSpec('integrationId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth integrations update.
  Future<AppbaseApiResult?> integrationsUpdate(String integrationId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/integrations/${serializePathParameter(integrationId, const PathParameterSpec('integrationId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth operational Resources list.
  Future<AppbaseApiResult?> operationalResourcesList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/operational_resources'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth operational Resources create.
  Future<AppbaseApiResult?> operationalResourcesCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/operational_resources'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth operational Resources delete.
  Future<AppbaseApiResult?> operationalResourcesDelete(String resourceId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/oauth/operational_resources/${serializePathParameter(resourceId, const PathParameterSpec('resourceId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth operational Resources update.
  Future<AppbaseApiResult?> operationalResourcesUpdate(String resourceId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/operational_resources/${serializePathParameter(resourceId, const PathParameterSpec('resourceId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth operational Resources publishes create.
  Future<AppbaseApiResult?> operationalResourcesPublishesCreate(String resourceId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/operational_resources/${serializePathParameter(resourceId, const PathParameterSpec('resourceId', 'simple', false))}/publishes'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth operator Platforms list.
  Future<AppbaseApiResult?> operatorPlatformsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/operator_platforms'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth operator Platforms create.
  Future<AppbaseApiResult?> operatorPlatformsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/operator_platforms'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth operator Platforms update.
  Future<AppbaseApiResult?> operatorPlatformsUpdate(String operatorPlatformId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/operator_platforms/${serializePathParameter(operatorPlatformId, const PathParameterSpec('operatorPlatformId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth operator Platforms pre Authorizations create.
  Future<AppbaseApiResult?> operatorPlatformsPreAuthorizationsCreate(String operatorPlatformId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/operator_platforms/${serializePathParameter(operatorPlatformId, const PathParameterSpec('operatorPlatformId', 'simple', false))}/pre_authorizations'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth policies list.
  Future<AppbaseApiResult?> policiesList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/policies'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth policies create.
  Future<AppbaseApiResult?> policiesCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/policies'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth policies update.
  Future<AppbaseApiResult?> policiesUpdate(String policyId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/policies/${serializePathParameter(policyId, const PathParameterSpec('policyId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth provider Catalog list.
  Future<AppbaseApiResult?> providerCatalogList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/provider_catalog'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth provider Catalog create.
  Future<AppbaseApiResult?> providerCatalogCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/provider_catalog'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth provider Catalog retrieve.
  Future<AppbaseApiResult?> providerCatalogRetrieve(String providerCatalogId) async {
    final response = await _client.get(ApiPaths.backendPath('/iam/oauth/provider_catalog/${serializePathParameter(providerCatalogId, const PathParameterSpec('providerCatalogId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth provider Catalog update.
  Future<AppbaseApiResult?> providerCatalogUpdate(String providerCatalogId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/provider_catalog/${serializePathParameter(providerCatalogId, const PathParameterSpec('providerCatalogId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth resource Accounts list.
  Future<AppbaseApiResult?> resourceAccountsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/resource_accounts'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth resource Accounts create.
  Future<AppbaseApiResult?> resourceAccountsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/resource_accounts'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth resource Accounts update.
  Future<AppbaseApiResult?> resourceAccountsUpdate(String resourceAccountId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, const PathParameterSpec('resourceAccountId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth resource Accounts authorization Refreshes create.
  Future<AppbaseApiResult?> resourceAccountsAuthorizationRefreshesCreate(String resourceAccountId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, const PathParameterSpec('resourceAccountId', 'simple', false))}/authorization_refreshes'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth resource Accounts mini Program Login Checks create.
  Future<AppbaseApiResult?> resourceAccountsMiniProgramLoginChecksCreate(String resourceAccountId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, const PathParameterSpec('resourceAccountId', 'simple', false))}/mini_program_login_checks'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth resource Accounts verifications create.
  Future<AppbaseApiResult?> resourceAccountsVerificationsCreate(String resourceAccountId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/resource_accounts/${serializePathParameter(resourceAccountId, const PathParameterSpec('resourceAccountId', 'simple', false))}/verifications'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth resource Authorizations list.
  Future<AppbaseApiResult?> resourceAuthorizationsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/resource_authorizations'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth resource Authorizations create.
  Future<AppbaseApiResult?> resourceAuthorizationsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/resource_authorizations'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth resource Authorizations update.
  Future<AppbaseApiResult?> resourceAuthorizationsUpdate(String authorizationId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/resource_authorizations/${serializePathParameter(authorizationId, const PathParameterSpec('authorizationId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth scope Profiles list.
  Future<AppbaseApiResult?> scopeProfilesList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/scope_profiles'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth scope Profiles create.
  Future<AppbaseApiResult?> scopeProfilesCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/scope_profiles'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth scope Profiles update.
  Future<AppbaseApiResult?> scopeProfilesUpdate(String scopeProfileId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/scope_profiles/${serializePathParameter(scopeProfileId, const PathParameterSpec('scopeProfileId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth secrets list.
  Future<AppbaseApiResult?> secretsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/secrets'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth secrets create.
  Future<AppbaseApiResult?> secretsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/secrets'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth secrets delete.
  Future<AppbaseApiResult?> secretsDelete(String secretId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/oauth/secrets/${serializePathParameter(secretId, const PathParameterSpec('secretId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth surfaces list.
  Future<AppbaseApiResult?> surfacesList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/surfaces'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth surfaces create.
  Future<AppbaseApiResult?> surfacesCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/surfaces'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth surfaces delete.
  Future<AppbaseApiResult?> surfacesDelete(String surfaceId) async {
    final response = await _client.delete(ApiPaths.backendPath('/iam/oauth/surfaces/${serializePathParameter(surfaceId, const PathParameterSpec('surfaceId', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth surfaces update.
  Future<AppbaseApiResult?> surfacesUpdate(String surfaceId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/surfaces/${serializePathParameter(surfaceId, const PathParameterSpec('surfaceId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth tenant Bindings list.
  Future<AppbaseApiResult?> tenantBindingsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/tenant_bindings'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth tenant Bindings create.
  Future<AppbaseApiResult?> tenantBindingsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/tenant_bindings'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth tenant Bindings update.
  Future<AppbaseApiResult?> tenantBindingsUpdate(String bindingId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/tenant_bindings/${serializePathParameter(bindingId, const PathParameterSpec('bindingId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth webhook Configs list.
  Future<AppbaseApiResult?> webhookConfigsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.backendPath('/iam/oauth/webhook_configs'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth webhook Configs create.
  Future<AppbaseApiResult?> webhookConfigsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/webhook_configs'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth webhook Configs update.
  Future<AppbaseApiResult?> webhookConfigsUpdate(String webhookConfigId, [Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.backendPath('/iam/oauth/webhook_configs/${serializePathParameter(webhookConfigId, const PathParameterSpec('webhookConfigId', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Iam oauth webhook Configs verifications create.
  Future<AppbaseApiResult?> webhookConfigsVerificationsCreate(String webhookConfigId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.backendPath('/iam/oauth/webhook_configs/${serializePathParameter(webhookConfigId, const PathParameterSpec('webhookConfigId', 'simple', false))}/verifications'), body: payload, contentType: 'application/json');
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
