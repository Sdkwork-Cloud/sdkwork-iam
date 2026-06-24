import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');
const businessRoot = path.resolve(appbaseRoot, "..", "..");
const forbiddenStandaloneApiPrefixPattern =
  /(?<![A-Za-z0-9._-])\/(?:api\/app\/v\d+(?:\/api)?|api\/backend\/v\d+(?:\/api)?|api\/v\d+\/app(?:\/api)?|api\/v\d+\/backend(?:\/api)?|app\/v[12](?:\/api)?|backend\/v[12](?:\/api)?)(?=["'`/#?\s])/u;
const forbiddenUrlApiPrefixPattern =
  /https?:\/\/[^\s"'`]*\/(?:api\/app\/v\d+(?:\/api)?|api\/backend\/v\d+(?:\/api)?|api\/v\d+\/app(?:\/api)?|api\/v\d+\/backend(?:\/api)?|app\/v[12](?:\/api)?|backend\/v[12](?:\/api)?)(?=["'`/#?\s])/u;
const springMappingPattern =
  /@(?:RequestMapping|GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping)\("(?<path>\/[^"]*)"/u;

const scannedRoots = [
  path.join(appbaseRoot, "packages"),
  path.join(appbaseRoot, "scripts"),
  path.join(businessRoot, "legacy-java-plus-app-api", "src"),
  path.join(businessRoot, "legacy-java-plus-backend-api", "src"),
];

const ignoredDirectories = new Set([
  ".git",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "target",
]);

const scannedExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".rs",
  ".ts",
  ".tsx",
  ".java",
  ".yaml",
  ".yml",
]);

function* walkFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        yield* walkFiles(absolutePath);
      }
      continue;
    }

    if (entry.isFile() && scannedExtensions.has(path.extname(entry.name))) {
      yield absolutePath;
    }
  }
}

function findForbiddenApiPrefixUsages() {
  const violations = [];

  for (const absoluteRoot of scannedRoots) {
    if (!fs.existsSync(absoluteRoot)) {
      continue;
    }

    for (const filePath of walkFiles(absoluteRoot)) {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split(/\r?\n/u);
      for (const [index, line] of lines.entries()) {
        if (
          forbiddenStandaloneApiPrefixPattern.test(line)
          || forbiddenUrlApiPrefixPattern.test(line)
        ) {
          violations.push({
            filePath: path.relative(businessRoot, filePath).replaceAll(path.sep, "/"),
            line: index + 1,
            text: line.trim(),
          });
        }
      }
    }
  }

  return violations;
}

function findNonCanonicalSpringMappings({
  root,
  requiredPrefix,
  surfaceName,
}) {
  const violations = [];

  if (!fs.existsSync(root)) {
    return violations;
  }

  for (const filePath of walkFiles(root)) {
    if (path.extname(filePath) !== ".java") {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/u);

    for (const [index, line] of lines.entries()) {
      const match = springMappingPattern.exec(line);
      const apiPath = match?.groups?.path;
      if (!apiPath) {
        continue;
      }

      let nextSignificantLine = "";
      for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
        const candidate = lines[nextIndex].trim();
        if (!candidate || candidate.startsWith("@")) {
          continue;
        }
        nextSignificantLine = candidate;
        break;
      }

      if (/\b(?:class|interface|record)\s+\w+/u.test(nextSignificantLine)) {
        if (!apiPath.startsWith(requiredPrefix)) {
          violations.push({
            filePath: path.relative(businessRoot, filePath).replaceAll(path.sep, "/"),
            line: index + 1,
            surfaceName,
            text: line.trim(),
          });
        }
      }
    }
  }

  return violations;
}

test("appbase runtime and governance sources do not contain legacy app/backend API prefixes", () => {
  assert.deepEqual(findForbiddenApiPrefixUsages(), []);
});

test("spring app-api and backend-api controllers use only canonical v3 API prefixes", () => {
  assert.deepEqual(
    [
      ...findNonCanonicalSpringMappings({
        requiredPrefix: "/app/v3/api",
        root: path.join(businessRoot, "legacy-java-plus-app-api", "src"),
        surfaceName: "app-api",
      }),
      ...findNonCanonicalSpringMappings({
        requiredPrefix: "/backend/v3/api",
        root: path.join(businessRoot, "legacy-java-plus-backend-api", "src"),
        surfaceName: "backend-api",
      }),
    ],
    [],
  );
});
