# sdkwork-appbase-open-sdk Component Specs

Machine-readable contract for the `sdkwork-appbase-open-sdk` SDK family.

## Verification

- `node --input-type=module -e "import { readFileSync } from 'node:fs'; JSON.parse(readFileSync('specs/component.spec.json','utf8'));"`
- `node tools/generators/materialize-appbase-v3-openapi-boundaries.mjs`
- `node sdks/sdkwork-appbase-open-sdk/bin/generate-sdk.mjs`

Run these commands from the `sdkwork-appbase` repository root.
