import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const appbaseRoot = path.resolve(import.meta.dirname, "../../..");
const specsRoot = path.resolve(appbaseRoot, "../sdkwork-specs");

function readSpec(relativePath) {
  return readFileSync(path.join(specsRoot, relativePath), "utf8");
}

test("environment credential standard documents unified SDKWORK_ACCESS_TOKEN only", () => {
  const environmentSpec = readSpec("ENVIRONMENT_SPEC.md");
  const apiSpec = readSpec("API_SPEC.md");
  const iamSpec = readSpec("IAM_SPEC.md");
  const testSpec = readSpec("TEST_SPEC.md");

  assert.match(environmentSpec, /`SDKWORK_ACCESS_TOKEN`/u);
  assert.match(apiSpec, /`SDKWORK_ACCESS_TOKEN`/u);
  assert.match(iamSpec, /`SDKWORK_ACCESS_TOKEN`/u);
  assert.match(testSpec, /`SDKWORK_ACCESS_TOKEN`/u);

  assert.doesNotMatch(
    environmentSpec,
    /\| `SDKWORK_<APP>_ACCESS_TOKEN` \|/u,
    "bootstrap access credential table must use unified SDKWORK_ACCESS_TOKEN",
  );
  assert.doesNotMatch(
    environmentSpec,
    /\| `SDKWORK_<APP>_AUTH_TOKEN` \|/u,
    "auth token must not remain in the standard env table",
  );
  assert.match(
    environmentSpec,
    /auth_token.*not environment variables/iu,
    "ENVIRONMENT_SPEC must forbid auth_token env configuration",
  );
  assert.match(
    environmentSpec,
    /refresh_token.*not environment variables/iu,
    "ENVIRONMENT_SPEC must forbid refresh_token env configuration",
  );
});
