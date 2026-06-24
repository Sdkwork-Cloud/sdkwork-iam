# SDKWork IAM Backend SDK Component Spec

This component spec declares the generated backend SDK family for `sdkwork-iam`.

- SDK family: `sdkwork-iam-backend-sdk`
- API authority: `sdkwork-iam-backend-api`
- API prefix: `/backend/v3/api`
- Languages: TypeScript, Dart, Python, Go, Java, Kotlin, Swift, C#, Flutter, Rust, PHP, Ruby
- Generator: `../sdkwork-sdk-generator/bin/sdkgen.js`

## Verification

- `node --input-type=module -e "import { readFileSync } from 'node:fs'; JSON.parse(readFileSync('specs/component.spec.json','utf8'));"`
- `node tools/generators/materialize-iam-v3-openapi-boundaries.mjs`
- `node sdks/sdkwork-iam-backend-sdk/bin/generate-sdk.mjs`

Run these commands from the `sdkwork-iam` repository root.
