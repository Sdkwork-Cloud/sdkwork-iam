# sdkwork-appbase-app-sdk (Go)

Generated SDKWork v3 dual-token transport SDK.

## Installation

```bash
go get github.com/sdkwork/sdkwork-appbase-app-sdk
```

## Quick Start

```go
package main

import (
    "fmt"
    "github.com/sdkwork/sdkwork-appbase-app-sdk"
    sdkhttp "github.com/sdkwork/sdkwork-appbase-app-sdk/http"

)

func main() {
    cfg := sdkhttp.NewDefaultConfig("http://localhost:8080")
    client := github.com/sdkwork/sdkwork-appbase-app-sdk.NewSdkworkAppClientWithConfig(cfg)
    client.SetAuthToken("your-auth-token")
client.SetAccessToken("your-access-token")
    
    // Use the SDK
    result, err := client.Auth.SessionsCurrentRetrieve()
    if err != nil {
        panic(err)
    }
    fmt.Println(result)
}
```

## Authentication

```text
Authorization: Bearer <authToken>
Access-Token: <accessToken>
```


## Configuration (Non-Auth)

```go
cfg := sdkhttp.NewDefaultConfig("http://localhost:8080")
client := github.com/sdkwork/sdkwork-appbase-app-sdk.NewSdkworkAppClientWithConfig(cfg)

// Set custom headers
client.SetHeader("X-Custom-Header", "value")
```

## API Modules

- `client.Auth` - auth API
- `client.Iam` - iam API
- `client.Oauth` - oauth API
- `client.System` - system API

## Usage Examples

### auth

```go
// Sessions current retrieve.
result, err := client.Auth.SessionsCurrentRetrieve()
if err != nil {
    panic(err)
}
fmt.Println(result)
```

### iam

```go
// Departments tree retrieve.
result, err := client.Iam.DepartmentsTreeRetrieve()
if err != nil {
    panic(err)
}
fmt.Println(result)
```

### oauth

```go
// Oauth account Links list.
params := map[string]interface{}{
    "page": 1,
    "page_size": 2,
    "cursor": "cursor",
    "sort": "sort",
    "q": "q",
}
result, err := client.Oauth.AccountLinksList(params)
if err != nil {
    panic(err)
}
fmt.Println(result)
```

### system

```go
// Iam account Binding Policy retrieve.
result, err := client.System.IamAccountBindingPolicyRetrieve()
if err != nil {
    panic(err)
}
fmt.Println(result)
```

## Error Handling

```go
_, err := client.Auth.SessionsCurrentRetrieve()
if err != nil {
    // Handle error
    fmt.Println("Error:", err)
    return
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

> Set `GO_RELEASE_TAG` (or `SDKWORK_RELEASE_TAG`) and push tag if needed.

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
