import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { runCommandSequence } from "./run-command-sequence.mjs";

const require = createRequire(import.meta.url);

export const WORKSPACE_VITEST_RUNTIME_DIAGNOSTIC_CODE = "WORKSPACE_VITEST_RUNTIME_UNREADABLE";
export const WORKSPACE_VITEST_RUNTIME_BLOCKED_EXIT_CODE = 77;

const DEFAULT_WORKSPACE_VITEST_ROOT_PACKAGES = ["vitest", "vite", "@vitejs/plugin-react"];
const DEFAULT_WORKSPACE_VITEST_REMEDIATION_ACTIONS = [
  "Rebuild the sdkwork-appbase workspace node_modules tree in place.",
  "Repair filesystem ACLs or permissions for the blocked runtime files under node_modules.",
  "Re-run `node scripts/run-workspace-vitest.mjs` after the workspace runtime is readable again.",
];
const WORKSPACE_VITEST_DIAGNOSTIC_SAMPLE_LIMIT = 12;
const RUNTIME_EXPORT_CONDITION_KEYS = new Set([
  "browser",
  "default",
  "development",
  "import",
  "module",
  "node",
  "node-addons",
  "production",
  "react-server",
  "require",
  "worker",
]);

function getWorkspaceRequire(cwd) {
  return createRequire(path.join(cwd, "package.json"));
}

function normalizeError(error) {
  return {
    errorCode: error?.code ?? "ERR_WORKSPACE_VITEST_RUNTIME",
    errorMessage: error?.message ?? String(error),
  };
}

function defaultResolveRealPath(filePath) {
  if (typeof fs.realpathSync.native === "function") {
    return fs.realpathSync.native(filePath);
  }

  return fs.realpathSync(filePath);
}

function defaultCheckReadable(filePath) {
  const descriptor = fs.openSync(filePath, "r");
  fs.closeSync(descriptor);
}

function defaultReadTextFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function defaultListDirectoryEntries(directoryPath) {
  return fs.readdirSync(directoryPath, { withFileTypes: true });
}

function isExportSubpathKey(key) {
  return key === "." || key.startsWith("./");
}

function collectExportRelativePaths(value, entries, mode = "root") {
  if (typeof value === "string") {
    if ((mode === "root" || mode === "runtime") && isRuntimeRelativePath(value) && value.startsWith(".")) {
      entries.add(value);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (key === "types") {
      continue;
    }

    if (mode === "root") {
      if (isExportSubpathKey(key) || RUNTIME_EXPORT_CONDITION_KEYS.has(key)) {
        collectExportRelativePaths(nestedValue, entries, "runtime");
      }
      continue;
    }

    if (RUNTIME_EXPORT_CONDITION_KEYS.has(key)) {
      collectExportRelativePaths(nestedValue, entries, "runtime");
    }
  }
}

function isRuntimeRelativePath(relativePath) {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    return false;
  }

  if (relativePath.includes("*")) {
    return false;
  }

  if (/\.d\.[cm]?ts$/u.test(relativePath)) {
    return false;
  }

  return true;
}

function collectPackageRuntimeRelativePaths(packageJson) {
  const entries = new Set();

  const addRelativePath = (relativePath) => {
    if (!isRuntimeRelativePath(relativePath)) {
      return;
    }

    entries.add(relativePath);
  };

  addRelativePath(packageJson.main);
  addRelativePath(packageJson.module);
  addRelativePath(packageJson.browser);

  if (typeof packageJson.bin === "string") {
    addRelativePath(packageJson.bin);
  } else if (packageJson.bin && typeof packageJson.bin === "object") {
    for (const relativePath of Object.values(packageJson.bin)) {
      addRelativePath(relativePath);
    }
  }

  collectExportRelativePaths(packageJson.exports, entries);

  return [...entries];
}

function collectVitestSupplementaryEntries({
  packageDir,
  listDirectoryEntries,
  packageName,
}) {
  const unreadableEntries = [];
  const relativePaths = new Set(["vitest.mjs", path.join("dist", "cli.js")]);
  const chunksDirectoryPath = path.join(packageDir, "dist", "chunks");

  try {
    const directoryEntries = listDirectoryEntries(chunksDirectoryPath);
    for (const directoryEntry of directoryEntries) {
      if (typeof directoryEntry?.isFile === "function" && directoryEntry.isFile() && /^env\..+\.js$/u.test(directoryEntry.name)) {
        relativePaths.add(path.join("dist", "chunks", directoryEntry.name));
      }
    }
  } catch (error) {
    unreadableEntries.push({
      entryType: "package-directory",
      filePath: chunksDirectoryPath,
      packageName,
      ...normalizeError(error),
    });
  }

  return {
    relativePaths: [...relativePaths],
    unreadableEntries,
  };
}

function findNearestPackageJsonPath(startFilePath) {
  let currentDirectoryPath = path.dirname(startFilePath);
  const { root } = path.parse(currentDirectoryPath);

  while (true) {
    const packageJsonPath = path.join(currentDirectoryPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      return packageJsonPath;
    }

    if (currentDirectoryPath === root) {
      throw new Error(`Cannot locate package.json from ${startFilePath}`);
    }

    currentDirectoryPath = path.dirname(currentDirectoryPath);
  }
}

function defaultResolvePackageJsonPath({
  cwd,
  packageName,
  parentPackageJsonPath,
} = {}) {
  const resolver = parentPackageJsonPath
    ? createRequire(parentPackageJsonPath)
    : getWorkspaceRequire(cwd);

  try {
    return resolver.resolve(`${packageName}/package.json`);
  } catch (error) {
    if (error?.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") {
      throw error;
    }
  }

  const packageEntryPath = resolver.resolve(packageName);
  return findNearestPackageJsonPath(packageEntryPath);
}

export function probeWorkspaceVitestRuntime({
  cwd = process.cwd(),
  rootPackages = DEFAULT_WORKSPACE_VITEST_ROOT_PACKAGES,
  resolvePackageJsonPath = defaultResolvePackageJsonPath,
  resolveRealPath = defaultResolveRealPath,
  readTextFile = defaultReadTextFile,
  listDirectoryEntries = defaultListDirectoryEntries,
  checkReadable = defaultCheckReadable,
} = {}) {
  const inspectedPackages = [];
  const unreadableEntries = [];
  const unresolvedPackages = [];
  const visitedPackages = new Set();
  const pendingPackages = rootPackages.map((packageName) => ({
    depth: 0,
    packageName,
    parentPackageName: null,
    parentPackageJsonPath: null,
  }));

  while (pendingPackages.length > 0) {
    const currentPackage = pendingPackages.shift();
    if (!currentPackage || visitedPackages.has(currentPackage.packageName)) {
      continue;
    }

    visitedPackages.add(currentPackage.packageName);

    let packageJsonPath;
    try {
      packageJsonPath = resolvePackageJsonPath({
        cwd,
        packageName: currentPackage.packageName,
        parentPackageJsonPath: currentPackage.parentPackageJsonPath,
        resolveRealPath,
      });
    } catch (error) {
      unresolvedPackages.push({
        depth: currentPackage.depth,
        packageName: currentPackage.packageName,
        parentPackageName: currentPackage.parentPackageName,
        ...normalizeError(error),
      });
      continue;
    }

    inspectedPackages.push({
      depth: currentPackage.depth,
      packageJsonPath,
      packageName: currentPackage.packageName,
    });

    try {
      checkReadable(packageJsonPath);
    } catch (error) {
      unreadableEntries.push({
        depth: currentPackage.depth,
        entryType: "package-json",
        filePath: packageJsonPath,
        packageName: currentPackage.packageName,
        ...normalizeError(error),
      });
      continue;
    }

    let packageJson;
    try {
      packageJson = JSON.parse(readTextFile(packageJsonPath));
    } catch (error) {
      unreadableEntries.push({
        depth: currentPackage.depth,
        entryType: "package-json",
        filePath: packageJsonPath,
        packageName: currentPackage.packageName,
        ...normalizeError(error),
      });
      continue;
    }

    const packageDir = path.dirname(packageJsonPath);
    const runtimeRelativePaths = new Set(collectPackageRuntimeRelativePaths(packageJson));

    if (currentPackage.packageName === "vitest") {
      const vitestSupplementaryEntries = collectVitestSupplementaryEntries({
        listDirectoryEntries,
        packageDir,
        packageName: currentPackage.packageName,
      });

      for (const relativePath of vitestSupplementaryEntries.relativePaths) {
        runtimeRelativePaths.add(relativePath);
      }

      unreadableEntries.push(...vitestSupplementaryEntries.unreadableEntries);
    }

    const checkedRuntimeEntryPaths = new Set();
    for (const relativePath of runtimeRelativePaths) {
      const runtimeEntryPath = path.resolve(packageDir, relativePath);
      if (checkedRuntimeEntryPaths.has(runtimeEntryPath)) {
        continue;
      }

      checkedRuntimeEntryPaths.add(runtimeEntryPath);

      try {
        checkReadable(runtimeEntryPath);
      } catch (error) {
        unreadableEntries.push({
          depth: currentPackage.depth,
          entryType: "package-entry",
          filePath: runtimeEntryPath,
          packageName: currentPackage.packageName,
          ...normalizeError(error),
        });
      }
    }

    const dependencyNames = Object.keys(packageJson.dependencies ?? {}).sort((left, right) => left.localeCompare(right));
    for (const dependencyName of dependencyNames) {
      pendingPackages.push({
        depth: currentPackage.depth + 1,
        packageName: dependencyName,
        parentPackageName: currentPackage.packageName,
        parentPackageJsonPath: packageJsonPath,
      });
    }
  }

  return {
    cwd,
    inspectedPackages,
    isReady: unreadableEntries.length === 0 && unresolvedPackages.length === 0,
    rootPackages: [...rootPackages],
    unreadableEntries,
    unresolvedPackages,
  };
}

function sortDiagnosticItems(items) {
  return [...items].sort((left, right) => {
    const depthDifference = (left.depth ?? 0) - (right.depth ?? 0);
    if (depthDifference !== 0) {
      return depthDifference;
    }

    const packageNameDifference = String(left.packageName ?? "").localeCompare(String(right.packageName ?? ""));
    if (packageNameDifference !== 0) {
      return packageNameDifference;
    }

    return String(left.filePath ?? left.packageJsonPath ?? "").localeCompare(String(right.filePath ?? right.packageJsonPath ?? ""));
  });
}

export function createWorkspaceVitestRuntimeDiagnostic({
  cwd = process.cwd(),
  probe,
} = {}) {
  const inspectedPackages = sortDiagnosticItems(probe?.inspectedPackages ?? []);
  const unreadableEntries = sortDiagnosticItems(probe?.unreadableEntries ?? []);
  const unresolvedPackages = sortDiagnosticItems(probe?.unresolvedPackages ?? []);

  return {
    code: WORKSPACE_VITEST_RUNTIME_DIAGNOSTIC_CODE,
    cwd,
    exitCode: WORKSPACE_VITEST_RUNTIME_BLOCKED_EXIT_CODE,
    inspectedPackageCount: inspectedPackages.length,
    inspectedPackages: inspectedPackages.slice(0, WORKSPACE_VITEST_DIAGNOSTIC_SAMPLE_LIMIT),
    message:
      "sdkwork-appbase workspace Vitest runtime contains unreadable or unresolved dependency files. The governed runner refused to execute Vitest with a broken node_modules runtime.",
    recommendedActions: [...DEFAULT_WORKSPACE_VITEST_REMEDIATION_ACTIONS],
    rootPackages: probe?.rootPackages ?? [...DEFAULT_WORKSPACE_VITEST_ROOT_PACKAGES],
    unreadableEntries: unreadableEntries.slice(0, WORKSPACE_VITEST_DIAGNOSTIC_SAMPLE_LIMIT),
    unreadableEntryCount: unreadableEntries.length,
    unresolvedPackages: unresolvedPackages.slice(0, WORKSPACE_VITEST_DIAGNOSTIC_SAMPLE_LIMIT),
    unresolvedPackageCount: unresolvedPackages.length,
  };
}

export function emitWorkspaceVitestRuntimeDiagnostic({
  diagnostic,
  logger = console,
} = {}) {
  logger.error(
    `[sdkwork-appbase:test:workspace-vitest] ${diagnostic.message}`,
  );
  logger.error(JSON.stringify(diagnostic, null, 2));
}

export function createWorkspaceVitestPlan({
  cwd = process.cwd(),
  resolvePackageJsonPath = defaultResolvePackageJsonPath,
} = {}) {
  const vitestPackageJsonPath = resolvePackageJsonPath({
    cwd,
    packageName: "vitest",
  });
  const vitestCliPath = path.join(path.dirname(vitestPackageJsonPath), "dist", "cli.js");

  return {
    args: [
      vitestCliPath,
      "run",
      "--config",
      path.join(cwd, "vitest.config.ts"),
      "--configLoader",
      "native",
      "--pool",
      "vmThreads",
    ],
    command: process.execPath,
  };
}

export function runWorkspaceVitest({
  cwd = process.cwd(),
  env = process.env,
  logger = console,
  probeVitestRuntime = probeWorkspaceVitestRuntime,
  runCommands = runCommandSequence,
} = {}) {
  const probe = probeVitestRuntime({ cwd });
  if (!probe.isReady) {
    emitWorkspaceVitestRuntimeDiagnostic({
      diagnostic: createWorkspaceVitestRuntimeDiagnostic({ cwd, probe }),
      logger,
    });
    return WORKSPACE_VITEST_RUNTIME_BLOCKED_EXIT_CODE;
  }

  return runCommands({
    commands: [createWorkspaceVitestPlan({ cwd })],
    cwd,
    env,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runWorkspaceVitest());
}
