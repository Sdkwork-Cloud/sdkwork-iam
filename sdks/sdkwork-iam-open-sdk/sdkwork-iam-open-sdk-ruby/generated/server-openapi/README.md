# sdkwork-iam-open-sdk (Ruby)

Professional Ruby SDK for SDKWork API.

## Installation

```bash
gem install sdkwork-iam-open-sdk
```

## Quick Start

```ruby
require 'sdkwork/custom_sdk'

config = Sdkwork::CustomSdk::SdkConfig.new(base_url: 'http://localhost:8080')
client = Sdkwork::CustomSdk::SdkworkCustomClient.new(config)
client.set_api_key('your-api-key')

callback_public_id = '1'
result = client.iam_oauth.provider_callbacks_handle_get(callback_public_id)


puts result.inspect
```

## Authentication Modes (Mutually Exclusive)

Choose exactly one mode for the same client instance.

### Mode A: API Key

```ruby
config = Sdkwork::CustomSdk::SdkConfig.new(base_url: "http://localhost:8080")
client = Sdkwork::CustomSdk::SdkworkCustomClient.new(config)
client.set_api_key("your-api-key")
# Sends: X-API-Key: <apiKey>
```

### Mode B: Dual Token

```ruby
config = Sdkwork::CustomSdk::SdkConfig.new(base_url: "http://localhost:8080")
client = Sdkwork::CustomSdk::SdkworkCustomClient.new(config)
client.set_auth_token("your-auth-token")
client.set_access_token("your-access-token")
# Sends:
# Authorization: Bearer <authToken>
# Access-Token: <accessToken>
```

> Do not call `set_api_key(...)` together with `set_auth_token(...)` + `set_access_token(...)` on the same client.

## Configuration (Non-Auth)

```ruby
config = Sdkwork::CustomSdk::SdkConfig.new(base_url: 'http://localhost:8080')
client = Sdkwork::CustomSdk::SdkworkCustomClient.new(config)

# Set custom headers
client.set_header('X-Custom-Header', 'value')
```

## API Modules

- `client.iam_oauth` - iam_oauth API

## Usage Examples

### iam_oauth

```ruby
# Iam oauth provider Callbacks handle Get.
callback_public_id = '1'
result = client.iam_oauth.provider_callbacks_handle_get(callback_public_id)
puts result.inspect
```

## Error Handling

```ruby
begin
  callback_public_id = '1'
  client.iam_oauth.provider_callbacks_handle_get(callback_public_id)
rescue StandardError => e
  warn("Error: #{e.message}")
end
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

> Set `GEM_HOST_API_KEY` (or `RUBYGEMS_API_KEY`) before `gem push`.

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
