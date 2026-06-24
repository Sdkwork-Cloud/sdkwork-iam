import { access, readFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { appbaseArchitectureCatalog } from "../catalog/package-catalog.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");

const REQUIRED_ADMIN_DIRS = ["services", "types", "routes", "pages"];
const LEGACY_ADMIN_DIRECTORY_PATTERN = /^sdkwork-iam-(oauth|tenant|organization|permission|account-binding)-pc-react$/;
const LEGACY_ADMIN_PACKAGE_DIRECTORY_PATTERN = /sdkwork-iam-(oauth|tenant|organization|permission|account-binding)-pc-react/;
const LEGACY_ADMIN_PACKAGE_NAMES = [
  "@sdkwork/iam-oauth-pc-react",
  "@sdkwork/iam-tenant-pc-react",
  "@sdkwork/iam-organization-pc-react",
  "@sdkwork/iam-permission-pc-react",
  "@sdkwork/iam-account-binding-pc-react",
];

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function adminPackagesFromCatalog() {
  const pcReact = appbaseArchitectureCatalog.find((entry) => entry.architecture === "pc-react");
  const adminDomain = pcReact?.domains.find((domain) => domain.domain === "iam-admin");
  return adminDomain?.packages ?? [];
}

export async function reviewPcAdminPackageStructure(options = {}) {
  const cwd = options.cwd ?? workspaceRoot;
  const issues = [];
  const packagesRoot = path.join(cwd, "apps/sdkwork-iam-pc/packages");

  if (await exists(packagesRoot)) {
    for (const entry of fs.readdirSync(packagesRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && LEGACY_ADMIN_DIRECTORY_PATTERN.test(entry.name)) {
        issues.push(`Legacy PC admin directory still present: apps/sdkwork-iam-pc/packages/${entry.name}`);
      }
    }
  }

  for (const pkg of adminPackagesFromCatalog()) {
    const packageRoot = path.join(packagesRoot, pkg.directory);
    const packageJsonPath = path.join(packageRoot, "package.json");
    const componentSpecPath = path.join(packageRoot, "specs/component.spec.json");

    if (!(await exists(packageRoot))) {
      issues.push(`Missing PC admin package directory: apps/sdkwork-iam-pc/packages/${pkg.directory}`);
      continue;
    }

    if (!(await exists(packageJsonPath))) {
      issues.push(`Missing package.json: apps/sdkwork-iam-pc/packages/${pkg.directory}/package.json`);
      continue;
    }

    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    const expectedName = `@sdkwork/${pkg.directory.replace(/^sdkwork-/, "")}`;

    if (packageJson.name !== expectedName) {
      issues.push(`PC admin package name mismatch for ${pkg.directory}: expected ${expectedName}, got ${packageJson.name}`);
    }

    if (packageJson.sdkwork?.architecture !== "pc-admin") {
      issues.push(`PC admin package ${packageJson.name} must declare sdkwork.architecture = "pc-admin"`);
    }

    if (packageJson.sdkwork?.surface !== "backend-admin") {
      issues.push(`PC admin package ${packageJson.name} must declare sdkwork.surface = "backend-admin"`);
    }

    if (LEGACY_ADMIN_PACKAGE_NAMES.includes(packageJson.name)) {
      issues.push(`Legacy PC admin package name still in use: ${packageJson.name}`);
    }

    if (!/^sdkwork-iam-pc-admin-/.test(pkg.directory)) {
      issues.push(`PC admin directory must use sdkwork-iam-pc-admin-* naming: ${pkg.directory}`);
    }

    if (LEGACY_ADMIN_PACKAGE_DIRECTORY_PATTERN.test(pkg.directory)) {
      issues.push(`Legacy PC admin directory naming still in use: ${pkg.directory}`);
    }

    const isInfrastructure = pkg.directory.endsWith("-core") || pkg.directory.endsWith("-shell");
    if (!isInfrastructure && !packageJson.dependencies?.["@sdkwork/iam-pc-admin-core"]) {
      issues.push(`PC admin capability package ${packageJson.name} should depend on @sdkwork/iam-pc-admin-core`);
    }

    const srcRoot = path.join(packageRoot, "src");
    const hasIndex = ["index.ts", "index.tsx"].some((fileName) => fs.existsSync(path.join(srcRoot, fileName)));
    if (!hasIndex) {
      issues.push(`Missing public export entrypoint under src/ for ${pkg.directory}`);
    }

    if (!isInfrastructure) {
      for (const dirName of REQUIRED_ADMIN_DIRS) {
        const dirPath = path.join(srcRoot, dirName);
        if (!(await exists(dirPath))) {
          issues.push(`Missing required PC admin directory ${dirName}/ in ${pkg.directory}`);
        }
      }
    }

    if (await exists(componentSpecPath)) {
      const componentSpec = JSON.parse(await readFile(componentSpecPath, "utf8"));
      if (componentSpec.component?.name !== expectedName) {
        issues.push(`component.spec.json name mismatch for ${pkg.directory}: expected ${expectedName}`);
      }
      if (componentSpec.component?.surface !== "backend-admin") {
        issues.push(`component.spec.json must declare component.surface = "backend-admin" for ${pkg.directory}`);
      }
      const rootPath = componentSpec.component?.root ?? "";
      if (LEGACY_ADMIN_PACKAGE_DIRECTORY_PATTERN.test(rootPath)) {
        issues.push(`component.spec.json root still references legacy admin package path for ${pkg.directory}`);
      }
      if (!isInfrastructure) {
        const sdkClients = componentSpec.contracts?.sdkClients ?? [];
        if (!sdkClients.includes("@sdkwork/iam-backend-sdk")) {
          issues.push(`component.spec.json should declare @sdkwork/iam-backend-sdk in contracts.sdkClients for ${pkg.directory}`);
        }
      }
    } else if (!isInfrastructure) {
      issues.push(`Missing specs/component.spec.json for ${pkg.directory}`);
    }
  }

  return { issues };
}

export async function runPcAdminPackageStructureReviewCli(options = {}) {
  const { issues } = await reviewPcAdminPackageStructure(options);
  if (issues.length > 0) {
    process.stderr.write(`PC admin package structure review failed with ${issues.length} issue(s):\n`);
    for (const issue of issues) {
      process.stderr.write(`- ${issue}\n`);
    }
    process.exitCode = 1;
    return { issues };
  }

  process.stdout.write("PC admin package structure review passed.\n");
  return { issues };
}

function isDirectExecution() {
  return path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
  await runPcAdminPackageStructureReviewCli();
}
