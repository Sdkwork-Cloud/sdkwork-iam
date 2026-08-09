import { fireEvent, render, screen } from "@testing-library/react";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import { describe, expect, it, vi } from "vitest";

import {
  SDKWORK_IAM_H5_AUTH_I18N_CATALOG,
  SdkworkIamH5AuthLoginScreen,
} from "../src/index";
import type {
  SdkworkIamH5AuthController,
  SdkworkIamH5OAuthProvider,
} from "../src/index";

function createFakeController(overrides: Partial<SdkworkIamH5AuthController> = {}) {
  const provider: SdkworkIamH5OAuthProvider[] = [];
  return {
    completeScanLogin: vi.fn().mockResolvedValue(undefined),
    createOAuthAuthorizationUrl: vi.fn().mockResolvedValue("https://open.weixin.qq.com/auth"),
    getState: () => ({ status: "idle" as const }),
    listOAuthProviders: vi.fn().mockResolvedValue(provider),
    login: vi.fn().mockResolvedValue({ kind: "session", session: { sessionId: "s" } }),
    loginWithCode: vi.fn().mockResolvedValue({ kind: "session", session: { sessionId: "s" } }),
    loginWithOAuth: vi.fn().mockResolvedValue({ sessionId: "s" }),
    loginWithMiniProgram: vi.fn().mockResolvedValue({ sessionId: "s" }),
    logout: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue({ kind: "session", session: { sessionId: "s" } }),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    resolveScanLoginContext: () => undefined,
    selectOrganization: vi.fn().mockResolvedValue({ sessionId: "s" }),
    selectPersonalLogin: vi.fn().mockResolvedValue({ sessionId: "s" }),
    sendVerificationCode: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as SdkworkIamH5AuthController;
}

function renderLogin(controller: SdkworkIamH5AuthController) {
  return render(
    <SdkworkI18nProvider catalogs={[SDKWORK_IAM_H5_AUTH_I18N_CATALOG]} locale="zh-CN">
      <SdkworkIamH5AuthLoginScreen controller={controller} />
    </SdkworkI18nProvider>,
  );
}

/** Clicks the round terms checkbox that precedes the terms paragraph. */
function clickTermsCheckbox() {
  const termsText = screen.getByText(/我已阅读并同意/);
  const checkbox = termsText.previousElementSibling as HTMLElement | null;
  if (!checkbox) {
    throw new Error("terms checkbox not found");
  }
  fireEvent.click(checkbox);
}

describe("@sdkwork/iam-h5-auth login screen (design)", () => {
  it("renders the password-login design: title, account/password inputs, disabled primary action, mode links, third-party divider and terms footer", () => {
    renderLogin(createFakeController());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("密码登录");
    expect(screen.getByText("账号")).toBeTruthy();
    expect(screen.getByPlaceholderText("手机号或邮箱")).toBeTruthy();
    expect(screen.getByPlaceholderText("请输入密码")).toBeTruthy();

    const primary = screen.getByRole("button", { name: "同意并登录" });
    expect((primary as HTMLButtonElement).disabled).toBe(true);

    expect(screen.getByText("用验证码登录")).toBeTruthy();
    expect(screen.getByText("找回密码")).toBeTruthy();
    expect(screen.getByText("注册账号")).toBeTruthy();
    expect(screen.getByText("其他开放平台登录")).toBeTruthy();
    expect(screen.getByText(/我已阅读并同意/)).toBeTruthy();
    expect(screen.getByText("软件许可及服务协议")).toBeTruthy();
    expect(screen.getByText("隐私保护指引")).toBeTruthy();
  });

  it("switches to code login, register and forgot modes and back", () => {
    renderLogin(createFakeController());

    fireEvent.click(screen.getByText("用验证码登录"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("验证码登录");
    expect(screen.getByPlaceholderText("请输入验证码")).toBeTruthy();
    expect(screen.getByText("获取验证码")).toBeTruthy();
    expect(screen.getByText("用密码登录")).toBeTruthy();

    fireEvent.click(screen.getByText("注册账号"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("手机号注册");
    expect(screen.getByPlaceholderText("请输入密码")).toBeTruthy();
    expect(screen.getByPlaceholderText("请输入验证码")).toBeTruthy();

    fireEvent.click(screen.getByText("返回登录"));
    fireEvent.click(screen.getByText("找回密码"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("找回密码");
    expect(screen.getByPlaceholderText("设置新密码")).toBeTruthy();
    expect(screen.getByText("返回登录")).toBeTruthy();
  });

  it("requires agreeing to the terms before submitting", async () => {
    const controller = createFakeController();
    renderLogin(controller);

    fireEvent.change(screen.getByPlaceholderText("手机号或邮箱"), {
      target: { value: "13800138000" },
    });
    fireEvent.change(screen.getByPlaceholderText("请输入密码"), { target: { value: "secret" } });

    const primary = screen.getByRole("button", { name: "同意并登录" }) as HTMLButtonElement;
    expect(primary.disabled).toBe(true);

    fireEvent.click(screen.getByText("软件许可及服务协议"));
    expect(screen.getByText("知道了")).toBeTruthy();
    fireEvent.click(screen.getByText("知道了"));

    clickTermsCheckbox();
    expect(primary.disabled).toBe(false);

    fireEvent.click(primary);
    await vi.waitFor(() => {
      expect(controller.login).toHaveBeenCalledWith({ password: "secret", username: "13800138000" });
    });
  });

  it("sends the verification code through the controller and starts the countdown", async () => {
    const controller = createFakeController();
    renderLogin(controller);

    fireEvent.click(screen.getByText("用验证码登录"));
    fireEvent.change(screen.getByPlaceholderText("手机号或邮箱"), {
      target: { value: "13800138000" },
    });
    fireEvent.click(screen.getByText("获取验证码"));

    await vi.waitFor(() => {
      expect(controller.sendVerificationCode).toHaveBeenCalledWith({
        scene: "LOGIN",
        target: "13800138000",
        verifyType: "PHONE",
      });
    });
    await vi.waitFor(() => {
      expect(screen.getByText(/^60s$/)).toBeTruthy();
    });
  });

  it("fails closed with a friendly message when the verification code client is absent", async () => {
    const controller = createFakeController({
      sendVerificationCode: vi.fn().mockRejectedValue(new Error("Verification code service is unavailable in this app; try password login.")),
    });
    renderLogin(controller);

    fireEvent.click(screen.getByText("用验证码登录"));
    fireEvent.change(screen.getByPlaceholderText("手机号或邮箱"), {
      target: { value: "13800138000" },
    });
    fireEvent.click(screen.getByText("获取验证码"));

    await vi.waitFor(() => {
      expect(screen.getByText("验证码服务暂不可用，请使用密码登录")).toBeTruthy();
    });
  });
});
