import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  APPBASE_APIS_OPENAPI_AUTHORITY_FILES,
  APPBASE_OPENAPI_MATERIALIZED_FILES,
} from "./appbase-sdk-family-surfaces.mjs";

const forbiddenNames = [
  "sdkwork-http-context-rust",
  "sdkwork_http_context",
  "sdkwork-id-rust",
  "sdkwork_id",
  "sdkwork-iam-core-rust",
  "sdkwork_iam_core",
  "sdkwork-iam-http-rust",
  "sdkwork_iam_http",
  "sdkwork-iam-storage-sqlx-rust",
  "sdkwork_iam_storage_sqlx",
  "sdkwork-iam-tauri-rust",
  "sdkwork_iam_tauri",
  "sdkwork-studio-storage-sqlx-rust",
  "sdkwork_studio_storage_sqlx",
  "sdkwork_user_center_native",
];

const requiredRouteCrates = [
  "crates/sdkwork-router-iam-app-api",
  "crates/sdkwork-router-iam-backend-api",
  "crates/sdkwork-router-iam-open-api",
];

const activeRustCatalogFiles = [
  "specs/appbase-capabilities.yaml",
  "tools/catalog/package-catalog.mjs",
  "scripts/run-iam-standard-contracts.mjs",
  "tools/generators/materialize-appbase-v3-openapi-boundaries.mjs",
  "sdks/materialize-appbase-v3-openapi-boundaries.mjs",
  "tools/generators/materialize-appbase-rpc-proto-boundaries.mjs",
  "sdks/materialize-appbase-rpc-proto-boundaries.mjs",
  ...APPBASE_APIS_OPENAPI_AUTHORITY_FILES,
  ...APPBASE_OPENAPI_MATERIALIZED_FILES,
];

const appbaseOwnedLegacyRustPathTokens = [
  "path: packages/native-rust/",
  "command: cargo test --manifest-path packages/native-rust/",
  "<sdkwork-iam>/packages/native-rust/",
  "resolve(appbaseRoot, 'packages/native-rust/",
  'resolve(appbaseRoot, "packages/native-rust/',
];

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function listCargoManifests(root) {
  const manifests = [];
  const ignored = new Set([".git", "node_modules", "target"]);

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (ignored.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile() && entry.name === "Cargo.toml") {
        manifests.push(fullPath);
      }
    }
  }

  visit(root);
  return manifests;
}

function listCrateDictionaryFiles(root) {
  const files = [];
  const cratesRoot = path.join(root, "crates");
  const ignored = new Set([".git", "node_modules", "target"]);
  const extensions = new Set([".json", ".md", ".toml"]);

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (ignored.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile() && extensions.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  visit(cratesRoot);
  return files;
}

function listFilesUnder(root, relativeRoot) {
  const files = [];
  const absoluteRoot = path.join(root, relativeRoot);
  if (!fs.existsSync(absoluteRoot)) {
    return files;
  }

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  visit(absoluteRoot);
  return files;
}

function packageNamesFromCargoToml(cargoToml) {
  const packageNames = [];
  let inPackage = false;

  for (const line of cargoToml.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      inPackage = trimmed === "[package]";
      continue;
    }

    if (!inPackage) {
      continue;
    }

    const match = trimmed.match(/^name\s*=\s*"([^"]+)"/);
    if (match) {
      packageNames.push(match[1]);
    }
  }

  return packageNames;
}

function firstPackageNameFromCargoToml(cargoToml) {
  return packageNamesFromCargoToml(cargoToml)[0] ?? null;
}

test("rust workspace uses standard crates layout and canonical crate names", () => {
  const root = process.cwd();
  const rootCargoToml = readText(path.join(root, "Cargo.toml"));
  const errors = [];

  if (rootCargoToml.includes("packages/native-rust")) {
    errors.push("Root Cargo.toml still references packages/native-rust");
  }

  for (const forbiddenName of forbiddenNames) {
    if (rootCargoToml.includes(forbiddenName)) {
      errors.push(`Root Cargo.toml still references forbidden Rust name: ${forbiddenName}`);
    }
  }

  for (const routeCrate of requiredRouteCrates) {
    if (!fs.existsSync(path.join(root, routeCrate, "Cargo.toml"))) {
      errors.push(`Missing IAM route crate: ${routeCrate}`);
    }
  }

  for (const legacyRustFile of listFilesUnder(root, "packages/native-rust")) {
    errors.push(
      `Legacy Rust file remains outside standard crates layout: ${
        path.relative(root, legacyRustFile).replaceAll(path.sep, "/")
      }`,
    );
  }

  for (const manifestPath of listCargoManifests(root)) {
    const relativePath = path.relative(root, manifestPath).replaceAll(path.sep, "/");
    const cargoToml = readText(manifestPath);
    const packageName = firstPackageNameFromCargoToml(cargoToml);

    for (const packageName of packageNamesFromCargoToml(cargoToml)) {
      if (packageName.includes("_")) {
        errors.push(`${relativePath} package name must use kebab-case: ${packageName}`);
      }
      for (const forbiddenName of forbiddenNames) {
        if (packageName === forbiddenName || cargoToml.includes(forbiddenName)) {
          errors.push(`${relativePath} still references forbidden Rust name: ${forbiddenName}`);
        }
      }
    }

    if (relativePath.startsWith("crates/") && relativePath.endsWith("/Cargo.toml")) {
      const crateRoot = path.dirname(manifestPath);
      const crateRelativeRoot = path.relative(root, crateRoot).replaceAll(path.sep, "/");
      const requiredFiles = [
        "README.md",
        "specs/README.md",
        "specs/component.spec.json",
      ];

      for (const requiredFile of requiredFiles) {
        if (!fs.existsSync(path.join(crateRoot, requiredFile))) {
          errors.push(`${crateRelativeRoot} is missing ${requiredFile}`);
        }
      }

      const componentSpecPath = path.join(crateRoot, "specs", "component.spec.json");
      if (fs.existsSync(componentSpecPath)) {
        const componentSpec = JSON.parse(readText(componentSpecPath));
        const component = componentSpec.component ?? {};
        const expectedRoot = `sdkwork-appbase/${crateRelativeRoot}`;

        if (component.name !== packageName) {
          errors.push(
            `${crateRelativeRoot}/specs/component.spec.json component.name must match Cargo package name: ${packageName}`,
          );
        }
        if (component.root !== expectedRoot) {
          errors.push(
            `${crateRelativeRoot}/specs/component.spec.json component.root must be ${expectedRoot}`,
          );
        }
        if (!Array.isArray(componentSpec.verification?.commands)
          || !componentSpec.verification.commands.includes(`cargo test -p ${packageName}`)) {
          errors.push(
            `${crateRelativeRoot}/specs/component.spec.json verification.commands must include cargo test -p ${packageName}`,
          );
        }
        if (component.type === "rust-route-crate") {
          for (const routeFile of ["src/paths.rs", "src/routes.rs", "src/handlers.rs", "src/manifest.rs"]) {
            if (!fs.existsSync(path.join(crateRoot, routeFile))) {
              errors.push(`${crateRelativeRoot} route crate is missing ${routeFile}`);
            }
          }
          const legacyAggregateFiles = [
            "src/sdkwork_appbase_app_api.rs",
            "src/sdkwork_appbase_backend_api.rs",
            "src/sdkwork_appbase_open_api.rs",
          ];
          for (const legacyFile of legacyAggregateFiles) {
            if (fs.existsSync(path.join(crateRoot, legacyFile))) {
              errors.push(`${crateRelativeRoot} route crate still uses legacy aggregate file ${legacyFile}`);
            }
          }
        }
        if (component.name === "sdkwork-router-iam-app-api") {
          const requiredFocusedModules = [
            "src/directory.rs",
            "src/passwords.rs",
            "src/responses.rs",
            "src/state.rs",
            "src/tokens.rs",
            "src/utils.rs",
          ];
          for (const moduleFile of requiredFocusedModules) {
            if (!fs.existsSync(path.join(crateRoot, moduleFile))) {
              errors.push(`${crateRelativeRoot} app-api route crate is missing focused module ${moduleFile}`);
            }
          }
        }
      }
    }
  }

  for (const dictionaryPath of listCrateDictionaryFiles(root)) {
    const relativePath = path.relative(root, dictionaryPath).replaceAll(path.sep, "/");
    const text = readText(dictionaryPath);

    if (text.includes("packages/native-rust")) {
      errors.push(`${relativePath} still references packages/native-rust`);
    }

    for (const forbiddenName of forbiddenNames) {
      if (text.includes(forbiddenName)) {
        errors.push(`${relativePath} still references forbidden Rust name: ${forbiddenName}`);
      }
    }
  }

  for (const activeFile of activeRustCatalogFiles) {
    const text = readText(path.join(root, activeFile));
    for (const legacyPathToken of appbaseOwnedLegacyRustPathTokens) {
      if (text.includes(legacyPathToken)) {
        errors.push(`${activeFile} still references appbase-owned legacy Rust path: ${legacyPathToken}`);
      }
    }

    for (const forbiddenName of forbiddenNames) {
      if (text.includes(forbiddenName)) {
        errors.push(`${activeFile} still references forbidden Rust name: ${forbiddenName}`);
      }
    }
  }

  const packageStructureReview = spawnSync(process.execPath, ["tools/validators/review-package-structure.mjs"], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  if (packageStructureReview.status !== 0) {
    errors.push(
      `review-package-structure.mjs must accept the standard crates/ Rust layout: ${
        packageStructureReview.stderr.trim() || packageStructureReview.stdout.trim()
      }`,
    );
  }

  assert.deepEqual(errors, []);
});
