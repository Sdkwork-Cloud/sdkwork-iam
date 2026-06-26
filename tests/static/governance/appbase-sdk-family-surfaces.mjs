export const APPBASE_SDK_FAMILY_ROOTS = [
  'sdks/sdkwork-iam-app-sdk',
  'sdks/sdkwork-iam-backend-sdk',
  'sdks/sdkwork-iam-open-sdk',
];

const sdkFamilySurfaces = [
  {
    directory: 'sdks/sdkwork-iam-app-sdk',
    authority: 'sdkwork-iam-app-api',
    apisSurface: 'app-api',
    routeCrate: 'sdkwork-routes-iam-app-api',
  },
  {
    directory: 'sdks/sdkwork-iam-backend-sdk',
    authority: 'sdkwork-iam-backend-api',
    apisSurface: 'backend-api',
    routeCrate: 'sdkwork-routes-iam-backend-api',
  },
  {
    directory: 'sdks/sdkwork-iam-open-sdk',
    authority: 'sdkwork-iam-open-api',
    apisSurface: 'open-api',
    routeCrate: 'sdkwork-routes-iam-open-api',
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
