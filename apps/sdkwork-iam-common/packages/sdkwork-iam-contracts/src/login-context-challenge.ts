import {
  isLoginEligibleOrganizationId,
  PLATFORM_ORGANIZATION_ID,
} from './login-context.js';

export type IamLoginContextSelectionChallengeType =
  | 'LOGIN_CONTEXT_SELECTION'
  | 'ORGANIZATION_SELECTION';

export interface IamLoginContextSelectionOption {
  displayName?: string;
  loginScope: 'TENANT' | 'ORGANIZATION';
  organizationId?: string;
  requiresOrganizationSelection?: boolean;
}

export interface IamLoginContextOrganizationChoice {
  displayName?: string;
  membershipKind?: string;
  name?: string;
  organizationId: string;
  tenantId?: string;
}

export interface IamLoginContextSelectionChallenge {
  challengeType: IamLoginContextSelectionChallengeType;
  continuationToken: string;
  expiresAt?: number | string;
  options?: IamLoginContextSelectionOption[];
  organizations: IamLoginContextOrganizationChoice[];
}

function optionalString(value: unknown): string | undefined {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized || undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeLoginContextSelectionOption(
  value: unknown,
): IamLoginContextSelectionOption | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const loginScope = optionalString(value.loginScope) || optionalString(value.login_scope);
  if (loginScope !== 'TENANT' && loginScope !== 'ORGANIZATION') {
    return undefined;
  }

  return {
    loginScope,
    ...(optionalString(value.displayName) || optionalString(value.display_name)
      ? { displayName: optionalString(value.displayName) || optionalString(value.display_name) }
      : {}),
    ...(optionalString(value.organizationId) || optionalString(value.organization_id)
      ? {
          organizationId:
            optionalString(value.organizationId) || optionalString(value.organization_id),
        }
      : {}),
    ...(value.requiresOrganizationSelection === true
      || value.requires_organization_selection === true
      ? { requiresOrganizationSelection: true }
      : {}),
  };
}

function normalizeLoginContextOrganizationChoice(
  value: unknown,
): IamLoginContextOrganizationChoice | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const organizationId =
    optionalString(value.organizationId)
    || optionalString(value.organization_id)
    || optionalString(value.id);
  if (!organizationId || !isLoginEligibleOrganizationId(organizationId)) {
    return undefined;
  }

  return {
    organizationId,
    ...(optionalString(value.displayName) || optionalString(value.display_name)
      ? { displayName: optionalString(value.displayName) || optionalString(value.display_name) }
      : {}),
    ...(optionalString(value.membershipKind) || optionalString(value.membership_kind)
      ? {
          membershipKind:
            optionalString(value.membershipKind) || optionalString(value.membership_kind),
        }
      : {}),
    ...(optionalString(value.name) ? { name: optionalString(value.name) } : {}),
    ...(optionalString(value.tenantId) || optionalString(value.tenant_id)
      ? { tenantId: optionalString(value.tenantId) || optionalString(value.tenant_id) }
      : {}),
  };
}

export function normalizeIamLoginContextSelectionChallenge(
  value: unknown,
): IamLoginContextSelectionChallenge | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const challengeType = optionalString(value.challengeType) || optionalString(value.challenge_type);
  if (challengeType !== 'LOGIN_CONTEXT_SELECTION' && challengeType !== 'ORGANIZATION_SELECTION') {
    return undefined;
  }

  const continuationToken =
    optionalString(value.continuationToken) || optionalString(value.continuation_token);
  if (!continuationToken) {
    return undefined;
  }

  const organizations = Array.isArray(value.organizations)
    ? value.organizations
        .map(normalizeLoginContextOrganizationChoice)
        .filter((organization): organization is IamLoginContextOrganizationChoice => Boolean(organization))
    : [];

  const options = Array.isArray(value.options)
    ? value.options
        .map(normalizeLoginContextSelectionOption)
        .filter((option): option is IamLoginContextSelectionOption => Boolean(option))
    : undefined;

  return {
    challengeType,
    continuationToken,
    organizations,
    ...(typeof value.expiresAt === 'number' || typeof value.expiresAt === 'string'
      ? { expiresAt: value.expiresAt }
      : optionalString(value.expiresAt)
        ? { expiresAt: optionalString(value.expiresAt) }
        : {}),
    ...(options && options.length > 0 ? { options } : {}),
  };
}

export function isIamLoginContextSelectionChallenge(
  value: unknown,
): value is IamLoginContextSelectionChallenge {
  return normalizeIamLoginContextSelectionChallenge(value) !== undefined;
}

export function buildPersonalLoginContextSelectionBody(
  continuationToken: string,
): Record<string, string> {
  return {
    continuationToken: continuationToken.trim(),
    loginScope: 'TENANT',
    organizationId: PLATFORM_ORGANIZATION_ID,
  };
}

export function buildOrganizationLoginContextSelectionBody(
  continuationToken: string,
  organizationId: string,
): Record<string, string> {
  const normalizedOrganizationId = organizationId.trim();
  if (!isLoginEligibleOrganizationId(normalizedOrganizationId)) {
    throw new Error('organization id is required for organization login');
  }

  return {
    continuationToken: continuationToken.trim(),
    loginScope: 'ORGANIZATION',
    organizationId: normalizedOrganizationId,
  };
}

export function buildTenantCurrentSessionUpdateBody(): Record<string, string> {
  return {
    loginScope: 'TENANT',
    organizationId: PLATFORM_ORGANIZATION_ID,
  };
}
