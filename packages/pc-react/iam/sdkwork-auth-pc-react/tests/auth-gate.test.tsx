import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import {
  createSdkworkAuthController,
  SdkworkAuthGate,
} from "../src";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

describe("SdkworkAuthGate", () => {
  it("redirects anonymous users on protected routes to login with redirect target", async () => {
    const controller = createSdkworkAuthController({
      service: {
        getCurrentSession: vi.fn().mockResolvedValue(null),
        getCurrentUser: vi.fn().mockResolvedValue(null),
      },
    });

    render(
      <MemoryRouter initialEntries={["/workspace/reports"]}>
        <Routes>
          <Route
            path="*"
            element={(
              <>
                <LocationProbe />
                <SdkworkAuthGate
                  authBasePath="/auth"
                  controller={controller}
                  homePath="/home"
                  protectedPrefixes={["/workspace"]}
                  renderAuthRoutes={<div data-testid="auth-surface">auth</div>}
                >
                  <div data-testid="protected-surface">protected</div>
                </SdkworkAuthGate>
              </>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe(
        "/auth/login?redirect=%2Fworkspace%2Freports",
      );
    });
    expect(screen.queryByTestId("protected-surface")).toBeNull();
  });

  it("redirects authenticated users away from auth routes to the resolved home target", async () => {
    const controller = createSdkworkAuthController({
      service: {
        getCurrentSession: vi.fn().mockResolvedValue({
          accessToken: "access-token-1",
          authToken: "auth-token-1",
          refreshToken: "refresh-token-1",
          user: {
            displayName: "Sdkwork Operator",
            id: "user-1",
            username: "sdkwork",
          },
        }),
        getCurrentUser: vi.fn().mockResolvedValue({
          displayName: "Sdkwork Operator",
          id: "user-1",
          username: "sdkwork",
        }),
      },
    });

    render(
      <MemoryRouter initialEntries={["/auth/login?redirect=%2Fworkspace%2Freports"]}>
        <Routes>
          <Route
            path="*"
            element={(
              <>
                <LocationProbe />
                <SdkworkAuthGate
                  authBasePath="/auth"
                  controller={controller}
                  homePath="/home"
                  protectedPrefixes={["/workspace"]}
                  renderAuthRoutes={<div data-testid="auth-surface">auth</div>}
                >
                  <div data-testid="protected-surface">protected</div>
                </SdkworkAuthGate>
              </>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/workspace/reports");
    });
    expect(screen.queryByTestId("auth-surface")).toBeNull();
  });

  it("renders auth routes for anonymous auth paths", async () => {
    const controller = createSdkworkAuthController({
      service: {
        getCurrentSession: vi.fn().mockResolvedValue(null),
        getCurrentUser: vi.fn().mockResolvedValue(null),
      },
    });

    render(
      <MemoryRouter initialEntries={["/auth/login"]}>
        <Routes>
          <Route
            path="*"
            element={(
              <SdkworkAuthGate
                authBasePath="/auth"
                controller={controller}
                homePath="/home"
                protectedPrefixes={["/workspace"]}
                renderAuthRoutes={<div data-testid="auth-surface">auth</div>}
              >
                <div data-testid="protected-surface">protected</div>
              </SdkworkAuthGate>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-surface")).toBeTruthy();
    });
  });

  it("renders protected children after authenticated bootstrap", async () => {
    const controller = createSdkworkAuthController({
      service: {
        getCurrentSession: vi.fn().mockResolvedValue({
          accessToken: "access-token-1",
          authToken: "auth-token-1",
          refreshToken: "refresh-token-1",
          user: {
            displayName: "Sdkwork Operator",
            id: "user-1",
            username: "sdkwork",
          },
        }),
        getCurrentUser: vi.fn().mockResolvedValue({
          displayName: "Sdkwork Operator",
          id: "user-1",
          username: "sdkwork",
        }),
      },
    });

    render(
      <MemoryRouter initialEntries={["/workspace/reports"]}>
        <Routes>
          <Route
            path="*"
            element={(
              <SdkworkAuthGate
                authBasePath="/auth"
                controller={controller}
                homePath="/home"
                protectedPrefixes={["/workspace"]}
                renderAuthRoutes={<div data-testid="auth-surface">auth</div>}
              >
                <div data-testid="protected-surface">protected</div>
              </SdkworkAuthGate>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("protected-surface")).toBeTruthy();
    });
  });
});
