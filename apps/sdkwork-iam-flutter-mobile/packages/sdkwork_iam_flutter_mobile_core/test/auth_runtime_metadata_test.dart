import 'package:sdkwork_iam_flutter_mobile_core/sdkwork_iam_flutter_mobile_core.dart';
import 'package:test/test.dart';

void main() {
  group('resolveSdkworkAuthRuntimeConfigFromMetadata', () {
    test('preserves OAuth provider region from canonical auth metadata', () {
      final config = resolveSdkworkAuthRuntimeConfigFromMetadata({
        'oauthLoginEnabled': true,
        'oauthProviderRegion': 'overseas',
        'supportsLocalCredentials': true,
      });

      expect(config.oauthLoginEnabled, isTrue);
      expect(config.oauthProviderRegion, SdkworkAuthOAuthProviderRegion.overseas);
      expect(config.oauthProviders, isEmpty);
    });

    test('derives login methods from supportsLocalCredentials and supportsSessionExchange', () {
      final config = resolveSdkworkAuthRuntimeConfigFromMetadata({
        'supportsLocalCredentials': false,
        'supportsSessionExchange': true,
        'oauthLoginEnabled': true,
      });

      expect(config.loginMethods, [SdkworkAuthLoginMethod.sessionBridge]);
      expect(config.oauthLoginEnabled, isTrue);
      expect(config.registerMethods, isEmpty);
    });

    test('uses metadata verification policy to hide disabled verification-code login tabs', () {
      final config = resolveSdkworkAuthRuntimeConfigFromMetadata({
        'loginMethods': ['password', 'emailCode', 'phoneCode'],
        'verificationPolicy': {
          'emailCodeLoginEnabled': true,
          'phoneCodeLoginEnabled': false,
        },
      });

      expect(
        config.loginMethods,
        [SdkworkAuthLoginMethod.password, SdkworkAuthLoginMethod.emailCode],
      );
    });

    test('exposes sdkwork OAuth provider enablement from relying-party metadata', () {
      final config = resolveSdkworkAuthRuntimeConfigFromMetadata({
        'sdkworkOAuthProviderEnabled': true,
        'oauthLoginEnabled': false,
      });

      expect(config.sdkworkOAuthProviderEnabled, isTrue);
      expect(config.oauthLoginEnabled, isFalse);
    });
  });
}
