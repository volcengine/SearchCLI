// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import './node-bootstrap';
import { Signer } from '@volcengine/openapi';
import { formatMissingVikingAuthMessage, formatMissingVikingControlPlaneAuthMessage } from './auth-errors';
import type { ServiceConfig } from './service-config';
import { debugLog } from './debug-logger';

const DEFAULT_OPENAPI_VERSION = '2025-03-01';
type SignedHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number | undefined,
    readonly apiCode: string | undefined,
    readonly apiMessage: string | undefined,
    readonly responseBody: unknown
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function postJson<T = unknown>(
  config: ServiceConfig,
  pathname: string,
  payload: unknown
): Promise<T> {
  return requestJson<T>(config, 'POST', pathname, payload);
}

export async function requestJson<T = unknown>(
  config: ServiceConfig,
  method: SignedHttpMethod,
  pathname: string,
  payload?: unknown,
  params?: Record<string, string>
): Promise<T> {
  const baseUrl = config.dataPlaneBaseUrl.replace(/\/+$/, '');
  const pathName = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const url = new URL(`${baseUrl}${pathName}`);
  appendQueryParams(url, params);
  return sendSignedJson<T>(config, method, url, payload, false);
}

export async function postOpenApiJson<T = unknown>(
  config: ServiceConfig,
  pathname: string,
  payload: unknown
): Promise<T> {
  return requestOpenApiJson<T>(config, 'POST', pathname, payload);
}

export async function requestOpenApiJson<T = unknown>(
  config: ServiceConfig,
  method: SignedHttpMethod,
  pathname: string,
  payload?: unknown,
  params?: Record<string, string>
): Promise<T> {
  const translated = translateOpenApiPath(config, pathname, params);
  if (!translated) {
    return requestJson<T>(config, method, pathname, payload, params);
  }

  return sendSignedJson<T>(config, method, translated, withDefaultProjectName(payload, config.projectName), true);
}

async function sendSignedJson<T = unknown>(
  config: ServiceConfig,
  method: SignedHttpMethod,
  url: URL,
  payload: unknown,
  includeControlPlaneHeaders: boolean
): Promise<T> {
  const body = shouldSendBody(method, payload) ? JSON.stringify(payload ?? {}) : undefined;
  const timeoutSignal = AbortSignal.timeout(config.timeoutMs);

  debugLog('HTTP Request', `${method} ${url.toString()}`);
  if (body) {
    debugLog('HTTP Request Body', body);
  }

  const response = await fetch(url, {
    method,
    headers: await buildHeaders(config, method, url, body, includeControlPlaneHeaders),
    body,
    signal: timeoutSignal
  });

  const rawText = await response.text();
  const parsed = parseMaybeJson(rawText);

  debugLog('HTTP Response', `Status: ${response.status} ${response.statusText}`);
  debugLog('HTTP Response Body', typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2));

  if (!response.ok) {
    const apiError = extractResponseMetadataError(parsed);
    console.error(
      `[HTTP Error] Method: ${method} URL: ${url.toString()}\nPayload: ${body}\nResponse: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)}`
    );
    throw new ApiRequestError(
      `Request failed: ${response.status} ${response.statusText}${apiError ? ` [${apiError.code}]: ${apiError.message}` : ''}`,
      response.status,
      apiError?.code,
      apiError?.message,
      parsed
    );
  }

  // Detect logical errors returned in the OpenApi wrapper even if HTTP status is 200 OK
  const apiError = extractResponseMetadataError(parsed);
  if (apiError) {
    throw new ApiRequestError(
      `API Error [${apiError.code}]: ${apiError.message}`,
      response.status,
      apiError.code,
      apiError.message,
      parsed
    );
  }

  return parsed as T;
}

function translateOpenApiPath(config: ServiceConfig, pathname: string, params?: Record<string, string>): URL | undefined {
  let action: string | undefined;
  let searchParams: URLSearchParams | undefined;

  if (/^[A-Za-z][A-Za-z0-9_]*$/.test(pathname)) {
    action = pathname;
  } else {
    const parsedPath = new URL(pathname, 'https://placeholder.local');
    const matched = parsedPath.pathname.match(/^(?:\/open|\/api\/v1)\/([^/]+)\/?$/);
    if (!matched) return undefined;
    action = matched[1];
    searchParams = parsedPath.searchParams;
  }

  const url = new URL(config.controlPlaneBaseUrl);
  url.searchParams.set('Action', action);
  url.searchParams.set('Version', DEFAULT_OPENAPI_VERSION);
  url.searchParams.set('Region', config.region);

  if (searchParams) {
    for (const [key, value] of searchParams.entries()) {
      url.searchParams.set(key, value);
    }
  }
  if (params) {
    appendQueryParams(url, params);
  }

  return url;
}

async function buildHeaders(
  config: ServiceConfig,
  method: SignedHttpMethod,
  url: URL,
  body: string | undefined,
  includeControlPlaneHeaders: boolean
): Promise<Record<string, string>> {
  const signedHost = resolveSignedHost(config, url);
  const headers = createBaseHeaders();
  if (includeControlPlaneHeaders && config.xTtBackend) {
    headers['x-tt-backend'] = config.xTtBackend;
  }
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
  }

  if (!includeControlPlaneHeaders && config.apiKey) {
    return buildApiKeyRequestHeaders(config.apiKey, headers);
  }

  if (config.accessKeyId && config.secretKey) {
    headers.host = signedHost;
    const signer = new Signer(
      {
        region: config.region,
        method,
        pathname: url.pathname,
        params: Object.fromEntries(url.searchParams.entries()),
        headers,
        body: body ?? ''
      },
      config.service
    );

    signer.addAuthorization({
      accessKeyId: config.accessKeyId,
      secretKey: config.secretKey,
      sessionToken: ''
    });

    return headers;
  }

  throw new Error(includeControlPlaneHeaders ? formatMissingVikingControlPlaneAuthMessage() : formatMissingVikingAuthMessage());
}

export function buildSignedRequestHeaders(
  config: Pick<ServiceConfig, 'apiKey' | 'accessKeyId' | 'secretKey' | 'region' | 'service' | 'dataPlaneBaseUrl' | 'dataPlaneHost'>,
  method: SignedHttpMethod,
  url: URL,
  body?: string,
  initialHeaders?: Record<string, string>
): Record<string, string> {
  if (config.apiKey) {
    return buildApiKeyRequestHeaders(config.apiKey, initialHeaders);
  }

  if (!config.accessKeyId || !config.secretKey) {
    throw new Error(formatMissingVikingAuthMessage());
  }

  const headers: Record<string, string> = {
    ...createBaseHeaders(),
    ...initialHeaders,
    host: resolveSignedHost(config, url)
  };

  const signer = new Signer(
    {
      region: config.region,
      method,
      pathname: url.pathname,
      params: Object.fromEntries(url.searchParams.entries()),
      headers,
      body: body ?? ''
    },
    config.service
  );

  signer.addAuthorization({
    accessKeyId: config.accessKeyId,
    secretKey: config.secretKey,
    sessionToken: ''
  });

  return headers;
}

export function buildApiKeyRequestHeaders(apiKey: string, initialHeaders?: Record<string, string>): Record<string, string> {
  return {
    ...createBaseHeaders(),
    ...initialHeaders,
    authorization: `Bearer ${apiKey}`
  };
}

function createBaseHeaders(): Record<string, string> {
  return {
    accept: 'application/json',
    'user-agent': 'Search-Cli'
  };
}

function parseMaybeJson(rawText: string): unknown {
  const trimmed = rawText.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return rawText;
  }
}

function extractResponseMetadataError(value: unknown): { code: string; message: string } | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const metadata = (value as Record<string, unknown>).ResponseMetadata;
  if (!metadata || typeof metadata !== 'object') return undefined;
  const error = (metadata as Record<string, unknown>).Error;
  if (!error || typeof error !== 'object') return undefined;
  const code = (error as Record<string, unknown>).Code;
  const message = (error as Record<string, unknown>).Message;
  return {
    code: typeof code === 'string' && code ? code : 'UnknownError',
    message: typeof message === 'string' && message ? message : 'An unknown API error occurred.'
  };
}

function appendQueryParams(url: URL, params?: Record<string, string>): void {
  if (!params) return;
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
}

function shouldSendBody(method: SignedHttpMethod, payload: unknown): boolean {
  if (payload === undefined) return false;
  return method !== 'GET' && method !== 'DELETE';
}

function withDefaultProjectName(payload: unknown, projectName: string): unknown {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  const currentProjectName = (payload as Record<string, unknown>).ProjectName;
  if (typeof currentProjectName === 'string' && currentProjectName.trim().length > 0) {
    return payload;
  }
  return {
    ...(payload as Record<string, unknown>),
    ProjectName: projectName
  };
}

function resolveSignedHost(
  config: Pick<ServiceConfig, 'dataPlaneBaseUrl' | 'dataPlaneHost'>,
  url: URL
): string {
  if (isDataPlaneRequest(config.dataPlaneBaseUrl, url) && config.dataPlaneHost) {
    return config.dataPlaneHost;
  }
  return url.host;
}

function isDataPlaneRequest(dataPlaneBaseUrl: string, url: URL): boolean {
  return normalizeOrigin(dataPlaneBaseUrl) === normalizeOrigin(url);
}

function normalizeOrigin(input: string | URL): string {
  return new URL(input).origin.replace(/\/+$/, '').toLowerCase();
}
