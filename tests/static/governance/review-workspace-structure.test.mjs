import assert from "node:assert/strict";
import test from "node:test";

import { reviewWorkspaceStructure } from "../../../tools/validators/review-workspace-structure.mjs";

test("workspace review rejects template placeholders and missing standard directories", () => {
  const result = reviewWorkspaceStructure({ cwd: process.cwd() });

  assert.deepEqual(result.errors, []);
});
