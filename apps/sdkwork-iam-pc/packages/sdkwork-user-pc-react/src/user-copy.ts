export type SdkworkUserLocale = "en-US" | "zh-CN";

export type SdkworkUserMessagesOverrides = DeepPartial<SdkworkUserMessages>;

export interface SdkworkUserMessages {
  common: {
    disabled: string;
    enabled: string;
    loading: string;
    requestFailed: string;
    searchPlaceholder: string;
  };
  notifications: {
    newMessages: string;
    saveButton: string;
    securityAlerts: string;
    systemUpdates: string;
    taskCompletions: string;
    taskFailures: string;
    title: string;
    description: string;
  };
  overview: {
    description: string;
    displayNameFallback: string;
    generalTitle: string;
    generalValueTemplate: string;
    notificationsTitle: string;
    notificationsValueTemplate: string;
    securityTitle: string;
    securityValueTemplate: string;
  };
  page: {
    badge: string;
    description: string;
    errorTitle: string;
    standardsEyebrow: string;
    title: string;
  };
  profile: {
    avatarLabel: string;
    bindButton: string;
    changeButton: string;
    contactDescription: string;
    contactTitle: string;
    description: string;
    emailLabel: string;
    firstNameLabel: string;
    lastNameLabel: string;
    notBound: string;
    phoneLabel: string;
    saveButton: string;
    sendCodeButton: string;
    title: string;
    unbindButton: string;
    verificationCodeLabel: string;
    verifiedLabel: string;
  };
  registry: {
    groups: {
      account: string;
      security: string;
      workspace: string;
    };
    notificationsDescription: string;
    notificationsKeywords: string[];
    overviewDescription: string;
    overviewKeywords: string[];
    profileDescription: string;
    profileKeywords: string[];
    securityDescription: string;
    securityKeywords: string[];
    sections: {
      notifications: string;
      overview: string;
      profile: string;
      security: string;
    };
  };
  security: {
    boundaryDescription: string;
    boundaryTitle: string;
    currentPasswordLabel: string;
    hidePasswordLabel: string;
    loginAlerts: string;
    newPasswordLabel: string;
    passwordDescription: string;
    passwordTitle: string;
    protectionDescription: string;
    protectionSaveButton: string;
    protectionTitle: string;
    showPasswordLabel: string;
    twoFactorAuth: string;
    updatePasswordButton: string;
  };
  standards: {
    items: Array<{
      description: string;
      title: string;
    }>;
  };
  toast: {
    contactSaveFailed: string;
    contactSaved: string;
    notificationsSaveFailed: string;
    notificationsSaved: string;
    passwordUpdateFailed: string;
    passwordUpdated: string;
    profileSaveFailed: string;
    profileSaved: string;
    securitySaveFailed: string;
    securitySaved: string;
    verificationCodeSendFailed: string;
    verificationCodeSent: string;
  };
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (...args: never[]) => unknown
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep<T>(base: T, overrides?: DeepPartial<T>): T {
  if (!overrides) {
    return base;
  }

  const output: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      continue;
    }

    const baseValue = output[key];
    output[key] = isRecord(baseValue) && isRecord(value)
      ? mergeDeep(baseValue, value)
      : value;
  }

  return output as T;
}

export function mergeSdkworkUserMessagesOverrides(
  ...overrides: Array<SdkworkUserMessagesOverrides | undefined>
): SdkworkUserMessagesOverrides | undefined {
  let hasOverrides = false;
  let mergedOverrides: Record<string, unknown> = {};

  for (const currentOverrides of overrides) {
    if (!currentOverrides) {
      continue;
    }

    hasOverrides = true;
    mergedOverrides = mergeDeep(
      mergedOverrides,
      currentOverrides as Record<string, unknown>,
    );
  }

  return hasOverrides
    ? (mergedOverrides as SdkworkUserMessagesOverrides)
    : undefined;
}

export function formatSdkworkUserTemplate(
  template: string,
  replacements: Record<string, string>,
): string {
  return Object.entries(replacements).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, value),
    template,
  );
}

const EN_US_MESSAGES: SdkworkUserMessages = {
  common: {
    disabled: "Disabled",
    enabled: "Enabled",
    loading: "Loading account center...",
    requestFailed: "Request failed.",
    searchPlaceholder: "Search account settings",
  },
  notifications: {
    newMessages: "New messages",
    saveButton: "Save notifications",
    securityAlerts: "Security alerts",
    systemUpdates: "System updates",
    taskCompletions: "Task completions",
    taskFailures: "Task failures",
    title: "Notifications",
    description: "Desktop notification defaults follow the Sdkwork-inspired experience but stay generic for every SDKWORK app.",
  },
  overview: {
    description: "Shared account settings powered by sdkwork-core runtime services and sdkwork-ui settings-center patterns.",
    displayNameFallback: "Unnamed user",
    generalTitle: "General",
    generalValueTemplate: "Compact selector: {value}",
    notificationsTitle: "Notifications",
    notificationsValueTemplate: "Message alerts: {value}",
    securityTitle: "Security",
    securityValueTemplate: "Login alerts: {value}",
  },
  page: {
    badge: "IAM workspace",
    description: "Sdkwork-quality desktop account center built on sdkwork-ui SettingsCenter and sdkwork-core profile services.",
    errorTitle: "Account center error",
    standardsEyebrow: "Shared standards",
    title: "Account Center",
  },
  profile: {
    avatarLabel: "Avatar",
    bindButton: "Bind",
    changeButton: "Change",
    contactDescription: "Bind or change verified email and phone contacts through IAM self-service endpoints.",
    contactTitle: "Contact bindings",
    description: "Profile fields are generalized for reuse across desktop applications.",
    emailLabel: "Email",
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    notBound: "Not bound",
    phoneLabel: "Phone",
    saveButton: "Save profile",
    sendCodeButton: "Send code",
    title: "Account profile",
    unbindButton: "Unbind",
    verificationCodeLabel: "Verification code",
    verifiedLabel: "Verified",
  },
  registry: {
    groups: {
      account: "Account",
      security: "Security",
      workspace: "Workspace",
    },
    notificationsDescription: "In-app and email notification preferences.",
    notificationsKeywords: ["notifications", "alerts", "messages"],
    overviewDescription: "Workspace usage and preference overview.",
    overviewKeywords: ["overview", "workspace", "preferences"],
    profileDescription: "Profile, avatar, and account details.",
    profileKeywords: ["profile", "account", "avatar"],
    securityDescription: "Password updates and account protection options.",
    securityKeywords: ["security", "password", "login alerts"],
    sections: {
      notifications: "Notifications",
      overview: "Overview",
      profile: "Profile",
      security: "Security",
    },
  },
  security: {
    boundaryDescription: "This section keeps profile and security logic in the shared IAM package while leaving application-level workflow settings to other domains.",
    boundaryTitle: "Reusable boundary",
    currentPasswordLabel: "Current password",
    hidePasswordLabel: "Hide password",
    loginAlerts: "Login alerts",
    newPasswordLabel: "New password",
    passwordDescription: "Password updates stay on the shared user service so application packages do not reimplement credential flows.",
    passwordTitle: "Password",
    protectionDescription: "Security preferences remain in the reusable IAM layer and do not leak into app-local settings implementations.",
    protectionSaveButton: "Save security",
    protectionTitle: "Protection",
    showPasswordLabel: "Show password",
    twoFactorAuth: "Two-factor authentication",
    updatePasswordButton: "Update password",
  },
  standards: {
    items: [
      {
        description: "Keep profile, notifications, and security flows in one reusable account workspace.",
        title: "Unified account center",
      },
      {
        description: "Settings stay on shared desktop primitives instead of drifting into app-local variants.",
        title: "Consistent settings surfaces",
      },
      {
        description: "Security preferences and password updates remain centralized in the IAM domain.",
        title: "Shared security boundary",
      },
    ],
  },
  toast: {
    contactSaveFailed: "Failed to update contact binding.",
    contactSaved: "Contact binding updated.",
    notificationsSaveFailed: "Failed to save preferences.",
    notificationsSaved: "Notification preferences updated.",
    passwordUpdateFailed: "Failed to update password.",
    passwordUpdated: "Password updated.",
    profileSaveFailed: "Failed to save profile.",
    profileSaved: "Profile saved.",
    securitySaveFailed: "Failed to save security settings.",
    securitySaved: "Security preferences updated.",
    verificationCodeSendFailed: "Failed to send verification code.",
    verificationCodeSent: "Verification code sent.",
  },
};

const ZH_CN_MESSAGES: SdkworkUserMessages = {
  common: {
    disabled: "已关闭",
    enabled: "已开启",
    loading: "正在加载账户中心...",
    requestFailed: "请求失败。",
    searchPlaceholder: "搜索账户设置",
  },
  notifications: {
    newMessages: "新消息",
    saveButton: "保存通知设置",
    securityAlerts: "安全提醒",
    systemUpdates: "系统更新",
    taskCompletions: "任务完成",
    taskFailures: "任务失败",
    title: "通知",
    description: "桌面通知默认值对齐 Sdkwork 风格体验，同时保持对所有 SDKWORK 应用的通用复用能力。",
  },
  overview: {
    description: "基于 sdkwork-core 运行时服务和 sdkwork-ui SettingsCenter 模式构建的共享身份设置中心。",
    displayNameFallback: "未命名用户",
    generalTitle: "通用",
    generalValueTemplate: "紧凑选择器：{value}",
    notificationsTitle: "通知",
    notificationsValueTemplate: "消息提醒：{value}",
    securityTitle: "安全",
    securityValueTemplate: "登录提醒：{value}",
  },
  page: {
    badge: "身份工作台",
    description: "基于 sdkwork-ui SettingsCenter 与 sdkwork-core 资料服务构建的 Sdkwork 水准桌面账户中心。",
    errorTitle: "账户中心异常",
    standardsEyebrow: "共享标准",
    title: "账户中心",
  },
  profile: {
    avatarLabel: "头像",
    bindButton: "绑定",
    changeButton: "更换",
    contactDescription: "通过 IAM 自助接口绑定或更换已验证的邮箱和手机号。",
    contactTitle: "联系方式绑定",
    description: "资料字段已抽象为可在桌面应用中复用的通用能力。",
    emailLabel: "邮箱",
    firstNameLabel: "名",
    lastNameLabel: "姓",
    notBound: "未绑定",
    phoneLabel: "手机号",
    saveButton: "保存资料",
    sendCodeButton: "发送验证码",
    title: "身份资料",
    unbindButton: "解绑",
    verificationCodeLabel: "验证码",
    verifiedLabel: "已验证",
  },
  registry: {
    groups: {
      account: "账户",
      security: "安全",
      workspace: "工作台",
    },
    notificationsDescription: "站内与邮件通知偏好。",
    notificationsKeywords: ["通知", "提醒", "messages", "alerts"],
    overviewDescription: "工作台使用情况与偏好概览。",
    overviewKeywords: ["概览", "工作台", "偏好", "overview"],
    profileDescription: "身份、头像与账户资料。",
    profileKeywords: ["资料", "身份", "头像", "profile"],
    securityDescription: "密码更新与账户保护设置。",
    securityKeywords: ["安全", "密码", "登录提醒", "security"],
    sections: {
      notifications: "通知",
      overview: "概览",
      profile: "资料",
      security: "安全",
    },
  },
  security: {
    boundaryDescription: "这一节将资料与安全逻辑保持在共享身份包内，同时把商业化或流程型设置留给其它领域模块。",
    boundaryTitle: "共享边界",
    currentPasswordLabel: "当前密码",
    hidePasswordLabel: "\u9690\u85cf\u5bc6\u7801",
    loginAlerts: "登录提醒",
    newPasswordLabel: "新密码",
    passwordDescription: "密码更新继续由共享用户服务承载，避免应用包重复实现凭证流程。",
    passwordTitle: "密码",
    protectionDescription: "安全偏好沉淀在可复用的身份层，不泄漏到应用本地设置实现中。",
    protectionSaveButton: "保存安全设置",
    protectionTitle: "保护策略",
    showPasswordLabel: "\u663e\u793a\u5bc6\u7801",
    twoFactorAuth: "双因素认证",
    updatePasswordButton: "更新密码",
  },
  standards: {
    items: [
      {
        description: "将资料、通知和安全流程统一在一个可复用的身份工作台中。",
        title: "统一账户中心",
      },
      {
        description: "设置界面保持在共享桌面原语之上，不再演化出应用私有变体。",
        title: "一致的设置界面",
      },
      {
        description: "安全偏好与密码更新持续留在身份域中统一治理。",
        title: "共享安全边界",
      },
    ],
  },
  toast: {
    contactSaveFailed: "更新联系方式绑定失败。",
    contactSaved: "联系方式绑定已更新。",
    notificationsSaveFailed: "保存偏好设置失败。",
    notificationsSaved: "通知偏好已更新。",
    passwordUpdateFailed: "更新密码失败。",
    passwordUpdated: "密码已更新。",
    profileSaveFailed: "保存资料失败。",
    profileSaved: "资料已保存。",
    securitySaveFailed: "保存安全设置失败。",
    securitySaved: "安全偏好已更新。",
    verificationCodeSendFailed: "发送验证码失败。",
    verificationCodeSent: "验证码已发送。",
  },
};

const SDKWORK_USER_MESSAGES: Record<SdkworkUserLocale, SdkworkUserMessages> = {
  "en-US": EN_US_MESSAGES,
  "zh-CN": ZH_CN_MESSAGES,
};

export function normalizeSdkworkUserLocale(locale?: string | null): SdkworkUserLocale {
  const normalized = String(locale || "").trim().toLowerCase();
  if (normalized.startsWith("zh")) {
    return "zh-CN";
  }

  return "en-US";
}

export function createSdkworkUserMessages(
  locale?: string | null,
  overrides?: SdkworkUserMessagesOverrides,
): SdkworkUserMessages {
  return mergeDeep(
    SDKWORK_USER_MESSAGES[normalizeSdkworkUserLocale(locale)],
    overrides,
  );
}
