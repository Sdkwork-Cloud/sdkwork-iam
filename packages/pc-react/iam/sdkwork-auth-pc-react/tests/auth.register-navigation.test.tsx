import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react";
import {
  SdkworkAuthPage,
  createSdkworkAuthController,
  type SdkworkAuthRuntimeConfig,
} from "../src";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="auth-location">{`${location.pathname}${location.search}`}</div>;
}

describe("auth register navigation", () => {
  const controller = createSdkworkAuthController({
    service: {
      checkLoginQrCodeStatus: vi.fn().mockResolvedValue({ status: "pending" }),
      generateLoginQrCode: vi.fn().mockResolvedValue({
        qrContent: "sdkwork://auth/repro",
        sessionKey: "qr-repro-1",
        title: "Desktop QR Login",
        type: "app",
      }),
      getCurrentSession: vi.fn().mockResolvedValue(null),
      getCurrentUser: vi.fn().mockResolvedValue(null),
    },
  });

  const runtimeConfig: SdkworkAuthRuntimeConfig = {
    loginMethods: ["password"],
    oauthProviders: [],
    qrLoginEnabled: false,
    registerMethods: ["email"],
  };

  it("switches to register when the host mounts auth on /auth/*", async () => {
    render(
      <SdkworkThemeProvider defaultTheme="light">
        <MemoryRouter initialEntries={["/auth/login"]}>
          <Routes>
            <Route
              path="/auth/*"
              element={(
                <>
                  <SdkworkAuthPage controller={controller} runtimeConfig={runtimeConfig} />
                  <LocationProbe />
                </>
              )}
            />
          </Routes>
        </MemoryRouter>
      </SdkworkThemeProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /sign up|注册/i }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-location")).toHaveTextContent("/auth/login?flow=register");
    });
    expect(
      await screen.findByRole("heading", { level: 1, name: /create an account|创建账号/i }),
    ).toBeInTheDocument();
  });

  it("keeps register navigation on /auth/login when the host only mounts the login route", async () => {
    render(
      <SdkworkThemeProvider defaultTheme="light">
        <MemoryRouter initialEntries={["/auth/login"]}>
          <Routes>
            <Route
              path="/auth/login"
              element={(
                <>
                  <SdkworkAuthPage controller={controller} runtimeConfig={runtimeConfig} />
                  <LocationProbe />
                </>
              )}
            />
          </Routes>
        </MemoryRouter>
      </SdkworkThemeProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /sign up|注册/i }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-location")).toHaveTextContent("/auth/login?flow=register");
    });
    expect(
      await screen.findByRole("heading", { level: 1, name: /create an account|创建账号/i }),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText(/username|用户名/i)).toBeInTheDocument();
  });
});
