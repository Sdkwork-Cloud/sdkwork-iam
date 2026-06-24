import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const staleWorkspaceRoots = [
  'apps/sdkwork-appbase',
];

const ignoredPathSegments = [
  `${path.sep}generated${path.sep}`,
  `${path.sep}docs${path.sep}superpowers${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
];

function shouldScan(filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  if (!normalized.endsWith('.md')) {
    return false;
  }

  return !ignoredPathSegments.some((segment) => filePath.includes(segment.replaceAll('/', path.sep)));
}

function listMarkdownFiles(directory) {
  const files = [];

  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile() && shouldScan(entryPath)) {
        files.push(entryPath);
      }
    }
  }

  visit(directory);
  return files;
}

test('authored markdown does not reference the retired apps/sdkwork-appbase workspace root', () => {
  const errors = [];

  for (const filePath of listMarkdownFiles(root)) {
    const relativePath = path.relative(root, filePath).replaceAll('\\', '/');
    const text = fs.readFileSync(filePath, 'utf8');

    for (const staleRoot of staleWorkspaceRoots) {
      if (text.includes(staleRoot)) {
        errors.push(`${relativePath} still references ${staleRoot}`);
      }
    }
  }

  assert.deepEqual(errors, []);
});

test('sdk family README verification sections stay cross-platform', () => {
  const errors = [];
  const families = [
    'sdks/sdkwork-iam-app-sdk/README.md',
    'sdks/sdkwork-iam-backend-sdk/README.md',
    'sdks/sdkwork-iam-open-sdk/README.md',
  ];

  for (const relativePath of families) {
    const text = fs.readFileSync(path.join(root, relativePath), 'utf8');
    if (/powershell/i.test(text)) {
      errors.push(`${relativePath} must not document PowerShell-only verification`);
    }
    if (!text.includes('generate-sdk.mjs')) {
      errors.push(`${relativePath} must document bin/generate-sdk.mjs`);
    }
  }

  assert.deepEqual(errors, []);
});
