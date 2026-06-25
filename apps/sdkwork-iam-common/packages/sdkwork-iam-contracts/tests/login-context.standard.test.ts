import { describe, expect, it } from 'vitest';
import {
  isLoginEligibleOrganizationId,
  isPlatformOrganizationId,
  normalizeLoginOrganizationClaim,
  PLATFORM_ORGANIZATION_ID,
  resolveSessionOrganizationId,
} from '../src/login-context.js';

describe('iam login context organization helpers', () => {
  it('treats organization id 0 as platform personal sentinel', () => {
    expect(PLATFORM_ORGANIZATION_ID).toBe('0');
    expect(isPlatformOrganizationId('0')).toBe(true);
    expect(isPlatformOrganizationId(' 0 ')).toBe(true);
    expect(isPlatformOrganizationId('org-1')).toBe(false);
    expect(isLoginEligibleOrganizationId('0')).toBe(false);
    expect(isLoginEligibleOrganizationId('org-1')).toBe(true);
  });

  it('normalizes tenant organization claims to platform sentinel', () => {
    expect(normalizeLoginOrganizationClaim(null)).toBe('0');
    expect(normalizeLoginOrganizationClaim(undefined)).toBe('0');
    expect(normalizeLoginOrganizationClaim('')).toBe('0');
    expect(normalizeLoginOrganizationClaim('0')).toBe('0');
    expect(normalizeLoginOrganizationClaim('org-1')).toBe('org-1');
  });

  it('resolves session organization id from login scope', () => {
    expect(resolveSessionOrganizationId({ loginScope: 'TENANT' })).toBe('0');
    expect(resolveSessionOrganizationId({
      loginScope: 'ORGANIZATION',
      organizationId: 'org-1',
    })).toBe('org-1');
    expect(resolveSessionOrganizationId({
      loginScope: 'ORGANIZATION',
      organizationId: null,
    })).toBe('0');
  });
});
