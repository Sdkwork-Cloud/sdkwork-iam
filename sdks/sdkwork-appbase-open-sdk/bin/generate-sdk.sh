#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAMILY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
APPBASE_ROOT="$(cd "${FAMILY_ROOT}/../.." && pwd)"
WORKSPACE_ROOT="$(cd "${FAMILY_ROOT}/../../.." && pwd)"
GENERATOR_PATH="${WORKSPACE_ROOT}/sdkwork-sdk-generator/bin/sdkgen.js"
INPUT_PATH="${FAMILY_ROOT}/openapi/sdkwork-appbase-open-api.sdkgen.yaml"
SDK_NAME="sdkwork-appbase-open-sdk"
BASE_URL="${BASE_URL:-http://localhost:8080}"
SDK_VERSION="${SDK_VERSION:-1.0.0}"
API_PREFIX="/iam/v3/api"
LANGUAGES="${LANGUAGES:-typescript,dart,python,go,java,kotlin,swift,csharp,flutter,rust,php,ruby}"

if [[ ! -f "${GENERATOR_PATH}" ]]; then
  echo "Canonical SDK generator not found: ${GENERATOR_PATH}" >&2
  exit 1
fi

if [[ ! -f "${INPUT_PATH}" ]]; then
  node "${APPBASE_ROOT}/tools/generators/materialize-appbase-v3-openapi-boundaries.mjs"
fi

package_name() {
  case "$1" in
    typescript) echo "@sdkwork/appbase-open-sdk" ;;
    dart|flutter) echo "sdkwork_appbase_open_sdk" ;;
    python|swift|rust|ruby) echo "sdkwork-appbase-open-sdk" ;;
    go) echo "github.com/sdkwork/sdkwork-appbase-open-sdk" ;;
    java|kotlin) echo "com.sdkwork:sdkwork-appbase-open-sdk" ;;
    csharp) echo "SDKWork.Appbase.OpenSdk" ;;
    php) echo "sdkwork/appbase-open-sdk" ;;
    *) echo "sdkwork-appbase-open-sdk-$1" ;;
  esac
}

namespace_args() {
  case "$1" in
    java|kotlin) printf '%s\n' "--namespace" "com.sdkwork.appbase.open.sdk" ;;
    csharp) printf '%s\n' "--namespace" "SDKWork.Appbase.OpenSdk" ;;
    php) printf '%s\n' "--namespace" "SDKWork\\Appbase\\OpenSdk" ;;
  esac
}

IFS=',' read -r -a language_array <<< "${LANGUAGES}"
for language in "${language_array[@]}"; do
  language="$(echo "${language}" | xargs)"
  [[ -z "${language}" ]] && continue
  output_path="${FAMILY_ROOT}/${SDK_NAME}-${language}"
  mapfile -t ns_args < <(namespace_args "${language}")
  node "${GENERATOR_PATH}" generate \
    -i "${INPUT_PATH}" \
    -o "${output_path}" \
    -n "${SDK_NAME}" \
    -t custom \
    -l "${language}" \
    --fixed-sdk-version "${SDK_VERSION}" \
    --base-url "${BASE_URL}" \
    --api-prefix "${API_PREFIX}" \
    --package-name "$(package_name "${language}")" \
    --standard-profile sdkwork-v3 \
    --sdk-root "${FAMILY_ROOT}" \
    --sdk-name "${SDK_NAME}" \
    --no-sync-published-version \
    "${ns_args[@]}"
done
