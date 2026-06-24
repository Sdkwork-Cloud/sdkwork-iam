import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildForbiddenIamPathFragments } from "../../../../sdkwork-specs/tools/iam-legacy-path-fragments.mjs";

const root = path.resolve(import.meta.dirname, "../../..");

const APP_ROOTS = [
  {
    relativePath: "apps/sdkwork-iam-common",
    architecture: "common",
    corePackageDir: null,
    requiredPackages: [
      "packages/sdkwork-iam-contracts",
      "packages/sdkwork-iam-runtime",
      "packages/sdkwork-iam-service",
      "packages/sdkwork-iam-rpc-contracts",
    ],
  },
  {
    relativePath: "apps/sdkwork-iam-pc",
    architecture: "pc",
    corePackageDir: "packages/sdkwork-iam-pc-core",
    requiredPackages: [
      "packages/sdkwork-iam-pc-core",
      "packages/sdkwork-auth-pc-react",
      "packages/sdkwork-auth-runtime-pc-react",
      "packages/sdkwork-iam-react",
    ],
  },
  {
    relativePath: "apps/sdkwork-iam-h5",
    architecture: "h5",
    corePackageDir: "packages/sdkwork-iam-h5-core",
    requiredPackages: ["packages/sdkwork-iam-h5-core"],
  },
  {
    relativePath: "apps/sdkwork-iam-flutter-mobile",
    architecture: "flutter-mobile",
    corePackageDir: null,
    requiredPackages: [],
  },
];

const LEGACY_PATH_FRAGMENTS = [
  ...buildForbiddenIamPathFragments().filter((fragment) => !fragment.includes("sdkwork-")),
  "packages\\\\pc-react\\\\iam\\\\",
  "packages\\\\common\\\\iam\\\\",
];

const IGNORED_SCAN_SEGMENTS = [
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}pnpm-lock.yaml`,
  `${path.sep}tools${path.sep}repath-iam-consumers.mjs`,
  `${path.sep}tests${path.sep}static${path.sep}governance${path.sep}iam-apps-layout-standard.test.mjs`,
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function listTextFiles(directoryPath) {
  const files = [];

  function visit(currentPath) {
    let entries;
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "target") {
          continue;
        }
        visit(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }

  visit(directoryPath);
  return files;
}

function shouldScanAuthoredFile(filePath) {
  return !IGNORED_SCAN_SEGMENTS.some((segment) => filePath.includes(segment));
}

test("iam domain workspace uses multi-surface apps layout and removes legacy packages/pc-react/iam", () => {
  const errors = [];

  if (exists("packages/pc-react")) {
    errors.push("legacy root directory still present: packages/pc-react");
  }

  if (exists("packages")) {
    errors.push("repository-root packages/ must be removed; use apps/<surface>/packages/ instead");
  }

  for (const appRoot of APP_ROOTS) {
    for (const requiredRelative of [
      `${appRoot.relativePath}/README.md`,
      `${appRoot.relativePath}/AGENTS.md`,
      `${appRoot.relativePath}/.sdkwork/README.md`,
      `${appRoot.relativePath}/.sdkwork/skills/README.md`,
      `${appRoot.relativePath}/.sdkwork/plugins/README.md`,
      `${appRoot.relativePath}/specs/component.spec.json`,
      `${appRoot.relativePath}/specs/dependency.composition.json`,
    ]) {
      if (!exists(requiredRelative)) {
        errors.push(`missing required app-root path: ${requiredRelative}`);
      }
    }

    const composition = JSON.parse(
      fs.readFileSync(path.join(root, appRoot.relativePath, "specs/dependency.composition.json"), "utf8"),
    );
    if (composition.clientArchitecture !== appRoot.architecture) {
      errors.push(
        `${appRoot.relativePath}/specs/dependency.composition.json clientArchitecture must be ${appRoot.architecture}`,
      );
    }

    for (const requiredPackage of appRoot.requiredPackages) {
      const packagePath = path.join(appRoot.relativePath, requiredPackage);
      if (!exists(packagePath)) {
        errors.push(`missing required package: ${packagePath}`);
      }
    }

    if (appRoot.corePackageDir) {
      const compositionEntry = path.join(
        appRoot.relativePath,
        appRoot.corePackageDir,
        "src/composition/index.ts",
      );
      if (!exists(compositionEntry)) {
        errors.push(`missing core composition entry: ${compositionEntry}`);
      }
    }
  }

  if (!exists("apps/sdkwork-iam-common/packages/sdkwork-iam-contracts")) {
    errors.push("cross-architecture shared package family missing: apps/sdkwork-iam-common/packages/sdkwork-iam-contracts");
  }

  assert.deepEqual(errors, []);
});

test("sdkwork-iam authored sources do not reference retired repository-root package paths", () => {
  const errors = [];
  const scanRoots = ["apps", "specs", "tools", "tests", "scripts", "README.md", "AGENTS.md"];

  for (const scanRoot of scanRoots) {
    const absoluteRoot = path.join(root, scanRoot);
    if (!fs.existsSync(absoluteRoot)) {
      continue;
    }

    const files = fs.statSync(absoluteRoot).isFile()
      ? [absoluteRoot]
      : listTextFiles(absoluteRoot);

    for (const filePath of files) {
      if (!shouldScanAuthoredFile(filePath)) {
        continue;
      }

      const extension = path.extname(filePath);
      if (![".ts", ".tsx", ".mjs", ".json", ".md", ".yaml", ".yml", ".rs"].includes(extension)) {
        continue;
      }

      const text = fs.readFileSync(filePath, "utf8");
      for (const fragment of LEGACY_PATH_FRAGMENTS) {
        if (text.includes(fragment)) {
          errors.push(
            `${path.relative(root, filePath).replaceAll("\\", "/")} still references legacy path fragment ${fragment}`,
          );
        }
      }
    }
  }

  assert.deepEqual(errors, []);
});

test("iam pc reusable packages declare sdkwork-iam workspace ownership", () => {
  const errors = [];
  const packagesRoot = path.join(root, "apps/sdkwork-iam-pc/packages");

  for (const entry of fs.readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageJsonPath = path.join(packagesRoot, entry.name, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      continue;
    }

    const manifest = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const workspaceName = manifest.sdkwork?.workspace;
    if (workspaceName && workspaceName !== "sdkwork-iam") {
      errors.push(`${entry.name}/package.json sdkwork.workspace must be sdkwork-iam, found ${workspaceName}`);
    }
  }

  assert.deepEqual(errors, []);
});
