import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const appbaseRoot = path.resolve(import.meta.dirname, "../../..");

test("IAM application bootstrap standard exposes checker script and bootstrap CLI wiring", async () => {
  const checkerModule = await import(
    pathToFileURL(
      path.resolve(appbaseRoot, "../sdkwork-specs/tools/check-iam-application-bootstrap-standard.mjs"),
    ).href,
  );

  assert.equal(typeof checkerModule.validateIamApplicationBootstrapStandard, "function");

  const packageJson = JSON.parse(fs.readFileSync(path.join(appbaseRoot, "package.json"), "utf8"));

  assert.equal(
    packageJson.scripts?.["check:iam-application-bootstrap"],
    "node ../sdkwork-specs/tools/check-iam-application-bootstrap-standard.mjs --root .",
  );
  assert.equal(
    packageJson.scripts?.["test:contract:iam-application-bootstrap"],
    "node ../sdkwork-specs/tools/check-iam-application-bootstrap-standard.mjs --root .",
  );
  assert.equal(
    packageJson.scripts?.["admin:bootstrap:app"],
    "node scripts/bootstrap/bootstrap-app.mjs",
  );
  assert.ok(packageJson.devDependencies?.["@sdkwork/iam-application-bootstrap"]);

  const bootstrapScript = fs.readFileSync(
    path.join(appbaseRoot, "scripts/bootstrap/bootstrap-app.mjs"),
    "utf8",
  );
  assert.match(bootstrapScript, /@sdkwork\/iam-application-bootstrap/);
  assert.doesNotMatch(bootstrapScript, /\/backend\/v3\/api\/iam\/applications\/register/);

  const result = checkerModule.validateIamApplicationBootstrapStandard(appbaseRoot);
  assert.equal(result.ok, true, result.failures.join("\n"));
});
