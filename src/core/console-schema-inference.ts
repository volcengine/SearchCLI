// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { VikingOpenApiClient } from './openapi-client';
import { resolveServiceConfig, type ServiceConfigInput } from './service-config';

export interface InferSchemaArtifactsWithConsoleOptions extends ServiceConfigInput {
  filePath: string;
  normalizedItems: Array<Record<string, unknown>>;
  datasetType: 'item' | 'video';
  language?: string;
  pollIntervalMs?: number;
  waitTimeoutMs?: number;
}

export interface ConsoleSchemaArtifactsResult {
  schema: unknown;
  dataFieldConfig: unknown;
  taskId: string;
  upload: {
    fileUrl: string;
    fileKey: string;
    tosBucket?: string;
    httpMethod?: string;
    expiresInSeconds?: number;
  };
}

const DEFAULT_LANGUAGE = 'zh';
const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_WAIT_TIMEOUT_MS = 120000;

export async function inferSchemaArtifactsWithConsole(
  options: InferSchemaArtifactsWithConsoleOptions
): Promise<ConsoleSchemaArtifactsResult> {
  const config = resolveServiceConfig(options);
  const openapi = new VikingOpenApiClient(config);
  const fileName = toUploadFileName(options.filePath);

  const signatureResponse = unwrapResultEnvelope(
    await openapi.post('/api/v1/GetInferDatasetSchemaUploadSignature', {
      FileName: fileName,
      ProjectName: options.projectName ?? config.projectName
    })
  );
  const fileUrl = requiredStringField(signatureResponse, ['FileUrl', 'UploadUrl', 'SignedUrl']);
  const fileKey = requiredStringField(signatureResponse, ['FileKey', 'TosKey', 'Key']);
  const tosBucket = optionalStringField(signatureResponse, ['TosBucket', 'Bucket']);

  await uploadJsonlToTos(fileUrl, toJsonlPayload(options.normalizedItems));

  const addTaskResponse = unwrapResultEnvelope(
    await openapi.post('/api/v1/AddInferDatasetSchemaTask', compactObject({
      TosBucket: tosBucket,
      TosKey: fileKey,
      Type: options.datasetType === 'video' ? 3 : 1,
      Language: options.language ?? DEFAULT_LANGUAGE,
      ProjectName: options.projectName ?? config.projectName
    }))
  );
  const taskId = requiredStringField(addTaskResponse, ['TaskID', 'TaskId']);

  const deadline = Date.now() + ensurePositiveInt(options.waitTimeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS, '--schema-wait-timeout-ms');
  const pollIntervalMs = ensurePositiveInt(options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS, '--schema-poll-interval-ms');

  while (Date.now() <= deadline) {
    const resultResponse = unwrapResultEnvelope(
      await openapi.post('/api/v1/GetInferDatasetSchemaResult', {
        TaskID: taskId,
        ProjectName: options.projectName ?? config.projectName
      })
    );
    const status = readTaskStatus(resultResponse.Status);
    if (status === 'success') {
      return {
        schema: requiredField(resultResponse, ['Schema']),
        dataFieldConfig: resultResponse.DataFieldConfig ?? resultResponse.FieldConfig ?? {},
        taskId,
        upload: {
          fileUrl,
          fileKey,
          tosBucket,
          httpMethod: optionalStringField(signatureResponse, ['HttpMethod']),
          expiresInSeconds: optionalNumberField(signatureResponse, ['ExpiresInSeconds'])
        }
      };
    }
    if (status === 'failed') {
      throw new Error(
        optionalStringField(resultResponse, ['Error', 'Message']) ??
          `Console schema inference task ${taskId} failed.`
      );
    }
    await sleep(pollIntervalMs);
  }

  throw new Error(`Timed out waiting for console schema inference task ${taskId}.`);
}

function toUploadFileName(filePath: string): string {
  const parsed = path.parse(filePath);
  const stem = sanitizeFileNamePart(parsed.name || 'items');
  return `${stem || 'items'}.jsonl`;
}

function sanitizeFileNamePart(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function toJsonlPayload(items: Array<Record<string, unknown>>): string {
  if (items.length === 0) return '';
  return `${items.map(item => JSON.stringify(item)).join('\n')}\n`;
}

async function uploadJsonlToTos(fileUrl: string, payload: string): Promise<void> {
  const response = await fetch(fileUrl, {
    method: 'PUT',
    headers: {
      'content-type': 'application/x-ndjson'
    },
    body: payload
  });
  if (response.ok) {
    return;
  }

  const body = await response.text().catch(() => '');
  throw new Error(
    `Uploading normalized JSONL to TOS failed: ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`
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

function requiredField(value: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in value) {
      return value[key];
    }
  }
  throw new Error(`Missing expected response field: ${keys.join(' or ')}`);
}

function readTaskStatus(value: unknown): 'processing' | 'success' | 'failed' {
  if (typeof value === 'number') {
    if (value === 2) return 'success';
    if (value === 3) return 'failed';
    return 'processing';
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'success' || normalized === 'taskstatustype_success') return 'success';
    if (normalized === 'failed' || normalized === 'taskstatustype_failed') return 'failed';
  }
  return 'processing';
}

function ensurePositiveInt(value: number, flagName: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${flagName} must be a positive integer.`);
  }
  return value;
}

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
