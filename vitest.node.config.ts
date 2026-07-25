import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const workspaceRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: workspaceRoot,
  test: {
    environment: "node",
    include: [
      "apps/sdkwork-iam-common/packages/**/*.test.ts",
      "apps/sdkwork-iam-common/packages/**/*.test.tsx",
      "apps/sdkwork-iam-pc/packages/**/*.test.ts",
      "packages/**/*.test.ts",
      "packages/**/*.test.tsx",
      "sdks/**/*.test.ts",
    ],
  },
});
