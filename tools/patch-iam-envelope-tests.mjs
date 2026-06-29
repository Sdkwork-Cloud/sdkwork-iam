import fs from "node:fs";
import path from "node:path";

const rustFiles = [
  "crates/sdkwork-routes-iam-app-api/tests/iam_http_standard.rs",
  "crates/sdkwork-routes-iam-app-api/tests/iam_local_app_router_test.rs",
  "crates/sdkwork-routes-iam-app-api/tests/oauth_authorization_server_integration.rs",
  "crates/sdkwork-routes-iam-backend-api/tests/iam_backend_route_standard.rs",
];

const tsFiles = [
  "apps/sdkwork-iam-pc/packages/sdkwork-user-center-core-pc-react/tests/userCenterAppSdkRuntimeClient.test.ts",
  "apps/sdkwork-iam-pc/packages/sdkwork-auth-pc-react/tests/auth.service.test.ts",
  "apps/sdkwork-iam-pc/packages/sdkwork-user-center-core-pc-react/tests/userCenterRuntimeBridgeContract.test.ts",
  "apps/sdkwork-iam-common/packages/sdkwork-iam-sdk-adapter/tests/iam-sdk-adapter.standard.test.ts",
  "apps/sdkwork-iam-pc/packages/sdkwork-user-pc-react/tests/user.service.test.ts",
];

const replacements = [
  [/assert_eq!\(\s*"2000",\s*(\w+)\["code"\]\s*\)/g, 'assert_eq!(0, $1["code"].as_i64().unwrap())'],
  [/assert_eq!\(\s*(\w+)\["code"\],\s*"2000"\s*\)/g, 'assert_eq!($1["code"].as_i64(), Some(0))'],
  [/assert_eq!\(\s*(\w+)\["code"\],\s*"2000",/g, 'assert_eq!($1["code"].as_i64(), Some(0),'],
  [/assert_ne!\(\s*"2000",\s*(\w+)\["code"\]/g, 'assert_ne!(Some(0), $1["code"].as_i64()'],
  [/assert_eq!\(\s*(\w+)\["code"\],\s*"iam_invalid_credentials"\s*\)/g, 'assert_eq!($1["code"].as_i64(), Some(40103))'],
  [/assert_eq!\(\s*payload\["code"\],\s*"iam_invalid_credentials"/g, 'assert_eq!(payload["code"].as_i64(), Some(40103)'],
  [/assert_eq!\(\s*"iam_permission_forbidden",\s*payload\["code"\]/g, 'assert_eq!(Some(40301), payload["code"].as_i64()'],
  [/assert_eq!\(\s*(\w+)\["code"\],\s*"iam_permission_forbidden"\s*\)/g, 'assert_eq!($1["code"].as_i64(), Some(40301))'],
  [/(\w+)_body\["requestId"\]/g, '$1_body["traceId"]'],
  [/must include requestId/g, "must include traceId"],
  [/unique requestId/g, "unique traceId"],
  [/code:\s*"2000"/g, "code: 0"],
];

function patchFile(file) {
  let text = fs.readFileSync(file, "utf8");
  const orig = text;
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }
  if (text !== orig) {
    fs.writeFileSync(file, text);
    console.log(`updated ${path.relative(process.cwd(), file)}`);
  }
}

for (const file of rustFiles) {
  patchFile(file);
}
for (const file of tsFiles) {
  patchFile(file);
}
