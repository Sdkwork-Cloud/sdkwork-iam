import 'dart:convert';
import '../http/client.dart';
import '../models.dart';

import 'paths.dart';
import 'response_helpers.dart';


class OauthApi {
  final HttpClient _client;

  OauthApi(this._client);

  /// Oauth account Links list.
  Future<SdkWorkListResponse?> accountLinksList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/oauth/account_links'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkListResponse.fromJson(map);
    })();
  }

  /// Oauth account Links delete.
  Future<void> accountLinksDelete(String accountLinkId) async {
    await _client.delete(ApiPaths.appPath('/oauth/account_links/${serializePathParameter(accountLinkId, const PathParameterSpec('accountLinkId', 'simple', false))}'));
  }

  /// Oauth authorization Urls create.
  Future<SdkWorkResourceResponse?> authorizationUrlsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/oauth/authorization_urls'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Oauth authorizations completions create.
  Future<SdkWorkResourceResponse?> authorizationsCompletionsCreate(String authorizationStateId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/oauth/authorizations/${serializePathParameter(authorizationStateId, const PathParameterSpec('authorizationStateId', 'simple', false))}/completions'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Oauth callbacks retrieve.
  Future<SdkWorkResourceResponse?> callbacksRetrieve(String providerCode) async {
    final response = await _client.get(ApiPaths.appPath('/oauth/callbacks/${serializePathParameter(providerCode, const PathParameterSpec('providerCode', 'simple', false))}'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Oauth callbacks create.
  Future<SdkWorkResourceResponse?> callbacksCreate(String providerCode, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/oauth/callbacks/${serializePathParameter(providerCode, const PathParameterSpec('providerCode', 'simple', false))}'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Oauth device Authorizations create.
  Future<SdkWorkResourceResponse?> deviceAuthorizationsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/oauth/device_authorizations'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Oauth device Authorizations retrieve.
  Future<SdkWorkResourceResponse?> deviceAuthorizationsRetrieve(String deviceAuthorizationId) async {
    final response = await _client.request('GET', ApiPaths.appPath('/oauth/device_authorizations/${serializePathParameter(deviceAuthorizationId, const PathParameterSpec('deviceAuthorizationId', 'simple', false))}'), skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Oauth device Authorizations password Completions create.
  Future<SdkWorkResourceResponse?> deviceAuthorizationsPasswordCompletionsCreate(String deviceAuthorizationId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/oauth/device_authorizations/${serializePathParameter(deviceAuthorizationId, const PathParameterSpec('deviceAuthorizationId', 'simple', false))}/password_completions'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Oauth device Authorizations scans create.
  Future<SdkWorkResourceResponse?> deviceAuthorizationsScansCreate(String deviceAuthorizationId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.request('POST', ApiPaths.appPath('/oauth/device_authorizations/${serializePathParameter(deviceAuthorizationId, const PathParameterSpec('deviceAuthorizationId', 'simple', false))}/scans'), body: payload, contentType: 'application/json', skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Oauth device Authorizations session Exchanges create.
  Future<SdkWorkResourceResponse?> deviceAuthorizationsSessionExchangesCreate(String deviceAuthorizationId, Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/oauth/device_authorizations/${serializePathParameter(deviceAuthorizationId, const PathParameterSpec('deviceAuthorizationId', 'simple', false))}/session_exchanges'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Oauth grants list.
  Future<SdkWorkListResponse?> grantsList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/oauth/grants'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkListResponse.fromJson(map);
    })();
  }

  /// Oauth grants delete.
  Future<void> grantsDelete(String grantId) async {
    await _client.delete(ApiPaths.appPath('/oauth/grants/${serializePathParameter(grantId, const PathParameterSpec('grantId', 'simple', false))}'));
  }

  /// Oauth mini Program Sessions create.
  Future<SdkWorkResourceResponse?> miniProgramSessionsCreate(WechatMiniProgramSessionCreateCommand body) async {
    final payload = body.toJson();
    final response = await _client.post(ApiPaths.appPath('/oauth/mini_program_sessions'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Oauth providers list.
  Future<SdkWorkListResponse?> providersList([int? page, int? pageSize, String? cursor, String? sort, String? q]) async {
    final query = buildQueryString([
      QueryParameterSpec('page', page, 'form', true, false, null),
      QueryParameterSpec('page_size', pageSize, 'form', true, false, null),
      QueryParameterSpec('cursor', cursor, 'form', true, false, null),
      QueryParameterSpec('sort', sort, 'form', true, false, null),
      QueryParameterSpec('q', q, 'form', true, false, null)
    ]);
    final response = await _client.get(ApiPaths.appendQueryString(ApiPaths.appPath('/oauth/providers'), query));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkListResponse.fromJson(map);
    })();
  }

  /// Oauth sessions create.
  Future<SdkWorkResourceResponse?> sessionsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/oauth/sessions'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
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
