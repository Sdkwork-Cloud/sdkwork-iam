# sdkwork-iam-database-host

SDKWork Appbase IAM database lifecycle bootstrap. Registers the application-root
`database/` manifest through `sdkwork-database` lifecycle SPI and exposes a shared
PostgreSQL pool for IAM route crates and repositories.

## Integration

- Uses `sdkwork-database-lifecycle`, `sdkwork-database-spi`, and `sdkwork-database-sqlx`.
- Application roots call `bootstrap_iam_database` during Rust service bootstrap.

## Verification

- `pnpm run check:database`
- `cargo test -p sdkwork-iam-database-host` when crate tests exist
