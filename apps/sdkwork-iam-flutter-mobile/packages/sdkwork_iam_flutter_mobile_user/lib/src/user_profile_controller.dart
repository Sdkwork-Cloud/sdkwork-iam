import 'package:sdkwork_iam_flutter_mobile_core/sdkwork_iam_flutter_mobile_core.dart';

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

class IamFlutterMobilePasswordDraft {
  const IamFlutterMobilePasswordDraft({
    required this.confirmPassword,
    required this.newPassword,
    required this.oldPassword,
  });

  final String confirmPassword;
  final String newPassword;
  final String oldPassword;
}

typedef IamFlutterMobileUserProfileRetriever = Future<Map<String, dynamic>> Function();

typedef IamFlutterMobileUserProfileUpdater = Future<Map<String, dynamic>> Function(
  IamFlutterMobileUserProfileDraft draft,
);

typedef IamFlutterMobilePasswordUpdater = Future<void> Function(
  IamFlutterMobilePasswordDraft draft,
);

/// Framework-independent user profile controller for Flutter host apps.
class IamFlutterMobileVerificationPolicy {
  const IamFlutterMobileVerificationPolicy({
    this.emailVerificationRequired,
    this.phoneVerificationRequired,
  });

  final bool? emailVerificationRequired;
  final bool? phoneVerificationRequired;
}

typedef IamFlutterMobileVerificationPolicyRetriever = Future<Map<String, dynamic>> Function();

class IamFlutterMobileUserProfileController {
  IamFlutterMobileUserProfileController({
    required IamFlutterMobileUserProfileRetriever retrieveProfile,
    required IamFlutterMobileUserProfileUpdater updateProfile,
    IamFlutterMobilePasswordUpdater? updatePassword,
    IamFlutterMobileVerificationPolicyRetriever? retrieveVerificationPolicy,
  })  : _retrieveProfile = retrieveProfile,
        _updateProfile = updateProfile,
        _updatePassword = updatePassword,
        _retrieveVerificationPolicy = retrieveVerificationPolicy;

  final IamFlutterMobileUserProfileRetriever _retrieveProfile;
  final IamFlutterMobileUserProfileUpdater _updateProfile;
  final IamFlutterMobilePasswordUpdater? _updatePassword;
  final IamFlutterMobileVerificationPolicyRetriever? _retrieveVerificationPolicy;

  IamFlutterMobileUserProfile? _profile;
  IamFlutterMobileVerificationPolicy? _verificationPolicy;

  IamFlutterMobileUserProfile? get profile => _profile;
  IamFlutterMobileVerificationPolicy? get verificationPolicy => _verificationPolicy;

  Future<IamFlutterMobileUserProfile> loadProfile() async {
    final payload = await _retrieveProfile();
    _profile = _toProfile(payload);
    return _profile!;
  }

  Future<IamFlutterMobileVerificationPolicy> loadVerificationPolicy() async {
    final retriever = _retrieveVerificationPolicy;
    if (retriever == null) {
      throw StateError('Verification policy retrieval is not configured for this controller');
    }
    final payload = await retriever();
    _verificationPolicy = _toVerificationPolicy(payload);
    return _verificationPolicy!;
  }

  Future<IamFlutterMobileUserProfile> saveProfile(IamFlutterMobileUserProfileDraft draft) async {
    final payload = await _updateProfile(draft);
    _profile = _toProfile(payload);
    return _profile!;
  }

  Future<void> changePassword(IamFlutterMobilePasswordDraft draft) async {
    final updater = _updatePassword;
    if (updater == null) {
      throw StateError('Password update is not configured for this controller');
    }
    await updater(draft);
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

  static IamFlutterMobileVerificationPolicy _toVerificationPolicy(Map<String, dynamic> payload) {
    return IamFlutterMobileVerificationPolicy(
      emailVerificationRequired: _optionalBool(
        payload['emailVerificationRequired'] ?? payload['email_verification_required'],
      ),
      phoneVerificationRequired: _optionalBool(
        payload['phoneVerificationRequired'] ?? payload['phone_verification_required'],
      ),
    );
  }

  static bool? _optionalBool(Object? value) {
    if (value is bool) {
      return value;
    }
    if (value is String) {
      final normalized = sdkworkNormalizeLowercase(value);
      if (normalized == 'true' || normalized == '1') {
        return true;
      }
      if (normalized == 'false' || normalized == '0') {
        return false;
      }
    }
    return null;
  }

  static String? _optionalString(Object? value) => sdkworkNormalizeOptionalString(value);
}
