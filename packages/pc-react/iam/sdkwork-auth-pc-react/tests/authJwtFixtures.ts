import { createTestJwt } from "@sdkwork/runtime-bootstrap";

const DEFAULT_ACCESS_CLAIMS = {
  tenant_id: "tenant-1",
  user_id: "user-1",
  session_id: "session-1",
  organization_id: "org-1",
  login_scope: "ORGANIZATION",
  app_id: "sdkwork-test-app",
  environment: "test",
  deployment_mode: "saas",
};

const DEFAULT_AUTH_CLAIMS = {
  ...DEFAULT_ACCESS_CLAIMS,
  auth_level: "password",
};

export function mockAccessToken(
  label: string,
  overrides: Record<string, unknown> = {},
): string {
  return createTestJwt({
    ...DEFAULT_ACCESS_CLAIMS,
    ...overrides,
    marker: label,
    kind: "access",
  });
}

export function mockAuthToken(
  label: string,
  overrides: Record<string, unknown> = {},
): string {
  return createTestJwt({
    ...DEFAULT_AUTH_CLAIMS,
    ...overrides,
    marker: label,
    kind: "auth",
  });
}
