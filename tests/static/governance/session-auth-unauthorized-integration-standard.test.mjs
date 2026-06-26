import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const iamRoot = path.resolve(import.meta.dirname, "../../..");
const authRuntimeRoot = path.join(
  iamRoot,
  "apps/sdkwork-iam-pc/packages/sdkwork-auth-runtime-pc-react",
);
const authPcReactRoot = path.join(
  iamRoot,
  "apps/sdkwork-iam-pc/packages/sdkwork-auth-pc-react",
);

const IAM_PC_APP_ROOTS = [
  "sdkwork-birdcoder/apps/sdkwork-birdcoder-pc",
  "sdkwork-clawrouter/apps/sdkwork-clawrouter-pc",
  "sdkwork-commerce/apps/sdkwork-commerce-pc",
  "sdkwork-dezhou/apps/sdkwork-dezhou-pc",
  "sdkwork-documents/apps/sdkwork-documents-pc",
  "sdkwork-drive/apps/sdkwork-drive-pc",
  "sdkwork-gameengine/apps/sdkwork-gameengine-pc",
  "sdkwork-games/apps/sdkwork-games-pc",
  "sdkwork-github/apps/sdkwork-github-pc",
  "sdkwork-im/apps/sdkwork-im-pc",
  "sdkwork-knowledgebase/apps/sdkwork-knowledgebase-pc",
  "sdkwork-mail/apps/sdkwork-mail-pc",
  "sdkwork-mall/apps/sdkwork-mall-pc",
  "sdkwork-notary/apps/sdkwork-notary-pc",
  "sdkwork-rtc/apps/sdkwork-rtc-pc",
  "sdkwork-skills/apps/sdkwork-skills-pc",
  "sdkwork-terminal/apps/sdkwork-terminal-pc",
].map((relativePath) => path.join(iamRoot, "..", relativePath));

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function findExistingFiles(root, candidates) {
  return candidates
    .map((candidate) => path.join(root, candidate))
    .filter((filePath) => fs.existsSync(filePath));
}

test("auth-runtime exposes canonical session-auth unauthorized integration", () => {
  const indexSource = readText(path.join(authRuntimeRoot, "src/index.ts"));
  const runtimeSource = readText(path.join(authRuntimeRoot, "src/appbasePcAuthRuntime.ts"));

  assert.match(indexSource, /sessionAuthUnauthorized\.ts/);
  assert.match(indexSource, /handleSdkworkSessionAuthUnauthorizedError\.ts/);
  assert.match(indexSource, /attachSdkworkSdkSessionAuthBoundary\.ts/);
  assert.match(indexSource, /createSdkworkSessionAuthUnauthorizedIntegration\.ts/);
  assert.match(runtimeSource, /sessionAuth\?: boolean/);
  assert.match(runtimeSource, /attachSdkworkSdkSessionAuthBoundary/);
});

test("auth-pc-react exposes browser session-auth modal root", () => {
  const indexSource = readText(path.join(authPcReactRoot, "src/index.ts"));
  const browserRootSource = readText(
    path.join(authPcReactRoot, "src/SdkworkSessionAuthBrowserRoot.tsx"),
  );

  assert.match(indexSource, /SdkworkSessionAuthBrowserRoot\.tsx/);
  assert.match(browserRootSource, /SdkworkSessionAuthUnauthorizedProvider/);
});

for (const appRoot of IAM_PC_APP_ROOTS) {
  const appName = path.basename(path.dirname(appRoot)) + "/" + path.basename(appRoot);

  test(`${appName} wires browser session-auth modal root inside router`, () => {
    const entryFiles = findExistingFiles(appRoot, [
      "packages/sdkwork-birdcoder-pc-shell/src/application/app/AppRoot.tsx",
      "packages/sdkwork-terminal-pc-core/src/bootstrap/renderApp.tsx",
      "src/bootstrap/routes.tsx",
      "src/main.tsx",
      "src/App.tsx",
    ]);
    assert.ok(entryFiles.length > 0, `expected router entry in ${appRoot}`);

    const matched = entryFiles.some((entryFile) => {
      const source = readText(entryFile);
      return /SdkworkSessionAuthBrowserRoot|SdkworkSessionAuthUnauthorizedProvider/.test(source)
        && /BrowserRouter|HashRouter|MemoryRouter/.test(source);
    });
    assert.ok(
      matched,
      `${appName} must mount session-auth modal provider inside a router entry (${entryFiles.join(", ")})`,
    );
  });

  test(`${appName} uses appbase auth runtime with session-auth enabled by default`, () => {
    const iamRuntimeFiles = findExistingFiles(appRoot, [
      "packages/sdkwork-birdcoder-pc-infrastructure/src/services/iamRuntime.ts",
      "packages/sdkwork-clawroutes-pc-commons/src/iam-runtime.ts",
      "packages/sdkwork-github-pc-core/src/iam/githubIamRuntime.ts",
      "packages/sdkwork-notary-pc-core/src/appAuthRuntime.ts",
      "packages/sdkwork-im-pc-core/src/sdk/appAuthRuntime.ts",
      "packages/sdkwork-terminal-pc-core/src/bootstrap/iamRuntime.ts",
      "src/bootstrap/driveIamRuntime.ts",
      "src/bootstrap/knowledgebaseIamRuntime.ts",
      "src/bootstrap/mailAppAuthRuntime.ts",
      "src/bootstrap/rtcAppAuthRuntime.ts",
      "src/bootstrap/iamRuntime.ts",
      "src/bootstrap/runtime.ts",
    ]);
    assert.ok(iamRuntimeFiles.length > 0, `expected iam runtime bootstrap in ${appRoot}`);

    const matched = iamRuntimeFiles.some((iamRuntimeFile) => {
      const source = readText(iamRuntimeFile);
      return /createSdkworkAppbasePcAuthRuntime/.test(source)
        && !/sessionAuth:\s*false/.test(source);
    });
    assert.ok(
      matched,
      `${appName} must use createSdkworkAppbasePcAuthRuntime without disabling sessionAuth`,
    );
  });
}
