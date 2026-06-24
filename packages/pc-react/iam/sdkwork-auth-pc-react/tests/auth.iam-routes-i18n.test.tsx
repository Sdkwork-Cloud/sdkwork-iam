import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import { SDKWORK_AUTH_I18N_CATALOG } from "../src/auth-copy.ts";

type IamControllerOptions =
  import("../src/auth-iam-runtime.ts").CreateSdkworkIamRuntimeAuthControllerOptions;

const iamRuntimeCapture = vi.hoisted(() => ({
  options: [] as IamControllerOptions[],
}));

const sdkToastMock = vi.hoisted(() => Object.assign(
  vi.fn(),
  {
    custom: vi.fn(),
    dismiss: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    message: vi.fn(),
    promise: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
));

vi.mock("../src/auth-iam-runtime.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/auth-iam-runtime.ts")>();

  return {
    ...actual,
    createSdkworkIamRuntimeAuthController: vi.fn((options: IamControllerOptions) => {
      iamRuntimeCapture.options.push(options);
      return actual.createSdkworkIamRuntimeAuthController(options);
    }),
  };
});

vi.mock("@sdkwork/ui-pc-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sdkwork/ui-pc-react")>();
  return {
    ...actual,
    SdkworkToaster: () => null,
    sdkToast: sdkToastMock,
    toast: sdkToastMock,
  };
});

import { SdkworkIamAuthRoutes } from "../src/pages/IamAuthRoutes.tsx";

describe("sdkwork IAM auth route i18n", () => {
  it("inherits the host i18n locale for the login left rail when no route locale prop is passed", async () => {
    const getRuntime = vi.fn().mockResolvedValue({
      contextStore: {
        clear: vi.fn(),
      },
      service: {
        auth: {
          passwordResetRequests: {
            create: vi.fn(),
          },
          passwordResets: {
            create: vi.fn(),
          },
          registrations: {
            create: vi.fn(),
          },
          sessions: {
            create: vi.fn(),
            current: {
              delete: vi.fn(),
              retrieve: vi.fn().mockRejectedValue(new Error("anonymous")),
            },
          },
        },
        messaging: {
          verificationCodes: {
            create: vi.fn(),
            verify: vi.fn(),
          },
        },
        oauth: {
          deviceAuthorizations: {
            create: vi.fn().mockResolvedValue({
              qrContent: {
                content: "sdkwork://auth/current-locale-qr",
                mode: "fallback_url",
              },
              sessionKey: "current-locale-qr-1",
              status: "pending",
              title: "Desktop QR Login",
            }),
            retrieve: vi.fn().mockResolvedValue({
              sessionKey: "current-locale-qr-1",
              status: "pending",
            }),
          },
        },
        iam: {
          users: {
            current: {
              retrieve: vi.fn().mockRejectedValue(new Error("anonymous")),
            },
          },
        },
      },
      tokenStore: {
        get: vi.fn().mockResolvedValue(null),
      },
    });

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkI18nProvider
          catalogs={[SDKWORK_AUTH_I18N_CATALOG]}
          locale="zh-CN"
        >
          <MemoryRouter initialEntries={["/auth/login"]}>
            <Routes>
              <Route
                element={
                  <SdkworkIamAuthRoutes
                    getRuntime={getRuntime}
                    homePath="/console"
                    runtimeConfig={{
                      loginMethods: ["password"],
                      oauthLoginEnabled: false,
                    }}
                  />
                }
                path="/auth/*"
              />
            </Routes>
          </MemoryRouter>
        </SdkworkI18nProvider>
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByText("\u626b\u7801\u767b\u5f55"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Scan to sign in")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "\u8d26\u53f7\u767b\u5f55",
      }),
    ).toBeInTheDocument();
  });

  it("localizes the IAM runtime method-unavailable fallback from the host locale", async () => {
    iamRuntimeCapture.options.length = 0;

    const getRuntime = vi.fn().mockResolvedValue({
      contextStore: {
        clear: vi.fn(),
      },
      service: {
        auth: {
          passwordResetRequests: {
            create: vi.fn(),
          },
          passwordResets: {
            create: vi.fn(),
          },
          registrations: {
            create: vi.fn(),
          },
          sessions: {
            create: vi.fn(),
            current: {
              delete: vi.fn(),
              retrieve: vi.fn().mockRejectedValue(new Error("anonymous")),
            },
          },
        },
        messaging: {
          verificationCodes: {
            create: vi.fn(),
            verify: vi.fn(),
          },
        },
        oauth: {
          deviceAuthorizations: {
            create: vi.fn(),
            retrieve: vi.fn(),
          },
        },
        iam: {
          users: {
            current: {
              retrieve: vi.fn().mockRejectedValue(new Error("anonymous")),
            },
          },
        },
      },
      tokenStore: {
        get: vi.fn().mockResolvedValue(null),
      },
    });

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <MemoryRouter initialEntries={["/auth/login"]}>
          <Routes>
            <Route
              element={
                <SdkworkIamAuthRoutes
                  getRuntime={getRuntime}
                  homePath="/console"
                  locale="zh-CN"
                  runtimeConfig={{
                    loginMethods: ["password"],
                    oauthLoginEnabled: false,
                    qrLoginEnabled: false,
                  }}
                />
              }
              path="/auth/*"
            />
          </Routes>
        </MemoryRouter>
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "\u6b22\u8fce\u56de\u6765",
      }),
    ).toBeInTheDocument();
    expect(iamRuntimeCapture.options).toHaveLength(1);
    expect(iamRuntimeCapture.options[0]?.methodUnavailableMessage).toBe(
      "\u5f53\u524d\u5e94\u7528\u5ba2\u6237\u7aef\u4e0d\u652f\u6301 SDKWork IAM \u8fd0\u884c\u65f6\u8ba4\u8bc1\u65b9\u6cd5\u3002",
    );
  });
});
