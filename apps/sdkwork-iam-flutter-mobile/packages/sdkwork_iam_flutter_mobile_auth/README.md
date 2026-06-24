# sdkwork_iam_flutter_mobile_auth

Flutter mobile authentication capability for `sdkwork-iam-flutter-mobile`.

- Package pattern: `sdkwork_<application>_flutter_mobile_<capability>` per `FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md`
- Exports: `IamFlutterMobileAuthSessionController`, `IamFlutterMobileAuthRoutes`
- Host apps inject generated Dart app SDK session calls through the controller callbacks

## Verification

```bash
dart test apps/sdkwork-iam-flutter-mobile/packages/sdkwork_iam_flutter_mobile_auth
```
