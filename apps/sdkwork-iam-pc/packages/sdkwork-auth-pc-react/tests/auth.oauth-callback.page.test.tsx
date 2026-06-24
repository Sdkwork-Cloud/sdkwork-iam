import { fireEvent, render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  SDKWORK_AUTH_I18N_CATALOG,
  SdkworkAuthOAuthCallbackPage,
  createSdkworkAuthController,
} from "../src";
import type { SdkworkAuthRuntimeConfig } from "../src";

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="oauth-callback-location">
      {location.pathname}
      {location.search}
    </output>
  );
}

describe("sdkwork-auth-pc-react oauth callback page", () => {
  function renderCallbackPage(
    initialEntry: string,
    options: {
      locale?: string;
      runtimeConfig?: Partial<SdkworkAuthRuntimeConfig>;
    } = {},
  ) {
    const controller = createSdkworkAuthController({
      service: {
        signInWithOAuth: vi.fn().mockResolvedValue({
          accessToken: "oauth-access-token",
          authToken: "oauth-auth-token",
          user: {
            displayName: "OAuth User",
            email: "oauth@sdkwork.ai",
            firstName: "OAuth",
            id: "oauth-user-1",
            initials: "OU",
            lastName: "User",
          },
        }),
        getCurrentSession: vi.fn().mockResolvedValue(null),
        getCurrentUser: vi.fn().mockResolvedValue(null),
      },
    });
    const callbackRoutes = (
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/auth/oauth/callback/:provider"
            element={
              <>
                <SdkworkAuthOAuthCallbackPage
                  controller={controller}
                  runtimeConfig={{
                    oauthLoginEnabled: true,
                    oauthProviders: ["github"],
                    ...options.runtimeConfig,
                  }}
                />
                <LocationProbe />
              </>
            }
          />
          <Route path="/auth/login" element={<LocationProbe />} />
          <Route path="/workspace" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    const renderResult = render(
      <SdkworkThemeProvider defaultTheme="light">
        {options.locale ? (
          <SdkworkI18nProvider
            catalogs={[SDKWORK_AUTH_I18N_CATALOG]}
            locale={options.locale}
          >
            {callbackRoutes}
          </SdkworkI18nProvider>
        ) : callbackRoutes}
      </SdkworkThemeProvider>,
    );

    return {
      controller,
      ...renderResult,
    };
  }

  it("uses the solid auth callback shell without viewport-height gradients", () => {
    const { container } = renderCallbackPage("/auth/oauth/callback/github?error=access_denied");

    const shell = container.firstElementChild?.firstElementChild;
    expect(shell?.className).toContain("h-[100dvh]");
    expect(shell?.className).toContain("min-h-[100dvh]");
    expect(shell?.className).not.toContain("min-h-screen");
    expect(container.innerHTML).not.toContain("radial-gradient");
    expect(container.innerHTML).not.toContain("linear-gradient");
    expect(container.innerHTML).not.toContain("100vh");
  });

  it("returns to login with redirect preserved after oauth callback failure", async () => {
    renderCallbackPage("/auth/oauth/callback/github?error=access_denied&redirect=%2Fworkspace");

    fireEvent.click(
      await screen.findByRole("button", {
        name: /back to login/i,
      }),
    );

    expect(screen.getByTestId("oauth-callback-location")).toHaveTextContent(
      "/auth/login?redirect=%2Fworkspace",
    );
  });

  it("shows a product-facing error when the callback provider is unsupported", async () => {
    const { container } = renderCallbackPage("/auth/oauth/callback/google?redirect=%2Fworkspace");

    expect(
      await screen.findByText(/third-party login method is not available/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Third-party login failed" })).toBeInTheDocument();
    expect(screen.queryByText(/provider is not configured/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/provider handshake/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to login/i })).toBeInTheDocument();
  });

  it("does not expose provider configuration errors from oauth callback query params", async () => {
    const { container } = renderCallbackPage(
      "/auth/oauth/callback/github?error_description=OAuth%20provider%20is%20not%20configured&redirect=%2Fworkspace",
    );

    expect(
      await screen.findByText(/third-party login method is not available/i),
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent("OAuth provider is not configured");
    expect(container).not.toHaveTextContent(/provider is not configured/i);
  });

  it("accepts provider aliases on oauth callbacks when the configured provider is canonical", async () => {
    renderCallbackPage("/auth/oauth/callback/ali-pay?error=access_denied&redirect=%2Fworkspace", {
      runtimeConfig: {
        oauthProviders: ["alipay"],
      },
    });

    expect(await screen.findByText("Third-party login was canceled or denied.")).toBeInTheDocument();
    expect(screen.queryByText("access_denied")).not.toBeInTheDocument();
    expect(screen.queryByText(/provider is not configured/i)).not.toBeInTheDocument();
  });

  it("submits a successful oauth callback once with the canonical provider", async () => {
    const { controller } = renderCallbackPage("/auth/oauth/callback/ali-pay?code=oauth-code&redirect=%2Fworkspace", {
      runtimeConfig: {
        oauthProviders: ["alipay"],
      },
    });

    await waitFor(() => {
      expect(controller.service.signInWithOAuth).toHaveBeenCalledTimes(1);
    });
    expect(controller.service.signInWithOAuth).toHaveBeenCalledWith({
      code: "oauth-code",
      deviceType: "desktop",
      provider: "alipay",
      redirectUri: "http://localhost:3000/auth/oauth/callback/alipay?redirect=%2Fworkspace",
      state: undefined,
    });
    expect(screen.queryByText(/provider is not configured/i)).not.toBeInTheDocument();
  });

  it("does not resubmit a successful oauth callback when runtime config arrays are recreated", async () => {
    let resolveOAuthSession: ((value: {
      accessToken: string;
      authToken: string;
    }) => void) | undefined;
    const oauthSessionPromise = new Promise<{
      accessToken: string;
      authToken: string;
    }>((resolve) => {
      resolveOAuthSession = resolve;
    });
    const controller = createSdkworkAuthController({
      service: {
        signInWithOAuth: vi.fn().mockReturnValue(oauthSessionPromise),
        getCurrentSession: vi.fn().mockResolvedValue(null),
        getCurrentUser: vi.fn().mockResolvedValue(null),
      },
    });

    function CallbackHarness() {
      const [renderNonce, setRenderNonce] = useState(0);

      return (
        <>
          <button onClick={() => setRenderNonce((value) => value + 1)} type="button">
            rerender {renderNonce}
          </button>
          <SdkworkAuthOAuthCallbackPage
            controller={controller}
            runtimeConfig={{
              oauthLoginEnabled: true,
              oauthProviders: ["alipay"],
            }}
          />
          <LocationProbe />
        </>
      );
    }

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <MemoryRouter initialEntries={["/auth/oauth/callback/ali-pay?code=oauth-code&redirect=%2Fworkspace"]}>
          <Routes>
            <Route path="/auth/oauth/callback/:provider" element={<CallbackHarness />} />
            <Route path="/workspace" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </SdkworkThemeProvider>,
    );

    await waitFor(() => {
      expect(controller.service.signInWithOAuth).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: /rerender/i }));
    expect(controller.service.signInWithOAuth).toHaveBeenCalledTimes(1);

    resolveOAuthSession?.({
      accessToken: "oauth-access-token",
      authToken: "oauth-auth-token",
    });
    await waitFor(() => {
      expect(screen.getByTestId("oauth-callback-location")).toHaveTextContent("/workspace");
    });
    expect(controller.service.signInWithOAuth).toHaveBeenCalledTimes(1);
  });

  it("renders localized callback copy from the global i18n provider", async () => {
    renderCallbackPage("/auth/oauth/callback/google?redirect=%2Fworkspace", {
      locale: "zh-CN",
    });

    expect(
      await screen.findByRole("heading", {
        name: "\u7b2c\u4e09\u65b9\u767b\u5f55\u5931\u8d25",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("\u5f53\u524d\u5de5\u4f5c\u533a\u6682\u672a\u5f00\u542f\u8be5\u7b2c\u4e09\u65b9\u767b\u5f55\u65b9\u5f0f\u3002"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "\u8fd4\u56de\u767b\u5f55",
      }),
    ).toBeInTheDocument();
  });

  it("supports custom auth base paths when returning from oauth callback errors", async () => {
    const controller = createSdkworkAuthController({
      service: {
        signInWithOAuth: vi.fn(),
        getCurrentSession: vi.fn().mockResolvedValue(null),
        getCurrentUser: vi.fn().mockResolvedValue(null),
      },
    });

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <MemoryRouter
          initialEntries={[
            "/workspace/auth/oauth/callback/github?error=access_denied&redirect=%2Fprojects",
          ]}
        >
          <Routes>
            <Route
              path="/workspace/auth/oauth/callback/:provider"
              element={
                <>
                  <SdkworkAuthOAuthCallbackPage
                    basePath="/workspace/auth"
                    controller={controller}
                    homePath="/workspace"
                    runtimeConfig={{
                      oauthLoginEnabled: true,
                      oauthProviders: ["github"],
                    }}
                  />
                  <LocationProbe />
                </>
              }
            />
            <Route path="/workspace/auth/login" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </SdkworkThemeProvider>,
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: /back to login/i,
      }),
    );

    expect(screen.getByTestId("oauth-callback-location")).toHaveTextContent(
      "/workspace/auth/login?redirect=%2Fprojects",
    );
  });
});
