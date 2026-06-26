import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveIamBackendOperationPermission } from './iam-backend-operation-permissions.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iamRoot = resolve(__dirname, '../..');

const routeSources = [
  {
    owner: 'iam',
    packageName: 'sdkwork-routes-iam-app-api',
    path: resolve(iamRoot, 'crates/sdkwork-routes-iam-app-api/src/manifest.rs'),
    constructors: ['HttpRoute::credential_entry_public', 'HttpRoute::public', 'HttpRoute::dual_token', 'HttpRoute::api_key'],
  },
  {
    owner: 'iam',
    packageName: 'sdkwork-routes-iam-backend-api',
    path: resolve(iamRoot, 'crates/sdkwork-routes-iam-backend-api/src/manifest.rs'),
    constructors: ['HttpRoute::public', 'HttpRoute::dual_token', 'HttpRoute::backend_admin', 'HttpRoute::api_key'],
  },
  {
    owner: 'iam',
    packageName: 'sdkwork-routes-iam-open-api',
    path: resolve(iamRoot, 'crates/sdkwork-routes-iam-open-api/src/manifest.rs'),
    constructors: [
      'HttpRoute::public',
      'HttpRoute::oauth',
      'HttpRoute::open_api_flexible',
      'HttpRoute::api_key',
    ],
  },
];

const surfaces = {
  app: {
    sdkType: 'app',
    sdkOwner: 'sdkwork-iam',
    familyName: 'sdkwork-iam-app-sdk',
    authorityName: 'sdkwork-iam-app-api',
    title: 'SDKWork IAM App API',
    description: 'App/client contract for sdkwork-iam and foundation modules.',
    prefix: '/app/v3/api',
    audience: 'App, desktop, mobile, H5, and user-facing clients',
  },
  backend: {
    sdkType: 'backend',
    sdkOwner: 'sdkwork-iam',
    familyName: 'sdkwork-iam-backend-sdk',
    authorityName: 'sdkwork-iam-backend-api',
    title: 'SDKWork IAM Backend API',
    description: 'Backend/admin contract for sdkwork-iam and foundation modules.',
    prefix: '/backend/v3/api',
    audience: 'Backend consoles, operators, control-plane integrations, and admin automation',
  },
  open: {
    sdkType: 'open',
    sdkOwner: 'sdkwork-iam',
    familyName: 'sdkwork-iam-open-sdk',
    authorityName: 'sdkwork-iam-open-api',
    title: 'SDKWork IAM Open API',
    description:
      'Public OAuth authorization-server ingress and provider callback contract for sdkwork-iam.',
    prefix: '/iam/v3',
    audience:
      'Public OAuth authorization-server clients, provider callbacks, and open ingress integrations',
  },
};

const publicAppOperationIds = new Set([
  'sessions.create',
  'sessions.loginContextSelection.create',
  'sessions.organizationSelection.create',
  'sessions.refresh',
  'passwordResetRequests.create',
  'passwordResets.create',
  'registrations.create',
  'oauth.authorizationUrls.create',
  'oauth.deviceAuthorizations.create',
  'oauth.deviceAuthorizations.retrieve',
  'oauth.deviceAuthorizations.scans.create',
  'oauth.deviceAuthorizations.passwordCompletions.create',
  'oauth.sessions.create',
  'iam.runtime.retrieve',
  'iam.verificationPolicy.retrieve',
  'iam.accountBindingPolicy.retrieve',
]);

const publicBackendBootstrapOperationIds = new Set([
  'applications.register',
  'tenantApplications.provision',
  'tenantApplications.update',
  'tenantApplications.enable',
  'accessCredentials.create',
]);

const credentialHeaderForbiddenAppOperationIds = new Set([
  'sessions.create',
  'sessions.loginContextSelection.create',
  'sessions.organizationSelection.create',
  'passwordResetRequests.create',
  'passwordResets.create',
  'registrations.create',
  'oauth.deviceAuthorizations.create',
  'oauth.deviceAuthorizations.passwordCompletions.create',
  'oauth.sessions.create',
]);

const methodNames = {
  Get: 'get',
  Post: 'post',
  Patch: 'patch',
  Put: 'put',
  Delete: 'delete',
};

export async function materializeAppbaseV3OpenApiBoundaries() {
  const routes = await collectRoutes();
  const appRoutes = selectRoutes(routes, surfaces.app.prefix);
  const backendRoutes = selectRoutes(routes, surfaces.backend.prefix);
  const openRoutes = selectOpenRoutes(routes);

  if (appRoutes.length === 0) {
    throw new Error('No app-api routes were materialized from Rust route catalogs.');
  }
  if (backendRoutes.length === 0) {
    throw new Error('No backend-api routes were materialized from Rust route catalogs.');
  }
  if (openRoutes.length === 0) {
    throw new Error('No open-api routes were materialized from Rust route catalogs.');
  }

  await writeSurfaceOpenApi(surfaces.app, appRoutes);
  await writeSurfaceOpenApi(surfaces.backend, backendRoutes);
  await writeSurfaceOpenApi(surfaces.open, openRoutes);

  console.log(`Materialized ${appRoutes.length} app-api operations.`);
  console.log(`Materialized ${backendRoutes.length} backend-api operations.`);
  console.log(`Materialized ${openRoutes.length} open-api operations.`);
}

function isDirectExecution() {
  return resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
  await materializeAppbaseV3OpenApiBoundaries();
  const { patchIamAppSdkTypescriptCredentialEntryTransport } = await import(
    './patch-iam-app-sdk-typescript-credential-entry-transport.mjs'
  );
  patchIamAppSdkTypescriptCredentialEntryTransport();
}

async function collectRoutes() {
  const routes = [];
  for (const source of routeSources) {
    const content = await readFile(source.path, 'utf8');
    const constructors = source.constructors
      .map((constructor) => escapeRegExp(constructor))
      .join('|');
    const routePattern = new RegExp(
      `(?:${constructors})\\s*\\(\\s*HttpMethod::(Get|Post|Patch|Put|Delete)\\s*,\\s*"([^"]+)"\\s*,\\s*"([^"]+)"\\s*,\\s*"([^"]+)"\\s*,?\\s*\\)`,
      'g',
    );

    for (const match of content.matchAll(routePattern)) {
      routes.push({
        owner: source.owner,
        routeCrate: source.packageName,
        method: methodNames[match[1]],
        path: match[2],
        tag: toLowerCamel(match[3]),
        operationId: match[4],
        routeKind: resolveRouteKind(match[0]),
      });
    }
  }

  const byKey = new Map();
  for (const route of routes) {
    const key = `${route.method.toUpperCase()} ${route.path}`;
    if (!byKey.has(key)) {
      byKey.set(key, route);
      continue;
    }
    const previous = byKey.get(key);
    if (previous.operationId !== route.operationId || previous.tag !== route.tag) {
      throw new Error(
        `Conflicting route metadata for ${key}: ${previous.operationId}/${previous.tag} vs ${route.operationId}/${route.tag}`,
      );
    }
  }

  return Array.from(byKey.values()).sort(compareRoutes);
}

function selectRoutes(routes, prefix) {
  return routes.filter((route) => route.path.startsWith(`${prefix}/`) || route.path === prefix);
}

function selectOpenRoutes(routes) {
  return routes
    .filter((route) => route.routeCrate === 'sdkwork-routes-iam-open-api')
    .sort(compareRoutes);
}

async function writeSurfaceOpenApi(surface, routes) {
  const authority = buildOpenApi(surface, routes);
  const familyRoot = resolve(iamRoot, 'sdks', surface.familyName);
  const openapiRoot = resolve(familyRoot, 'openapi');
  const apisSurfaceRoot = resolve(
    iamRoot,
    'apis',
    `${surface.sdkType}-api`,
    'iam',
  );
  await mkdir(openapiRoot, { recursive: true });
  await mkdir(apisSurfaceRoot, { recursive: true });

  const authorityPath = resolve(openapiRoot, `${surface.authorityName}.openapi.yaml`);
  const sdkgenPath = resolve(openapiRoot, `${surface.authorityName}.sdkgen.yaml`);
  const flutterSdkgenPath = resolve(openapiRoot, `${surface.authorityName}.flutter.sdkgen.yaml`);
  const apisAuthorityPath = resolve(apisSurfaceRoot, `${surface.authorityName}.openapi.yaml`);
  const content = `${JSON.stringify(authority, null, 2)}\n`;

  await writeFile(authorityPath, content, 'utf8');
  await writeFile(sdkgenPath, content, 'utf8');
  await writeFile(flutterSdkgenPath, content, 'utf8');
  await writeFile(apisAuthorityPath, content, 'utf8');
}

function buildOpenApi(surface, routes) {
  const paths = {};
  for (const route of routes) {
    const pathItem = paths[route.path] ?? {};
    pathItem[route.method] = buildOperation(surface, route);
    paths[route.path] = pathItem;
  }

  const tags = Array.from(new Set(routes.map((route) => route.tag)))
    .sort()
    .map((name) => ({
      name,
      description: `${toTitle(name)} API resources.`,
      'x-sdk-nested-resource-surface': true,
    }));

  return {
    openapi: '3.1.2',
    info: {
      title: surface.title,
      version: '1.0.0',
      description: surface.description,
      'x-sdkwork-api-authority': surface.authorityName,
      'x-sdkwork-sdk-family': surface.familyName,
      'x-sdkwork-audience': surface.audience,
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Local sdkwork-iam runtime',
      },
    ],
    tags,
    security: surface.sdkType === 'open' ? [] : [{ AuthToken: [], AccessToken: [] }],
    paths,
    components: {
      securitySchemes: buildSecuritySchemes(surface),
      schemas: buildSchemas(),
    },
    'x-sdkwork-materialized-from': materializedFromSources(surface).map((source) => ({
      owner: source.owner,
      routeCrate: source.packageName,
      path: relativeForOpenApi(source.path),
    })),
    'x-sdkwork-request-context': buildRequestContext(surface),
  };
}

function buildSecuritySchemes(surface) {
  if (surface.sdkType === 'open') {
    return {
      ApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'SDKWork open-api API key for protected ingress operations.',
      },
      OAuthBearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'OAuth bearer credential for protected open-api operations.',
      },
    };
  }

  return {
    AuthToken: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'SDKWork auth token carried as Authorization: Bearer <auth_token>.',
    },
    AccessToken: {
      type: 'apiKey',
      in: 'header',
      name: 'Access-Token',
      description: 'SDKWork access isolation token.',
    },
  };
}

function buildRequestContext(surface) {
  if (surface.sdkType === 'open') {
    return {
      contextObject: 'WebRequestContext',
      serverRequestId: 'server-owned',
      clientRequestIdHeader: 'forbidden',
      tenantSource: 'ApiKey or OAuthBearer',
      organizationSource: 'ApiKey or OAuthBearer',
      userSource: 'ApiKey or OAuthBearer',
    };
  }

  return {
    contextObject: 'AppRequestContext',
    serverRequestId: 'server-owned',
    clientRequestIdHeader: 'forbidden',
    tenantSource: 'AuthToken + AccessToken',
    organizationSource: 'AuthToken + AccessToken',
    userSource: 'AuthToken + AccessToken',
  };
}

function materializedFromSources(surface) {
  if (surface.sdkType === 'open') {
    return routeSources.filter((source) => source.packageName === 'sdkwork-routes-iam-open-api');
  }
  if (surface.sdkType === 'app') {
    return routeSources.filter((source) => source.packageName === 'sdkwork-routes-iam-app-api');
  }
  if (surface.sdkType === 'backend') {
    return routeSources.filter((source) => source.packageName === 'sdkwork-routes-iam-backend-api');
  }
  return routeSources;
}

function buildOperation(surface, route) {
  const authMode = operationAuthMode(surface, route);
  const operation = {
    tags: [route.tag],
    summary: `${toTitle(route.operationId)}.`,
    operationId: route.operationId,
    parameters: extractPathParameters(route.path),
    responses: {
      200: jsonResponse('Success', '#/components/schemas/AppbaseApiResult'),
      400: problemResponse('Bad request'),
      401: problemResponse('Unauthorized'),
      403: problemResponse('Forbidden'),
      404: problemResponse('Not found'),
      409: problemResponse('Conflict'),
      500: problemResponse('Internal server error'),
    },
    security: resolveOperationSecurity(surface, route),
    'x-sdkwork-auth-mode': authMode,
    'x-sdkwork-forbid-credential-headers': operationForbidsCredentialHeaders(surface, route),
    'x-sdkwork-owner': surface.sdkOwner,
    'x-sdkwork-api-authority': surface.authorityName,
    'x-sdkwork-domain': route.owner,
    'x-sdkwork-resource': route.operationId.split('.').slice(0, -1).join('.'),
    'x-sdkwork-request-context': surface.sdkType === 'open' ? 'WebRequestContext' : 'AppRequestContext',
    'x-sdkwork-server-request-id': true,
  };

  const permission = resolveIamBackendOperationPermission(route.operationId);
  if (permission) {
    operation['x-sdkwork-permission'] = permission;
  }
  if (surface.sdkType === 'backend' && route.routeKind !== 'public') {
    operation['x-sdkwork-required-surface'] = 'organizationMember';
  }

  if (usesJsonBody(route.method)) {
    operation.requestBody = {
      required: route.method !== 'patch',
      content: {
        'application/json': {
          schema: { $ref: requestBodySchemaRef(route) },
        },
      },
    };
  }

  if (isListOperation(route)) {
    operation.parameters.push(
      queryParameter('page', { type: 'integer', minimum: 1, default: 1 }),
      queryParameter('page_size', { type: 'integer', minimum: 1, maximum: 200, default: 20 }),
      queryParameter('cursor', { type: 'string' }),
      queryParameter('sort', { type: 'string' }),
      queryParameter('q', { type: 'string' }),
    );
  }

  return operation;
}

function requestBodySchemaRef(route) {
  if (route.operationId === 'sessions.create') {
    return '#/components/schemas/AppbaseSessionCreateCommand';
  }
  if (route.operationId === 'applications.register') {
    return '#/components/schemas/AppbaseApplicationRegisterCommand';
  }
  if (route.operationId === 'tenantApplications.provision') {
    return '#/components/schemas/AppbaseTenantApplicationProvisionCommand';
  }
  if (route.operationId === 'tenantApplications.update') {
    return '#/components/schemas/AppbaseTenantApplicationUpdateCommand';
  }
  if (route.operationId === 'tenantApplications.enable') {
    return '#/components/schemas/AppbaseTenantApplicationEnableCommand';
  }
  if (route.operationId === 'accessCredentials.create') {
    return '#/components/schemas/AppbaseAccessCredentialCreateCommand';
  }

  return '#/components/schemas/AppbaseOperationCommand';
}

function bootstrapBodyAuthProperties() {
  return {
    authToken: {
      type: 'string',
      description: 'Super-admin auth token used for bootstrap body authentication.',
    },
    username: {
      type: 'string',
      description: 'Super-admin username credential for bootstrap body authentication.',
    },
    email: {
      type: 'string',
      description: 'Super-admin email credential for bootstrap body authentication.',
    },
    phone: {
      type: 'string',
      description: 'Super-admin phone credential for bootstrap body authentication.',
    },
    password: {
      type: 'string',
      format: 'password',
      description: 'Super-admin password credential for bootstrap body authentication.',
    },
  };
}

function buildSchemas() {
  const bootstrapAuth = bootstrapBodyAuthProperties();

  return {
    AppbaseApiResult: {
      type: 'object',
      additionalProperties: false,
      required: ['code', 'message', 'requestId', 'data'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        requestId: {
          type: 'string',
          format: 'uuid',
          description: 'Server-owned request correlation id.',
        },
        data: {
          type: 'object',
          additionalProperties: true,
        },
      },
    },
    AppbaseOperationCommand: {
      type: 'object',
      additionalProperties: true,
      description: 'Operation-specific command payload defined by the owning IAM Rust module.',
    },
    AppbaseSessionCreateCommand: {
      type: 'object',
      additionalProperties: true,
      description: 'Session creation command for credential login and external user-center session exchange.',
      properties: {
        email: {
          type: 'string',
          description: 'Email credential used by standard password login.',
        },
        username: {
          type: 'string',
          description: 'Username credential used by standard password login.',
        },
        phone: {
          type: 'string',
          description: 'Phone credential used by standard password login.',
        },
        password: {
          type: 'string',
          description: 'Write-only password credential used by standard password login.',
          format: 'password',
        },
        externalToken: {
          type: 'string',
          description: 'Opaque upstream credential used only by an external user-center session exchange.',
        },
        providerKey: {
          type: 'string',
          description: 'External authority provider key used to select the configured bridge.',
        },
        tenantId: {
          type: 'string',
          description: 'Verified tenant id supplied by an external user-center session exchange after upstream identity validation.',
        },
        organizationId: {
          type: 'string',
          description: 'Verified organization id supplied by an external user-center session exchange when the upstream identity resolved an organization scope.',
        },
      },
    },
    AppbaseApplicationRegisterCommand: {
      type: 'object',
      additionalProperties: true,
      description: 'Super-admin registered application command for startup bootstrap.',
      required: ['appKey', 'name', 'appType', 'version', 'defaultAccessPermissions'],
      properties: {
        ...bootstrapAuth,
        ownerTenantId: { type: 'string' },
        appKey: { type: 'string' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        appType: { type: 'string' },
        packageName: { type: 'string' },
        bundleId: { type: 'string' },
        desktopAppId: { type: 'string' },
        version: { type: 'string' },
        channel: { type: 'string' },
        manifestHash: { type: 'string' },
        defaultAccessPermissions: {
          type: 'array',
          minItems: 1,
          items: { type: 'string' },
        },
        config: { type: 'object', additionalProperties: true },
        packages: {
          type: 'array',
          items: { type: 'object', additionalProperties: true },
        },
      },
    },
    AppbaseTenantApplicationProvisionCommand: {
      type: 'object',
      additionalProperties: true,
      description: 'Provision a tenant application from a registered application template.',
      required: ['tenantId', 'organizationId', 'instanceKey', 'displayName', 'environment'],
      properties: {
        ...bootstrapAuth,
        tenantId: { type: 'string' },
        organizationId: { type: 'string' },
        templateId: { type: 'string' },
        appKey: { type: 'string' },
        instanceKey: { type: 'string' },
        displayName: { type: 'string' },
        environment: { type: 'string' },
        primaryDomain: { type: 'string' },
        accessPermissions: {
          type: 'array',
          items: { type: 'string' },
        },
        runtimeConfig: { type: 'object', additionalProperties: true },
      },
    },
    AppbaseTenantApplicationUpdateCommand: {
      type: 'object',
      additionalProperties: true,
      description: 'Update tenant application access and runtime configuration.',
      properties: {
        ...bootstrapAuth,
        primaryDomain: { type: 'string' },
        domainConfig: { type: 'object', additionalProperties: true },
        accessPermissions: {
          type: 'array',
          items: { type: 'string' },
        },
        runtimeConfig: { type: 'object', additionalProperties: true },
      },
    },
    AppbaseTenantApplicationEnableCommand: {
      type: 'object',
      additionalProperties: true,
      description: 'Enable a provisioned tenant application before access credential issuance.',
      properties: {
        ...bootstrapAuth,
      },
    },
    AppbaseAccessCredentialCreateCommand: {
      type: 'object',
      additionalProperties: true,
      description: 'Issue a delegated access credential for an enabled tenant application.',
      required: ['tenantId', 'organizationId'],
      properties: {
        ...bootstrapAuth,
        tenantId: { type: 'string' },
        organizationId: { type: 'string' },
        tenantApplicationId: { type: 'string' },
        appId: { type: 'string' },
        instanceKey: { type: 'string' },
      },
    },
    ProblemDetail: {
      type: 'object',
      additionalProperties: true,
      required: ['type', 'title', 'status'],
      properties: {
        type: { type: 'string', format: 'uri-reference' },
        title: { type: 'string' },
        status: { type: 'integer', minimum: 100, maximum: 599 },
        detail: { type: 'string' },
        instance: { type: 'string' },
        code: { type: 'string' },
        traceId: { type: 'string' },
        requestId: {
          type: 'string',
          format: 'uuid',
          description: 'Server-owned request correlation id.',
        },
        errors: {
          type: 'array',
          items: { $ref: '#/components/schemas/FieldError' },
        },
      },
    },
    FieldError: {
      type: 'object',
      additionalProperties: false,
      required: ['field', 'message'],
      properties: {
        field: { type: 'string' },
        message: { type: 'string' },
        code: { type: 'string' },
      },
    },
  };
}

function jsonResponse(description, schemaRef) {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: schemaRef },
      },
    },
  };
}

function problemResponse(description) {
  return {
    description,
    content: {
      'application/problem+json': {
        schema: { $ref: '#/components/schemas/ProblemDetail' },
      },
    },
  };
}

function extractPathParameters(path) {
  const parameters = [];
  for (const match of path.matchAll(/\{([^}]+)\}/g)) {
    parameters.push({
      name: match[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
    });
  }
  return parameters;
}

function queryParameter(name, schema) {
  return {
    name,
    in: 'query',
    required: false,
    schema,
  };
}

function routeIsPublic(surface, route) {
  if (surface.sdkType === 'open') {
    return route.routeKind === 'open_api_flexible' || route.routeKind === 'public';
  }
  if (surface.sdkType === 'backend' && route.routeKind === 'public') {
    return publicBackendBootstrapOperationIds.has(route.operationId);
  }
  return surface.sdkType === 'app' && publicAppOperationIds.has(route.operationId);
}

function operationAuthMode(surface, route) {
  if (surface.sdkType === 'open') {
    if (route.routeKind === 'api_key') {
      return 'api-key';
    }
    if (route.routeKind === 'oauth') {
      return 'oauth';
    }
    if (route.routeKind === 'open_api_flexible') {
      return routeIsPublic(surface, route) ? 'anonymous' : 'open-api-flexible';
    }
    return 'anonymous';
  }
  if (surface.sdkType === 'backend' && publicBackendBootstrapOperationIds.has(route.operationId)) {
    return 'bootstrap-body';
  }
  if (surface.sdkType === 'app' && route.routeKind === 'credential_entry_public') {
    return 'credential-entry-bootstrap';
  }
  if (surface.sdkType === 'app' && publicAppOperationIds.has(route.operationId)) {
    return route.operationId === 'sessions.refresh' ? 'refresh-token' : 'anonymous';
  }
  return 'dual-token';
}

function resolveOperationSecurity(surface, route) {
  if (routeIsPublic(surface, route)) {
    return [];
  }
  if (surface.sdkType === 'open') {
    if (route.routeKind === 'oauth') {
      return [{ OAuthBearer: [] }];
    }
    if (route.routeKind === 'api_key') {
      return [{ ApiKey: [] }];
    }
    return [{ ApiKey: [], OAuthBearer: [] }];
  }
  return [{ AuthToken: [], AccessToken: [] }];
}

function resolveRouteKind(routeExpression) {
  if (routeExpression.includes('HttpRoute::open_api_flexible')) {
    return 'open_api_flexible';
  }
  if (routeExpression.includes('HttpRoute::api_key')) {
    return 'api_key';
  }
  if (routeExpression.includes('HttpRoute::credential_entry_public')) {
    return 'credential_entry_public';
  }
  if (routeExpression.includes('HttpRoute::public')) {
    return 'public';
  }
  if (routeExpression.includes('HttpRoute::oauth')) {
    return 'oauth';
  }
  if (routeExpression.includes('HttpRoute::dual_token')) {
    return 'dual_token';
  }
  if (routeExpression.includes('HttpRoute::backend_admin')) {
    return 'backend_admin';
  }
  return 'unknown';
}

function operationForbidsCredentialHeaders(surface, route) {
  if (surface.sdkType === 'app' && credentialHeaderForbiddenAppOperationIds.has(route.operationId)) {
    return true;
  }
  return surface.sdkType === 'backend' && publicBackendBootstrapOperationIds.has(route.operationId);
}

function usesJsonBody(method) {
  return method === 'post' || method === 'put' || method === 'patch';
}

function isListOperation(route) {
  return route.method === 'get' && route.operationId.endsWith('.list');
}

function compareRoutes(left, right) {
  return left.path.localeCompare(right.path) || left.method.localeCompare(right.method);
}

function toLowerCamel(value) {
  const parts = String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return 'api';
  }
  const [first, ...rest] = parts;
  return [
    first.charAt(0).toLowerCase() + first.slice(1),
    ...rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)),
  ].join('');
}

function toTitle(value) {
  return String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

function relativeForOpenApi(path) {
  return path.replace(iamRoot, '<sdkwork-iam>').replace(/\\/g, '/');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
