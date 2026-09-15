// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import './node-bootstrap';
import type { ServiceConfig } from './service-config';

const VOLC_OPENAPI_HOST = 'https://open.volcengineapi.com';
const DEFAULT_OPENAPI_VERSION = '2025-03-01';
type SignedHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  const pathName = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const url = new URL(`${baseUrl}${pathName}`);
  appendQueryParams(url, params);
  return sendSignedJson<T>(config, method, url, payload);
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

  return sendSignedJson<T>(config, method, translated, withDefaultProjectName(payload, config.projectName));
}

async function sendSignedJson<T = unknown>(
  config: ServiceConfig,
  method: SignedHttpMethod,
  url: URL,
  payload?: unknown
): Promise<T> {
  const body = shouldSendBody(method, payload) ? JSON.stringify(payload ?? {}) : undefined;
  const timeoutSignal = AbortSignal.timeout(config.timeoutMs);

  const response = await fetch(url, {
    method,
    headers: await buildHeaders(config, method, url, body),
    body,
    signal: timeoutSignal
  });

  const rawText = await response.text();
  const parsed = parseMaybeJson(rawText);
  if (!response.ok) {
    console.error(
      `[HTTP Error] Method: ${method} URL: ${url.toString()}\nPayload: ${body}\nResponse: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)}`
    );
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}\n${typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)}`
    );
  }

  // Detect logical errors returned in the OpenApi wrapper even if HTTP status is 200 OK
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'ResponseMetadata' in parsed &&
    typeof (parsed as any).ResponseMetadata === 'object' &&
    (parsed as any).ResponseMetadata !== null &&
    'Error' in (parsed as any).ResponseMetadata &&
    (parsed as any).ResponseMetadata.Error !== null
  ) {
    const apiError = (parsed as any).ResponseMetadata.Error;
    const code = apiError.Code || 'UnknownError';
    const message = apiError.Message || 'An unknown API error occurred.';
    throw new Error(`API Error [${code}]: ${message}\nPayload: ${body}`);
  }

  return parsed as T;
}

function translateOpenApiPath(config: ServiceConfig, pathname: string, params?: Record<string, string>): URL | undefined {
  const parsedPath = new URL(pathname, 'https://placeholder.local');
  const matched = parsedPath.pathname.match(/^(?:\/open|\/api\/v1)\/([^/]+)\/?$/);
  if (!matched) return undefined;
  if (!shouldUseVolcOpenApiGateway(config.baseUrl)) return undefined;

  const [, action] = matched;
  const url = new URL(VOLC_OPENAPI_HOST);
  url.searchParams.set('Action', action);
  url.searchParams.set('Version', DEFAULT_OPENAPI_VERSION);
  url.searchParams.set('Region', config.region);

  for (const [key, value] of parsedPath.searchParams.entries()) {
    url.searchParams.set(key, value);
  }
  if (params) {
    appendQueryParams(url, params);
  }

  return url;
}

function shouldUseVolcOpenApiGateway(baseUrl: string): boolean {
  let host: string;
  try {
    host = new URL(baseUrl).host.toLowerCase();
  } catch {
    return false;
  }

  if (host === 'open.volcengineapi.com') return true;
  return /^aisearch\.[a-z0-9-]+\.volces\.com$/i.test(host);
}

async function buildHeaders(
  config: ServiceConfig,
  method: SignedHttpMethod,
  url: URL,
  body?: string
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    accept: 'application/json'
  };
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
  }

  if (config.accessKeyId && config.secretKey) {
    const { Signer } = await import('@volcengine/openapi');
    headers.host = url.host;
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

  throw new Error(
    'Missing Viking auth. Run `vs auth import-env`, `vs auth login`, set VIKING_AK/VIKING_SK, or pass --ak/--sk.'
  );
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

  if ('ProjectName' in (payload as Record<string, unknown>)) {
    return payload;
  }

  return {
    ...(payload as Record<string, unknown>),
    ProjectName: projectName
  };
}
