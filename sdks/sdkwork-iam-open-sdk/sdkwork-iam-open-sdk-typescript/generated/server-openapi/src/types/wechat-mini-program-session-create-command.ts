/** One-time WeChat Mini Program login-code exchange command. */
export interface WechatMiniProgramSessionCreateCommand {
  /** One-time code returned by wx.login(). */
  jsCode: string;
  providerCode?: 'wechat_mini_program';
  /** Registered IAM OAuth mini-program surface code. */
  surfaceCode?: string;
}
