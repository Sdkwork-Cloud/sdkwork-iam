class IamFlutterMobileUserProfile {
  const IamFlutterMobileUserProfile({
    required this.userId,
    this.displayName,
    this.email,
    this.nickname,
    this.username,
  });

  final String userId;
  final String? displayName;
  final String? email;
  final String? nickname;
  final String? username;
}

class IamFlutterMobileUserProfileDraft {
  const IamFlutterMobileUserProfileDraft({
    this.displayName,
    this.nickname,
  });

  final String? displayName;
  final String? nickname;
}

typedef IamFlutterMobileUserProfileRetriever = Future<Map<String, dynamic>> Function();

typedef IamFlutterMobileUserProfileUpdater = Future<Map<String, dynamic>> Function(
  IamFlutterMobileUserProfileDraft draft,
);

/// Framework-independent user profile controller for Flutter host apps.
class IamFlutterMobileUserProfileController {
  IamFlutterMobileUserProfileController({
    required IamFlutterMobileUserProfileRetriever retrieveProfile,
    required IamFlutterMobileUserProfileUpdater updateProfile,
  })  : _retrieveProfile = retrieveProfile,
        _updateProfile = updateProfile;

  final IamFlutterMobileUserProfileRetriever _retrieveProfile;
  final IamFlutterMobileUserProfileUpdater _updateProfile;

  IamFlutterMobileUserProfile? _profile;

  IamFlutterMobileUserProfile? get profile => _profile;

  Future<IamFlutterMobileUserProfile> loadProfile() async {
    final payload = await _retrieveProfile();
    _profile = _toProfile(payload);
    return _profile!;
  }

  Future<IamFlutterMobileUserProfile> saveProfile(IamFlutterMobileUserProfileDraft draft) async {
    final payload = await _updateProfile(draft);
    _profile = _toProfile(payload);
    return _profile!;
  }

  static IamFlutterMobileUserProfile _toProfile(Map<String, dynamic> payload) {
    final userId = _optionalString(payload['userId'] ?? payload['user_id'] ?? payload['id']);
    if (userId == null) {
      throw StateError('User profile payload is missing userId');
    }

    return IamFlutterMobileUserProfile(
      userId: userId,
      displayName: _optionalString(payload['displayName'] ?? payload['display_name']),
      email: _optionalString(payload['email']),
      nickname: _optionalString(payload['nickname']),
      username: _optionalString(payload['username']),
    );
  }

  static String? _optionalString(Object? value) {
    if (value == null) {
      return null;
    }
    final normalized = value.toString().trim();
    return normalized.isEmpty ? null : normalized;
  }
}
