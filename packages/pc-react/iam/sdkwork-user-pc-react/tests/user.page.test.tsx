import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import { SdkworkUserCenterPage, createSdkworkUserController } from "../src";

describe("sdkwork-user-pc-react page", () => {
  function createController() {
    return createSdkworkUserController({
      service: {
        capabilities: {
          profile: {
            avatarEditable: false,
            contactBindingEnabled: false,
            emailEditable: false,
            emailUnbindEnabled: false,
            oauthBindingEnabled: false,
            phoneEditable: false,
            phoneUnbindEnabled: false,
            profileEditable: false,
          },
          security: {
            passwordChangeEnabled: true,
          },
        },
        getPreferences: vi.fn().mockResolvedValue({
          general: {
            compactModelSelector: true,
            launchOnStartup: false,
            startMinimized: false,
          },
          notifications: {
            newMessages: true,
            securityAlerts: true,
            systemUpdates: true,
            taskCompletions: true,
            taskFailures: false,
          },
          privacy: {
            personalizedRecommendations: false,
            shareUsageData: false,
          },
          security: {
            loginAlerts: true,
            twoFactorAuth: false,
          },
        }),
        getProfile: vi.fn().mockResolvedValue({
          avatar: {
            kind: "image",
            publicUrl: "https://cdn.sdkwork.ai/avatar.png",
            source: "external_url",
            url: "https://cdn.sdkwork.ai/avatar.png",
          },
          email: "sdkwork@sdkwork.ai",
          emailVerified: true,
          firstName: "Sdkwork",
          lastName: "Operator",
          phone: "",
          phoneVerified: false,
        }),
        bindEmail: vi.fn(),
        bindPhone: vi.fn(),
        refreshAccountBindingPolicy: vi.fn().mockResolvedValue({
          profile: {
            avatarEditable: false,
            contactBindingEnabled: false,
            emailEditable: false,
            emailUnbindEnabled: false,
            oauthBindingEnabled: false,
            phoneEditable: false,
            phoneUnbindEnabled: false,
            profileEditable: false,
          },
          security: {
            passwordChangeEnabled: true,
          },
        }),
        unbindEmail: vi.fn(),
        unbindPhone: vi.fn(),
        updatePassword: vi.fn(),
        updatePreferences: vi.fn(),
        updateProfile: vi.fn(),
      },
    });
  }

  function renderUserPage(
    options: {
      locale?: string;
    } = {},
  ) {
    const localeProps = options.locale
      ? ({
          locale: options.locale,
        } as Record<string, unknown>)
      : {};
    const controller = createController();

    const renderResult = render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkUserCenterPage
          controller={controller}
          {...localeProps}
        />
      </SdkworkThemeProvider>,
    );

    return {
      controller,
      ...renderResult,
    };
  }

  it("renders the reusable settings center with account and security sections", async () => {
    renderUserPage();

    expect(
      await screen.findByRole("button", {
        name: /profile/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /security/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("sdkwork@sdkwork.ai"),
    ).toBeInTheDocument();
  });

  it("lets users reveal and mask password fields in the security section", async () => {
    renderUserPage();

    fireEvent.click(
      await screen.findByRole("button", {
        name: /security/i,
      }),
    );

    const currentPasswordInput = await screen.findByLabelText(/current password/i);
    const nextPasswordInput = screen.getByLabelText(/new password/i);
    expect(currentPasswordInput).toHaveAttribute("type", "password");
    expect(nextPasswordInput).toHaveAttribute("type", "password");

    const [currentPasswordToggle, nextPasswordToggle] = screen.getAllByRole("button", {
      name: "Show password",
    });

    fireEvent.click(currentPasswordToggle);
    expect(currentPasswordInput).toHaveAttribute("type", "text");
    expect(nextPasswordInput).toHaveAttribute("type", "password");

    fireEvent.click(nextPasswordToggle);
    expect(nextPasswordInput).toHaveAttribute("type", "text");

    fireEvent.click(screen.getAllByRole("button", { name: "Hide password" })[0]);
    expect(currentPasswordInput).toHaveAttribute("type", "password");
  });

  it("uses a solid account center shell without viewport-height gradients", async () => {
    const { container } = renderUserPage();

    await screen.findByRole("button", {
      name: /profile/i,
    });

    const shell = container.firstElementChild?.firstElementChild;
    expect(shell?.className).not.toContain("min-h-screen");
    expect(container.innerHTML).not.toContain("radial-gradient");
    expect(container.innerHTML).not.toContain("linear-gradient");
    expect(container.innerHTML).not.toContain("100vh");
  });

  it("renders localized account-center copy when a locale is provided", async () => {
    renderUserPage({
      locale: "zh-CN",
    });

    expect(
      await screen.findByRole("heading", {
        name: "账户中心",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("身份工作台"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("搜索账户设置"),
    ).toBeInTheDocument();
  });
});
