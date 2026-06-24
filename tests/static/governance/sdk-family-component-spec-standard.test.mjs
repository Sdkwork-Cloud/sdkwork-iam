import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

const SDK_FAMILIES = [
  {
    directory: 'sdks/sdkwork-iam-app-sdk',
    apiAuthority: 'sdkwork-iam-app-api',
    sdkType: 'app',
    routeCrate: 'sdkwork-router-iam-app-api',
  },
  {
    directory: 'sdks/sdkwork-iam-backend-sdk',
    apiAuthority: 'sdkwork-iam-backend-api',
    sdkType: 'backend',
    routeCrate: 'sdkwork-router-iam-backend-api',
  },
  {
    directory: 'sdks/sdkwork-iam-open-sdk',
    apiAuthority: 'sdkwork-iam-open-api',
    sdkType: 'open',
    routeCrate: 'sdkwork-router-iam-open-api',
  },
];

const REQUIRED_CANONICAL_SPECS = [
  'COMPONENT_SPEC.md',
  'CODE_STYLE_SPEC.md',
  'NAMING_SPEC.md',
  'MODULE_SPEC.md',
  'TEST_SPEC.md',
  'SDK_SPEC.md',
  'SDK_WORKSPACE_GENERATION_SPEC.md',
  'API_SPEC.md',
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

test('sdk family component specs declare standard metadata and canonical spec links', () => {
  const errors = [];

  for (const family of SDK_FAMILIES) {
    const specPath = `${family.directory}/specs/component.spec.json`;
    const spec = readJson(specPath);

    if (spec.kind !== 'sdkwork.component.spec') {
      errors.push(`${specPath} must set kind to sdkwork.component.spec`);
    }

    if (!spec.component?.name) {
      errors.push(`${specPath} must declare component.name`);
    }

    if (!Array.isArray(spec.canonicalSpecs) || spec.canonicalSpecs.length === 0) {
      errors.push(`${specPath} must declare canonicalSpecs`);
    } else {
      for (const requiredFile of REQUIRED_CANONICAL_SPECS) {
        const match = spec.canonicalSpecs.find((entry) => entry.file === requiredFile);
        if (!match?.path?.startsWith('../../../sdkwork-specs/')) {
          errors.push(`${specPath} must link ${requiredFile} to ../../../sdkwork-specs/${requiredFile}`);
        }
      }
    }

    if (spec.apiAuthority !== family.apiAuthority) {
      errors.push(`${specPath} apiAuthority must be ${family.apiAuthority}`);
    }

    if (spec.sdkType !== family.sdkType) {
      errors.push(`${specPath} sdkType must be ${family.sdkType}`);
    }

    if (!Array.isArray(spec.verification?.commands) || spec.verification.commands.length === 0) {
      errors.push(`${specPath} must declare verification.commands`);
    } else if (spec.verification.commands.some((command) => /powershell/i.test(command))) {
      errors.push(`${specPath} verification.commands must be cross-platform (no powershell)`);
    }

    if (spec.metadata?.managedBy !== 'sdkwork-iam') {
      errors.push(`${specPath} metadata.managedBy must be sdkwork-iam`);
    }

    if (!spec.metadata?.standardVersion) {
      errors.push(`${specPath} metadata.standardVersion must be declared`);
    }
  }

  assert.deepEqual(errors, []);
});

test('sdk family component specs expose cross-platform generate entrypoints', () => {
  for (const family of SDK_FAMILIES) {
    const generateEntry = path.join(root, family.directory, 'bin/generate-sdk.mjs');
    assert.ok(fs.existsSync(generateEntry), `${family.directory} must expose bin/generate-sdk.mjs`);
  }
});

test('sdk family component specs declare materialize and generate verification commands', () => {
  const errors = [];

  for (const family of SDK_FAMILIES) {
    const specPath = `${family.directory}/specs/component.spec.json`;
    const commands = readJson(specPath).verification?.commands ?? [];

    if (!commands.some((command) => command.includes('materialize-iam-v3-openapi-boundaries.mjs'))) {
      errors.push(`${specPath} must verify OpenAPI materialization`);
    }

    if (!commands.some((command) => command.includes(`${family.directory}/bin/generate-sdk.mjs`))) {
      errors.push(`${specPath} must verify ${family.directory}/bin/generate-sdk.mjs`);
    }
  }

  assert.deepEqual(errors, []);
});
