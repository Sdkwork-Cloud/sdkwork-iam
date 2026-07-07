/** IMF capability host packages for sdkwork-iam-h5 composition. */
export function createSdkworkIamH5HostRegistry() {
  return {
    accountBinding: "@sdkwork/iam-h5-account-binding",
    auth: "@sdkwork/iam-h5-auth",
    core: "@sdkwork/iam-h5-core",
    user: "@sdkwork/iam-h5-user",
  } as const;
}
