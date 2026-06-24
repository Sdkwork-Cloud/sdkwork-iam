import 'package:sdkwork_iam_flutter_mobile_user/sdkwork_iam_flutter_mobile_user.dart';
import 'package:test/test.dart';

void main() {
  test('loads and updates the current user profile', () async {
    var storedDisplayName = 'Alice';

    final controller = IamFlutterMobileUserProfileController(
      retrieveProfile: () async => {
        'userId': 'user-1',
        'displayName': storedDisplayName,
        'email': 'alice@example.com',
      },
      updateProfile: (draft) async {
        storedDisplayName = draft.displayName ?? storedDisplayName;
        return {
          'userId': 'user-1',
          'displayName': storedDisplayName,
          'nickname': draft.nickname,
        };
      },
    );

    await expectLater(
      controller.loadProfile(),
      completion(isA<IamFlutterMobileUserProfile>().having((profile) => profile.displayName, 'displayName', 'Alice')),
    );

    await expectLater(
      controller.saveProfile(const IamFlutterMobileUserProfileDraft(displayName: 'Alice Updated', nickname: 'ali')),
      completion(isA<IamFlutterMobileUserProfile>().having((profile) => profile.nickname, 'nickname', 'ali')),
    );

    expect(controller.profile?.displayName, 'Alice Updated');
  });
}
