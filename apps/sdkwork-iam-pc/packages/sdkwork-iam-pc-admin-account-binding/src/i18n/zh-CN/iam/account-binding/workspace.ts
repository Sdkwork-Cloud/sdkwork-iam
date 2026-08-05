import type { SdkworkIamAccountBindingAdminMessages } from "../../../../types/account-binding-admin-messages";

export const sdkworkIamAccountBindingAdminMessages: SdkworkIamAccountBindingAdminMessages = {
  common: {
    loadError: "账号绑定策略加载失败。",
    saveError: "账号绑定策略保存失败。",
    savePolicy: "保存策略",
  },
  contactBinding: {
    allowEmailBinding: "允许绑定邮箱",
    allowEmailChange: "允许修改邮箱",
    allowEmailUnbind: "允许解绑邮箱",
    allowPhoneBinding: "允许绑定手机号",
    allowPhoneChange: "允许修改手机号",
    allowPhoneUnbind: "允许解绑手机号",
    description: "控制终端用户是否可以绑定或解绑邮箱和手机号身份。",
    enableContactBinding: "启用联系方式绑定",
    requireVerification: "绑定或修改时要求验证码",
    title: "联系方式绑定",
  },
  oauthBinding: {
    allowSelfServiceLink: "允许用户自助关联 OAuth 账号",
    allowSelfServiceUnlink: "允许用户自助解除 OAuth 关联",
    allowedProvidersLabel: "允许的提供方编码",
    allowedProvidersPlaceholder: "github、wechat、google",
    description: "OAuth 关联使用提供方授权流程。启用 OAuth 绑定后，用户可以查看已关联账号。",
    enableOauthBinding: "启用 OAuth 账号绑定",
    title: "OAuth 绑定",
  },
  oauthLogin: {
    allowAutoRegistration: "允许新 OAuth 用户自动注册",
    allowedProvidersLabel: "允许的登录提供方编码",
    allowedProvidersPlaceholder: "wechat、google、twitter（留空表示使用所有已配置提供方）",
    description: "OAuth 登录会在登录页展示第三方登录入口。提供方还需在 IAM OAuth 集成或本地 OAuth 环境变量中配置。",
    enableOauthLogin: "启用 OAuth 登录",
    title: "OAuth 登录",
  },
};
