export const PLATFORM_ORGANIZATION_ID = '0' as const;

export type IamLoginScope = 'TENANT' | 'ORGANIZATION';

export function isPlatformOrganizationId(value: unknown): boolean {
  return typeof value === 'string' && value.trim() === PLATFORM_ORGANIZATION_ID;
}

export function normalizeLoginOrganizationClaim(value: unknown): string {
  if (value === null || value === undefined) {
    return PLATFORM_ORGANIZATION_ID;
  }

  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || normalized === PLATFORM_ORGANIZATION_ID) {
    return PLATFORM_ORGANIZATION_ID;
  }

  return normalized;
}

export function isLoginEligibleOrganizationId(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0 && !isPlatformOrganizationId(value);
}

export function resolveSessionOrganizationId(input: {
  loginScope?: unknown;
  organizationId?: unknown;
}): string {
  const loginScope = typeof input.loginScope === 'string'
    ? input.loginScope.trim().toUpperCase()
    : '';
  if (loginScope === 'TENANT') {
    return PLATFORM_ORGANIZATION_ID;
  }

  return normalizeLoginOrganizationClaim(input.organizationId);
}
