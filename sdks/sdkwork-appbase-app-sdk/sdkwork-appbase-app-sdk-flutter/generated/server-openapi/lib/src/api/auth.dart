import '../http/client.dart';
import '../models.dart';

import 'paths.dart';
import 'response_helpers.dart';


class AuthApi {
  final HttpClient _client;

  AuthApi(this._client);

  /// Password Reset Requests create.
  Future<AppbaseApiResult?> passwordResetRequestsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.request('POST', ApiPaths.appPath('/auth/password_reset_requests'), body: payload, contentType: 'application/json', skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Password Resets create.
  Future<AppbaseApiResult?> passwordResetsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.request('POST', ApiPaths.appPath('/auth/password_resets'), body: payload, contentType: 'application/json', skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Registrations create.
  Future<AppbaseApiResult?> registrationsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.request('POST', ApiPaths.appPath('/auth/registrations'), body: payload, contentType: 'application/json', skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Sessions create.
  Future<AppbaseApiResult?> sessionsCreate(AppbaseSessionCreateCommand body) async {
    final payload = body.toJson();
    final response = await _client.request('POST', ApiPaths.appPath('/auth/sessions'), body: payload, contentType: 'application/json', skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Sessions current delete.
  Future<AppbaseApiResult?> sessionsCurrentDelete() async {
    final response = await _client.delete(ApiPaths.appPath('/auth/sessions/current'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Sessions current retrieve.
  Future<AppbaseApiResult?> sessionsCurrentRetrieve() async {
    final response = await _client.get(ApiPaths.appPath('/auth/sessions/current'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Sessions current update.
  Future<AppbaseApiResult?> sessionsCurrentUpdate([Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.appPath('/auth/sessions/current'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Sessions login Context Selection create.
  Future<AppbaseApiResult?> sessionsLoginContextSelectionCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.request('POST', ApiPaths.appPath('/auth/sessions/login_context_selection'), body: payload, contentType: 'application/json', skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Sessions organization Selection create.
  Future<AppbaseApiResult?> sessionsOrganizationSelectionCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.request('POST', ApiPaths.appPath('/auth/sessions/organization_selection'), body: payload, contentType: 'application/json', skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }

  /// Sessions refresh.
  Future<AppbaseApiResult?> sessionsRefresh(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.request('POST', ApiPaths.appPath('/auth/sessions/refresh'), body: payload, contentType: 'application/json', skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : AppbaseApiResult.fromJson(map);
    })();
  }
}
