import { appApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { AppbaseOperationCommand, SdkWorkPageData, WechatMiniProgramSessionCreateCommand } from '../types';


export class OauthSessionsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Oauth sessions create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/oauth/sessions`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }
}

export interface OauthProvidersListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class OauthProvidersApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Oauth providers list. */
  async list(params?: OauthProvidersListParams): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<SdkWorkPageData>(appendQueryString(appApiPath(`/oauth/providers`), query));
  }
}

export class OauthMiniProgramSessionsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Oauth mini Program Sessions create. */
  async create(body: WechatMiniProgramSessionCreateCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/oauth/mini_program_sessions`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }
}

export interface OauthGrantsListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class OauthGrantsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Oauth grants list. */
  async list(params?: OauthGrantsListParams): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<SdkWorkPageData>(appendQueryString(appApiPath(`/oauth/grants`), query));
  }

/** Oauth grants delete. */
  async delete(grantId: string): Promise<void> {
    return this.client.delete<void>(appApiPath(`/oauth/grants/${serializePathParameter(grantId, { name: 'grantId', style: 'simple', explode: false })}`));
  }
}

export class OauthDeviceAuthorizationsSessionExchangesApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Oauth device Authorizations session Exchanges create. */
  async create(deviceAuthorizationId: string, body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/oauth/device_authorizations/${serializePathParameter(deviceAuthorizationId, { name: 'deviceAuthorizationId', style: 'simple', explode: false })}/session_exchanges`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }
}

export class OauthDeviceAuthorizationsScansApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Oauth device Authorizations scans create. */
  async create(deviceAuthorizationId: string, body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/oauth/device_authorizations/${serializePathParameter(deviceAuthorizationId, { name: 'deviceAuthorizationId', style: 'simple', explode: false })}/scans`), { method: 'POST' as any, body, contentType: 'application/json', skipAuth: true });
  }
}

export class OauthDeviceAuthorizationsPasswordCompletionsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Oauth device Authorizations password Completions create. */
  async create(deviceAuthorizationId: string, body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/oauth/device_authorizations/${serializePathParameter(deviceAuthorizationId, { name: 'deviceAuthorizationId', style: 'simple', explode: false })}/password_completions`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }
}

export class OauthDeviceAuthorizationsApi {
  private client: HttpClient;
  public readonly passwordCompletions: OauthDeviceAuthorizationsPasswordCompletionsApi;
  public readonly scans: OauthDeviceAuthorizationsScansApi;
  public readonly sessionExchanges: OauthDeviceAuthorizationsSessionExchangesApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.passwordCompletions = new OauthDeviceAuthorizationsPasswordCompletionsApi(client);
    this.scans = new OauthDeviceAuthorizationsScansApi(client);
    this.sessionExchanges = new OauthDeviceAuthorizationsSessionExchangesApi(client);
  }


/** Oauth device Authorizations create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/oauth/device_authorizations`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }

/** Oauth device Authorizations retrieve. */
  async retrieve(deviceAuthorizationId: string): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/oauth/device_authorizations/${serializePathParameter(deviceAuthorizationId, { name: 'deviceAuthorizationId', style: 'simple', explode: false })}`), { method: 'GET' as any, skipAuth: true });
  }
}

export class OauthCallbacksApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Oauth callbacks retrieve. */
  async retrieve(providerCode: string): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/oauth/callbacks/${serializePathParameter(providerCode, { name: 'providerCode', style: 'simple', explode: false })}`), { method: 'GET' as any, credentialEntryBootstrap: true });
  }

/** Oauth callbacks create. */
  async create(providerCode: string, body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/oauth/callbacks/${serializePathParameter(providerCode, { name: 'providerCode', style: 'simple', explode: false })}`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }
}

export class OauthAuthorizationsCompletionsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Oauth authorizations completions create. */
  async create(authorizationStateId: string, body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/oauth/authorizations/${serializePathParameter(authorizationStateId, { name: 'authorizationStateId', style: 'simple', explode: false })}/completions`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }
}

export class OauthAuthorizationsApi {
  private client: HttpClient;
  public readonly completions: OauthAuthorizationsCompletionsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.completions = new OauthAuthorizationsCompletionsApi(client);
  }

}

export class OauthAuthorizationUrlsApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Oauth authorization Urls create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(appApiPath(`/oauth/authorization_urls`), { method: 'POST' as any, body, contentType: 'application/json', credentialEntryBootstrap: true });
  }
}

export interface OauthAccountLinksListParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sort?: string;
  q?: string;
}

export class OauthAccountLinksApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Oauth account Links list. */
  async list(params?: OauthAccountLinksListParams): Promise<SdkWorkPageData> {
    const query = buildQueryString([
      { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
      { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
      { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
      { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
      { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.get<SdkWorkPageData>(appendQueryString(appApiPath(`/oauth/account_links`), query));
  }

/** Oauth account Links delete. */
  async delete(accountLinkId: string): Promise<void> {
    return this.client.delete<void>(appApiPath(`/oauth/account_links/${serializePathParameter(accountLinkId, { name: 'accountLinkId', style: 'simple', explode: false })}`));
  }
}

export class OauthApi {
  private client: HttpClient;
  public readonly accountLinks: OauthAccountLinksApi;
  public readonly authorizationUrls: OauthAuthorizationUrlsApi;
  public readonly authorizations: OauthAuthorizationsApi;
  public readonly callbacks: OauthCallbacksApi;
  public readonly deviceAuthorizations: OauthDeviceAuthorizationsApi;
  public readonly grants: OauthGrantsApi;
  public readonly miniProgramSessions: OauthMiniProgramSessionsApi;
  public readonly providers: OauthProvidersApi;
  public readonly sessions: OauthSessionsApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.accountLinks = new OauthAccountLinksApi(client);
    this.authorizationUrls = new OauthAuthorizationUrlsApi(client);
    this.authorizations = new OauthAuthorizationsApi(client);
    this.callbacks = new OauthCallbacksApi(client);
    this.deviceAuthorizations = new OauthDeviceAuthorizationsApi(client);
    this.grants = new OauthGrantsApi(client);
    this.miniProgramSessions = new OauthMiniProgramSessionsApi(client);
    this.providers = new OauthProvidersApi(client);
    this.sessions = new OauthSessionsApi(client);
  }

}

export function createOauthApi(client: HttpClient): OauthApi {
  return new OauthApi(client);
}

function appendQueryString(path: string, rawQueryString: string): string {
  const query = rawQueryString.replace(/^\?+/, '');
  if (!query) {
    return path;
  }
  return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}

interface PathParameterSpec {
  name: string;
  style: string;
  explode: boolean;
}

function serializePathParameter(value: unknown, spec: PathParameterSpec): string {
  if (value === undefined || value === null) {
    return '';
  }

  const style = spec.style || 'simple';
  if (Array.isArray(value)) {
    return serializePathArray(spec.name, value, style, spec.explode);
  }
  if (typeof value === 'object') {
    return serializePathObject(spec.name, value as Record<string, unknown>, style, spec.explode);
  }
  return pathPrefix(spec.name, style, false) + encodePathValue(serializePathPrimitive(value));
}

function serializePathArray(name: string, values: unknown[], style: string, explode: boolean): string {
  const serialized = values
    .filter((item) => item !== undefined && item !== null)
    .map((item) => encodePathValue(serializePathPrimitive(item)));
  if (serialized.length === 0) {
    return pathPrefix(name, style, false);
  }
  if (style === 'matrix') {
    return explode
      ? serialized.map((item) => `;${name}=${item}`).join('')
      : `;${name}=${serialized.join(',')}`;
  }
  return pathPrefix(name, style, false) + serialized.join(explode ? '.' : ',');
}

function serializePathObject(name: string, value: Record<string, unknown>, style: string, explode: boolean): string {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return pathPrefix(name, style, true);
  }
  if (style === 'matrix') {
    return explode
      ? entries.map(([key, entryValue]) => `;${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join('')
      : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',')}`;
  }
  const serialized = explode
    ? entries.map(([key, entryValue]) => `${encodePathValue(key)}=${encodePathValue(serializePathPrimitive(entryValue))}`).join(style === 'label' ? '.' : ',')
    : entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',');
  return pathPrefix(name, style, true) + serialized;
}

function pathPrefix(name: string, style: string, _objectValue: boolean): string {
  if (style === 'label') return '.';
  if (style === 'matrix') return `;${name}`;
  return '';
}

function encodePathValue(value: string): string {
  return encodeURIComponent(value);
}

function serializePathPrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
interface QueryParameterSpec {
  name: string;
  value: unknown;
  style: string;
  explode: boolean;
  allowReserved: boolean;
  contentType?: string;
}

function buildQueryString(parameters: QueryParameterSpec[]): string {
  const pairs: string[] = [];
  for (const parameter of parameters) {
    appendSerializedParameter(pairs, parameter);
  }
  return pairs.join('&');
}

function appendSerializedParameter(pairs: string[], parameter: QueryParameterSpec): void {
  if (parameter.value === undefined || parameter.value === null) {
    return;
  }

  if (parameter.contentType) {
    pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(JSON.stringify(parameter.value), parameter.allowReserved)}`);
    return;
  }

  const style = parameter.style || 'form';
  if (style === 'deepObject') {
    appendDeepObjectParameter(pairs, parameter.name, parameter.value, parameter.allowReserved);
    return;
  }

  if (Array.isArray(parameter.value)) {
    appendArrayParameter(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
    return;
  }

  if (typeof parameter.value === 'object') {
    appendObjectParameter(pairs, parameter.name, parameter.value as Record<string, unknown>, style, parameter.explode, parameter.allowReserved);
    return;
  }

  pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(serializePrimitive(parameter.value), parameter.allowReserved)}`);
}

function appendArrayParameter(
  pairs: string[],
  name: string,
  value: unknown[],
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
  const values = value
    .filter((item) => item !== undefined && item !== null)
    .map((item) => serializePrimitive(item));
  if (values.length === 0) {
    return;
  }

  if (style === 'form' && explode) {
    for (const item of values) {
      pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(item, allowReserved)}`);
    }
    return;
  }

  pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(values.join(','), allowReserved)}`);
}

function appendObjectParameter(
  pairs: string[],
  name: string,
  value: Record<string, unknown>,
  style: string,
  explode: boolean,
  allowReserved: boolean,
): void {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
  if (entries.length === 0) {
    return;
  }

  if (style === 'form' && explode) {
    for (const [key, entryValue] of entries) {
      pairs.push(`${encodeQueryComponent(key)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
    }
    return;
  }

  const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive(entryValue)]).join(',');
  pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serialized, allowReserved)}`);
}

function appendDeepObjectParameter(
  pairs: string[],
  name: string,
  value: unknown,
  allowReserved: boolean,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serializePrimitive(value), allowReserved)}`);
    return;
  }

  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    if (entryValue === undefined || entryValue === null) {
      continue;
    }
    pairs.push(`${encodeQueryComponent(`${name}[${key}]`)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
  }
}

function serializePrimitive(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function encodeQueryComponent(value: string): string {
  return encodeURIComponent(value);
}

function encodeQueryValue(value: string, allowReserved: boolean): string {
  const encoded = encodeURIComponent(value);
  if (!allowReserved) {
    return encoded;
  }
  return encoded.replace(/%3A/gi, ':')
    .replace(/%2F/gi, '/')
    .replace(/%3F/gi, '?')
    .replace(/%23/gi, '#')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
    .replace(/%40/gi, '@')
    .replace(/%21/gi, '!')
    .replace(/%24/gi, '$')
    .replace(/%26/gi, '&')
    .replace(/%27/gi, "'")
    .replace(/%28/gi, '(')
    .replace(/%29/gi, ')')
    .replace(/%2A/gi, '*')
    .replace(/%2B/gi, '+')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
    .replace(/%3D/gi, '=');
}
