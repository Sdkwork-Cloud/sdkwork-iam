import 'src/http/client.dart';
import 'src/http/sdk_config.dart';
import 'src/api/auth.dart';
import 'src/api/iam.dart';
import 'src/api/oauth.dart';
import 'src/api/system.dart';

class SdkworkAppClient {
  final HttpClient _httpClient;

  late final AuthApi auth;
  late final IamApi iam;
  late final OauthApi oauth;
  late final SystemApi system;

  SdkworkAppClient({
    required SdkConfig config,
  }) : _httpClient = HttpClient(config: config) {
    auth = AuthApi(_httpClient);
    iam = IamApi(_httpClient);
    oauth = OauthApi(_httpClient);
    system = SystemApi(_httpClient);
  }

  factory SdkworkAppClient.withBaseUrl({
    required String baseUrl,
    String? authToken,
    String? accessToken,
    Map<String, String>? headers,
    int timeout = 30000,
  }) {
    return SdkworkAppClient(
      config: SdkConfig(
        baseUrl: baseUrl,
        timeout: timeout,
        headers: headers ?? const {},
        authToken: authToken,
        accessToken: accessToken,
      ),
    );
  }

  void setAuthToken(String token) {
    _httpClient.setAuthToken(token);
  }

  void setAccessToken(String token) {
    _httpClient.setAccessToken(token);
  }

  void setHeader(String key, String value) {
    _httpClient.setHeader(key, value);
  }

  void close() {
    _httpClient.close();
  }
}
