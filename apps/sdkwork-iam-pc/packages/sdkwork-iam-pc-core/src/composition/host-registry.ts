/** IMF capability host packages for sdkwork-iam-pc composition. */
export function createSdkworkIamPcHostRegistry() {
  return {
    admin: {
      accountBinding: "@sdkwork/iam-pc-admin-account-binding",
      audit: "@sdkwork/iam-pc-admin-audit",
      oauth: "@sdkwork/iam-pc-admin-oauth",
      organization: "@sdkwork/iam-pc-admin-organization",
      permission: "@sdkwork/iam-pc-admin-permission",
      shell: "@sdkwork/iam-pc-admin-shell",
      tenant: "@sdkwork/iam-pc-admin-tenant",
      user: "@sdkwork/iam-pc-admin-user",
    },
    app: {
      auth: "@sdkwork/auth-pc-react",
      authRuntime: "@sdkwork/auth-runtime-pc-react",
      core: "@sdkwork/iam-core-pc-react",
      react: "@sdkwork/iam-react",
      user: "@sdkwork/user-pc-react",
      userCenter: "@sdkwork/user-center-pc-react",
    },
    console: {
      accountBinding: "@sdkwork/iam-pc-console-account-binding",
      core: "@sdkwork/iam-pc-console-core",
      organization: "@sdkwork/iam-pc-console-organization",
      shell: "@sdkwork/iam-pc-console-shell",
      tenant: "@sdkwork/iam-pc-console-tenant",
      user: "@sdkwork/iam-pc-console-user",
    },
    core: "@sdkwork/iam-pc-core",
  } as const;
}
