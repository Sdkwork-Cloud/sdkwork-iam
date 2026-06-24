# sdkwork-appbase-backend-sdk (PHP)

Professional PHP SDK for SDKWork API.

## Installation

```bash
composer require sdkwork/appbase-backend-sdk
```

## Quick Start

```php
<?php

use SDKWork\Appbase\BackendSdk\SdkworkBackendClient;
use SDKWork\Appbase\BackendSdk\SdkConfig;


$config = new SdkConfig(baseUrl: 'http://localhost:8080');
$client = new SdkworkBackendClient($config);
$client->setApiKey('your-api-key');

$result = $client->iam->departmentsTreeRetrieve();


var_dump($result);
```

## Authentication Modes (Mutually Exclusive)

Choose exactly one mode for the same client instance.

### Mode A: API Key

```php
$config = new SdkConfig(baseUrl: "http://localhost:8080");
$client = new SdkworkBackendClient($config);
$client->setApiKey('your-api-key');
// Sends: Access-Token: <apiKey>
```

### Mode B: Dual Token

```php
$config = new SdkConfig(baseUrl: "http://localhost:8080");
$client = new SdkworkBackendClient($config);
$client->setAuthToken('your-auth-token');
$client->setAccessToken('your-access-token');
// Sends:
// Authorization: Bearer <authToken>
// Access-Token: <accessToken>
```

> Do not call `setApiKey(...)` together with `setAuthToken(...)` + `setAccessToken(...)` on the same client.

## Configuration (Non-Auth)

```php
<?php

use SDKWork\Appbase\BackendSdk\SdkworkBackendClient;
use SDKWork\Appbase\BackendSdk\SdkConfig;

$config = new SdkConfig(baseUrl: 'http://localhost:8080');
$client = new SdkworkBackendClient($config);

// Set custom headers
$client->setHeader('X-Custom-Header', 'value');
```

## API Modules

- `$client->iam` - iam API

## Usage Examples

### iam

```php
<?php

// Departments tree retrieve.
$result = $client->iam->departmentsTreeRetrieve();
var_dump($result);
```

## Error Handling

```php
<?php

use SDKWork\Appbase\BackendSdk\SdkworkBackendClient;
use SDKWork\Appbase\BackendSdk\SdkConfig;


$config = new SdkConfig(baseUrl: 'http://localhost:8080');
$client = new SdkworkBackendClient($config);

try {
    $client->iam->departmentsTreeRetrieve();
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

- Generator-owned files are tracked in `.sdkwork/sdkwork-generator-manifest.json`.
- Each run also writes `.sdkwork/sdkwork-generator-changes.json` so automation can inspect created, updated, deleted, unchanged, scaffolded, and backed-up files plus the classified impact areas, verification plan, and execution decision for the latest generation.
- Apply mode also writes `.sdkwork/sdkwork-generator-report.json` with the full execution report, including `schemaVersion`, `generator`, stable artifact paths, and the execution handoff commands that match CLI `--json` output.
- CLI JSON output also includes an execution handoff with concrete next commands, including reviewed apply commands for dry-run flows.
- Put hand-written wrappers, adapters, and orchestration in `custom/`.
- Files scaffolded under `custom/` are created once and preserved across regenerations.
- If a generated-owned file was modified locally, its previous content is copied to `.sdkwork/manual-backups/` before overwrite or removal.
