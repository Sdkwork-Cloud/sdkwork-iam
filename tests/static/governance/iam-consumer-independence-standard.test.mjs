import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const iamRoot = path.resolve(import.meta.dirname, '../../..');
const embeddedBootstrapPath = path.join(
  iamRoot,
  'crates/sdkwork-iam-web-adapter/src/embedded_bootstrap.rs',
);

function listFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (['node_modules', 'target', 'dist', 'generated', '.git', '.runtime'].includes(entry.name)) {
      continue;
    }
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(entryPath));
    } else if (/\.(?:json|md|mjs|mts|rs|toml|ts|tsx|yaml|yml)$/u.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
}

test('embedded IAM bootstrap accepts only the generic application-root key', () => {
  const source = fs.readFileSync(embeddedBootstrapPath, 'utf8');
  const appRootKeys = [...source.matchAll(/"(SDKWORK_[A-Z_]*APP_ROOT)"/gu)]
    .map((match) => match[1]);

  assert.deepEqual([...new Set(appRootKeys)], ['SDKWORK_APP_ROOT']);
});

test('IAM authored sources do not name a consuming product', () => {
  const consumerIdentity = ['bird', 'coder'].join('');
  const testFile = path.resolve(import.meta.filename);
  const offenders = [
    path.join(iamRoot, '.gitignore'),
    ...listFiles(path.join(iamRoot, 'apps')),
    ...listFiles(path.join(iamRoot, 'crates')),
    ...listFiles(path.join(iamRoot, 'scripts')),
    ...listFiles(path.join(iamRoot, 'tests')),
  ].filter((filePath) => filePath !== testFile)
    .filter((filePath) => {
      try {
        return fs.readFileSync(filePath, 'utf8').toLowerCase().includes(consumerIdentity);
      } catch {
        return false;
      }
    })
    .map((filePath) => path.relative(iamRoot, filePath));

  assert.deepEqual(offenders, []);
});
