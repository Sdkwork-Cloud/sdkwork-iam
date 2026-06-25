import 'package:sdkwork_iam_flutter_mobile_auth/sdkwork_iam_flutter_mobile_auth.dart';
import 'package:test/test.dart';

void main() {
  test('login and signOut manage session state', () async {
    var loggedOut = false;
    final controller = IamFlutterMobileAuthSessionController(
      createSession: (_) async => {
        'sessionId': 'sess-1',
        'userId': 'user-1',
        'accessToken': 'token',
        'authToken': 'auth-token',
      },
      logout: () async {
        loggedOut = true;
      },
    );

    final result = await controller.login(
      const IamFlutterMobileLoginCredentials(username: 'alice', password: 'secret'),
    );

    expect(result, isA<IamFlutterMobileLoginSessionResult>());
    expect((result as IamFlutterMobileLoginSessionResult).session.userId, 'user-1');
    expect(controller.session?.sessionId, 'sess-1');

    await controller.signOut();
    expect(loggedOut, isTrue);
    expect(controller.session, isNull);
  });

  test('login context selection completes personal login with organizationId 0', () async {
    Map<String, String>? capturedBody;
    final controller = IamFlutterMobileAuthSessionController(
      createSession: (_) async => {
        'challengeType': 'LOGIN_CONTEXT_SELECTION',
        'continuationToken': 'continue-1',
        'organizations': [
          {'organizationId': 'org-1', 'displayName': 'Org One'},
        ],
      },
      createLoginContextSelection: (body) async {
        capturedBody = body;
        return {
          'sessionId': 'sess-2',
          'userId': 'user-1',
          'accessToken': 'token',
          'authToken': 'auth-token',
        };
      },
      logout: () async {},
    );

    final loginResult = await controller.login(
      const IamFlutterMobileLoginCredentials(username: 'alice', password: 'secret'),
    );
    expect(loginResult, isA<IamFlutterMobileLoginContextSelectionRequiredResult>());
    expect(controller.challenge?.continuationToken, 'continue-1');

    final session = await controller.selectPersonalLogin('continue-1');
    expect(session.sessionId, 'sess-2');
    expect(capturedBody, {
      'continuationToken': 'continue-1',
      'loginScope': 'TENANT',
      'organizationId': '0',
    });
  });
}
