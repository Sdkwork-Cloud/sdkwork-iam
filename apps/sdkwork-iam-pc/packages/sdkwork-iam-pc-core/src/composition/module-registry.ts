export function createSdkworkIamPcModuleRegistry() {
  return {
    contracts: "@sdkwork/iam-contracts",
    runtime: "@sdkwork/iam-runtime",
    react: "@sdkwork/iam-react",
    authRuntime: "@sdkwork/auth-runtime-pc-react",
  } as const;
}
