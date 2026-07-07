import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import {
  dispatchSdkworkSessionAuthUnauthorized,
} from "../../sdkwork-auth-runtime-pc-react/src/sessionAuthUnauthorized.ts";
import {
  createSdkworkAuthController,
  SDKWORK_AUTH_I18N_CATALOG,
  SdkworkSessionAuthUnauthorizedProvider,
} from "../src";

function renderSessionAuthProvider(
  ui: React.ReactElement,
  initialEntry = "/workspace",
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SdkworkI18nProvider catalogs={[SDKWORK_AUTH_I18N_CATALOG]}>
        {ui}
      </SdkworkI18nProvider>
    </MemoryRouter>,
  );
}

vi.mock("qrcode", () => ({
  toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,qr-login"),
}));

vi.mock("@sdkwork/ui-pc-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sdkwork/ui-pc-react")>();
  return {
    ...actual,
    SdkworkToaster: () => null,
    sdkToast: Object.assign(vi.fn(), {
      custom: vi.fn(),
      dismiss: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      loading: vi.fn(),
      message: vi.fn(),
      promise: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    }),
  };
});

describe("SdkworkSessionAuthUnauthorizedProvider", () => {
  it("opens the standard auth shell in a modal instead of the legacy error dialog", async () => {
    const controller = createSdkworkAuthController({
      service: {
        getCurrentSession: vi.fn().mockResolvedValue(null),
        getCurrentUser: vi.fn().mockResolvedValue(null),
        getVerificationPolicy: vi.fn().mockResolvedValue({
          emailCodeLoginEnabled: false,
          emailRegistrationVerificationRequired: false,
          phoneCodeLoginEnabled: false,
          phoneRegistrationVerificationRequired: false,
        }),
        listOAuthProviders: vi.fn().mockResolvedValue([]),
      },
    });

    renderSessionAuthProvider(
      <SdkworkSessionAuthUnauthorizedProvider controller={controller}>
        <div>protected content</div>
      </SdkworkSessionAuthUnauthorizedProvider>,
    );

    dispatchSdkworkSessionAuthUnauthorized({
      code: "40101",
      httpStatus: 401,
      message: "Session expired",
      occurredAt: new Date().toISOString(),
      path: "/workspace/messages",
    });

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("protected content")).toBeTruthy();
    expect(screen.queryByText("HTTP status")).toBeNull();
    expect(screen.queryByText("Technical details")).toBeNull();
    expect(document.body.innerHTML).toContain("sdkwork-auth-shell");
  });

  it("closes the modal after a successful login without leaving the page", async () => {
    const signIn = vi.fn().mockResolvedValue({
      accessToken: "access-token",
      authToken: "auth-token",
      expiresAt: Date.now() + 60_000,
      refreshToken: "refresh-token",
      user: {
        displayName: "Demo User",
        email: "demo@example.com",
        firstName: "Demo",
        initials: "DU",
        lastName: "User",
      },
    });
    const controller = createSdkworkAuthController({
      service: {
        getCurrentSession: vi.fn().mockResolvedValue(null),
        getCurrentUser: vi.fn().mockResolvedValue(null),
        getVerificationPolicy: vi.fn().mockResolvedValue({
          emailCodeLoginEnabled: false,
          emailRegistrationVerificationRequired: false,
          phoneCodeLoginEnabled: false,
          phoneRegistrationVerificationRequired: false,
        }),
        listOAuthProviders: vi.fn().mockResolvedValue([]),
        signIn,
      },
    });
    const onAuthSuccess = vi.fn();

    renderSessionAuthProvider(
      <SdkworkSessionAuthUnauthorizedProvider
        controller={controller}
        onAuthSuccess={onAuthSuccess}
        runtimeConfig={{
          leftRailMode: "highlights-only",
          qrLoginEnabled: false,
        }}
      >
        <div>protected content</div>
      </SdkworkSessionAuthUnauthorizedProvider>,
    );

    dispatchSdkworkSessionAuthUnauthorized({
      message: "Session expired",
      occurredAt: new Date().toISOString(),
      path: "/workspace",
    });

    expect(await screen.findByRole("dialog")).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/^account$/i), {
      target: { value: "demo@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({
        password: "secret123",
        username: "demo@example.com",
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(onAuthSuccess).toHaveBeenCalledTimes(1);
    expect(screen.getByText("protected content")).toBeTruthy();
  });
});
