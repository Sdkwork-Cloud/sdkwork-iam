#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAMILY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
APPBASE_ROOT="$(cd "${FAMILY_ROOT}/../.." && pwd)"
IAM_ROOT="${APPBASE_ROOT}"
WORKSPACE_ROOT="$(cd "${FAMILY_ROOT}/../../.." && pwd)"
GENERATOR_PATH="${WORKSPACE_ROOT}/sdkwork-sdk-generator/bin/sdkgen.js"
INPUT_PATH="${FAMILY_ROOT}/openapi/sdkwork-iam-app-api.sdkgen.yaml"
SDK_NAME="sdkwork-iam-app-sdk"
BASE_URL="${BASE_URL:-http://localhost:8080}"
SDK_VERSION="${SDK_VERSION:-1.0.0}"
API_PREFIX="/app/v3/api"
LANGUAGES="${LANGUAGES:-typescript,dart,python,go,java,kotlin,swift,csharp,flutter,rust,php,ruby}"

if [[ ! -f "${GENERATOR_PATH}" ]]; then
  echo "Canonical SDK generator not found: ${GENERATOR_PATH}" >&2
  exit 1
fi

if [[ ! -f "${INPUT_PATH}" ]]; then
  node "${IAM_ROOT}/tools/generators/materialize-iam-v3-openapi-boundaries.mjs"
fi

package_name() {
  case "$1" in
    typescript) echo "@sdkwork/iam-app-sdk" ;;
    dart|flutter) echo "sdkwork_iam_app_sdk" ;;
    python|swift|rust|ruby) echo "sdkwork-iam-app-sdk" ;;
    go) echo "github.com/sdkwork/sdkwork-iam-app-sdk" ;;
    java|kotlin) echo "com.sdkwork:sdkwork-iam-app-sdk" ;;
    csharp) echo "SDKWork.Iam.AppSdk" ;;
    php) echo "sdkwork/iam-app-sdk" ;;
    *) echo "sdkwork-iam-app-sdk-$1" ;;
  esac
}

namespace_args() {
  case "$1" in
    java|kotlin) printf '%s\n' "--namespace" "com.sdkwork.iam.app.sdk" ;;
    csharp) printf '%s\n' "--namespace" "SDKWork.Iam.AppSdk" ;;
    php) printf '%s\n' "--namespace" "SDKWork\\Iam\\AppSdk" ;;
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
    -t app \
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
