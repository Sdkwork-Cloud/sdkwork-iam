# sdkwork-appbase-app-sdk (Flutter)

Generated SDKWork v3 dual-token transport SDK.

## Installation

Add to `pubspec.yaml`:

```yaml
dependencies:
  sdkwork_appbase_app_sdk: ^1.0.0
```

## Quick Start

```dart
import 'package:sdkwork_appbase_app_sdk/sdkwork_appbase_app_sdk.dart';

final client = SdkworkAppClient.withBaseUrl(baseUrl: 'http://localhost:8080');
client.setAuthToken('your-auth-token');
client.setAccessToken('your-access-token');

// Use the SDK
final result = await client.auth.sessionsCurrentRetrieve();
print(result);
```

## Authentication

```text
Authorization: Bearer <authToken>
Access-Token: <accessToken>
```


## Configuration (Non-Auth)

```dart
final client = SdkworkAppClient.withBaseUrl(baseUrl: 'http://localhost:8080');

// Set custom headers
client.setHeader('X-Custom-Header', 'value');
```

## API Modules

- `client.auth` - auth API
- `client.iam` - iam API
- `client.oauth` - oauth API
- `client.system` - system API

## Usage Examples

### auth
```dart
// Sessions current retrieve.
final result = await client.auth.sessionsCurrentRetrieve();
print(result);
```

### iam
```dart
// Departments tree retrieve.
final result = await client.iam.departmentsTreeRetrieve();
print(result);
```

### oauth
```dart
// Oauth account Links list.
final params = <String, dynamic>{
  'page': 1,
  'page_size': 2,
  'cursor': 'cursor',
  'sort': 'sort',
  'q': 'q',
};
final result = await client.oauth.accountLinksList(params);
print(result);
```

### system
```dart
// Iam account Binding Policy retrieve.
final result = await client.system.iamAccountBindingPolicyRetrieve();
print(result);
```

## Error Handling

```dart
try {
  final result = await client.auth.sessionsCurrentRetrieve();
  print(result);
} catch (e) {
  print('Error: $e');
}
```

## Publishing

This SDK includes cross-platform publish scripts in `bin/`:
- `bin/publish-core.mjs`
- `bin/publish.sh`
- `bin/publish.ps1`

### Check

```bash
./bin/publish.sh --action check
```

### Publish

```bash
./bin/publish.sh --action publish --channel release
```

```powershell
.\bin\publish.ps1 --action publish --channel test --dry-run
```

> Ensure `dart pub publish --dry-run` passes before release publish.

## License

MIT

## Regeneration Contract

- HTTP/OpenAPI generator-owned files are tracked in `.sdkwork/sdkwork-generator-manifest.json`.
- HTTP/OpenAPI generation also writes `.sdkwork/sdkwork-generator-changes.json` so automation can inspect created, updated, deleted, unchanged, scaffolded, and backed-up files plus the classified impact areas, verification plan, and execution decision for the latest generation.
- HTTP/OpenAPI apply mode also writes `.sdkwork/sdkwork-generator-report.json` with the full execution report, including `schemaVersion`, `generator`, stable artifact paths, and the execution handoff commands that match CLI `--json` output.
- CLI JSON output also includes an execution handoff with concrete next commands, including reviewed apply commands for dry-run flows.
- Put HTTP/OpenAPI hand-written wrappers, adapters, and orchestration in `custom/`.
- Files scaffolded under `custom/` are created once and preserved across HTTP/OpenAPI regenerations.
- If an HTTP/OpenAPI generated-owned file was modified locally, its previous content is copied to `.sdkwork/manual-backups/` before overwrite or removal.
- RPC SDK source workspaces use convention-first evidence by default: RPC SDK family naming, language workspace naming, `rpc/*.manifest.json`, proto source references, generated client source, and native package manifests.
- Use `sdkgen inspect --protocol rpc` to verify RPC convention evidence. Request persisted generator evidence only with `--emit-control-plane` for release, CI, audit, or migration workflows; evidence paths are derived by generator convention.
