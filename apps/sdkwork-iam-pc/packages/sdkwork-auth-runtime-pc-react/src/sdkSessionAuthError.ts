export const SDKWORK_SESSION_AUTH_ERROR_CODES = new Set([
  "401",
  "4010",
  "40103",
  "UNAUTHORIZED",
  "TOKEN_EXPIRED",
  "TOKEN_INVALID",
]);

export const SDKWORK_SESSION_AUTH_ERROR_MESSAGES = [
  "app session token has expired",
  "session token has expired",
  "token has expired",
  "invalid or expired iam session",
  "invalid token",
  "not logged in",
  "not login",
  "unauthorized",
] as const;

function isErrorRecord(error: unknown): error is Record<string, unknown> {
  return typeof error === "object" && error !== null && !Array.isArray(error);
}

function readStringField(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  return undefined;
}

function normalizeSdkErrorCode(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  return typeof value === "string" ? value.trim() : "";
}

function readSdkErrorField(error: unknown, key: string): unknown {
  if (!isErrorRecord(error)) {
    return undefined;
  }
  return error[key];
}

export function readSdkworkSessionAuthErrorCode(error: unknown): string {
  return normalizeSdkErrorCode(readSdkErrorField(error, "code"));
}

export function readSdkworkSessionAuthBusinessCode(error: unknown): string {
  return normalizeSdkErrorCode(readSdkErrorField(error, "businessCode"));
}

export function readSdkworkSessionAuthErrorHttpStatus(error: unknown): number | undefined {
  const value = readSdkErrorField(error, "httpStatus")
    ?? readSdkErrorField(error, "status");
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isInteger(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function readSdkworkSessionAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  const value = readSdkErrorField(error, "message")
    ?? readSdkErrorField(error, "msg")
    ?? readSdkErrorField(error, "detail")
    ?? readSdkErrorField(error, "title");
  return typeof value === "string" ? value : "";
}

export function isSdkworkSdkSessionAuthError(error: unknown): boolean {
  const code = readSdkworkSessionAuthErrorCode(error);
  const httpStatus = readSdkworkSessionAuthErrorHttpStatus(error);
  const businessCode = readSdkworkSessionAuthBusinessCode(error);
  if (httpStatus === 401) {
    return true;
  }
  if (code && SDKWORK_SESSION_AUTH_ERROR_CODES.has(code.toUpperCase())) {
    return true;
  }
  if (businessCode && SDKWORK_SESSION_AUTH_ERROR_CODES.has(businessCode.toUpperCase())) {
    return true;
  }

  const message = readSdkworkSessionAuthErrorMessage(error).toLowerCase();
  return SDKWORK_SESSION_AUTH_ERROR_MESSAGES.some((pattern) => message.includes(pattern));
}

export function formatSdkworkSessionAuthUnauthorizedDetail(
  error: unknown,
  context: { path?: string } = {},
) {
  const record = isErrorRecord(error) ? error : {};
  const httpStatus = readSdkworkSessionAuthErrorHttpStatus(error);
  const code = readStringField(record, "code");
  const businessCode = readStringField(record, "businessCode");
  const message =
    readStringField(record, "message")
    ?? readStringField(record, "msg")
    ?? readStringField(record, "detail")
    ?? readStringField(record, "title")
    ?? (error instanceof Error ? error.message : undefined)
    ?? "Session authentication failed";

  return {
    businessCode,
    code,
    httpStatus,
    message,
    occurredAt: new Date().toISOString(),
    path: context.path,
    raw: error,
  };
}
