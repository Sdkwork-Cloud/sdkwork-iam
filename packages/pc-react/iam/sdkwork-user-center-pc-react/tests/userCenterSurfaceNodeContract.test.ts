import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "vitest";

import {
  createUserCenterSurfaceAppearanceBundle,
  resolveUserCenterSurfaceAuthAppearance,
  resolveUserCenterSurfaceInitialEntry,
  resolveUserCenterSurfaceUserAppearance,
  userCenterPackageMeta,
} from "../src/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const indexPath = path.join(packageRoot, "src", "index.ts");
const readmePath = path.join(packageRoot, "README.md");

describe("@sdkwork/user-center-pc-react surface contract", () => {
  it("keeps the root index UI-only", () => {
    const indexSource = fs.readFileSync(indexPath, "utf8");

    assert.match(indexSource, /userCenterAppearance\.ts/u);
    assert.match(indexSource, /userCenterSurfaceRouting\.ts/u);
    assert.match(indexSource, /userCenterAuthSurfacePage\.tsx/u);
    assert.match(indexSource, /userCenterProfileSurfacePage\.tsx/u);

    assert.doesNotMatch(indexSource, /userCenterBridge\.ts/u);
    assert.doesNotMatch(indexSource, /userCenterConfig\.ts/u);
    assert.doesNotMatch(indexSource, /userCenterDeployment\.ts/u);
    assert.doesNotMatch(indexSource, /userCenterPlugin\.ts/u);
    assert.doesNotMatch(indexSource, /userCenterRuntimeClient\.ts/u);
    assert.doesNotMatch(indexSource, /userCenterServer\.ts/u);
    assert.doesNotMatch(indexSource, /userCenterStandard\.ts/u);
  });

  it("exports the governed UI package identity", () => {
    assert.deepEqual(userCenterPackageMeta, {
      architecture: "pc-react",
      capability: "user-center",
      domain: "iam",
      package: "@sdkwork/user-center-pc-react",
      status: "ready",
    });
  });

  it("resolves the sdkwork preset consistently for auth and user surfaces", () => {
    const bundle = createUserCenterSurfaceAppearanceBundle({
      preset: "sdkwork",
    });
    const authAppearance = resolveUserCenterSurfaceAuthAppearance(undefined, {
      preset: "sdkwork",
    });
    const userAppearance = resolveUserCenterSurfaceUserAppearance(undefined, {
      preset: "sdkwork",
    });

    assert.deepEqual(authAppearance, bundle.auth);
    assert.deepEqual(userAppearance, bundle.user);
    assert.equal(typeof bundle.auth, "object");
    assert.equal(typeof bundle.user, "object");
  });

  it("resolves the standard preset as an appbase-hosted fast integration surface", () => {
    const bundle = createUserCenterSurfaceAppearanceBundle({
      preset: "standard",
    });
    const defaultBundle = createUserCenterSurfaceAppearanceBundle({
      preset: "sdkwork",
    });

    assert.equal(bundle.auth.theme?.pageBackgroundColor, "#fafafa");
    assert.equal(bundle.auth.theme?.fieldBackgroundColor, "#f4f4f5");
    assert.equal(bundle.auth.theme?.shellBackgroundColor, "#ffffff");
    assert.equal(bundle.auth.theme?.qrFrameBackgroundColor, "rgba(24, 24, 27, 0.700)");
    assert.equal(bundle.auth.shellStyle?.boxShadow, undefined);
    assert.equal(
      bundle.auth.slotProps?.contentContainer?.style?.borderLeft,
      undefined,
    );
    assert.deepEqual(bundle.auth, defaultBundle.auth);
    assert.deepEqual(bundle.user, defaultBundle.user);
  });

  it("falls back deterministically when resolving the initial auth route entry", () => {
    assert.equal(
      resolveUserCenterSurfaceInitialEntry({
        fallbackEntry: "/login/login",
        location: null,
      }),
      "/login/login",
    );

    assert.equal(
      resolveUserCenterSurfaceInitialEntry({
        fallbackEntry: "/login/login",
        location: {
          hash: "#fragment",
          pathname: "/login/register",
          search: "?redirect=%2Fworkspace",
        },
      }),
      "/login/register?redirect=%2Fworkspace#fragment",
    );
  });

  it("documents the UI-only boundary and the handoff to the core package", () => {
    const readmeSource = fs.readFileSync(readmePath, "utf8");

    assert.match(readmeSource, /UI-only root package/u);
    assert.match(readmeSource, /@sdkwork\/user-center-core-pc-react/u);
    assert.match(readmeSource, /Do not deep-import internal files/u);
    assert.match(readmeSource, /SdkworkUserCenterAuthSurfacePage/u);
    assert.match(readmeSource, /SdkworkUserCenterProfileSurfacePage/u);
  });
});
