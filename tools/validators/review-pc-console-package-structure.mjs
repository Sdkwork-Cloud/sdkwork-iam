import { access, readFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { appbaseArchitectureCatalog } from "../catalog/package-catalog.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");

const REQUIRED_CONSOLE_DIRS = ["services", "types", "routes", "pages"];

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function consolePackagesFromCatalog() {
  const pcReact = appbaseArchitectureCatalog.find((entry) => entry.architecture === "pc-react");
  const consoleDomain = pcReact?.domains.find((domain) => domain.domain === "iam-console");
  return consoleDomain?.packages ?? [];
}

export async function reviewPcConsolePackageStructure(options = {}) {
  const cwd = options.cwd ?? workspaceRoot;
  const issues = [];
  const packagesRoot = path.join(cwd, "apps/sdkwork-iam-pc/packages");

  for (const pkg of consolePackagesFromCatalog()) {
    const packageRoot = path.join(packagesRoot, pkg.directory);
    const packageJsonPath = path.join(packageRoot, "package.json");
    const componentSpecPath = path.join(packageRoot, "specs/component.spec.json");

    if (!(await exists(packageRoot))) {
      issues.push(`Missing PC console package directory: apps/sdkwork-iam-pc/packages/${pkg.directory}`);
      continue;
    }

    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    const expectedName = `@sdkwork/${pkg.directory.replace(/^sdkwork-/, "")}`;

    if (packageJson.name !== expectedName) {
      issues.push(`PC console package name mismatch for ${pkg.directory}: expected ${expectedName}, got ${packageJson.name}`);
    }

    if (packageJson.sdkwork?.architecture !== "pc-console") {
      issues.push(`PC console package ${packageJson.name} must declare sdkwork.architecture = "pc-console"`);
    }

    if (packageJson.sdkwork?.surface !== "console") {
      issues.push(`PC console package ${packageJson.name} must declare sdkwork.surface = "console"`);
    }

    if (!/^sdkwork-iam-pc-console-/.test(pkg.directory)) {
      issues.push(`PC console directory must use sdkwork-iam-pc-console-* naming: ${pkg.directory}`);
    }

    const isInfrastructure = pkg.directory.endsWith("-core") || pkg.directory.endsWith("-shell");
    if (!isInfrastructure && !packageJson.dependencies?.["@sdkwork/iam-pc-console-core"]) {
      issues.push(`PC console capability package ${packageJson.name} should depend on @sdkwork/iam-pc-console-core`);
    }

    if (!isInfrastructure && packageJson.dependencies?.["@sdkwork/iam-backend-sdk"]) {
      issues.push(`PC console capability package ${packageJson.name} must not depend on backend SDK clients`);
    }

    const srcRoot = path.join(packageRoot, "src");
    const hasIndex = ["index.ts", "index.tsx"].some((fileName) => fs.existsSync(path.join(srcRoot, fileName)));
    if (!hasIndex) {
      issues.push(`Missing public export entrypoint under src/ for ${pkg.directory}`);
    }

    if (!isInfrastructure) {
      for (const dirName of REQUIRED_CONSOLE_DIRS) {
        if (!(await exists(path.join(srcRoot, dirName)))) {
          issues.push(`Missing required PC console directory ${dirName}/ in ${pkg.directory}`);
        }
      }
    }

    if (!isInfrastructure) {
      if (!(await exists(componentSpecPath))) {
        issues.push(`Missing specs/component.spec.json for ${pkg.directory}`);
        continue;
      }
      const componentSpec = JSON.parse(await readFile(componentSpecPath, "utf8"));
      if (componentSpec.component?.surface !== "console") {
        issues.push(`component.spec.json must declare component.surface = "console" for ${pkg.directory}`);
      }
      const sdkClients = componentSpec.contracts?.sdkClients ?? [];
      if (!sdkClients.includes("@sdkwork/iam-app-sdk")) {
        issues.push(`component.spec.json should declare @sdkwork/iam-app-sdk in contracts.sdkClients for ${pkg.directory}`);
      }
      if (sdkClients.includes("@sdkwork/iam-backend-sdk")) {
        issues.push(`component.spec.json must not declare @sdkwork/iam-backend-sdk for console package ${pkg.directory}`);
      }
    }
  }

  return { issues };
}
