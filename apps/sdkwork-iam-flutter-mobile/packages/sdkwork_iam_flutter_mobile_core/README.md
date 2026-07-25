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

## Credential entry bootstrap

Flutter applications resolve the pre-session bootstrap `Access-Token` through
`resolveSdkworkFlutterCredentialEntryBootstrapAccessToken(...)`. Development builds may receive
the private `SDKWORK_ACCESS_TOKEN` through a Dart define prepared by the canonical IAM Node
bootstrap helper. Staging and production artifacts reject embedded credentials and require a
trusted native host channel. Call
`requireSdkworkFlutterCredentialEntryBootstrapAccessToken(...)` before constructing or invoking a
credential-entry SDK client so a missing bootstrap token fails before network dispatch.
