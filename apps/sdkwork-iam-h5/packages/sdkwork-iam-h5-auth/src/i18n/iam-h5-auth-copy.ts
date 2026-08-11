import {
  assertSdkworkCatalogLocaleParity,
  createSdkworkMessageCatalog,
  normalizeSdkworkLocale,
} from "@sdkwork/i18n-pc-react";

export type SdkworkIamH5AuthLocale = "en-US" | "zh-CN";

export const SDKWORK_IAM_H5_AUTH_I18N_NAMESPACE = "iam.h5.auth";

export interface SdkworkIamH5AuthMessages {
  actions: {
    agreeAndLogin: string;
    agreeAndRegister: string;
    confirm: string;
    gotIt: string;
    pleaseWait: string;
  };
  common: {
    accountLabel: string;
    accountPlaceholder: string;
    and: string;
    codePlaceholder: string;
    getCode: string;
    passwordPlaceholder: string;
    readAndAgree: string;
    setNewPasswordPlaceholder: string;
    termsOfService: string;
    privacyPolicy: string;
  };
  contextSelection: {
    cancel: string;
    description: string;
    organizationLabel: string;
    personalLabel: string;
    signingIn: string;
    title: string;
  };
  footer: {
    readAndAgree: string;
    termsOfService: string;
    and: string;
    privacyPolicy: string;
  };
  modes: {
    loginCode: string;
    loginPwd: string;
    register: string;
    forgot: string;
  };
  oauth: {
    authorizeWithWechat: string;
    explicitFailedHint: string;
    signingIn: string;
    silentFailedHint: string;
    silentSigningIn: string;
    wechatBrowserRequired: string;
  };
  links: {
    backToLogin: string;
    forgotPassword: string;
    loginWithCode: string;
    loginWithPwd: string;
    registerAccount: string;
  };
  scanLogin: {
    backToForm: string;
    completedDescription: string;
    completedTitle: string;
    confirmedDescription: string;
  };
  thirdParty: {
    dividerLabel: string;
    unavailableHint: string;
    wechat: string;
    apple: string;
    google: string;
  };
  toasts: {
    agreeTermsFirst: string;
    codeSent: string;
    enterAccount: string;
    enterCode: string;
    enterNewPassword: string;
    enterPassword: string;
    enterValidAccount: string;
    operationFailed: string;
    passwordResetSuccess: string;
    verificationUnavailable: string;
    loggingIn: string;
    redirectingTo: string;
  };
  termsModal: {
    mockContent: string;
    mockItem1: string;
    mockItem2: string;
    mockItem3: string;
  };
}

const EN_US_MESSAGES: SdkworkIamH5AuthMessages = {
  actions: {
    agreeAndLogin: "Agree & Sign in",
    agreeAndRegister: "Agree & Register",
    confirm: "Confirm",
    gotIt: "Got it",
    pleaseWait: "Please wait...",
  },
  common: {
    accountLabel: "Account",
    accountPlaceholder: "Phone or email",
    and: "and",
    codePlaceholder: "Enter verification code",
    getCode: "Get code",
    passwordPlaceholder: "Enter password",
    readAndAgree: "I have read and agree to the",
    setNewPasswordPlaceholder: "Set a new password",
    termsOfService: "Software License and Service Agreement",
    privacyPolicy: "Privacy Protection Guidelines",
  },
  contextSelection: {
    cancel: "Cancel",
    description: "Choose personal platform access or an organization workspace.",
    organizationLabel: "Organization",
    personalLabel: "Personal account",
    signingIn: "Signing in...",
    title: "Choose login context",
  },
  footer: {
    readAndAgree: "I have read and agree to the",
    termsOfService: "Software License and Service Agreement",
    and: "and",
    privacyPolicy: "Privacy Protection Guidelines",
  },
  modes: {
    loginCode: "Code sign in",
    loginPwd: "Password sign in",
    register: "Register with phone",
    forgot: "Reset password",
  },
  oauth: {
    authorizeWithWechat: "Authorize with WeChat",
    explicitFailedHint: "Authorization didn't complete. Please try again or sign in another way.",
    signingIn: "Authorizing WeChat login...",
    silentFailedHint: "Silent sign-in didn't complete. Tap the button below to authorize with WeChat.",
    silentSigningIn: "Signing in silently with WeChat...",
    wechatBrowserRequired: "WeChat sign-in only works inside the WeChat browser. Open this page in WeChat and try again.",
  },
  links: {
    backToLogin: "Back to sign in",
    forgotPassword: "Forgot password",
    loginWithCode: "Sign in with code",
    loginWithPwd: "Sign in with password",
    registerAccount: "Register account",
  },
  scanLogin: {
    backToForm: "Back to sign in",
    completedDescription: "You are signed in on this device. Return to your computer to finish.",
    completedTitle: "Login successful",
    confirmedDescription: "Scan login confirmed. Sign in to continue on your computer.",
  },
  thirdParty: {
    dividerLabel: "Other platforms",
    unavailableHint: "not available yet",
    wechat: "WeChat",
    apple: "Apple",
    google: "Google",
  },
  toasts: {
    agreeTermsFirst: "Please read and agree to the terms first",
    codeSent: "Verification code sent, please check",
    enterAccount: "Please enter your account",
    enterCode: "Please enter the verification code",
    enterNewPassword: "Please enter a new password",
    enterPassword: "Please enter your password",
    enterValidAccount: "Please enter a valid account",
    operationFailed: "Operation failed",
    passwordResetSuccess: "Password reset successfully, please sign in again",
    verificationUnavailable: "Verification code service is unavailable; try password sign in",
    loggingIn: "signing in...",
    redirectingTo: "Redirecting to ",
  },
  termsModal: {
    mockContent: "This is placeholder agreement content. In production, the full legal text is displayed here.",
    mockItem1: "1. You must follow the usage rules of this application and must not use it for illegal activities.",
    mockItem2: "We collect some of your usage data to improve the service, and we promise to protect your privacy.",
    mockItem3: "3. By continuing to use the application, you fully understand and accept all terms.",
  },
};

const ZH_CN_MESSAGES: SdkworkIamH5AuthMessages = {
  actions: {
    agreeAndLogin: "同意并登录",
    agreeAndRegister: "同意并注册",
    confirm: "确认",
    gotIt: "知道了",
    pleaseWait: "请稍候...",
  },
  common: {
    accountLabel: "账号",
    accountPlaceholder: "手机号或邮箱",
    and: "和",
    codePlaceholder: "请输入验证码",
    getCode: "获取验证码",
    passwordPlaceholder: "请输入密码",
    readAndAgree: "我已阅读并同意",
    setNewPasswordPlaceholder: "设置新密码",
    termsOfService: "软件许可及服务协议",
    privacyPolicy: "隐私保护指引",
  },
  contextSelection: {
    cancel: "取消",
    description: "选择个人账号或组织工作台",
    organizationLabel: "组织",
    personalLabel: "个人账号",
    signingIn: "正在登录...",
    title: "选择登录方式",
  },
  footer: {
    readAndAgree: "我已阅读并同意",
    termsOfService: "软件许可及服务协议",
    and: "和",
    privacyPolicy: "隐私保护指引",
  },
  modes: {
    loginCode: "验证码登录",
    loginPwd: "密码登录",
    register: "手机号注册",
    forgot: "找回密码",
  },
  oauth: {
    authorizeWithWechat: "微信授权登录",
    explicitFailedHint: "授权未完成，请重试或使用其他方式登录。",
    signingIn: "正在授权微信登录...",
    silentFailedHint: "静默登录未完成，请点击下方按钮授权微信登录。",
    silentSigningIn: "正在使用微信静默登录...",
    wechatBrowserRequired: "微信登录仅支持在微信中打开页面后使用，请复制链接到微信中访问。",
  },
  links: {
    backToLogin: "返回登录",
    forgotPassword: "找回密码",
    loginWithCode: "用验证码登录",
    loginWithPwd: "用密码登录",
    registerAccount: "注册账号",
  },
  scanLogin: {
    backToForm: "返回登录",
    completedDescription: "您已在本设备登录成功，请回到电脑端完成登录。",
    completedTitle: "登录成功",
    confirmedDescription: "扫码登录已确认，请登录以继续电脑端操作。",
  },
  thirdParty: {
    dividerLabel: "其他开放平台登录",
    unavailableHint: "暂未开放",
    wechat: "微信",
    apple: "Apple",
    google: "Google",
  },
  toasts: {
    agreeTermsFirst: "请先阅读并同意条款",
    codeSent: "验证码已发送，请查收",
    enterAccount: "请输入账号",
    enterCode: "请输入验证码",
    enterNewPassword: "请输入新密码",
    enterPassword: "请输入密码",
    enterValidAccount: "请输入正确的账号",
    operationFailed: "操作失败",
    passwordResetSuccess: "密码重置成功，请重新登录",
    verificationUnavailable: "验证码服务暂不可用，请使用密码登录",
    loggingIn: "登录...",
    redirectingTo: "正在跳转至",
  },
  termsModal: {
    mockContent: "这是一段模拟的协议内容。真实环境中应展示完整的法律条文。",
    mockItem1: "1. 您必须遵守本应用的使用规范，不得利用本应用从事违法活动。",
    mockItem2: "我们会收集您的部分使用数据以优化服务，但承诺保护您的隐私安全。",
    mockItem3: "3. 若您继续使用，即表示完全理解并接受所有条款。",
  },
};

const SDKWORK_IAM_H5_AUTH_MESSAGES: Record<SdkworkIamH5AuthLocale, SdkworkIamH5AuthMessages> = {
  "en-US": EN_US_MESSAGES,
  "zh-CN": ZH_CN_MESSAGES,
};

export function normalizeSdkworkIamH5AuthLocale(locale?: string | null): SdkworkIamH5AuthLocale {
  return normalizeSdkworkLocale(locale);
}

export const SDKWORK_IAM_H5_AUTH_I18N_CATALOG = createSdkworkMessageCatalog<SdkworkIamH5AuthMessages>({
  defaultLocale: "en-US",
  locales: SDKWORK_IAM_H5_AUTH_MESSAGES,
  namespace: SDKWORK_IAM_H5_AUTH_I18N_NAMESPACE,
});

export function assertSdkworkIamH5AuthI18nCatalogParity(): void {
  assertSdkworkCatalogLocaleParity(SDKWORK_IAM_H5_AUTH_I18N_CATALOG);
}

export function createSdkworkIamH5AuthMessages(
  locale?: string | null,
): SdkworkIamH5AuthMessages {
  return SDKWORK_IAM_H5_AUTH_I18N_CATALOG.resolveMessages(locale);
}
