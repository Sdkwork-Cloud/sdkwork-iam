import 'package:sdkwork_iam_flutter_mobile_account_binding/sdkwork_iam_flutter_mobile_account_binding.dart';
import 'package:test/test.dart';

void main() {
  test('loads account binding policy and oauth account links', () async {
    final controller = IamFlutterMobileAccountBindingController(
      retrievePolicy: () async => {
        'contactBinding': {'enabled': true, 'emailEnabled': true},
        'oauthBinding': {'selfServiceLinkEnabled': true},
      },
      listAccountLinks: () async => [
        {'id': 'link-1', 'provider': 'github'},
      ],
    );

    await expectLater(
      controller.loadPolicy(),
      completion(isA<IamFlutterMobileAccountBindingPolicy>().having((policy) => policy.oauthSelfServiceLinkEnabled, 'oauthSelfServiceLinkEnabled', true)),
    );
    await expectLater(
      controller.loadAccountLinks(),
      completion(hasLength(1)),
    );
    expect(controller.accountLinks.first.provider, 'github');
  });
}
