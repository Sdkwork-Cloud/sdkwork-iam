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
      },
      logout: () async {
        loggedOut = true;
      },
    );

    final session = await controller.login(
      const IamFlutterMobileLoginCredentials(username: 'alice', password: 'secret'),
    );

    expect(session.userId, 'user-1');
    expect(controller.session?.sessionId, 'sess-1');

    await controller.signOut();
    expect(loggedOut, isTrue);
    expect(controller.session, isNull);
  });
}
