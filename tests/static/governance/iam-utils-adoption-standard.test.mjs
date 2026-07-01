import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

const COMMON_PACKAGES_WITH_STRING_HELPERS = new Set([
  '@sdkwork/iam-application-bootstrap',
  '@sdkwork/iam-contracts',
  '@sdkwork/iam-credential-entry',
  '@sdkwork/iam-sdk-adapter',
  '@sdkwork/iam-service',
]);

const H5_CONTROLLER_PACKAGES = new Set([
  '@sdkwork/iam-h5-auth',
  '@sdkwork/iam-h5-user',
  '@sdkwork/iam-h5-account-binding',
]);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function listPackageJsonFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageJsonPath = path.join(absoluteDir, entry.name, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      files.push(packageJsonPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function packageDependsOnUtils(packageJson) {
  return packageJson.dependencies?.['@sdkwork/utils'] === 'workspace:*'
    || packageJson.devDependencies?.['@sdkwork/utils'] === 'workspace:*';
}

test('common IAM packages with authored string normalization depend on @sdkwork/utils', () => {
  const violations = [];

  for (const packageJsonPath of listPackageJsonFiles('apps/sdkwork-iam-common/packages')) {
    const packageJson = readJson(path.relative(root, packageJsonPath));
    if (!COMMON_PACKAGES_WITH_STRING_HELPERS.has(packageJson.name)) {
      continue;
    }

    if (!packageDependsOnUtils(packageJson)) {
      violations.push({
        name: packageJson.name,
        path: path.relative(root, packageJsonPath),
      });
    }
  }

  assert.deepEqual(violations, []);
});

test('H5 IAM controller packages depend on @sdkwork/utils', () => {
  const violations = [];

  for (const packageJsonPath of listPackageJsonFiles('apps/sdkwork-iam-h5/packages')) {
    const packageJson = readJson(path.relative(root, packageJsonPath));
    if (!H5_CONTROLLER_PACKAGES.has(packageJson.name)) {
      continue;
    }

    if (!packageDependsOnUtils(packageJson)) {
      violations.push({
        name: packageJson.name,
        path: path.relative(root, packageJsonPath),
      });
    }
  }

  assert.deepEqual(violations, []);
});

test('Flutter IAM core exports sdkwork string helpers aligned with @sdkwork/utils', () => {
  const coreExport = fs.readFileSync(
    path.join(root, 'apps/sdkwork-iam-flutter-mobile/packages/sdkwork_iam_flutter_mobile_core/lib/sdkwork_iam_flutter_mobile_core.dart'),
    'utf8',
  );
  assert.match(coreExport, /sdkwork_string_utils\.dart/u);

  const utilsSource = fs.readFileSync(
    path.join(
      root,
      'apps/sdkwork-iam-flutter-mobile/packages/sdkwork_iam_flutter_mobile_core/lib/src/sdkwork_string_utils.dart',
    ),
    'utf8',
  );
  assert.match(utilsSource, /sdkworkIsBlank/u);
  assert.match(utilsSource, /sdkworkNormalizeOptionalString/u);
});

test('IAM component specs do not use legacy Appbase branding in displayName', () => {
  const violations = [];

  function collectComponentSpecs(relativeDir) {
    const absoluteDir = path.join(root, relativeDir);
    if (!fs.existsSync(absoluteDir)) {
      return;
    }

    for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
      const childRelative = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        collectComponentSpecs(childRelative);
        continue;
      }

      if (entry.name !== 'component.spec.json') {
        continue;
      }

      const spec = readJson(childRelative);
      const displayName = spec.component?.displayName ?? '';
      if (/appbase/iu.test(displayName)) {
        violations.push({ path: childRelative, displayName });
      }
    }
  }

  collectComponentSpecs('crates');
  collectComponentSpecs('apps');
  collectComponentSpecs('sdks');
  collectComponentSpecs('specs');

  assert.deepEqual(violations, []);
});

test('Rust route crates re-export sdkwork_utils_rust::is_blank', () => {
  const routeCrates = [
    'crates/sdkwork-routes-iam-app-api/Cargo.toml',
    'crates/sdkwork-routes-iam-backend-api/Cargo.toml',
    'crates/sdkwork-routes-iam-open-api/Cargo.toml',
  ];

  for (const cargoTomlPath of routeCrates) {
    const cargoToml = fs.readFileSync(path.join(root, cargoTomlPath), 'utf8');
    assert.match(
      cargoToml,
      /sdkwork_utils_rust\.workspace = true/u,
      `${cargoTomlPath} must depend on sdkwork-utils-rust`,
    );

    const libPath = path.join(
      root,
      path.dirname(cargoTomlPath),
      'src/lib.rs',
    );
    const libSource = fs.readFileSync(libPath, 'utf8');
    assert.match(
      libSource,
      /sdkwork_utils_rust::is_blank/u,
      `${path.relative(root, libPath)} must re-export sdkwork_utils_rust::is_blank`,
    );
  }
});
