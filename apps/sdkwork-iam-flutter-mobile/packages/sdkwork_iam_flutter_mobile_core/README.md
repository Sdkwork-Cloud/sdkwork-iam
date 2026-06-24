# sdkwork_iam_flutter_mobile_core

Framework-independent IAM runtime helpers for Flutter mobile surfaces.

## Auth runtime metadata

Mirrors `@sdkwork/iam-contracts` `resolveSdkworkAuthRuntimeConfigFromMetadata()` per `IAM_OAUTH_SPEC.md` §5.

```dart
import 'package:sdkwork_iam_flutter_mobile_core/sdkwork_iam_flutter_mobile_core.dart';

final config = resolveSdkworkAuthRuntimeConfigFromMetadata({
  'oauthLoginEnabled': true,
  'oauthProviderRegion': 'overseas',
  'supportsLocalCredentials': true,
});
```

Owner: `sdkwork-iam` maintainers.
