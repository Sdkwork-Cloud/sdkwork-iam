import { customApiPath } from './paths';
import type { HttpClient } from '../http/client';

import type { AppbaseOperationCommand, IamOauthProviderCallbacksCreateRequest, IamOauthProviderCallbacksCreateResponse } from '../types';


export class IamOauthIamOauthOpenidConfigurationApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth openid Configuration retrieve. */
  async retrieve(): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(customApiPath(`/system/oauth/openid_configuration`), { method: 'GET' as any, skipAuth: true });
  }
}

export class IamOauthIamOauthAuthorizationServerMetadataApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth authorization Server Metadata retrieve. */
  async retrieve(): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(customApiPath(`/system/oauth/authorization_server_metadata`), { method: 'GET' as any, skipAuth: true });
  }
}

export class IamOauthIamOauthUserinfoApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth userinfo retrieve. */
  async retrieve(): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(customApiPath(`/oauth/userinfo`), { method: 'GET' as any, skipAuth: true });
  }
}

export class IamOauthIamOauthTokenApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth token create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(customApiPath(`/oauth/token`), { method: 'POST' as any, body, contentType: 'application/json', skipAuth: true });
  }
}

export class IamOauthIamOauthRevokeApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth revoke create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(customApiPath(`/oauth/revoke`), { method: 'POST' as any, body, contentType: 'application/json', skipAuth: true });
  }
}

export interface IamOauthIamOauthProviderCallbacksRetrieveParams {
  signature?: string;
  timestamp?: string;
  nonce?: string;
  echostr?: string;
}

export interface IamOauthIamOauthProviderCallbacksCreateParams {
  signature?: string;
  msgSignature?: string;
  timestamp?: string;
  nonce?: string;
}

export class IamOauthIamOauthProviderCallbacksApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth provider Callbacks retrieve. */
  async retrieve(callbackPublicId: string, params?: IamOauthIamOauthProviderCallbacksRetrieveParams): Promise<string> {
    const query = buildQueryString([
      { name: 'signature', value: params?.signature, style: 'form', explode: true, allowReserved: false },
      { name: 'timestamp', value: params?.timestamp, style: 'form', explode: true, allowReserved: false },
      { name: 'nonce', value: params?.nonce, style: 'form', explode: true, allowReserved: false },
      { name: 'echostr', value: params?.echostr, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<string>(appendQueryString(customApiPath(`/oauth/provider_callbacks/${serializePathParameter(callbackPublicId, { name: 'callbackPublicId', style: 'simple', explode: false })}`), query), { method: 'GET' as any, skipAuth: true });
  }

/** Iam oauth provider Callbacks create. */
  async create(callbackPublicId: string, body: IamOauthProviderCallbacksCreateRequest, params?: IamOauthIamOauthProviderCallbacksCreateParams): Promise<IamOauthProviderCallbacksCreateResponse> {
    const query = buildQueryString([
      { name: 'signature', value: params?.signature, style: 'form', explode: true, allowReserved: false },
      { name: 'msg_signature', value: params?.msgSignature, style: 'form', explode: true, allowReserved: false },
      { name: 'timestamp', value: params?.timestamp, style: 'form', explode: true, allowReserved: false },
      { name: 'nonce', value: params?.nonce, style: 'form', explode: true, allowReserved: false },
    ]);
    return this.client.request<IamOauthProviderCallbacksCreateResponse>(appendQueryString(customApiPath(`/oauth/provider_callbacks/${serializePathParameter(callbackPublicId, { name: 'callbackPublicId', style: 'simple', explode: false })}`), query), { method: 'POST' as any, body, contentType: 'application/json', skipAuth: true });
  }
}

export class IamOauthIamOauthJwksApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth jwks retrieve. */
  async retrieve(): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(customApiPath(`/oauth/jwks`), { method: 'GET' as any, skipAuth: true });
  }
}

export class IamOauthIamOauthIntrospectApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth introspect create. */
  async create(body: AppbaseOperationCommand): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(customApiPath(`/oauth/introspect`), { method: 'POST' as any, body, contentType: 'application/json', skipAuth: true });
  }
}

export class IamOauthIamOauthAuthorizeApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }


/** Iam oauth authorize handle Get. */
  async handleGet(): Promise<Record<string, unknown>> {
    return this.client.request<Record<string, unknown>>(customApiPath(`/oauth/authorize`), { method: 'GET' as any, skipAuth: true });
  }
}

export class IamOauthIamOauthApi {
  private client: HttpClient;
  public readonly authorize: IamOauthIamOauthAuthorizeApi;
  public readonly introspect: IamOauthIamOauthIntrospectApi;
  public readonly jwks: IamOauthIamOauthJwksApi;
  public readonly providerCallbacks: IamOauthIamOauthProviderCallbacksApi;
  public readonly revoke: IamOauthIamOauthRevokeApi;
  public readonly token: IamOauthIamOauthTokenApi;
  public readonly userinfo: IamOauthIamOauthUserinfoApi;
  public readonly authorizationServerMetadata: IamOauthIamOauthAuthorizationServerMetadataApi;
  public readonly openidConfiguration: IamOauthIamOauthOpenidConfigurationApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.authorize = new IamOauthIamOauthAuthorizeApi(client);
    this.introspect = new IamOauthIamOauthIntrospectApi(client);
    this.jwks = new IamOauthIamOauthJwksApi(client);
    this.providerCallbacks = new IamOauthIamOauthProviderCallbacksApi(client);
    this.revoke = new IamOauthIamOauthRevokeApi(client);
    this.token = new IamOauthIamOauthTokenApi(client);
    this.userinfo = new IamOauthIamOauthUserinfoApi(client);
    this.authorizationServerMetadata = new IamOauthIamOauthAuthorizationServerMetadataApi(client);
    this.openidConfiguration = new IamOauthIamOauthOpenidConfigurationApi(client);
  }

}

export class IamOauthIamApi {
  private client: HttpClient;
  public readonly oauth: IamOauthIamOauthApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.oauth = new IamOauthIamOauthApi(client);
  }

}

export class IamOauthApi {
  private client: HttpClient;
  public readonly iam: IamOauthIamApi;

  constructor(client: HttpClient) {
    this.client = client;
    this.iam = new IamOauthIamApi(client);
  }

}

export function createIamOauthApi(client: HttpClient): IamOauthApi {
  return new IamOauthApi(client);
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
