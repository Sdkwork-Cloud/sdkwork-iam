# sdkwork-iam-app-sdk (PHP)

Generated SDKWork v3 dual-token transport SDK.

## Installation

```bash
composer require sdkwork/iam-app-sdk
```

## Quick Start

```php
<?php

use SDKWork\\Iam\\AppSdk\SdkworkAppClient;
use SDKWork\\Iam\\AppSdk\SdkConfig;


$config = new SdkConfig(baseUrl: 'http://localhost:8080');
$client = new SdkworkAppClient($config);
$$result = $client->auth->sessionsCurrentRetrieve();


var_dump($result);
```

## Authentication

```text
Authorization: Bearer <authToken>
Access-Token: <accessToken>
```


## Configuration (Non-Auth)

```php
<?php

use SDKWork\\Iam\\AppSdk\SdkworkAppClient;
use SDKWork\\Iam\\AppSdk\SdkConfig;

$config = new SdkConfig(baseUrl: 'http://localhost:8080');
$client = new SdkworkAppClient($config);

// Set custom headers
$client->setHeader('X-Custom-Header', 'value');
```

## API Modules

- `$client->auth` - auth API
- `$client->iam` - iam API
- `$client->oauth` - oauth API
- `$client->system` - system API

## Usage Examples

### auth

```php
<?php

// Sessions current retrieve.
$result = $client->auth->sessionsCurrentRetrieve();
var_dump($result);
```

### iam

```php
<?php

// Departments tree retrieve.
$result = $client->iam->departmentsTreeRetrieve();
var_dump($result);
```

### oauth

```php
<?php

// Oauth account Links list.
$params = ['page' => 1, 'page_size' => 2, 'cursor' => 'cursor', 'sort' => 'sort', 'q' => 'q'];
$result = $client->oauth->accountLinksList($params);
var_dump($result);
```

### system

```php
<?php

// Iam account Binding Policy retrieve.
$result = $client->system->iamAccountBindingPolicyRetrieve();
var_dump($result);
```

## Error Handling

```php
<?php

use SDKWork\\Iam\\AppSdk\SdkworkAppClient;
use SDKWork\\Iam\\AppSdk\SdkConfig;


$config = new SdkConfig(baseUrl: 'http://localhost:8080');
$client = new SdkworkAppClient($config);

try {
    $client->auth->sessionsCurrentRetrieve();
} catch (\Throwable $e) {
    echo "Error: {$e->getMessage()}\n";
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

> Set `PHP_RELEASE_TAG` (or `SDKWORK_RELEASE_TAG`) for Composer/Packagist tag-based release.

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
