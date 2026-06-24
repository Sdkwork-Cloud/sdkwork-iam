import 'dart:convert';
import '../http/client.dart';
import '../models.dart';

import 'paths.dart';
import 'response_helpers.dart';


class IamApi {
  final HttpClient _client;

  IamApi(this._client);

  /// Department Assignments list.
  Future<AppbaseApiResult?> departmentAssignmentsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/iam/department_assignments'), query));
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
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/iam/departments'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Departments tree retrieve.
  Future<AppbaseApiResult?> departmentsTreeRetrieve() async {
    final response = await _client.get(ApiPaths.appPath('/iam/departments/tree'));
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
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/iam/organization_memberships'), query));
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
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/iam/organizations'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Organizations tree retrieve.
  Future<AppbaseApiResult?> organizationsTreeRetrieve() async {
    final response = await _client.get(ApiPaths.appPath('/iam/organizations/tree'));
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
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/iam/position_assignments'), query));
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
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/iam/positions'), query));
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
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/iam/role_bindings'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Users current retrieve.
  Future<AppbaseApiResult?> usersCurrentRetrieve() async {
    final response = await _client.get(ApiPaths.appPath('/iam/users/current'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Users current update.
  Future<AppbaseApiResult?> usersCurrentUpdate([Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.appPath('/iam/users/current'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Users current email Bindings delete.
  Future<AppbaseApiResult?> usersCurrentEmailBindingsDelete() async {
    final response = await _client.delete(ApiPaths.appPath('/iam/users/current/email_bindings'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Users current email Bindings create.
  Future<AppbaseApiResult?> usersCurrentEmailBindingsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/iam/users/current/email_bindings'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Users current password update.
  Future<AppbaseApiResult?> usersCurrentPasswordUpdate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/iam/users/current/password'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Users current phone Bindings delete.
  Future<AppbaseApiResult?> usersCurrentPhoneBindingsDelete() async {
    final response = await _client.delete(ApiPaths.appPath('/iam/users/current/phone_bindings'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Users current phone Bindings create.
  Future<AppbaseApiResult?> usersCurrentPhoneBindingsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/iam/users/current/phone_bindings'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }
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
