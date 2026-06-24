import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  SDKWORK_AUTH_I18N_CATALOG,
  SdkworkAuthPage,
  assertSdkworkAuthI18nCatalogParity,
  createSdkworkAuthController,
  type SdkworkAuthPageProps,
} from "../src";

function createTestController() {
  return createSdkworkAuthController({
    service: {
      signIn: vi.fn(),
      signInWithPhoneCode: vi.fn(),
      signInWithEmailCode: vi.fn(),
      signInWithOAuth: vi.fn(),
      register: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      sendVerifyCode: vi.fn(),
      signOut: vi.fn(),
      getOAuthAuthorizationUrl: vi.fn(),
      generateLoginQrCode: vi.fn(),
      checkLoginQrCodeStatus: vi.fn(),
      getCurrentSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
    },
  });
}

describe("sdkwork-auth-pc-react i18n contract", () => {
  it("exports a complete IAM auth namespace catalog", () => {
    expect(SDKWORK_AUTH_I18N_CATALOG.namespace).toBe("iam.auth");
    expect(() => assertSdkworkAuthI18nCatalogParity()).not.toThrow();
    expect(SDKWORK_AUTH_I18N_CATALOG.resolveMessages("en-US").qr.defaultDescription).not.toMatch(
      /backend-issued|approval flows/i,
    );
    expect(SDKWORK_AUTH_I18N_CATALOG.resolveMessages("zh-CN").qr.defaultDescription).not.toMatch(
      /后端签发|确认流程/,
    );
    expect(SDKWORK_AUTH_I18N_CATALOG.resolveMessages("zh-CN").callback.failedTitle).toBe(
      "第三方登录失败",
    );
    expect(SDKWORK_AUTH_I18N_CATALOG.resolveMessages("zh-CN").oauth.providerHintTemplate).toBe(
      "",
    );
    expect(SDKWORK_AUTH_I18N_CATALOG.resolveMessages("zh-CN").service.startOAuthFailed).toBe(
      "第三方登录暂时无法启动。",
    );
  });

  it("renders auth copy from the global SDKWork i18n provider", async () => {
    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkI18nProvider
          catalogs={[SDKWORK_AUTH_I18N_CATALOG]}
          locale="zh-CN"
        >
          <MemoryRouter initialEntries={["/auth/login"]}>
            <Routes>
              <Route
                path="/auth/login"
                element={
                  <SdkworkAuthPage
                    controller={createTestController()}
                    runtimeConfig={{
                      loginMethods: ["password", "emailCode"],
                      oauthLoginEnabled: true,
                      oauthProviders: ["github"],
                      qrLoginEnabled: false,
                    }}
                  />
                }
              />
            </Routes>
          </MemoryRouter>
        </SdkworkI18nProvider>
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "\u6b22\u8fce\u56de\u6765",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "\u5bc6\u7801",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /使用GitHub登录/,
      }),
    ).toBeInTheDocument();
  });

  it("uses password-only login copy when password is the only enabled login method", async () => {
    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkI18nProvider
          catalogs={[SDKWORK_AUTH_I18N_CATALOG]}
          locale="zh-CN"
        >
          <MemoryRouter initialEntries={["/auth/login"]}>
            <Routes>
              <Route
                path="/auth/login"
                element={
                  <SdkworkAuthPage
                    controller={createTestController()}
                    runtimeConfig={{
                      loginMethods: ["password"],
                      oauthProviders: [],
                      qrLoginEnabled: false,
                    }}
                  />
                }
              />
            </Routes>
          </MemoryRouter>
        </SdkworkI18nProvider>
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "\u6b22\u8fce\u56de\u6765",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("\u8f93\u5165\u8d26\u53f7\u548c\u5bc6\u7801\u7ee7\u7eed\u3002"),
    ).toHaveLength(1);
    expect(
      screen.queryByText("\u5bc6\u7801\u767b\u5f55"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("\u9009\u62e9\u7b26\u5408\u8d26\u53f7\u7b56\u7565\u7684\u767b\u5f55\u65b9\u5f0f\uff0c\u5b89\u5168\u5730\u7ee7\u7eed\u4f7f\u7528\u3002"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("\u5bc6\u7801\u3001\u9a8c\u8bc1\u7801\u3001\u7b2c\u4e09\u65b9\u767b\u5f55\u4e0e\u626b\u7801\u767b\u5f55\u7edf\u4e00\u5728\u4e00\u4e2a\u684c\u9762\u8ba4\u8bc1\u5de5\u4f5c\u533a\u5185\u3002"),
    ).not.toBeInTheDocument();
  });

  it("does not expose legacy locale or messages props on the auth page", () => {
    const validProps = {
      basePath: "/auth",
      runtimeConfig: {
        loginMethods: ["password"],
        qrLoginEnabled: false,
      },
    } satisfies SdkworkAuthPageProps;

    expect(validProps.basePath).toBe("/auth");

    const legacyProps = {
      locale: "zh-CN",
      messages: {
        login: {
          title: "旧标题",
        },
      },
    };

    expect("locale" in legacyProps).toBe(true);
    expect("messages" in legacyProps).toBe(true);
    type LegacyPropKeys = Extract<keyof SdkworkAuthPageProps, "locale" | "messages">;
    const noLegacyProps: LegacyPropKeys extends never ? true : false = true;
    expect(noLegacyProps).toBe(true);
  });
});
