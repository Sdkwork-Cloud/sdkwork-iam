# sdkwork-iam-gateway-assembly

Generated HTTP gateway assembly for the `sdkwork-iam` application plane. Composes IAM `app-api`, `backend-api`, and `open-api` route crates into a single Axum router for standalone and cloud gateway hosts.

## Verification

```bash
cargo test -p sdkwork-iam-gateway-assembly
```

## Canonical Specs

See [specs/README.md](./specs/README.md) and [specs/component.spec.json](./specs/component.spec.json).
