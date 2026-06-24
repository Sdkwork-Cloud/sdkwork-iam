class SdkConfig {
  final String baseUrl;
  final int timeout;
  final Map<String, String> headers;
  final String? apiKey;
  final String apiKeyHeader;
  final bool apiKeyAsBearer;
  final String? authToken;
  final String? accessToken;

  const SdkConfig({
    required this.baseUrl,
    this.timeout = 30000,
    this.headers = const {},
    this.apiKey,
    this.apiKeyHeader = 'Authorization',
    this.apiKeyAsBearer = true,
    this.authToken,
    this.accessToken,
  });
}
