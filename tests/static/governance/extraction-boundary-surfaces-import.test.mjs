import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const extractionBoundaryFiles = [
  'tests/static/governance/appbase-commerce-extraction-boundary.test.mjs',
  'tests/static/governance/appbase-content-extraction-boundary.test.mjs',
  'tests/static/governance/appbase-device-extraction-boundary.test.mjs',
  'tests/static/governance/appbase-ecosystem-extraction-boundary.test.mjs',
  'tests/static/governance/appbase-intelligence-extraction-boundary.test.mjs',
  'tests/static/governance/appbase-portal-extraction-boundary.test.mjs',
  'tests/static/governance/appbase-course-extraction-boundary.test.mjs',
  'tests/static/governance/appbase-community-extraction-boundary.test.mjs',
  'tests/static/governance/appbase-comments-extraction-boundary.test.mjs',
  'tests/static/governance/appbase-search-extraction-boundary.test.mjs',
  'tests/static/governance/appbase-news-extraction-boundary.test.mjs',
  'tests/static/governance/appbase-messaging-extraction-boundary.test.mjs',
  'tests/static/governance/appbase-image-extraction-boundary.test.mjs',
];

test('sdk-scoped extraction boundary tests import the shared SDK family surface catalog', () => {
  const errors = [];

  for (const relativePath of extractionBoundaryFiles) {
    const text = fs.readFileSync(path.join(root, relativePath), 'utf8');
    if (!text.includes('./appbase-sdk-family-surfaces.mjs')) {
      errors.push(`${relativePath} must import ./appbase-sdk-family-surfaces.mjs`);
    }
  }

  assert.deepEqual(errors, []);
});
