#!/usr/bin/env node

import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

async function removeIfExists(relativePath) {
  const absolutePath = path.join(appRoot, relativePath);
  try {
    await rm(absolutePath, { recursive: true, force: true });
    console.log(`removed ${relativePath}`);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code !== "ENOENT") {
      throw error;
    }
  }
}

await removeIfExists("target");
console.log("clean complete");
