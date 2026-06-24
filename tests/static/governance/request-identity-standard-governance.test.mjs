import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');
const sourceRoots = [
  path.join(appbaseRoot, "packages", "common"),
  path.join(appbaseRoot, "packages", "mobile-react"),
  path.join(appbaseRoot, "packages", "pc-react"),
];

const ignoredDirectories = new Set([
  ".git",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "specs",
  "target",
  "tests",
]);

const scannedExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);

const forbiddenPatterns = [
  {
    name: "generated SDK xRequestId parameter",
    pattern: /\bxRequestId\b/u,
  },
  {
    name: "request id provider hook",
    pattern: /\brequestIdProvider\b/u,
  },
  {
    name: "frontend request id helper",
    pattern: /\bcreateRequestId\b/u,
  },
  {
    name: "request id transport header",
    pattern: /X-Request-Id/u,
  },
  {
    name: "direct browser UUID generation",
    pattern: /\bcrypto\s*\.\s*randomUUID\s*\(/u,
  },
];

function* walkSourceFiles(directory) {
  if (!fs.existsSync(directory)) {
    return;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        yield* walkSourceFiles(absolutePath);
      }
      continue;
    }

    if (entry.isFile() && scannedExtensions.has(path.extname(entry.name))) {
      yield absolutePath;
    }
  }
}

function findFrontendRequestIdentityViolations() {
  const violations = [];

  for (const root of sourceRoots) {
    for (const filePath of walkSourceFiles(root)) {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split(/\r?\n/u);

      for (const [index, line] of lines.entries()) {
        for (const forbidden of forbiddenPatterns) {
          if (forbidden.pattern.test(line)) {
            violations.push({
              filePath: path.relative(appbaseRoot, filePath).replaceAll(path.sep, "/"),
              line: index + 1,
              rule: forbidden.name,
              text: line.trim(),
            });
          }
        }
      }
    }
  }

  return violations;
}

test("frontend and shared UI runtime source does not generate or send request ids", () => {
  assert.deepEqual(findFrontendRequestIdentityViolations(), []);
});
