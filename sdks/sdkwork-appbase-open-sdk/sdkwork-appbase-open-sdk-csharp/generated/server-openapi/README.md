# sdkwork-appbase-open-sdk (C#)

Professional C# SDK for SDKWork API.

## Installation

```bash
dotnet add package SDKWork.Appbase.OpenSdk
```

Or add to your `.csproj`:

```xml
<PackageReference Include="SDKWork.Appbase.OpenSdk" Version="1.0.0" />
```

## Quick Start

```csharp
using SDKWork.Appbase.OpenSdk.Models;
using SDKWork.Appbase.OpenSdk;
using SDKwork.Common.Core;

var config = new SdkConfig("http://localhost:8080");
var client = new SdkworkCustomClient(config);
client.SetApiKey("your-api-key");

var callbackPublicId = "1";
var result = await client.IamOauth.ProviderCallbacksHandleGetAsync(callbackPublicId);
Console.WriteLine(result);
```

## Authentication Modes (Mutually Exclusive)

Choose exactly one mode for the same client instance.

### Mode A: API Key

```csharp
var config = new SdkConfig("http://localhost:8080");
var client = new SdkworkCustomClient(config);
client.SetApiKey("your-api-key");
// Sends: X-API-Key: <apiKey>
```

### Mode B: Dual Token

```csharp
var config = new SdkConfig("http://localhost:8080");
var client = new SdkworkCustomClient(config);
client.SetAuthToken("your-auth-token");
client.SetAccessToken("your-access-token");
// Sends:
// Authorization: Bearer <authToken>
// Access-Token: <accessToken>
```

> Do not call `SetApiKey(...)` together with `SetAuthToken(...)` + `SetAccessToken(...)` on the same client.

## Configuration (Non-Auth)

```csharp
var config = new SdkConfig("http://localhost:8080");
var client = new SdkworkCustomClient(config);

// Set custom headers
client.SetHeader("X-Custom-Header", "value");
```

## API Modules

- `client.IamOauth` - iam_oauth API

## Usage Examples

### iam_oauth

```csharp
// Iam oauth provider Callbacks handle Get.
var callbackPublicId = "1";
var result = await client.IamOauth.ProviderCallbacksHandleGetAsync(callbackPublicId);
Console.WriteLine(result);
```

## Error Handling

```csharp
try
{
    var callbackPublicId = "1";
    await client.IamOauth.ProviderCallbacksHandleGetAsync(callbackPublicId);
}
catch (HttpRequestException ex)
{
    Console.WriteLine($"Error: {ex.Message}");
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

> Set `NUGET_API_KEY` for release (or `NUGET_TEST_API_KEY` for test channel).

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
