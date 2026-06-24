import { access, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appbaseArchitectureCatalog,
  rootPackageDirectoriesToRemove,
} from "../catalog/package-catalog.mjs";
import { reviewPcAdminPackageStructure } from "./review-pc-admin-package-structure.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");
const packagesRoot = path.join(workspaceRoot, "packages");
const cratesRoot = path.join(workspaceRoot, "crates");

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(targetPath) {
  const files = [];

  async function visit(directoryPath) {
    let entries;
    try {
      entries = await readdir(directoryPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }

  await visit(targetPath);
  return files;
}

export async function reviewPackageStructure(options = {}) {
  const summaryOnly = options.summaryOnly ?? process.argv.includes("--summary");
  const issues = [];
  const summary = [];

  for (const architecture of appbaseArchitectureCatalog) {
    const usesAppRoot = Boolean(architecture.appRoot);
    const architecturePath = architecture.packageKind === "rust"
      ? cratesRoot
      : usesAppRoot
        ? path.join(workspaceRoot, architecture.appRoot, "packages")
        : path.join(packagesRoot, architecture.architecture);
    const architectureLabel = architecture.packageKind === "rust"
      ? "crates"
      : usesAppRoot
        ? `${architecture.appRoot}/packages`
        : `packages/${architecture.architecture}`;

    if (!(await exists(architecturePath))) {
      issues.push(`Missing architecture directory: ${architectureLabel}`);
      continue;
    }

    let packageCount = 0;

    for (const domain of architecture.domains) {
      const domainPath = architecture.packageKind === "rust"
        ? architecturePath
        : architecture.packageLayout === "flat"
          ? architecturePath
          : path.join(architecturePath, domain.domain);

      if (
        architecture.packageKind !== "rust"
        && architecture.packageLayout !== "flat"
        && !(await exists(domainPath))
      ) {
        issues.push(`Missing domain directory: packages/${architecture.architecture}/${domain.domain}`);
        continue;
      }

      if (!architecture.scaffoldPackages) {
        continue;
      }

      for (const pkg of domain.packages) {
        packageCount += 1;
        const packageRoot = architecture.packageKind === "rust"
          ? path.join(cratesRoot, pkg.directory)
          : path.join(domainPath, pkg.directory);
        const requiredPaths = architecture.packageKind === "rust"
          ? [
              packageRoot,
              path.join(packageRoot, "Cargo.toml"),
              path.join(packageRoot, "README.md"),
              path.join(packageRoot, "src", "lib.rs"),
              path.join(packageRoot, "specs", "README.md"),
              path.join(packageRoot, "specs", "component.spec.json"),
            ]
          : [
              packageRoot,
              path.join(packageRoot, "README.md"),
              path.join(packageRoot, "package.json"),
              path.join(packageRoot, "tsconfig.json"),
            ];

        for (const requiredPath of requiredPaths) {
          if (!(await exists(requiredPath))) {
            issues.push(`Missing required path: ${path.relative(workspaceRoot, requiredPath)}`);
          }
        }

        if (architecture.packageKind !== "rust") {
          const srcRoot = path.join(packageRoot, "src");
          const hasPublicEntrypoint = ["index.ts", "index.tsx"].some((fileName) => existsSync(path.join(srcRoot, fileName)));
          if (!hasPublicEntrypoint) {
            issues.push(`Missing public export entrypoint under src/ for ${path.relative(workspaceRoot, packageRoot)}`);
          }
        }
      }
    }

    summary.push({
      architecture: architecture.architecture,
      scaffolded: architecture.scaffoldPackages ? packageCount : 0,
      reservedDomains: architecture.scaffoldPackages ? 0 : architecture.domains.length,
    });
  }

  for (const legacyRustFile of await listFiles(path.join(packagesRoot, "native-rust"))) {
    issues.push(
      `Legacy Rust package file still present outside crates layout: ${
        path.relative(workspaceRoot, legacyRustFile)
      }`,
    );
  }

  for (const rootPackageDirectory of rootPackageDirectoriesToRemove) {
    if (await exists(path.join(workspaceRoot, rootPackageDirectory))) {
      issues.push(`Root package directory still present: ${rootPackageDirectory}`);
    }
  }

  const { issues: pcAdminIssues } = await reviewPcAdminPackageStructure({ cwd: workspaceRoot });
  issues.push(...pcAdminIssues);

  if (summaryOnly) {
    for (const item of summary) {
      process.stdout.write(
        `${item.architecture}: scaffolded=${item.scaffolded} reservedDomains=${item.reservedDomains}\n`
      );
    }
    return { issues, summary };
  }

  if (issues.length > 0) {
    process.stderr.write(`Structure review failed with ${issues.length} issue(s):\n`);
    for (const issue of issues) {
      process.stderr.write(`- ${issue}\n`);
    }
    process.exitCode = 1;
    return { issues, summary };
  }

  const packageTotal = summary.reduce((total, item) => total + item.scaffolded, 0);
  process.stdout.write(
    `Structure review passed. Architectures=${summary.length} packages=${packageTotal}\n`
  );
  return { issues, summary };
}

export async function runPackageStructureReviewCli(options = {}) {
  return reviewPackageStructure(options);
}

function isDirectExecution() {
  return path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
  await runPackageStructureReviewCli();
}
