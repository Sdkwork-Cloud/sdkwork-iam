export const APPBASE_SDK_FAMILY_ROOTS = [
  'sdks/sdkwork-appbase-app-sdk',
  'sdks/sdkwork-appbase-backend-sdk',
  'sdks/sdkwork-appbase-open-sdk',
];

const sdkFamilySurfaces = [
  {
    directory: 'sdks/sdkwork-appbase-app-sdk',
    authority: 'sdkwork-appbase-app-api',
    apisSurface: 'app-api',
    routeCrate: 'sdkwork-router-iam-app-api',
  },
  {
    directory: 'sdks/sdkwork-appbase-backend-sdk',
    authority: 'sdkwork-appbase-backend-api',
    apisSurface: 'backend-api',
    routeCrate: 'sdkwork-router-iam-backend-api',
  },
  {
    directory: 'sdks/sdkwork-appbase-open-sdk',
    authority: 'sdkwork-appbase-open-api',
    apisSurface: 'open-api',
    routeCrate: 'sdkwork-router-iam-open-api',
  },
];

function openApiPath(directory, authority, suffix) {
  return `${directory}/openapi/${authority}.${suffix}`;
}

export const APPBASE_APIS_OPENAPI_AUTHORITY_FILES = sdkFamilySurfaces.map(
  ({ authority, apisSurface }) => `apis/${apisSurface}/iam/${authority}.openapi.yaml`,
);

export const APPBASE_OPENAPI_AUTHORITY_PAIRS = sdkFamilySurfaces.map(({ directory, authority, apisSurface }) => [
  `apis/${apisSurface}/iam/${authority}.openapi.yaml`,
  openApiPath(directory, authority, 'openapi.yaml'),
]);

export const APPBASE_MATERIALIZED_FROM_EXPECTATIONS = sdkFamilySurfaces.map(({ authority, apisSurface, routeCrate }) => ({
  relativePath: `apis/${apisSurface}/iam/${authority}.openapi.yaml`,
  routeCrate,
}));

export const APPBASE_SDK_FAMILY_ASSEMBLY_MANIFESTS = sdkFamilySurfaces.map(
  ({ directory }) => `${directory}/.sdkwork-assembly.json`,
);

export const APPBASE_OPENAPI_CORE_FILES = sdkFamilySurfaces.flatMap(({ directory, authority }) => [
  openApiPath(directory, authority, 'openapi.yaml'),
  openApiPath(directory, authority, 'sdkgen.yaml'),
]);

export const APPBASE_OPENAPI_MATERIALIZED_FILES = sdkFamilySurfaces.flatMap(({ directory, authority }) => [
  openApiPath(directory, authority, 'openapi.yaml'),
  openApiPath(directory, authority, 'sdkgen.yaml'),
  openApiPath(directory, authority, 'flutter.sdkgen.yaml'),
]);
