export function createSdkworkIamH5ModuleRegistry() {
  return {
    auth: "@sdkwork/iam-h5-auth",
    accountBinding: "@sdkwork/iam-h5-account-binding",
    contracts: "@sdkwork/iam-contracts",
    runtime: "@sdkwork/iam-runtime",
    userCenter: "@sdkwork/iam-h5-user",
  } as const;
}
