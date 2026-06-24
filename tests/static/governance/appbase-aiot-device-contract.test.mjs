import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appbaseRoot = fileURLToPath(new URL("../../..", import.meta.url));
const aiotRoot = join(appbaseRoot, "..", "sdkwork-aiot", "apps", "sdkwork-aiot-pc", "packages");
const aiotRepoRoot = join(appbaseRoot, "..", "sdkwork-aiot");

function readJson(absolutePath) {
  return JSON.parse(readFileSync(absolutePath, "utf8"));
}

function readText(absolutePath) {
  return readFileSync(absolutePath, "utf8");
}

function aiotWorkspaceAvailable() {
  return existsSync(join(aiotRepoRoot, "apps", "sdkwork-aiot-pc", "packages", "sdkwork-aiot-pc-console-device", "package.json"));
}

test("appbase tsconfig resolves canonical AIoT SDK and console package aliases", () => {
  const tsconfigBase = readJson(join(appbaseRoot, "tsconfig.base.json"));
  const aiotPath = tsconfigBase.compilerOptions?.paths?.["@sdkwork/aiot-app-sdk"];
  assert.ok(
    Array.isArray(aiotPath) && aiotPath.some((entry) => entry.includes("sdkwork-aiot-app-sdk-typescript/src/index.ts")),
    "tsconfig.base.json must resolve @sdkwork/aiot-app-sdk to the canonical sdkwork-aiot app SDK source.",
  );
  assert.ok(
    Array.isArray(tsconfigBase.compilerOptions?.paths?.["@sdkwork/aiot-pc-console-device"]),
    "tsconfig.base.json must expose @sdkwork/aiot-pc-console-device as a path alias.",
  );
  assert.ok(
    Array.isArray(tsconfigBase.compilerOptions?.paths?.["@sdkwork/aiot-pc-console-iot"]),
    "tsconfig.base.json must expose @sdkwork/aiot-pc-console-iot as a path alias.",
  );
});

test("sdkwork-aiot console packages consume generated app SDK clients without raw HTTP", {
  skip: aiotWorkspaceAvailable() ? false : "sdkwork-aiot sibling workspace is not available",
}, () => {
  const devicePackagePath = join(aiotRoot, "sdkwork-aiot-pc-console-device", "package.json");
  const iotPackagePath = join(aiotRoot, "sdkwork-aiot-pc-console-iot", "package.json");

  const devicePackage = readJson(devicePackagePath);
  const iotPackage = readJson(iotPackagePath);

  assert.equal(
    devicePackage.sdkwork?.product,
    "sdkwork-aiot",
    "@sdkwork/aiot-pc-console-device must live in the sdkwork-aiot product workspace.",
  );
  assert.equal(
    devicePackage.sdkwork?.domain,
    "device",
    "@sdkwork/aiot-pc-console-device must claim the device domain.",
  );
  assert.ok(
    Array.isArray(devicePackage.sdkwork?.supersedes) && devicePackage.sdkwork.supersedes.includes("@sdkwork/device-pc-react"),
    "@sdkwork/aiot-pc-console-device must supersede the legacy @sdkwork/device-pc-react package.",
  );
  assert.equal(
    devicePackage.dependencies?.["@sdkwork/aiot-app-sdk"],
    "workspace:*",
    "@sdkwork/aiot-pc-console-device must depend on @sdkwork/aiot-app-sdk for canonical device catalog integration.",
  );

  assert.equal(
    iotPackage.sdkwork?.product,
    "sdkwork-aiot",
    "@sdkwork/aiot-pc-console-iot must live in the sdkwork-aiot product workspace.",
  );
  assert.equal(
    iotPackage.sdkwork?.domain,
    "iot",
    "@sdkwork/aiot-pc-console-iot must claim the iot domain.",
  );
  assert.ok(
    Array.isArray(iotPackage.sdkwork?.supersedes) && iotPackage.sdkwork.supersedes.includes("@sdkwork/iot-pc-react"),
    "@sdkwork/aiot-pc-console-iot must supersede the legacy @sdkwork/iot-pc-react package.",
  );
  assert.equal(
    iotPackage.dependencies?.["@sdkwork/aiot-app-sdk"],
    "workspace:*",
    "@sdkwork/aiot-pc-console-iot must depend on @sdkwork/aiot-app-sdk for canonical IoT fleet integration.",
  );

  const deviceServiceSource = readText(join(aiotRoot, "sdkwork-aiot-pc-console-device", "src", "device-service.ts"));
  assert.match(
    deviceServiceSource,
    /from\s+["']@sdkwork\/aiot-app-sdk["']/,
    "Device service must import generated types from @sdkwork/aiot-app-sdk.",
  );
  assert.match(
    deviceServiceSource,
    /\.iot\.devicesList\(/,
    "Device service must load managed devices through client.iot.devicesList.",
  );
  assert.doesNotMatch(
    deviceServiceSource,
    /fetch\(|axios\.|Authorization|Access-Token|X-API-Key|createListByPageFile/,
    "Device service must not use raw HTTP, manual auth headers, or File API persistence for managed devices.",
  );

  const deviceDomainSource = readText(join(aiotRoot, "sdkwork-aiot-pc-console-device", "src", "device.ts"));
  assert.match(
    deviceDomainSource,
    /const devices = sortSdkworkManagedDevices\(options\.devices \?\? \[\]\);/,
    "createEmptySdkworkDeviceCatalog must not seed demo managed devices when no SDK data is provided.",
  );

  const iotServiceSource = readText(join(aiotRoot, "sdkwork-aiot-pc-console-iot", "src", "iot-service.ts"));
  assert.match(
    iotServiceSource,
    /from\s+["']@sdkwork\/aiot-app-sdk["']/,
    "IoT service must import generated types from @sdkwork/aiot-app-sdk.",
  );
  assert.match(
    iotServiceSource,
    /\.iot\.devicesList\(/,
    "IoT service must load fleet nodes through client.iot.devicesList.",
  );
  assert.doesNotMatch(
    iotServiceSource,
    /fetch\(|axios\.|Authorization|Access-Token|X-API-Key|createListByPageFile/,
    "IoT service must not use raw HTTP, manual auth headers, or File API persistence for fleet nodes.",
  );
});
