# Apps

SDKWork IAM multi-surface application roots. Each child directory is one selected language/architecture per `APPLICATION_SPEC.md` and `SDKWORK_WORKSPACE_SPEC.md`.

| Application root | Architecture standard | Package family |
| --- | --- | --- |
| `sdkwork-iam-common/` | `APPLICATION_SPEC.md` shared package-family | Cross-architecture IAM contracts, runtime, service, SDK ports, RPC contracts |
| `sdkwork-iam-pc/` | `APP_PC_ARCHITECTURE_SPEC.md`, `APP_PC_REACT_UI_SPEC.md` | Reusable IAM PC React modules (`sdkwork-*-pc-react`) |
| `sdkwork-iam-h5/` | `APP_H5_ARCHITECTURE_SPEC.md`, `APP_MOBILE_REACT_UI_SPEC.md` | Future IAM H5/mobile React modules |
| `sdkwork-iam-flutter-mobile/` | `FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md`, `APP_FLUTTER_UI_SPEC.md` | Future IAM Flutter modules |

Cross-architecture TypeScript packages live in `sdkwork-iam-common/packages/` and are consumed by every client surface.

Owner: `sdkwork-iam` maintainers.
