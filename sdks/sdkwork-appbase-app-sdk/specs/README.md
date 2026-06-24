# SDKWork Appbase App SDK Component Spec

This component spec declares the generated app SDK family for `sdkwork-appbase`.

- SDK family: `sdkwork-appbase-app-sdk`
- API authority: `sdkwork-appbase-app-api`
- API prefix: `/app/v3/api`
- Languages: TypeScript, Dart, Python, Go, Java, Kotlin, Swift, C#, Flutter, Rust, PHP, Ruby
- Generator: `../sdkwork-sdk-generator/bin/sdkgen.js`

## Verification

- `node --input-type=module -e "import { readFileSync } from 'node:fs'; JSON.parse(readFileSync('specs/component.spec.json','utf8'));"`
- `node tools/generators/materialize-appbase-v3-openapi-boundaries.mjs`
- `node sdks/sdkwork-appbase-app-sdk/bin/generate-sdk.mjs`

Run these commands from the `sdkwork-appbase` repository root.
