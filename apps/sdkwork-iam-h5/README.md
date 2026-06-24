# sdkwork-iam-h5

Phone-first H5 application root for IAM mobile React modules.

Follows `APP_H5_ARCHITECTURE_SPEC.md` and `APP_MOBILE_REACT_UI_SPEC.md`. Shared cross-architecture IAM contracts remain in `../../apps/sdkwork-iam-common/packages/`.

`sdkwork-iam-h5-core` re-exports `resolveSdkworkAuthRuntimeConfigFromMetadata()` and related auth-runtime types from `@sdkwork/iam-contracts` per `IAM_OAUTH_SPEC.md` §5.

Owner: `sdkwork-iam` maintainers.
