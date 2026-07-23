import '../http/client.dart';
import '../models.dart';

import 'paths.dart';
import 'response_helpers.dart';


class AuthApi {
  final HttpClient _client;

  AuthApi(this._client);

  /// Password Reset Requests create.
  Future<SdkWorkResourceResponse?> passwordResetRequestsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/auth/password_reset_requests'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Password Resets create.
  Future<SdkWorkResourceResponse?> passwordResetsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/auth/password_resets'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Registrations create.
  Future<SdkWorkResourceResponse?> registrationsCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/auth/registrations'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Sessions create.
  Future<SdkWorkResourceResponse?> sessionsCreate(AppbaseSessionCreateCommand body) async {
    final payload = body.toJson();
    final response = await _client.post(ApiPaths.appPath('/auth/sessions'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Sessions current delete.
  Future<void> sessionsCurrentDelete() async {
    await _client.delete(ApiPaths.appPath('/auth/sessions/current'));
  }

  /// Sessions current retrieve.
  Future<SdkWorkResourceResponse?> sessionsCurrentRetrieve() async {
    final response = await _client.get(ApiPaths.appPath('/auth/sessions/current'));
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Sessions current update.
  Future<SdkWorkResourceResponse?> sessionsCurrentUpdate([Map<String, dynamic>? body]) async {
    final payload = body;
    final response = await _client.patch(ApiPaths.appPath('/auth/sessions/current'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Sessions login Context Selection create.
  Future<SdkWorkResourceResponse?> sessionsLoginContextSelectionCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/auth/sessions/login_context_selection'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Sessions organization Selection create.
  Future<SdkWorkResourceResponse?> sessionsOrganizationSelectionCreate(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.post(ApiPaths.appPath('/auth/sessions/organization_selection'), body: payload, contentType: 'application/json');
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Sessions refresh.
  Future<SdkWorkCommandResponse?> sessionsRefresh(Map<String, dynamic> body) async {
    final payload = body;
    final response = await _client.request('POST', ApiPaths.appPath('/auth/sessions/refresh'), body: payload, contentType: 'application/json', skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkCommandResponse.fromJson(map);
    })();
  }
}
