import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appbaseArchitectureCatalog,
  rootPackageDirectoriesToRemove,
} from "../catalog/package-catalog.mjs";

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
    const architecturePath = architecture.packageKind === "rust"
      ? cratesRoot
      : path.join(packagesRoot, architecture.architecture);
    const architectureLabel = architecture.packageKind === "rust"
      ? "crates"
      : `packages/${architecture.architecture}`;

    if (!(await exists(architecturePath))) {
      issues.push(`Missing architecture directory: ${architectureLabel}`);
      continue;
    }

    let packageCount = 0;

    for (const domain of architecture.domains) {
      const domainPath = architecture.packageKind === "rust"
        ? architecturePath
        : path.join(architecturePath, domain.domain);

      if (architecture.packageKind !== "rust" && !(await exists(domainPath))) {
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
              path.join(packageRoot, "src", architecture.architecture === "pc-react" && pkg.directory === "sdkwork-iam-react" ? "index.tsx" : "index.ts"),
            ];

        for (const requiredPath of requiredPaths) {
          if (!(await exists(requiredPath))) {
            issues.push(`Missing required path: ${path.relative(workspaceRoot, requiredPath)}`);
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
