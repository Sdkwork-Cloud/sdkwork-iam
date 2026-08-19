## Bootstrap auth profiles

IAM application bootstrap authenticates with any principal that holds register/provision/enable/access-credential permissions. Development often uses the platform super-admin account, but profiles are named by **environment**, not by role.

Store credentials under `~/.sdkwork/iam-bootstrap/`:

| File | When used |
| --- | --- |
| `development.json` | `SDKWORK_ENVIRONMENT=development` |
| `test.json` | test environment |
| `default.json` | fallback when no lifecycle file exists |
| `standalone.development.json` | exact `SDKWORK_PROFILE_ID` match |

Resolution order: `SDKWORK_IAM_BOOTSTRAP_OPERATOR_PROFILE` → lifecycle → profile id → `default` → legacy `super-admin` stem.

Legacy fallback: `~/.sdkwork/users/*.json` (including `super-admin.json`).

Canonical development identity: username `admin`, email `admin@sdkwork.com`. Store the password in the home profile, never in git.

Environment overrides: `SDKWORK_IAM_BOOTSTRAP_OPERATOR_USERNAME`, `SDKWORK_IAM_BOOTSTRAP_OPERATOR_PASSWORD` (legacy `SDKWORK_IAM_SUPER_ADMIN_*` aliases still work).

Directory override: `SDKWORK_IAM_BOOTSTRAP_PROFILE_DIR` (default `~/.sdkwork/iam-bootstrap`). Home resolution uses `%USERPROFILE%` on Windows (`HOMEDRIVE`+`HOMEPATH` fallback) and `$HOME` on Linux/macOS.
