import { describe, expect, it } from 'vitest';

import {
  buildOrganizationLoginContextSelectionBody,
  buildPersonalLoginContextSelectionBody,
  normalizeIamLoginContextSelectionChallenge,
} from '../src/login-context-challenge.js';

describe('iam login context challenge helpers', () => {
  it('normalizes login context selection challenge and filters platform organization choices', () => {
    const challenge = normalizeIamLoginContextSelectionChallenge({
      challengeType: 'LOGIN_CONTEXT_SELECTION',
      continuationToken: 'continue-1',
      options: [{ loginScope: 'TENANT', organizationId: '0', displayName: 'Personal account' }],
      organizations: [
        { organizationId: '0', displayName: 'Root Organization' },
        { organizationId: 'org-1', displayName: 'Org One' },
      ],
    });

    expect(challenge).toMatchObject({
      challengeType: 'LOGIN_CONTEXT_SELECTION',
      continuationToken: 'continue-1',
      organizations: [{ organizationId: 'org-1', displayName: 'Org One' }],
    });
  });

  it('builds personal and organization continuation bodies', () => {
    expect(buildPersonalLoginContextSelectionBody(' continue-1 ')).toEqual({
      continuationToken: 'continue-1',
      loginScope: 'TENANT',
      organizationId: '0',
    });
    expect(buildOrganizationLoginContextSelectionBody('continue-1', 'org-1')).toEqual({
      continuationToken: 'continue-1',
      loginScope: 'ORGANIZATION',
      organizationId: 'org-1',
    });
    expect(() => buildOrganizationLoginContextSelectionBody('continue-1', '0')).toThrow(
      'organization id is required for organization login',
    );
  });
});
