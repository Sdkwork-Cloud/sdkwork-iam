# sdkwork-iam Source Configuration

`sdkwork.deployment.config.json` is the root deployment profile index.
Topology profiles live under `topology/`. Gateway and runtime examples must stay
secret-free; production secrets come from mounted files under
`/etc/sdkwork/iam/secrets/`.

## Verification

```bash
node ../sdkwork-specs/tools/check-source-config-standard.mjs --root .
node ../sdkwork-app-topology/scripts/sdkwork-topology.mjs validate --root . --spec specs/topology.spec.json
```

<!-- SDKWORK-DEPLOY-LAYOUT: v1 -->
## Installed Runtime Paths

Authority: `APPLICATION_DEPLOY_LAYOUT_SPEC.md` (`../sdkwork-specs/`).

| Item | Value |
| --- | --- |
| `appId` | `sdkwork-iam` |
| `runtimeCode` | `iam` |
| Config root | `/etc/sdkwork/iam/` |
| Runtime TOML | `/etc/sdkwork/iam/config.toml` |
| Secrets | `/etc/sdkwork/iam/secrets/` |
| Override | `SDKWORK_IAM_CONFIG_FILE` |

Source profiles live under `etc/` (`sdkwork.deployment.config.json` index). Deploy manifest: `deployments/deploy.yaml`. Web data-plane source: `deployments/webserver/` (`SDKWORK_WEBSERVER_SPEC.md` layout v2).

```bash
node ../sdkwork-specs/tools/check-source-config-standard.mjs --root .
node ../sdkwork-specs/tools/check-application-deploy-layout.mjs --root .
node ../sdkwork-specs/tools/check-webserver-toml-standard.mjs --root deployments/webserver
```
<!-- /SDKWORK-DEPLOY-LAYOUT -->
