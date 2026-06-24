# Deployments

Purpose: deployment topology, packaging handoff files, infrastructure examples,
and deployment runbooks when this base repository ships deployable artifacts.

Owner: `sdkwork-appbase` maintainers.

Allowed content: safe deployment descriptors, release handoff notes, and
deployment runbooks.

## Runbooks

| Path | Purpose |
| --- | --- |
| `runbooks/local-iam-rust.md` | Bootstrap PostgreSQL, materialize contracts, and verify IAM Rust route crates |

Forbidden content: live secrets, private keys, local overrides, user-private
runtime config, generated SDK output, or runtime state.

Related specs: `../sdkwork-specs/DEPLOYMENT_SPEC.md`,
`../sdkwork-specs/RELEASE_SPEC.md`, and
`../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`.

Verification: `pnpm run check:workspace`.
