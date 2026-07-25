const String sdkworkAccessTokenEnvironmentKey = 'SDKWORK_ACCESS_TOKEN';

String? resolveSdkworkFlutterCredentialEntryBootstrapAccessToken({
  String? hostAccessToken,
  String environment = const String.fromEnvironment(
    'FLUTTER_ENV',
    defaultValue: 'development',
  ),
  String compileTimeAccessToken = const String.fromEnvironment(
    sdkworkAccessTokenEnvironmentKey,
  ),
}) {
  final normalizedEnvironment = environment.trim().toLowerCase();
  final embeddedToken = _normalizeOptionalText(compileTimeAccessToken);
  if (embeddedToken != null &&
      (normalizedEnvironment == 'staging' ||
          normalizedEnvironment == 'production' ||
          normalizedEnvironment == 'prod')) {
    throw StateError(
      '$sdkworkAccessTokenEnvironmentKey must not be embedded in '
      '$normalizedEnvironment Flutter artifacts; use a trusted native host channel',
    );
  }

  final trustedHostToken = _normalizeOptionalText(hostAccessToken);
  if (trustedHostToken != null) {
    return trustedHostToken;
  }

  return embeddedToken;
}

String requireSdkworkFlutterCredentialEntryBootstrapAccessToken(
  String? accessToken,
) {
  final normalized = _normalizeOptionalText(accessToken);
  if (normalized == null) {
    throw StateError(
      '$sdkworkAccessTokenEnvironmentKey is required before Flutter '
      'credential-entry SDK calls',
    );
  }
  return normalized;
}

String? _normalizeOptionalText(String? value) {
  final normalized = value?.trim();
  return normalized == null || normalized.isEmpty ? null : normalized;
}
