import 'src/http/client.dart';
import 'src/http/sdk_config.dart';
import 'src/api/iam_oauth.dart';

class SdkworkCustomClient {
  final HttpClient _httpClient;

  late final IamOauthApi iamOauth;

  SdkworkCustomClient({
    required SdkConfig config,
  }) : _httpClient = HttpClient(config: config) {
    iamOauth = IamOauthApi(_httpClient);
  }

  factory SdkworkCustomClient.withBaseUrl({
    required String baseUrl,
    String? apiKey,
    String? authToken,
    String? accessToken,
    String apiKeyHeader = 'X-API-Key',
    bool apiKeyAsBearer = false,
    Map<String, String>? headers,
    int timeout = 30000,
  }) {
    return SdkworkCustomClient(
      config: SdkConfig(
        baseUrl: baseUrl,
        timeout: timeout,
        headers: headers ?? const {},
        apiKey: apiKey,
        apiKeyHeader: apiKeyHeader,
        apiKeyAsBearer: apiKeyAsBearer,
        authToken: authToken,
        accessToken: accessToken,
      ),
    );
  }

  void setApiKey(String apiKey) {
    _httpClient.setApiKey(apiKey);
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
