// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { createHash, createHmac } from 'node:crypto';

const ALGORITHM = 'HMAC-SHA256';
const DATE_HEADER = 'X-Date';
const CONTENT_SHA256_HEADER = 'X-Content-Sha256';
const CREDENTIAL_TERMINATOR = 'request';
const UNSIGNABLE_HEADERS = new Set([
  'authorization',
  'content-type',
  'content-length',
  'user-agent',
  'presigned-expires',
  'expect'
]);

export type VolcSignedHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface VolcSignRequest {
  region: string;
  service: string;
  method: VolcSignedHttpMethod;
  pathname: string;
  params: Record<string, string>;
  headers: Record<string, string>;
  body: string;
}

export interface VolcCredentials {
  accessKeyId: string;
  secretKey: string;
}

export function addVolcAuthorization(
  request: VolcSignRequest,
  credentials: VolcCredentials,
  date = new Date()
): void {
  const datetime = formatDateTime(date);
  request.headers[DATE_HEADER] = datetime;
  if (request.body) {
    request.headers[CONTENT_SHA256_HEADER] = sha256(request.body);
  }

  const signedHeaders = collectSignedHeaders(request.headers);
  const credentialScope = createCredentialScope(datetime.slice(0, 8), request.region, request.service);
  const canonicalRequest = [
    request.method.toUpperCase(),
    request.pathname || '/',
    canonicalQuery(request.params),
    `${canonicalHeaders(request.headers)}\n`,
    signedHeaders,
    request.headers[CONTENT_SHA256_HEADER] ?? sha256('')
  ].join('\n');
  const stringToSign = [
    ALGORITHM,
    datetime,
    credentialScope,
    sha256(canonicalRequest)
  ].join('\n');
  const signature = createSignature(credentials.secretKey, datetime.slice(0, 8), request.region, request.service, stringToSign);

  request.headers.Authorization = [
    `${ALGORITHM} Credential=${credentials.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`
  ].join(', ');
}

function canonicalQuery(params: Record<string, string>): string {
  return Object.entries(params)
    .sort(([left], [right]) => compareAscii(left, right))
    .map(([key, value]) => `${uriEscape(key)}=${uriEscape(value)}`)
    .join('&');
}

function canonicalHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([name, value]) => [name.toLowerCase(), value] as const)
    .filter(([name]) => isSignableHeader(name))
    .sort(([left], [right]) => compareAscii(left, right))
    .map(([name, value]) => `${name}:${value.replace(/\s+/g, ' ').trim()}`)
    .join('\n');
}

function collectSignedHeaders(headers: Record<string, string>): string {
  return Object.keys(headers)
    .map(name => name.toLowerCase())
    .filter(isSignableHeader)
    .sort(compareAscii)
    .join(';');
}

function isSignableHeader(name: string): boolean {
  return !UNSIGNABLE_HEADERS.has(name);
}

function createCredentialScope(date: string, region: string, service: string): string {
  return [date, region, service, CREDENTIAL_TERMINATOR].join('/');
}

function createSignature(
  secretKey: string,
  date: string,
  region: string,
  service: string,
  stringToSign: string
): string {
  const dateKey = hmac(secretKey, date);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, service);
  const signingKey = hmac(serviceKey, CREDENTIAL_TERMINATOR);
  return hmac(signingKey, stringToSign).toString('hex');
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function hmac(key: string | Buffer, value: string): Buffer {
  return createHmac('sha256', key).update(value, 'utf8').digest();
}

function formatDateTime(date: Date): string {
  return date.toISOString().replace(/[:\-]|\.\d{3}/g, '');
}

function uriEscape(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function compareAscii(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
