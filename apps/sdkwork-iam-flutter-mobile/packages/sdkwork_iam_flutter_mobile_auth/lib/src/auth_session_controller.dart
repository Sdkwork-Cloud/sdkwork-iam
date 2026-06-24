class IamFlutterMobileAuthSession {
  const IamFlutterMobileAuthSession({
    this.accessToken,
    this.refreshToken,
    this.sessionId,
    this.userId,
  });

  final String? accessToken;
  final String? refreshToken;
  final String? sessionId;
  final String? userId;
}

class IamFlutterMobileLoginCredentials {
  const IamFlutterMobileLoginCredentials({
    required this.password,
    required this.username,
  });

  final String password;
  final String username;
}

typedef IamFlutterMobileAuthSessionCreator = Future<Map<String, dynamic>> Function(
  IamFlutterMobileLoginCredentials credentials,
);

typedef IamFlutterMobileAuthLogout = Future<void> Function();

/// Framework-independent auth session controller for Flutter host apps.
class IamFlutterMobileAuthSessionController {
  IamFlutterMobileAuthSessionController({
    required IamFlutterMobileAuthSessionCreator createSession,
    required IamFlutterMobileAuthLogout logout,
  })  : _createSession = createSession,
        _logout = logout;

  final IamFlutterMobileAuthSessionCreator _createSession;
  final IamFlutterMobileAuthLogout _logout;

  IamFlutterMobileAuthSession? _session;

  IamFlutterMobileAuthSession? get session => _session;

  Future<IamFlutterMobileAuthSession> login(IamFlutterMobileLoginCredentials credentials) async {
    final payload = await _createSession(credentials);
    _session = IamFlutterMobileAuthSession(
      accessToken: _optionalString(payload['accessToken'] ?? payload['access_token']),
      refreshToken: _optionalString(payload['refreshToken'] ?? payload['refresh_token']),
      sessionId: _optionalString(payload['sessionId'] ?? payload['session_id']),
      userId: _optionalString(payload['userId'] ?? payload['user_id']),
    );
    return _session!;
  }

  Future<void> signOut() async {
    await _logout();
    _session = null;
  }

  static String? _optionalString(Object? value) {
    if (value == null) {
      return null;
    }
    final normalized = value.toString().trim();
    return normalized.isEmpty ? null : normalized;
  }
}
