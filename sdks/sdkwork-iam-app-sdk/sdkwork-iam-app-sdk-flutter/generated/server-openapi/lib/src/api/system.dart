import '../http/client.dart';
import '../models.dart';

import 'paths.dart';
import 'response_helpers.dart';


class SystemApi {
  final HttpClient _client;

  SystemApi(this._client);

  /// Iam account Binding Policy retrieve.
  Future<SdkWorkResourceResponse?> iamAccountBindingPolicyRetrieve() async {
    final response = await _client.request('GET', ApiPaths.appPath('/system/iam/account_binding_policy'), skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Iam runtime retrieve.
  Future<SdkWorkResourceResponse?> iamRuntimeRetrieve() async {
    final response = await _client.request('GET', ApiPaths.appPath('/system/iam/runtime'), skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }

  /// Iam verification Policy retrieve.
  Future<SdkWorkResourceResponse?> iamVerificationPolicyRetrieve() async {
    final response = await _client.request('GET', ApiPaths.appPath('/system/iam/verification_policy'), skipAuth: true);
    return (() {
      final map = sdkworkResponseAsMap(response);
      return map == null ? null : SdkWorkResourceResponse.fromJson(map);
    })();
  }
}
