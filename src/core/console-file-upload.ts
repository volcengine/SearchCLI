// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { VikingOpenApiClient } from './openapi-client';
import { resolveServiceConfig, type ServiceConfigInput } from './service-config';

export interface ConsoleFileUploadOptions extends ServiceConfigInput {
  filePath?: string;
  fileName?: string;
  contentType?: string;
  fileContent?: string | Buffer;
  signatureFileExtension?: string;
}

export interface ConsoleFileUploadResult {
  fileUrl: string;
  fileKey: string;
  httpMethod?: string;
  expiresInSeconds?: number;
}

export async function uploadFileWithConsoleSignature(
  options: ConsoleFileUploadOptions
): Promise<ConsoleFileUploadResult> {
  const config = resolveServiceConfig(options);
  const openapi = new VikingOpenApiClient(config);
  const fallbackExtension =
    path.extname(options.fileName ?? options.filePath ?? 'upload.bin') || '.jsonl';
  const fileName = normalizeConsoleUploadFileName(
    options.fileName ?? path.basename(options.filePath ?? 'upload.bin'),
    options.signatureFileExtension ?? fallbackExtension
  );

  const signatureResponse = unwrapResultEnvelope(
    await openapi.post('GetPresignedImportUrlV2', {
      FileName: fileName,
      ProjectName: options.projectName ?? config.projectName
    })
  );
  const fileUrl = requiredStringField(signatureResponse, ['FileUrl', 'UploadUrl', 'SignedUrl']);
  const fileKey = requiredStringField(signatureResponse, ['FileKey', 'TosKey', 'Key']);
  const contentType = options.contentType ?? detectUploadContentType(fileName);
  const fileContent =
    options.fileContent ??
    (options.filePath ? await readFile(options.filePath) : undefined);

  if (fileContent === undefined) {
    throw new Error('uploadFileWithConsoleSignature requires fileContent or filePath.');
  }

  await uploadFileToTos(fileUrl, fileContent, contentType);

  return {
    fileUrl,
    fileKey,
    httpMethod: optionalStringField(signatureResponse, ['HttpMethod']),
    expiresInSeconds: optionalNumberField(signatureResponse, ['ExpiresInSeconds'])
  };
}

export function detectUploadContentType(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === '.jsonl' || extension === '.ndjson') return 'application/x-ndjson';
  if (extension === '.csv') return 'text/csv';
  if (extension === '.json') return 'application/json';
  if (extension === '.txt') return 'text/plain';
  return 'application/octet-stream';
}

export function normalizeConsoleUploadFileName(rawFileName: string, extension?: string): string {
  const sourceName = rawFileName.trim() || 'upload';
  const normalizedExtensionSource = extension ?? (path.extname(sourceName) || '.jsonl');
  const normalizedExtension = normalizedExtensionSource.startsWith('.')
    ? normalizedExtensionSource.toLowerCase()
    : `.${normalizedExtensionSource.toLowerCase()}`;
  const baseName = path.basename(sourceName);
  const nameWithoutExt = baseName.replace(/\.[^.]*$/, '');
  const sanitizedStem = nameWithoutExt
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^[_\.]+|[_\.]+$/g, '')
    .slice(0, Math.max(1, 128 - normalizedExtension.length));
  return `${sanitizedStem || 'upload'}${normalizedExtension}`;
}

async function uploadFileToTos(
  fileUrl: string,
  payload: string | Buffer,
  contentType: string
): Promise<void> {
  const requestBody = typeof payload === 'string' ? payload : new Uint8Array(payload);
  const response = await fetch(fileUrl, {
    method: 'PUT',
    headers: {
      'content-type': contentType
    },
    body: requestBody
  });
  if (response.ok) {
    return;
  }

  const responseBody = await response.text().catch(() => '');
  throw new Error(
    `Uploading source file to TOS failed: ${response.status} ${response.statusText}${responseBody ? ` - ${responseBody}` : ''}`
  );
}

function unwrapResultEnvelope(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error('Console API returned a non-object response.');
  }
  if (isRecord(value.Result)) return value.Result;
  if (isRecord(value.result)) return value.result;
  if (isRecord(value.Response)) return value.Response;
  if (isRecord(value.response)) return value.response;
  return value;
}

function requiredStringField(value: Record<string, unknown>, keys: string[]): string {
  const resolved = optionalStringField(value, keys);
  if (!resolved) {
    throw new Error(`Missing expected response field: ${keys.join(' or ')}`);
  }
  return resolved;
}

function optionalStringField(value: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return undefined;
}

function optionalNumberField(value: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
