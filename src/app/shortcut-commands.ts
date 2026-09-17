// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from 'node:crypto';
import { fetchAppStatusSnapshot, type AppStatusSnapshot } from '../core/app-status';
import { loadJsonInput, loadJsonOrJsonlInput, parseBooleanString } from '../core/json-input';
import { formatOutput, hasExplicitOutputFormatFlag, printOutput } from '../core/output-format';
import { VikingRuntimeApiClient } from '../core/runtime-api-client';
import { resolveServiceConfig, type ServiceConfigInput } from '../core/service-config';

export interface ShortcutServiceOptions extends ServiceConfigInput {
  data?: string;
  projectName?: string;
}

export interface SearchShortcutRunOptions extends ShortcutServiceOptions {
  applicationId: string;
  sceneId?: string;
  datasetId?: string;
  query?: string;
  pageSize?: number;
}

export interface RecommendShortcutRunOptions extends ShortcutServiceOptions {
  applicationId: string;
  sceneId: string;
  userId?: string;
  parentId?: string;
  pageSize?: number;
}

export interface ChatSearchShortcutAskOptions extends ShortcutServiceOptions {
  applicationId: string;
  sessionId?: string;
  message?: string;
  openingRemarks?: boolean | string;
  userId?: string;
}

export interface DataImportShortcutOptions extends ShortcutServiceOptions {
  datasetId: string;
  fields?: string;
}

export async function runSearchShortcutRunCommand(options: SearchShortcutRunOptions): Promise<void> {
  const config = resolveServiceConfig(toServiceConfigInput(options));
  const providedPayload = await loadJsonInput(options.data);
  let datasetId = options.datasetId;
  let snapshot: AppStatusSnapshot | undefined;
  if (!datasetId && !hasDatasetIdInPayload(providedPayload)) {
    snapshot = await fetchAppStatusSnapshot(config, {
      applicationId: options.applicationId
    });
    datasetId = snapshot.inferredSearchDataset?.datasetId;
    if (!datasetId) {
      throw new Error(buildSearchDatasetInferenceError(options.applicationId, snapshot));
    }
  }

  const payload = withDatasetIdIfMissing(
    providedPayload ??
      compactObject({
        query: options.query ? { text: options.query } : undefined,
        dataset_id: datasetId,
        page_size: options.pageSize ?? 10
      }),
    datasetId
  );
  requireNonEmptyObject(payload, 'Need --query or --data for search run.');

  const result = await new VikingRuntimeApiClient(config).search(options.applicationId, options.sceneId, payload);
  printShortcutHeader('search run', [
    ['application', options.applicationId],
    ['scene', options.sceneId ?? '(default)'],
    ['query', options.query ?? '(from --data)'],
    ['dataset', datasetId],
    ['page_size', String(extractNumber(payload, 'page_size') ?? options.pageSize ?? 10)]
  ]);
  await printJson(result);
}

export async function runRecommendShortcutRunCommand(options: RecommendShortcutRunOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      user: options.userId ? { _user_id: options.userId } : undefined,
      parent_items: options.parentId ? [{ _id: options.parentId }] : undefined,
      page_size: options.pageSize ?? 20
    });
  requireNonEmptyObject(payload, 'Need --data or recommend context for recommend run.');

  const result = await createRuntimeClient(options).recommend(options.applicationId, options.sceneId, payload);
  printShortcutHeader('recommend run', [
    ['application', options.applicationId],
    ['scene', options.sceneId],
    ['user_id', options.userId],
    ['parent_id', options.parentId],
    ['page_size', String(extractNumber(payload, 'page_size') ?? options.pageSize ?? 20)]
  ]);
  await printJson(result);
}

export async function runChatSearchShortcutAskCommand(options: ChatSearchShortcutAskOptions): Promise<void> {
  const openingRemarks =
    typeof options.openingRemarks === 'string' ? parseBooleanString(options.openingRemarks) : options.openingRemarks;
  const sessionId = options.sessionId ?? randomUUID();
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      session_id: sessionId,
      opening_remarks: openingRemarks,
      input_message:
        openingRemarks === true
          ? undefined
          : options.message
            ? {
                content: [
                  {
                    type: 'text',
                    text: options.message
                  }
                ]
              }
            : undefined,
      user: options.userId ? { _user_id: options.userId } : undefined
    });
  requireNonEmptyObject(payload, 'Need --message, --opening-remarks true, or --data for chat ask.');

  const result = await createRuntimeClient({
    ...options,
    timeoutMs: options.timeoutMs ?? 60000
  }).chatSearch(options.applicationId, payload);
  printShortcutHeader('chat ask', [
    ['application', options.applicationId],
    ['session_id', sessionId],
    ['message', options.message ?? (openingRemarks ? '(opening remarks)' : '(from --data)')],
    ['user_id', options.userId]
  ]);
  await printJson(result);
}

export async function runDataImportShortcutCommand(options: DataImportShortcutOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      fields: await loadJsonOrJsonlInput(options.fields)
    });
  requireNonEmptyObject(payload, 'Need --fields or --data for data import.');

  const recordCount = countImportedRecords(payload);
  const result = await createRuntimeClient(options).dataWrite(options.datasetId, payload);
  printShortcutHeader('data import', [
    ['dataset', options.datasetId],
    ['records', recordCount ? String(recordCount) : '(unknown)'],
    ['source', options.fields ?? (options.data ? '--data' : undefined)]
  ]);
  await printJson(result);
}

function createRuntimeClient(options: ShortcutServiceOptions): VikingRuntimeApiClient {
  return new VikingRuntimeApiClient(resolveServiceConfig(toServiceConfigInput(options)));
}

function toServiceConfigInput(options: ShortcutServiceOptions): ServiceConfigInput {
  return {
    baseUrl: options.baseUrl,
    controlPlaneBaseUrl: options.controlPlaneBaseUrl,
    dataPlaneBaseUrl: options.dataPlaneBaseUrl,
    apiKey: options.apiKey,
    accessKeyId: options.accessKeyId,
    secretKey: options.secretKey,
    projectName: options.projectName,
    region: options.region,
    timeoutMs: options.timeoutMs,
    debug: options.debug
  };
}

async function printJson(result: unknown): Promise<void> {
  if (!hasExplicitOutputFormatFlag()) {
    process.stdout.write(`${formatOutput(result, 'pretty')}\n`);
    return;
  }
  await printOutput(result);
}

function printShortcutHeader(title: string, rows: Array<[string, string | undefined]>): void {
  if (hasExplicitOutputFormatFlag()) {
    return;
  }
  console.log(`WORKFLOW ${title}`);
  for (const [label, value] of rows) {
    if (value) {
      console.log(`  ${label}: ${value}`);
    }
  }
  console.log('');
}

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function requireNonEmptyObject(value: unknown, message: string): void {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length === 0) {
    throw new Error(message);
  }
}

function hasDatasetIdInPayload(payload: unknown): boolean {
  return isRecord(payload) && typeof payload.dataset_id === 'string' && payload.dataset_id.length > 0;
}

function buildSearchDatasetInferenceError(
  applicationId: string,
  snapshot: AppStatusSnapshot
): string {
  const activated = [...snapshot.itemDatasetIds, ...snapshot.documentDatasetIds];
  const bound = snapshot.datasets.map(dataset => dataset.datasetId).filter((value): value is string => Boolean(value));
  const configured = snapshot.dataConfigs.map(config => config.datasetId).filter((value): value is string => Boolean(value));
  const candidates = [...new Set([...activated, ...bound, ...configured])];
  const candidateText = candidates.length > 0 ? candidates.join(', ') : '(none)';
  return [
    `Could not infer a unique dataset for application ${applicationId}.`,
    `Pass --dataset-id <dataset>.`,
    `Observed candidate datasets: ${candidateText}`,
    `Inspect current state: vs app status --application-id ${applicationId}`
  ].join('\n');
}

function withDatasetIdIfMissing(payload: unknown, datasetId?: string): unknown {
  if (!datasetId || !isRecord(payload) || hasDatasetIdInPayload(payload)) {
    return payload;
  }
  return {
    ...payload,
    dataset_id: datasetId
  };
}

function extractNumber(payload: unknown, key: string): number | undefined {
  if (!isRecord(payload)) return undefined;
  return extractInt(payload[key]);
}

function extractInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function countImportedRecords(payload: unknown): number | undefined {
  if (!isRecord(payload)) return undefined;
  const fields = payload.fields;
  return Array.isArray(fields) ? fields.length : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
