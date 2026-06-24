# Contract Tests

Purpose: reserved cross-package HTTP, OpenAPI, RPC, and SDK contract verification
harnesses that are not owned by a single package-local test directory.

Owner: `sdkwork-iam` maintainers.

Active contract parity checks currently live in `../static/contract-parity.test.mjs`.

Verification: `pnpm run test:governance-node`.
