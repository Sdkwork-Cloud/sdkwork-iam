import { isBlank, trim } from '@sdkwork/utils';

export const PLATFORM_ORGANIZATION_ID = '0' as const;

export type IamLoginScope = 'TENANT' | 'ORGANIZATION';

export function isPlatformOrganizationId(value: unknown): boolean {
  return typeof value === 'string' && trim(value) === PLATFORM_ORGANIZATION_ID;
}

export function normalizeLoginOrganizationClaim(value: unknown): string {
  if (value === null || value === undefined) {
    return PLATFORM_ORGANIZATION_ID;
  }

  const normalized = typeof value === 'string' ? trim(value) : '';
  if (isBlank(normalized) || normalized === PLATFORM_ORGANIZATION_ID) {
    return PLATFORM_ORGANIZATION_ID;
  }

  return normalized;
}

export function isLoginEligibleOrganizationId(value: unknown): boolean {
  return typeof value === 'string' && !isBlank(value) && !isPlatformOrganizationId(value);
}

export function resolveSessionOrganizationId(input: {
  loginScope?: unknown;
  organizationId?: unknown;
}): string {
  const loginScope = typeof input.loginScope === 'string'
    ? trim(input.loginScope).toUpperCase()
    : '';
  if (loginScope === 'TENANT') {
    return PLATFORM_ORGANIZATION_ID;
  }

  return normalizeLoginOrganizationClaim(input.organizationId);
}
