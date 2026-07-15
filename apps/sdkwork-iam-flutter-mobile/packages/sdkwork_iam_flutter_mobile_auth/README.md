# sdkwork_iam_flutter_mobile_auth

Flutter mobile authentication capability for `sdkwork-iam-flutter-mobile`.

- Package pattern: `sdkwork_<application>_flutter_mobile_<capability>` per `FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md`
- Login context selection: personal login uses `loginScope=TENANT` with `organizationId=0`; organization login uses `loginScope=ORGANIZATION` with a non-zero organization id returned by appbase
- Exports: `IamFlutterMobileAuthSessionController`, `IamLoginContextSelectionChallenge`, `IamFlutterMobileAuthRoutes`
- Host apps inject generated Dart app SDK session calls through the controller callbacks, including optional `createLoginContextSelection`, `createOAuthSession`, and `createMiniProgramSession`
- WeChat Mini Program hosts obtain `jsCode` through the platform API and pass it to `loginWithMiniProgram`; AppSecret and `session_key` remain server-side

## Verification

```bash
dart test apps/sdkwork-iam-flutter-mobile/packages/sdkwork_iam_flutter_mobile_auth
```
