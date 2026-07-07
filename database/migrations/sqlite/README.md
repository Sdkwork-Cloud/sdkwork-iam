# SQLite migrations

SQLite is **not** part of the governed IAM database lifecycle (`database.manifest.json` declares PostgreSQL only).

- Production and CI use `database/migrations/postgres/`.
- The mirrored baseline at `database/ddl/baseline/sqlite/` supports embedded/OAuth-device runtime paths only.
- Do not add versioned SQLite migrations here unless SQLite is promoted to a manifest `engines` entry with dialect-correct DDL.
