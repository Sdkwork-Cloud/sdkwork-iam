import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');

async function loadModule() {
  return import(
    pathToFileURL(
      path.join(appbaseRoot, "scripts", "run-iam-standard-governance.mjs"),
    ).href,
  );
}

test("IAM standard governance runner exposes one top-level entrypoint and package script", async () => {
  const module = await loadModule();

  assert.equal(typeof module.createIamStandardGovernancePlan, "function");
  assert.deepEqual(
    module.createIamStandardGovernancePlan({
      cwd: "D:/workspace/sdkwork-appbase",
      env: {
        SDKWORK_IAM_STANDARD: "1",
      },
      nodeExecutable: "node-custom",
    }),
    {
      command: "node-custom",
      args: ["scripts/run-user-center-standard-contracts.mjs"],
      cwd: "D:/workspace/sdkwork-appbase",
      env: {
        SDKWORK_IAM_STANDARD: "1",
      },
      shell: false,
      windowsHide: process.platform === "win32",
    },
  );

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(appbaseRoot, "package.json"), "utf8"),
  );

  assert.equal(
    packageJson.scripts?.["test:iam-standard-governance"],
    "node scripts/run-iam-standard-governance.mjs",
  );
});
