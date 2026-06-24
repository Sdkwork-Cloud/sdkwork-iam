#!/usr/bin/env node

import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appbaseRoot = path.resolve(__dirname, '../..');

const syncTargets = [
  {
    source: 'apis/rpc/common/v1',
    target: 'packages/common/rpc/sdkwork-rpc-contracts/proto/sdkwork/common/v1',
  },
  {
    source: 'apis/rpc/iam/app/v3',
    target: 'packages/common/iam/sdkwork-iam-rpc-contracts/proto/sdkwork/iam/app/v3',
  },
  {
    source: 'apis/rpc/iam/backend/v3',
    target: 'packages/common/iam/sdkwork-iam-rpc-contracts/proto/sdkwork/iam/backend/v3',
  },
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

export async function materializeAppbaseRpcProtoBoundaries({ cwd = appbaseRoot } = {}) {
  const copied = [];

  for (const mapping of syncTargets) {
    const sourceRoot = path.join(cwd, mapping.source);
    const targetRoot = path.join(cwd, mapping.target);
    const sourceFiles = (await listFiles(sourceRoot)).filter((filePath) => filePath.endsWith('.proto'));

    if (sourceFiles.length === 0) {
      throw new Error(`No proto authority files found under ${mapping.source}`);
    }

    await mkdir(targetRoot, { recursive: true });

    for (const sourceFile of sourceFiles) {
      const fileName = path.basename(sourceFile);
      const targetFile = path.join(targetRoot, fileName);
      await cp(sourceFile, targetFile);
      copied.push({
        source: path.relative(cwd, sourceFile).replaceAll('\\', '/'),
        target: path.relative(cwd, targetFile).replaceAll('\\', '/'),
      });
    }
  }

  return { copied };
}

function isDirectExecution() {
  return path.resolve(process.argv[1] ?? '') === __filename;
}

if (isDirectExecution()) {
  const result = await materializeAppbaseRpcProtoBoundaries();
  process.stdout.write(`Synced ${result.copied.length} proto authority file(s) from apis/rpc to package distribution trees.\n`);
  for (const entry of result.copied) {
    process.stdout.write(`- ${entry.source} -> ${entry.target}\n`);
  }
}
