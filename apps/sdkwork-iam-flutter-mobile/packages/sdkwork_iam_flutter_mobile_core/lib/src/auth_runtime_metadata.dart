enum SdkworkAuthLoginMethod {
  emailCode,
  password,
  phoneCode,
  sessionBridge,
}

enum SdkworkAuthRegisterMethod { email, phone }

enum SdkworkAuthRecoveryMethod { email, phone }

enum SdkworkAuthOAuthProviderRegion { mainland, overseas }

class SdkworkAuthVerificationPolicyConfig {
  const SdkworkAuthVerificationPolicyConfig({
    this.emailCodeLoginEnabled,
    this.emailRegistrationVerificationRequired,
    this.phoneCodeLoginEnabled,
    this.phoneRegistrationVerificationRequired,
    this.oauthLoginEnabled,
  });

  final bool? emailCodeLoginEnabled;
  final bool? emailRegistrationVerificationRequired;
  final bool? phoneCodeLoginEnabled;
  final bool? phoneRegistrationVerificationRequired;
  final bool? oauthLoginEnabled;
}

class SdkworkAuthRuntimeConfig {
  const SdkworkAuthRuntimeConfig({
    this.loginMethods = const [],
    this.oauthLoginEnabled = false,
    this.oauthProviderRegion,
    this.oauthProviders = const [],
    this.sdkworkOAuthProviderEnabled,
    this.qrLoginEnabled,
    this.recoveryMethods = const [],
    this.registerMethods = const [],
    this.verificationPolicy,
  });

  final List<SdkworkAuthLoginMethod> loginMethods;
  final bool oauthLoginEnabled;
  final SdkworkAuthOAuthProviderRegion? oauthProviderRegion;
  final List<String> oauthProviders;
  final bool? sdkworkOAuthProviderEnabled;
  final bool? qrLoginEnabled;
  final List<SdkworkAuthRecoveryMethod> recoveryMethods;
  final List<SdkworkAuthRegisterMethod> registerMethods;
  final SdkworkAuthVerificationPolicyConfig? verificationPolicy;
}

bool isSdkworkAuthLoginMethod(String? value) {
  return value == 'password'
      || value == 'phoneCode'
      || value == 'emailCode'
      || value == 'sessionBridge';
}

bool isSdkworkAuthRegisterMethod(String? value) {
  return value == 'email' || value == 'phone';
}

bool isSdkworkAuthRecoveryMethod(String? value) {
  return value == 'email' || value == 'phone';
}

bool isSdkworkAuthOAuthProviderRegion(String? value) {
  return value == 'mainland' || value == 'overseas';
}

SdkworkAuthLoginMethod? parseSdkworkAuthLoginMethod(String? value) {
  switch (value) {
    case 'password':
      return SdkworkAuthLoginMethod.password;
    case 'phoneCode':
      return SdkworkAuthLoginMethod.phoneCode;
    case 'emailCode':
      return SdkworkAuthLoginMethod.emailCode;
    case 'sessionBridge':
      return SdkworkAuthLoginMethod.sessionBridge;
    default:
      return null;
  }
}

SdkworkAuthRegisterMethod? parseSdkworkAuthRegisterMethod(String? value) {
  switch (value) {
    case 'email':
      return SdkworkAuthRegisterMethod.email;
    case 'phone':
      return SdkworkAuthRegisterMethod.phone;
    default:
      return null;
  }
}

SdkworkAuthRecoveryMethod? parseSdkworkAuthRecoveryMethod(String? value) {
  switch (value) {
    case 'email':
      return SdkworkAuthRecoveryMethod.email;
    case 'phone':
      return SdkworkAuthRecoveryMethod.phone;
    default:
      return null;
  }
}

SdkworkAuthOAuthProviderRegion? parseSdkworkAuthOAuthProviderRegion(String? value) {
  switch (value) {
    case 'mainland':
      return SdkworkAuthOAuthProviderRegion.mainland;
    case 'overseas':
      return SdkworkAuthOAuthProviderRegion.overseas;
    default:
      return null;
  }
}

SdkworkAuthRuntimeConfig resolveSdkworkAuthRuntimeConfigFromMetadata(
  Map<String, dynamic>? authConfig,
) {
  final verificationPolicy = _resolveMetadataVerificationPolicy(authConfig);
  final configuredLoginMethods = _readStringList(authConfig, 'loginMethods');
  final loginMethods = configuredLoginMethods.isNotEmpty
      ? configuredLoginMethods
          .where(isSdkworkAuthLoginMethod)
          .map(parseSdkworkAuthLoginMethod)
          .whereType<SdkworkAuthLoginMethod>()
          .where((method) {
            if (method == SdkworkAuthLoginMethod.emailCode
                && verificationPolicy.emailCodeLoginEnabled == false) {
              return false;
            }
            if (method == SdkworkAuthLoginMethod.phoneCode
                && verificationPolicy.phoneCodeLoginEnabled == false) {
              return false;
            }
            return true;
          })
          .toList(growable: false)
      : _deriveLoginMethods(authConfig, verificationPolicy);

  final configuredRegisterMethods = _readStringList(authConfig, 'registerMethods')
      .where(isSdkworkAuthRegisterMethod)
      .map(parseSdkworkAuthRegisterMethod)
      .whereType<SdkworkAuthRegisterMethod>()
      .toList(growable: false);
  final supportsLocalCredentials = _readBool(authConfig, 'supportsLocalCredentials') ?? true;
  final registerMethods = configuredRegisterMethods.isNotEmpty
      ? configuredRegisterMethods
      : (supportsLocalCredentials
          ? const [SdkworkAuthRegisterMethod.email]
          : const <SdkworkAuthRegisterMethod>[]);

  final recoveryMethods = _readStringList(authConfig, 'recoveryMethods')
      .where(isSdkworkAuthRecoveryMethod)
      .map(parseSdkworkAuthRecoveryMethod)
      .whereType<SdkworkAuthRecoveryMethod>()
      .toList(growable: false);

  final oauthProviderRegionValue = authConfig?['oauthProviderRegion'] as String?;
  final oauthProviderRegion = parseSdkworkAuthOAuthProviderRegion(oauthProviderRegionValue);

  return SdkworkAuthRuntimeConfig(
    loginMethods: loginMethods,
    oauthLoginEnabled: _readBool(authConfig, 'oauthLoginEnabled') ?? false,
    oauthProviderRegion: oauthProviderRegion,
    oauthProviders: List<String>.from(_readStringList(authConfig, 'oauthProviders')),
    sdkworkOAuthProviderEnabled: _readBool(authConfig, 'sdkworkOAuthProviderEnabled'),
    qrLoginEnabled: _readBool(authConfig, 'qrLoginEnabled'),
    recoveryMethods: recoveryMethods,
    registerMethods: registerMethods,
    verificationPolicy: _hasVerificationPolicyValues(verificationPolicy)
        ? verificationPolicy
        : null,
  );
}

List<SdkworkAuthLoginMethod> _deriveLoginMethods(
  Map<String, dynamic>? authConfig,
  SdkworkAuthVerificationPolicyConfig verificationPolicy,
) {
  final resolved = <SdkworkAuthLoginMethod>[];
  final supportsLocalCredentials = _readBool(authConfig, 'supportsLocalCredentials') ?? true;
  final supportsSessionExchange = _readBool(authConfig, 'supportsSessionExchange') ?? false;

  if (supportsLocalCredentials) {
    resolved.add(SdkworkAuthLoginMethod.password);
  }
  if (supportsSessionExchange) {
    resolved.add(SdkworkAuthLoginMethod.sessionBridge);
  }
  if (verificationPolicy.emailCodeLoginEnabled ?? false) {
    resolved.add(SdkworkAuthLoginMethod.emailCode);
  }
  if (verificationPolicy.phoneCodeLoginEnabled ?? false) {
    resolved.add(SdkworkAuthLoginMethod.phoneCode);
  }

  return resolved.isEmpty
      ? const [SdkworkAuthLoginMethod.password]
      : List<SdkworkAuthLoginMethod>.unmodifiable(resolved);
}

SdkworkAuthVerificationPolicyConfig _resolveMetadataVerificationPolicy(
  Map<String, dynamic>? authConfig,
) {
  final nestedPolicy = _readMap(authConfig, 'verificationPolicy');
  return SdkworkAuthVerificationPolicyConfig(
    emailCodeLoginEnabled: _readBool(nestedPolicy, 'emailCodeLoginEnabled')
        ?? _readBool(authConfig, 'emailCodeLoginEnabled'),
    emailRegistrationVerificationRequired:
        _readBool(nestedPolicy, 'emailRegistrationVerificationRequired')
            ?? _readBool(authConfig, 'emailRegistrationVerificationRequired'),
    phoneCodeLoginEnabled: _readBool(nestedPolicy, 'phoneCodeLoginEnabled')
        ?? _readBool(authConfig, 'phoneCodeLoginEnabled'),
    phoneRegistrationVerificationRequired:
        _readBool(nestedPolicy, 'phoneRegistrationVerificationRequired')
            ?? _readBool(authConfig, 'phoneRegistrationVerificationRequired'),
    oauthLoginEnabled: _readBool(nestedPolicy, 'oauthLoginEnabled')
        ?? _readBool(authConfig, 'oauthLoginEnabled'),
  );
}

bool _hasVerificationPolicyValues(SdkworkAuthVerificationPolicyConfig policy) {
  return policy.emailCodeLoginEnabled != null
      || policy.emailRegistrationVerificationRequired != null
      || policy.phoneCodeLoginEnabled != null
      || policy.phoneRegistrationVerificationRequired != null
      || policy.oauthLoginEnabled != null;
}

Map<String, dynamic>? _readMap(Map<String, dynamic>? source, String key) {
  final value = source?[key];
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }
  return null;
}

bool? _readBool(Map<String, dynamic>? source, String key) {
  final value = source?[key];
  return value is bool ? value : null;
}

List<String> _readStringList(Map<String, dynamic>? source, String key) {
  final value = source?[key];
  if (value is! List) {
    return const [];
  }
  return value.whereType<String>().toList(growable: false);
}
