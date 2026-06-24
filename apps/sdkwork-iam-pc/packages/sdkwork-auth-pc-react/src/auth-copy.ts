import {
  assertSdkworkCatalogLocaleParity,
  createSdkworkMessageCatalog,
  normalizeSdkworkLocale,
} from "@sdkwork/i18n-pc-react";

export type SdkworkAuthLocale = "en-US" | "zh-CN";

export interface SdkworkAuthMessages {
  callback: {
    backToLogin: string;
    badge: string;
    failedTitle: string;
    genericProviderError: string;
    invalidProvider: string;
    missingCode: string;
    providerDenied: string;
    processingDescription: string;
    processingHint: string;
    processingTitle: string;
  };
  common: {
    accountLabel: string;
    accountPlaceholder: string;
    authErrorTitle: string;
    backToLogin: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    hidePassword: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    recoveryCodeLabel: string;
    recoveryCodePlaceholder: string;
    requestFailed: string;
    resendCode: string;
    sendCode: string;
    showPassword: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    verificationCodeLabel: string;
    verificationCodePlaceholder: string;
  };
  forgot: {
    badge: string;
    backHelper: string;
    description: string;
    emailMethod: string;
    highlights: string[];
    phoneMethod: string;
    startResetAction: string;
    submit: string;
    title: string;
  };
  login: {
    badge: string;
    description: string;
    emailCodeMethod: string;
    forgotPassword: string;
    highlights: string[];
    needAccount: string;
    passwordOnlyDescription: string;
    passwordOnlyHighlight: string;
    passwordMethod: string;
    phoneCodeMethod: string;
    qrRailFormDescription: string;
    qrRailFormTitle: string;
    sessionBridgeDescription: string;
    sessionBridgeMethod: string;
    sessionBridgeSubmit: string;
    signIn: string;
    title: string;
  };
  oauth: {
    dividerLabel: string;
    providerContinueTemplate: string;
    providerHintFallback: string;
    providerHintTemplate: string;
  };
  organizationSelection: {
    cancel: string;
    description: string;
    errorTitle: string;
    personalAccount: string;
    personalDescription: string;
    selecting: string;
    tenantLabel: string;
    title: string;
  };
  qr: {
    alt: string;
    defaultDescription: string;
    defaultTitle: string;
    entryUnavailable: string;
    errorHint: string;
    generateFailed: string;
    missingPayload: string;
    openAppHint: string;
    refresh: string;
    scannedHint: string;
    status: {
      bindRequired: string;
      confirmed: string;
      error: string;
      expired: string;
      failed: string;
      loading: string;
      organizationSelectionRequired: string;
      passwordRequired: string;
      pending: string;
      scanned: string;
    };
    statusHint: {
      bindRequired: string;
      confirmed: string;
      expired: string;
      failed: string;
      organizationSelectionRequired: string;
      passwordRequired: string;
      scanned: string;
    };
    unavailable: string;
  };
  register: {
    badge: string;
    backHelper: string;
    description: string;
    emailMethod: string;
    highlights: string[];
    phoneMethod: string;
    submit: string;
    title: string;
  };
  service: {
    accountAlreadyExists: string;
    accessTokenMissing: string;
    authTokenMissing: string;
    checkQrStatusFailed: string;
    confirmQrCodeFailed: string;
    completeEmailCodeLoginFailed: string;
    completeOAuthLoginFailed: string;
    completePhoneCodeLoginFailed: string;
    currentUserProfileLoadFailed: string;
    generateQrCodeFailed: string;
    iamRuntimeAuthMethodName: string;
    methodUnavailableTemplate: string;
    oauthAuthorizationUrlMissing: string;
    oauthProviderRequired: string;
    qrCodeKeyMissing: string;
    registerFailed: string;
    resetPasswordFailed: string;
    sendCodeFailed: string;
    signInFailed: string;
    startOAuthFailed: string;
    verifyCodeFailed: string;
  };
  toasts: {
    codeSent: string;
    passwordResetSuccess: string;
    registerSuccess: string;
    resetCodeSent: string;
  };
  validation: {
    accountRequired: string;
    confirmPasswordRequired: string;
    emailRequired: string;
    invalidEmail: string;
    invalidPhone: string;
    newPasswordRequired: string;
    oauthProviderNotConfigured: string;
    passwordRequired: string;
    passwordsDoNotMatch: string;
    phoneRequired: string;
    usernameRequired: string;
    verificationCodeRequired: string;
  };
}

export function formatSdkworkAuthTemplate(
  template: string,
  replacements: Record<string, string>,
): string {
  return Object.entries(replacements).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, value),
    template,
  );
}

const EN_US_MESSAGES: SdkworkAuthMessages = {
  callback: {
    backToLogin: "Back to login",
    badge: "Identity",
    failedTitle: "Third-party login failed",
    genericProviderError: "Third-party login could not be completed.",
    invalidProvider: "This third-party login method is not available for the current workspace.",
    missingCode: "The third-party login authorization is incomplete.",
    providerDenied: "Third-party login was canceled or denied.",
    processingDescription: "Completing third-party login. This usually takes a moment.",
    processingHint: "Keep this window open while we finish signing you in.",
    processingTitle: "Completing third-party login",
  },
  common: {
    accountLabel: "Account",
    accountPlaceholder: "Username, phone, or email",
    authErrorTitle: "Request failed",
    backToLogin: "Back to login",
    confirmPasswordLabel: "Confirm password",
    confirmPasswordPlaceholder: "Confirm your password",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    newPasswordLabel: "New password",
    newPasswordPlaceholder: "Enter your new password",
    hidePassword: "Hide password",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    phoneLabel: "Phone number",
    phonePlaceholder: "Enter your phone number",
    recoveryCodeLabel: "Verification code",
    recoveryCodePlaceholder: "Enter verification code",
    requestFailed: "Authentication failed.",
    resendCode: "Resend code",
    sendCode: "Send code",
    showPassword: "Show password",
    usernameLabel: "Username",
    usernamePlaceholder: "Choose a username",
    verificationCodeLabel: "Verification code",
    verificationCodePlaceholder: "Enter verification code",
  },
  forgot: {
    badge: "Recovery",
    backHelper: "Back to sign in when you are ready.",
    description: "Use your email or phone to request a reset code and set a new password.",
    emailMethod: "Recover with email",
    highlights: [
      "Send a reset code through the verified email channel.",
      "Finish the reset by confirming a brand-new password.",
    ],
    phoneMethod: "Recover with phone",
    startResetAction: "Send reset code",
    submit: "Reset password",
    title: "Reset password",
  },
  login: {
    badge: "Identity",
    description: "Sign in with the method configured for your account.",
    emailCodeMethod: "Email code",
    forgotPassword: "Forgot password?",
    highlights: [
      "Password, verification code, or third-party sign-in.",
      "Scan the QR code from your mobile app.",
    ],
    needAccount: "Don't have an account?",
    passwordOnlyDescription: "Enter your account and password to continue.",
    passwordOnlyHighlight: "Password sign-in",
    passwordMethod: "Password",
    phoneCodeMethod: "Phone code",
    qrRailFormDescription: "",
    qrRailFormTitle: "Account sign-in",
    sessionBridgeDescription: "Sign in with your organization account.",
    sessionBridgeMethod: "SSO",
    sessionBridgeSubmit: "Continue sign in",
    signIn: "Sign in",
    title: "Welcome back",
  },
  oauth: {
    dividerLabel: "Third-party login",
    providerContinueTemplate: "Sign in with {provider}",
    providerHintFallback: "Third-party login",
    providerHintTemplate: "",
  },
  organizationSelection: {
    cancel: "Cancel",
    description: "Choose whether to continue with your personal account or an organization workspace.",
    errorTitle: "Selection failed.",
    personalAccount: "Personal account",
    personalDescription: "Access your personal data and apps",
    selecting: "Signing in...",
    tenantLabel: "Tenant",
    title: "Choose login context",
  },
  qr: {
    alt: "Login QR code",
    defaultDescription: "",
    defaultTitle: "Scan to sign in",
    entryUnavailable: "This QR code is no longer available. Refresh the desktop QR code and scan again.",
    errorHint: "QR login is currently unavailable.",
    generateFailed: "Failed to load the login QR code.",
    missingPayload: "The QR code content is invalid.",
    openAppHint: "",
    refresh: "Refresh QR code",
    scannedHint: "QR scanned. Complete login on your phone.",
    status: {
      bindRequired: "Account binding required",
      confirmed: "Login confirmed",
      error: "QR status unavailable",
      expired: "QR code expired",
      failed: "QR login failed",
      loading: "Preparing QR code...",
      organizationSelectionRequired: "Organization selection required",
      passwordRequired: "Password required on scanned device",
      pending: "Scan the QR code to continue",
      scanned: "QR code scanned",
    },
    statusHint: {
      bindRequired: "Bind or create the account on the scanned device to finish this desktop login.",
      confirmed: "Desktop login confirmed. Redirecting...",
      expired: "This QR code expired. Refresh to create a new one.",
      failed: "The scanned login was canceled or rejected. Refresh to try again.",
      organizationSelectionRequired: "Select an organization on the scanned device to finish this desktop login.",
      passwordRequired: "Enter the password on the scanned device to finish this desktop login.",
      scanned: "QR scanned. Complete login on your phone.",
    },
    unavailable: "QR login is currently unavailable.",
  },
  register: {
    badge: "Workspace access",
    backHelper: "Already have an account?",
    description: "Create your account with a verified email or phone number.",
    emailMethod: "Register with email",
    highlights: [
      "Verify your email with a one-time code.",
      "Verify your phone with an SMS code.",
      "Choose a password to secure your account.",
    ],
    phoneMethod: "Register with phone",
    submit: "Sign up",
    title: "Create an account",
  },
  service: {
    accountAlreadyExists: "This account already exists. Sign in or use a different account.",
    accessTokenMissing: "Access token is missing.",
    authTokenMissing: "Auth token is missing.",
    checkQrStatusFailed: "Failed to refresh QR login status.",
    confirmQrCodeFailed: "Failed to confirm QR login.",
    completeEmailCodeLoginFailed: "Failed to complete email code login.",
    completeOAuthLoginFailed: "Failed to complete third-party login.",
    completePhoneCodeLoginFailed: "Failed to complete phone code login.",
    currentUserProfileLoadFailed: "Failed to load current user profile.",
    generateQrCodeFailed: "Failed to generate the login QR code.",
    iamRuntimeAuthMethodName: "SDKWork IAM runtime auth method",
    methodUnavailableTemplate: "{name} is unavailable on the current app client.",
    oauthAuthorizationUrlMissing: "Third-party login link is unavailable.",
    oauthProviderRequired: "Third-party login method is required.",
    qrCodeKeyMissing: "QR code key is missing.",
    registerFailed: "Failed to complete registration.",
    resetPasswordFailed: "Failed to reset password.",
    sendCodeFailed: "Failed to send verification code.",
    signInFailed: "Failed to sign in.",
    startOAuthFailed: "Third-party login is temporarily unavailable.",
    verifyCodeFailed: "Failed to verify code.",
  },
  toasts: {
    codeSent: "Verification code sent.",
    passwordResetSuccess: "Password reset successful.",
    registerSuccess: "Registration successful.",
    resetCodeSent: "Password reset code sent.",
  },
  validation: {
    accountRequired: "Enter your account.",
    confirmPasswordRequired: "Confirm your password.",
    emailRequired: "Enter your email address.",
    invalidEmail: "Enter a valid email address.",
    invalidPhone: "Enter a valid phone number.",
    newPasswordRequired: "Enter your new password.",
    oauthProviderNotConfigured: "This third-party login method is not available.",
    passwordRequired: "Enter your password.",
    passwordsDoNotMatch: "Passwords do not match.",
    phoneRequired: "Enter your phone number.",
    usernameRequired: "Enter your username.",
    verificationCodeRequired: "Enter the verification code.",
  },
};

const ZH_CN_MESSAGES: SdkworkAuthMessages = {
  callback: {
    backToLogin: "\u8fd4\u56de\u767b\u5f55",
    badge: "\u8eab\u4efd\u8ba4\u8bc1",
    failedTitle: "\u7b2c\u4e09\u65b9\u767b\u5f55\u5931\u8d25",
    genericProviderError: "\u7b2c\u4e09\u65b9\u767b\u5f55\u672a\u80fd\u5b8c\u6210\u3002",
    invalidProvider: "\u5f53\u524d\u5de5\u4f5c\u533a\u6682\u672a\u5f00\u542f\u8be5\u7b2c\u4e09\u65b9\u767b\u5f55\u65b9\u5f0f\u3002",
    missingCode: "\u7b2c\u4e09\u65b9\u767b\u5f55\u6388\u6743\u4fe1\u606f\u4e0d\u5b8c\u6574\u3002",
    providerDenied: "\u7b2c\u4e09\u65b9\u767b\u5f55\u5df2\u53d6\u6d88\u6216\u672a\u6388\u6743\u3002",
    processingDescription: "\u6b63\u5728\u5b8c\u6210\u7b2c\u4e09\u65b9\u767b\u5f55\uff0c\u8bf7\u7a0d\u5019\u3002",
    processingHint: "\u8bf7\u4fdd\u6301\u5f53\u524d\u7a97\u53e3\u6253\u5f00\uff0c\u5373\u5c06\u8fd4\u56de\u5e94\u7528\u3002",
    processingTitle: "\u6b63\u5728\u5b8c\u6210\u7b2c\u4e09\u65b9\u767b\u5f55",
  },
  common: {
    accountLabel: "\u8d26\u53f7",
    accountPlaceholder: "\u7528\u6237\u540d\u3001\u624b\u673a\u53f7\u6216\u90ae\u7bb1",
    authErrorTitle: "\u8bf7\u6c42\u5931\u8d25",
    backToLogin: "\u8fd4\u56de\u767b\u5f55",
    confirmPasswordLabel: "\u786e\u8ba4\u5bc6\u7801",
    confirmPasswordPlaceholder: "\u8bf7\u518d\u6b21\u8f93\u5165\u5bc6\u7801",
    emailLabel: "\u90ae\u7bb1",
    emailPlaceholder: "name@example.com",
    newPasswordLabel: "\u65b0\u5bc6\u7801",
    newPasswordPlaceholder: "\u8bf7\u8f93\u5165\u65b0\u5bc6\u7801",
    hidePassword: "\u9690\u85cf\u5bc6\u7801",
    passwordLabel: "\u5bc6\u7801",
    passwordPlaceholder: "\u8bf7\u8f93\u5165\u5bc6\u7801",
    phoneLabel: "\u624b\u673a\u53f7",
    phonePlaceholder: "+86 138 0000 0000",
    recoveryCodeLabel: "\u9a8c\u8bc1\u7801",
    recoveryCodePlaceholder: "\u8bf7\u8f93\u5165\u9a8c\u8bc1\u7801",
    requestFailed: "\u8ba4\u8bc1\u8bf7\u6c42\u5931\u8d25\u3002",
    resendCode: "\u91cd\u65b0\u53d1\u9001",
    sendCode: "\u53d1\u9001\u9a8c\u8bc1\u7801",
    showPassword: "\u663e\u793a\u5bc6\u7801",
    usernameLabel: "\u7528\u6237\u540d",
    usernamePlaceholder: "\u8bf7\u8f93\u5165\u7528\u6237\u540d",
    verificationCodeLabel: "\u9a8c\u8bc1\u7801",
    verificationCodePlaceholder: "\u8bf7\u8f93\u5165\u9a8c\u8bc1\u7801",
  },
  forgot: {
    badge: "\u8d26\u53f7\u6062\u590d",
    backHelper: "\u51c6\u5907\u597d\u540e\u53ef\u8fd4\u56de\u767b\u5f55\u3002",
    description: "\u4f7f\u7528\u90ae\u7bb1\u6216\u624b\u673a\u53f7\u7533\u8bf7\u91cd\u7f6e\u9a8c\u8bc1\u7801\uff0c\u5e76\u8bbe\u7f6e\u65b0\u5bc6\u7801\u3002",
    emailMethod: "\u90ae\u7bb1\u627e\u56de",
    highlights: [
      "\u901a\u8fc7\u5df2\u9a8c\u8bc1\u90ae\u7bb1\u63a5\u6536\u91cd\u7f6e\u9a8c\u8bc1\u7801\u3002",
      "\u901a\u8fc7\u786e\u8ba4\u4e00\u4e2a\u5168\u65b0\u5bc6\u7801\u5b8c\u6210\u91cd\u7f6e\u3002",
    ],
    phoneMethod: "\u624b\u673a\u627e\u56de",
    startResetAction: "\u53d1\u9001\u91cd\u7f6e\u9a8c\u8bc1\u7801",
    submit: "\u91cd\u7f6e\u5bc6\u7801",
    title: "\u91cd\u7f6e\u5bc6\u7801",
  },
  login: {
    badge: "\u8eab\u4efd\u8ba4\u8bc1",
    description: "\u4f7f\u7528\u5df2\u4e3a\u8d26\u53f7\u542f\u7528\u7684\u65b9\u5f0f\u767b\u5f55\u3002",
    emailCodeMethod: "\u90ae\u7bb1\u9a8c\u8bc1\u7801",
    forgotPassword: "\u5fd8\u8bb0\u5bc6\u7801\uff1f",
    highlights: [
      "\u652f\u6301\u5bc6\u7801\u3001\u9a8c\u8bc1\u7801\u6216\u7b2c\u4e09\u65b9\u767b\u5f55\u3002",
      "\u4e5f\u53ef\u4f7f\u7528\u624b\u673a\u626b\u63cf\u4e8c\u7ef4\u7801\u767b\u5f55\u3002",
    ],
    needAccount: "\u8fd8\u6ca1\u6709\u8d26\u53f7\uff1f",
    passwordOnlyDescription: "\u8f93\u5165\u8d26\u53f7\u548c\u5bc6\u7801\u7ee7\u7eed\u3002",
    passwordOnlyHighlight: "\u5bc6\u7801\u767b\u5f55",
    passwordMethod: "\u5bc6\u7801",
    phoneCodeMethod: "\u624b\u673a\u9a8c\u8bc1\u7801",
    qrRailFormDescription: "",
    qrRailFormTitle: "\u8d26\u53f7\u767b\u5f55",
    sessionBridgeDescription: "\u4f7f\u7528\u7ec4\u7ec7\u8d26\u53f7\u767b\u5f55\u3002",
    sessionBridgeMethod: "\u5355\u70b9\u767b\u5f55",
    sessionBridgeSubmit: "\u7ee7\u7eed\u767b\u5f55",
    signIn: "\u767b\u5f55",
    title: "\u6b22\u8fce\u56de\u6765",
  },
  oauth: {
    dividerLabel: "\u7b2c\u4e09\u65b9\u767b\u5f55",
    providerContinueTemplate: "\u4f7f\u7528{provider}\u767b\u5f55",
    providerHintFallback: "\u7b2c\u4e09\u65b9\u767b\u5f55",
    providerHintTemplate: "",
  },
  organizationSelection: {
    cancel: "\u53d6\u6d88",
    description: "\u8bf7\u9009\u62e9\u4ee5\u4e2a\u4eba\u8d26\u53f7\u8fd8\u662f\u7ec4\u7ec7\u5de5\u4f5c\u7a7a\u95f4\u767b\u5f55\u3002",
    errorTitle: "\u9009\u62e9\u5931\u8d25\u3002",
    personalAccount: "\u4e2a\u4eba\u8d26\u53f7",
    personalDescription: "\u8bbf\u95ee\u4e2a\u4eba\u6570\u636e\u4e0e\u5e94\u7528",
    selecting: "\u6b63\u5728\u767b\u5f55...",
    tenantLabel: "\u79df\u6237",
    title: "\u9009\u62e9\u767b\u5f55\u65b9\u5f0f",
  },
  qr: {
    alt: "\u767b\u5f55\u4e8c\u7ef4\u7801",
    defaultDescription: "",
    defaultTitle: "\u626b\u7801\u767b\u5f55",
    entryUnavailable: "\u8be5\u4e8c\u7ef4\u7801\u5df2\u4e0d\u53ef\u7528\uff0c\u8bf7\u5237\u65b0\u684c\u9762\u7aef\u4e8c\u7ef4\u7801\u540e\u91cd\u65b0\u626b\u7801\u3002",
    errorHint: "\u5f53\u524d\u6682\u65f6\u65e0\u6cd5\u4f7f\u7528\u626b\u7801\u767b\u5f55\u3002",
    generateFailed: "\u52a0\u8f7d\u767b\u5f55\u4e8c\u7ef4\u7801\u5931\u8d25\u3002",
    missingPayload: "\u4e8c\u7ef4\u7801\u5185\u5bb9\u65e0\u6548\u3002",
    openAppHint: "",
    refresh: "\u5237\u65b0\u4e8c\u7ef4\u7801",
    scannedHint: "\u5df2\u626b\u7801\uff0c\u8bf7\u5728\u624b\u673a\u7aef\u5b8c\u6210\u767b\u5f55\u3002",
    status: {
      bindRequired: "\u9700\u8981\u7ed1\u5b9a\u8d26\u53f7",
      confirmed: "\u767b\u5f55\u5df2\u786e\u8ba4",
      error: "\u65e0\u6cd5\u83b7\u53d6\u4e8c\u7ef4\u7801\u72b6\u6001",
      expired: "\u4e8c\u7ef4\u7801\u5df2\u8fc7\u671f",
      failed: "\u626b\u7801\u767b\u5f55\u5931\u8d25",
      loading: "\u6b63\u5728\u51c6\u5907\u4e8c\u7ef4\u7801...",
      organizationSelectionRequired: "\u9700\u8981\u9009\u62e9\u7ec4\u7ec7",
      passwordRequired: "\u8bf7\u5728\u626b\u7801\u8bbe\u5907\u4e0a\u8f93\u5165\u5bc6\u7801",
      pending: "\u8bf7\u626b\u7801\u4ee5\u7ee7\u7eed",
      scanned: "\u4e8c\u7ef4\u7801\u5df2\u88ab\u626b\u63cf",
    },
    statusHint: {
      bindRequired: "\u8bf7\u5728\u626b\u7801\u8bbe\u5907\u4e0a\u7ed1\u5b9a\u6216\u521b\u5efa\u8d26\u53f7\uff0c\u4ee5\u5b8c\u6210\u684c\u9762\u7aef\u767b\u5f55\u3002",
      confirmed: "\u684c\u9762\u7aef\u767b\u5f55\u5df2\u786e\u8ba4\uff0c\u6b63\u5728\u8df3\u8f6c\u3002",
      expired: "\u4e8c\u7ef4\u7801\u5df2\u8fc7\u671f\uff0c\u8bf7\u5237\u65b0\u540e\u91cd\u8bd5\u3002",
      failed: "\u626b\u7801\u767b\u5f55\u5df2\u53d6\u6d88\u6216\u88ab\u62d2\u7edd\uff0c\u8bf7\u5237\u65b0\u540e\u91cd\u8bd5\u3002",
      organizationSelectionRequired: "\u8bf7\u5728\u626b\u7801\u8bbe\u5907\u4e0a\u9009\u62e9\u7ec4\u7ec7\uff0c\u4ee5\u5b8c\u6210\u684c\u9762\u7aef\u767b\u5f55\u3002",
      passwordRequired: "\u8bf7\u5728\u626b\u7801\u8bbe\u5907\u4e0a\u8f93\u5165\u5bc6\u7801\uff0c\u4ee5\u5b8c\u6210\u684c\u9762\u7aef\u767b\u5f55\u3002",
      scanned: "\u5df2\u626b\u7801\uff0c\u8bf7\u5728\u626b\u7801\u8bbe\u5907\u4e0a\u7ee7\u7eed\u64cd\u4f5c\u3002",
    },
    unavailable: "\u5f53\u524d\u6682\u65f6\u65e0\u6cd5\u4f7f\u7528\u626b\u7801\u767b\u5f55\u3002",
  },
  register: {
    badge: "\u521b\u5efa\u8d26\u53f7",
    backHelper: "\u5df2\u6709\u8d26\u53f7\uff1f",
    description: "\u4f7f\u7528\u5df2\u9a8c\u8bc1\u7684\u90ae\u7bb1\u6216\u624b\u673a\u53f7\u521b\u5efa\u8d26\u53f7\u3002",
    emailMethod: "\u90ae\u7bb1\u6ce8\u518c",
    highlights: [
      "\u901a\u8fc7\u90ae\u7bb1\u9a8c\u8bc1\u7801\u786e\u8ba4\u5f52\u5c5e\u3002",
      "\u901a\u8fc7\u77ed\u4fe1\u9a8c\u8bc1\u7801\u786e\u8ba4\u624b\u673a\u53f7\u3002",
      "\u8bbe\u7f6e\u5bc6\u7801\u4ee5\u4fdd\u62a4\u8d26\u53f7\u5b89\u5168\u3002",
    ],
    phoneMethod: "\u624b\u673a\u6ce8\u518c",
    submit: "\u6ce8\u518c",
    title: "\u521b\u5efa\u8d26\u53f7",
  },
  service: {
    accountAlreadyExists: "\u8d26\u53f7\u5df2\u5b58\u5728\uff0c\u8bf7\u76f4\u63a5\u767b\u5f55\u6216\u66f4\u6362\u8d26\u53f7\u3002",
    accessTokenMissing: "\u7f3a\u5c11 Access Token\u3002",
    authTokenMissing: "\u7f3a\u5c11 Auth Token\u3002",
    checkQrStatusFailed: "\u5237\u65b0\u626b\u7801\u767b\u5f55\u72b6\u6001\u5931\u8d25\u3002",
    confirmQrCodeFailed: "\u786e\u8ba4\u626b\u7801\u767b\u5f55\u5931\u8d25\u3002",
    completeEmailCodeLoginFailed: "\u90ae\u7bb1\u9a8c\u8bc1\u7801\u767b\u5f55\u5931\u8d25\u3002",
    completeOAuthLoginFailed: "\u7b2c\u4e09\u65b9\u767b\u5f55\u5931\u8d25\u3002",
    completePhoneCodeLoginFailed: "\u624b\u673a\u9a8c\u8bc1\u7801\u767b\u5f55\u5931\u8d25\u3002",
    currentUserProfileLoadFailed: "\u52a0\u8f7d\u5f53\u524d\u7528\u6237\u4fe1\u606f\u5931\u8d25\u3002",
    generateQrCodeFailed: "\u751f\u6210\u767b\u5f55\u4e8c\u7ef4\u7801\u5931\u8d25\u3002",
    iamRuntimeAuthMethodName: "SDKWork IAM \u8fd0\u884c\u65f6\u8ba4\u8bc1\u65b9\u6cd5",
    methodUnavailableTemplate: "\u5f53\u524d\u5e94\u7528\u5ba2\u6237\u7aef\u4e0d\u652f\u6301 {name}\u3002",
    oauthAuthorizationUrlMissing: "\u7b2c\u4e09\u65b9\u767b\u5f55\u94fe\u63a5\u6682\u4e0d\u53ef\u7528\u3002",
    oauthProviderRequired: "\u8bf7\u9009\u62e9\u7b2c\u4e09\u65b9\u767b\u5f55\u65b9\u5f0f\u3002",
    qrCodeKeyMissing: "\u7f3a\u5c11\u4e8c\u7ef4\u7801 Key\u3002",
    registerFailed: "\u6ce8\u518c\u5931\u8d25\u3002",
    resetPasswordFailed: "\u91cd\u7f6e\u5bc6\u7801\u5931\u8d25\u3002",
    sendCodeFailed: "\u53d1\u9001\u9a8c\u8bc1\u7801\u5931\u8d25\u3002",
    signInFailed: "\u767b\u5f55\u5931\u8d25\u3002",
    startOAuthFailed: "\u7b2c\u4e09\u65b9\u767b\u5f55\u6682\u65f6\u65e0\u6cd5\u542f\u52a8\u3002",
    verifyCodeFailed: "\u6821\u9a8c\u9a8c\u8bc1\u7801\u5931\u8d25\u3002",
  },
  toasts: {
    codeSent: "\u9a8c\u8bc1\u7801\u5df2\u53d1\u9001\u3002",
    passwordResetSuccess: "\u5bc6\u7801\u91cd\u7f6e\u6210\u529f\u3002",
    registerSuccess: "\u6ce8\u518c\u6210\u529f\u3002",
    resetCodeSent: "\u91cd\u7f6e\u9a8c\u8bc1\u7801\u5df2\u53d1\u9001\u3002",
  },
  validation: {
    accountRequired: "\u8bf7\u8f93\u5165\u8d26\u53f7\u3002",
    confirmPasswordRequired: "\u8bf7\u518d\u6b21\u8f93\u5165\u5bc6\u7801\u3002",
    emailRequired: "\u8bf7\u8f93\u5165\u90ae\u7bb1\u3002",
    invalidEmail: "\u8bf7\u8f93\u5165\u6709\u6548\u7684\u90ae\u7bb1\u5730\u5740\u3002",
    invalidPhone: "\u8bf7\u8f93\u5165\u6709\u6548\u7684\u624b\u673a\u53f7\u7801\u3002",
    newPasswordRequired: "\u8bf7\u8f93\u5165\u65b0\u5bc6\u7801\u3002",
    oauthProviderNotConfigured: "\u8be5\u7b2c\u4e09\u65b9\u767b\u5f55\u65b9\u5f0f\u6682\u4e0d\u53ef\u7528\u3002",
    passwordRequired: "\u8bf7\u8f93\u5165\u5bc6\u7801\u3002",
    passwordsDoNotMatch: "\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4\u3002",
    phoneRequired: "\u8bf7\u8f93\u5165\u624b\u673a\u53f7\u3002",
    usernameRequired: "\u8bf7\u8f93\u5165\u7528\u6237\u540d\u3002",
    verificationCodeRequired: "\u8bf7\u8f93\u5165\u9a8c\u8bc1\u7801\u3002",
  },
};

export const SDKWORK_AUTH_I18N_NAMESPACE = "iam.auth";

const SDKWORK_AUTH_MESSAGES: Record<SdkworkAuthLocale, SdkworkAuthMessages> = {
  "en-US": EN_US_MESSAGES,
  "zh-CN": ZH_CN_MESSAGES,
};

export function normalizeSdkworkAuthLocale(locale?: string | null): SdkworkAuthLocale {
  return normalizeSdkworkLocale(locale);
}

export const SDKWORK_AUTH_I18N_CATALOG = createSdkworkMessageCatalog<SdkworkAuthMessages>({
  defaultLocale: "en-US",
  locales: SDKWORK_AUTH_MESSAGES,
  namespace: SDKWORK_AUTH_I18N_NAMESPACE,
});

export function assertSdkworkAuthI18nCatalogParity(): void {
  assertSdkworkCatalogLocaleParity(SDKWORK_AUTH_I18N_CATALOG);
}

export function createSdkworkAuthMessages(
  locale?: string | null,
): SdkworkAuthMessages {
  return SDKWORK_AUTH_I18N_CATALOG.resolveMessages(locale);
}
