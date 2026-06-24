import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');
const commonRoot = path.join(appbaseRoot, "packages", "common");

function listCommonPackageJsonFiles() {
  const files = [];

  for (const domainEntry of fs.readdirSync(commonRoot, { withFileTypes: true })) {
    if (!domainEntry.isDirectory()) {
      continue;
    }

    const domainPath = path.join(commonRoot, domainEntry.name);
    for (const packageEntry of fs.readdirSync(domainPath, { withFileTypes: true })) {
      if (!packageEntry.isDirectory()) {
        continue;
      }

      const packageJsonPath = path.join(domainPath, packageEntry.name, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        files.push(packageJsonPath);
      }
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

test("common TypeScript packages with tests expose exact package-level tests through the workspace Vitest root", () => {
  const violations = [];

  for (const packageJsonPath of listCommonPackageJsonFiles()) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const packageRoot = path.dirname(packageJsonPath);
    const packageRootRelativePath = toPosixPath(path.relative(appbaseRoot, packageRoot));
    const testsPath = path.join(packageRoot, "tests");
    const testScript = packageJson.scripts?.test;

    if (!fs.existsSync(testsPath)) {
      if (testScript) {
        violations.push({
          name: packageJson.name,
          path: path.relative(appbaseRoot, packageJsonPath),
          testScript,
          expectedTestScript: null,
        });
      }

      continue;
    }

    const expectedTestScript = [
      "pnpm --dir ../../../.. exec vitest run",
      `${packageRootRelativePath}/tests`,
      "--config vitest.config.ts --configLoader native --pool vmThreads",
    ].join(" ");

    if (testScript !== expectedTestScript) {
      violations.push({
        name: packageJson.name,
        path: path.relative(appbaseRoot, packageJsonPath),
        testScript,
        expectedTestScript,
      });
    }
  }

  assert.deepEqual(violations, []);
});
