import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";

import {
  blockWechatAutoAuthorization,
  clearOAuthFlowContext,
  clearWechatAutoAuthorizationBlock,
  isWechatAutoAuthorizationBlocked,
  readOAuthFlowContext,
  SDKWORK_IAM_H5_AUTH_I18N_CATALOG,
  SdkworkIamH5AuthOAuthCallbackScreen,
  storeOAuthFlowContext,
} from "../src/index";
import type { SdkworkIamH5AuthController } from "../src/index";

const WECHAT_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49";

/** Simulates running inside the WeChat in-app browser for the current test. */
function mockWechatBrowser(): void {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: WECHAT_USER_AGENT,
  });
}

afterEach(() => {
  clearOAuthFlowContext();
  clearWechatAutoAuthorizationBlock();
});

function createFakeController(overrides: Partial<SdkworkIamH5AuthController> = {}) {
  return {
    beginOAuthAuthorization: vi.fn().mockResolvedValue(undefined),
    completeScanLogin: vi.fn().mockResolvedValue(undefined),
    createOAuthAuthorizationUrl: vi.fn().mockResolvedValue("https://open.weixin.qq.com/auth"),
    getState: () => ({ status: "idle" as const }),
    listOAuthProviders: vi.fn().mockResolvedValue([]),
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

function visitCallbackUrl(code: string | null, state = "state-1") {
  const query = code === null ? "" : `?code=${code}&state=${state}`;
  window.history.replaceState(null, "", `/auth/oauth/callback${query}`);
}

/** The callback screen derives its exchange redirect URI from the page origin. */
const CALLBACK_REDIRECT_URI = `${window.location.origin}/auth/oauth/callback`;

function renderCallback(controller: SdkworkIamH5AuthController, onAuthenticated?: () => void) {
  return render(
    <SdkworkI18nProvider catalogs={[SDKWORK_IAM_H5_AUTH_I18N_CATALOG]} locale="zh-CN">
      <SdkworkIamH5AuthOAuthCallbackScreen
        controller={controller}
        onAuthenticated={onAuthenticated}
      />
    </SdkworkI18nProvider>,
  );
}

describe("@sdkwork/iam-h5-auth OAuth callback screen (公众号授权回调)", () => {
  it("exchanges a silent (snsapi_base) code and clears the flow context on success", async () => {
    visitCallbackUrl("wx-code-1");
    storeOAuthFlowContext({
      mode: "silent",
      provider: "wechat",
      redirectUri: CALLBACK_REDIRECT_URI,
    });
    blockWechatAutoAuthorization();
    const onAuthenticated = vi.fn();
    const controller = createFakeController();
    renderCallback(controller, onAuthenticated);

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalled());
    expect(controller.loginWithOAuth).toHaveBeenCalledWith({
      code: "wx-code-1",
      provider: "wechat",
      redirectUri: CALLBACK_REDIRECT_URI,
      state: "state-1",
    });
    expect(readOAuthFlowContext()).toBeUndefined();
    // A successful login lifts the block so the next session can auto-redirect.
    expect(isWechatAutoAuthorizationBlocked()).toBe(false);
  });

  it("offers the explicit WeChat consent flow when a silent attempt fails", async () => {
    mockWechatBrowser();
    visitCallbackUrl("wx-code-2");
    storeOAuthFlowContext({
      mode: "silent",
      provider: "wechat",
      redirectUri: CALLBACK_REDIRECT_URI,
    });
    const controller = createFakeController({
      loginWithOAuth: vi.fn().mockRejectedValue(new Error("exchange failed")),
    });
    renderCallback(controller);

    // The silent exchange fails and the screen escalates to 点击授权.
    const authorizeButton = await screen.findByRole("button", { name: "微信授权登录" });
    expect(screen.getByText(/静默登录未完成/)).toBeTruthy();

    fireEvent.click(authorizeButton);
    await waitFor(() => expect(controller.beginOAuthAuthorization).toHaveBeenCalledTimes(1));
    expect(controller.beginOAuthAuthorization).toHaveBeenCalledWith({
      mode: "explicit",
      provider: "wechat",
      redirectUri: CALLBACK_REDIRECT_URI,
    });
  });

  it("shows a plain error (no escalation button) when the explicit flow fails", async () => {
    visitCallbackUrl("wx-code-3");
    storeOAuthFlowContext({
      mode: "explicit",
      provider: "wechat",
      redirectUri: CALLBACK_REDIRECT_URI,
    });
    const controller = createFakeController({
      loginWithOAuth: vi.fn().mockRejectedValue(new Error("exchange failed")),
    });
    renderCallback(controller);

    await waitFor(() => expect(screen.queryByText("exchange failed")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "微信授权登录" })).toBeNull();
    expect(screen.getByRole("button", { name: "返回登录" })).toBeTruthy();
  });

  it("handles WeChat denial (no code) for a silent attempt with the escalation button", async () => {
    visitCallbackUrl(null);
    storeOAuthFlowContext({
      mode: "silent",
      provider: "wechat",
      redirectUri: CALLBACK_REDIRECT_URI,
    });
    const controller = createFakeController();
    renderCallback(controller);

    const authorizeButton = await screen.findByRole("button", { name: "微信授权登录" });
    expect(controller.loginWithOAuth).not.toHaveBeenCalled();
    expect(authorizeButton).toBeTruthy();
  });

  it("treats a missing flow context as the explicit flow (no escalation loop)", async () => {
    visitCallbackUrl("wx-code-4");
    clearOAuthFlowContext();
    const controller = createFakeController({
      loginWithOAuth: vi.fn().mockRejectedValue(new Error("exchange failed")),
    });
    renderCallback(controller);

    await waitFor(() => expect(screen.queryByText("exchange failed")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "微信授权登录" })).toBeNull();
  });

  it("blocks the automatic WeChat redirect after any failed attempt (deny loop guard)", async () => {
    expect(isWechatAutoAuthorizationBlocked()).toBe(false);

    // Silent attempt fails on the exchange → block is set so the next page
    // load cannot auto-redirect again (deny → back to sign in loop).
    visitCallbackUrl("wx-code-5");
    storeOAuthFlowContext({
      mode: "silent",
      provider: "wechat",
      redirectUri: CALLBACK_REDIRECT_URI,
    });
    const controller = createFakeController({
      loginWithOAuth: vi.fn().mockRejectedValue(new Error("exchange failed")),
    });
    renderCallback(controller);
    await waitFor(() => expect(screen.queryByText("exchange failed")).toBeTruthy());
    expect(isWechatAutoAuthorizationBlocked()).toBe(true);
  });

  it("guards the escalation button outside the WeChat in-app browser", async () => {
    // Reset the UA to a non-WeChat browser (earlier tests stubbed it).
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
        "(KHTML, like Gecko) Mobile/15E148",
    });
    visitCallbackUrl("wx-code-6");
    storeOAuthFlowContext({
      mode: "silent",
      provider: "wechat",
      redirectUri: CALLBACK_REDIRECT_URI,
    });
    const controller = createFakeController({
      loginWithOAuth: vi.fn().mockRejectedValue(new Error("exchange failed")),
    });
    renderCallback(controller);

    // jsdom UA is not WeChat: the button explains the constraint instead of
    // sending the user to open.weixin.qq.com (which would dead-end).
    fireEvent.click(await screen.findByRole("button", { name: "微信授权登录" }));
    expect(await screen.findByText(/微信登录仅支持在微信中打开/)).toBeTruthy();
    expect(controller.beginOAuthAuthorization).not.toHaveBeenCalled();
  });
});
