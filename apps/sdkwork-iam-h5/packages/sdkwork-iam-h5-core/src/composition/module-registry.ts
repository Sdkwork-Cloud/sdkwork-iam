export function createSdkworkIamH5ModuleRegistry() {
  return {
    auth: "@sdkwork/iam-h5-auth",
    contracts: "@sdkwork/iam-contracts",
    runtime: "@sdkwork/iam-runtime",
    userCenter: "@sdkwork/iam-h5-user",
  } as const;
}
