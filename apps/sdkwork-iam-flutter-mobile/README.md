# sdkwork-iam-flutter-mobile

Flutter mobile application root for IAM Flutter packages.

Follows `FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` and `APP_FLUTTER_UI_SPEC.md`. Shared cross-architecture IAM contracts remain in `../../apps/sdkwork-iam-common/packages/`.

Auth login-mode discovery follows `IAM_OAUTH_SPEC.md` §5 through `packages/sdkwork_iam_flutter_mobile_core` (`resolveSdkworkAuthRuntimeConfigFromMetadata()`), aligned with `@sdkwork/iam-contracts`.

Owner: `sdkwork-iam` maintainers.
