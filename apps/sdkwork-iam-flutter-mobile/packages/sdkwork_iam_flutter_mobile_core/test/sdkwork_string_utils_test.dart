import 'package:sdkwork_iam_flutter_mobile_core/sdkwork_iam_flutter_mobile_core.dart';
import 'package:test/test.dart';

void main() {
  test('sdkworkIsBlank matches @sdkwork/utils semantics', () {
    expect(sdkworkIsBlank(null), isTrue);
    expect(sdkworkIsBlank(''), isTrue);
    expect(sdkworkIsBlank('   '), isTrue);
    expect(sdkworkIsBlank('iam'), isFalse);
  });

  test('sdkworkNormalizeOptionalString trims and drops empty values', () {
    expect(sdkworkNormalizeOptionalString(null), isNull);
    expect(sdkworkNormalizeOptionalString('  tenant  '), 'tenant');
    expect(sdkworkNormalizeOptionalString('   '), isNull);
  });
}
