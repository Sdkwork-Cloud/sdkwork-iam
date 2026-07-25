import 'package:sdkwork_iam_flutter_mobile_core/sdkwork_iam_flutter_mobile_core.dart';
import 'package:test/test.dart';

void main() {
  test('production accepts a trusted host token without embedded credentials',
      () {
    expect(
      resolveSdkworkFlutterCredentialEntryBootstrapAccessToken(
        hostAccessToken: ' host-bootstrap-token ',
        environment: 'production',
        compileTimeAccessToken: '',
      ),
      'host-bootstrap-token',
    );
  });

  test('development may use a compile-time bootstrap handoff', () {
    expect(
      resolveSdkworkFlutterCredentialEntryBootstrapAccessToken(
        environment: 'development',
        compileTimeAccessToken: ' development-token ',
      ),
      'development-token',
    );
  });

  test('production and staging reject embedded bootstrap credentials', () {
    for (final environment in ['staging', 'production', 'prod']) {
      expect(
        () => resolveSdkworkFlutterCredentialEntryBootstrapAccessToken(
          hostAccessToken: 'host-bootstrap-token',
          environment: environment,
          compileTimeAccessToken: 'embedded-token',
        ),
        throwsStateError,
      );
    }
  });

  test('missing bootstrap credentials fail before SDK dispatch', () {
    expect(
      resolveSdkworkFlutterCredentialEntryBootstrapAccessToken(
        compileTimeAccessToken: '',
      ),
      isNull,
    );
    expect(
      () => requireSdkworkFlutterCredentialEntryBootstrapAccessToken(null),
      throwsStateError,
    );
  });
}
