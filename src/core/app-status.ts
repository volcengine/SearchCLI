// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { VikingOpenApiClient } from './openapi-client';
import type { ServiceConfig } from './service-config';

const APP_STATE_NAMES: Record<number, string> = {
  0: 'AppInit',
  1: 'AppReady',
  2: 'AppDeleting',
  3: 'AppDeleted',
  4: 'AppNotReady'
};

const APP_DATA_CONFIG_STATE_NAMES: Record<number, string> = {
  0: 'AppDataConfigInit',
  1: 'AppDataConfigInActive',
  2: 'AppDataConfigActive',
  3: 'AppDataConfigUpdating',
  4: 'AppDataConfigActivated',
  5: 'AppDataConfigDeleting',
  6: 'AppDataConfigDeleted',
  7: 'AppDataConfigOffline',
  8: 'AppDataConfigOfflining'
};

const ACTIVE_CONFIG_STATES = new Set([2, 3, 4]);

export interface AppStatusQuery {
  applicationId: string;
  projectName?: string;
  activatedOnly?: boolean;
}

export interface ApplicationDatasetSummary {
  datasetId?: string;
  name?: string;
  type?: string;
}

export interface AppDataConfigSummary {
  datasetId?: string;
  datasetName?: string;
  datasetType?: string;
  schemaVersion?: number;
  stateCode?: number;
  state: string;
  processedDataNum?: number;
  firstUpdating?: boolean;
  lastUpdatedTimestamp?: string;
}

export interface SearchDatasetInference {
  datasetId?: string;
  source?: 'activated' | 'bound' | 'config';
}

export interface AppStatusSnapshot {
  applicationId: string;
  projectName?: string;
  appName?: string;
  appStateCode?: number;
  appState: string;
  phase: 'unbound' | 'config_saved' | 'activating' | 'ready' | 'waiting_runtime' | 'unknown';
  ready: boolean;
  runtimeSearchReady: boolean;
  inferredSearchDataset?: SearchDatasetInference;
  itemDatasetIds: string[];
  documentDatasetIds: string[];
  recommendSceneIds: string[];
  datasets: ApplicationDatasetSummary[];
  dataConfigs: AppDataConfigSummary[];
  configStateCounts: Record<string, number>;
  reasons: string[];
  nextActions: string[];
}

export async function fetchAppStatusSnapshot(
  config: ServiceConfig,
  query: AppStatusQuery
): Promise<AppStatusSnapshot> {
  const client = new VikingOpenApiClient(config);
  const applicationResponse = await client.post<Record<string, unknown>>('/api/v1/GetApplication', compactObject({
    AppID: query.applicationId,
    ProjectName: query.projectName
  }));
  const listResponse = await client.post<Record<string, unknown>>('/api/v1/ListAppDataConfigs', compactObject({
    AppID: query.applicationId,
    ProjectName: query.projectName,
    ActivatedOnly: query.activatedOnly
  }));

  return deriveAppStatusSnapshot(unwrapResultEnvelope(applicationResponse), unwrapResultEnvelope(listResponse), query);
}

export function deriveAppStatusSnapshot(
  application: unknown,
  listResponse: unknown,
  query: AppStatusQuery
): AppStatusSnapshot {
  const appRecord = asRecord(unwrapResultEnvelope(application));
  const appStateCode = readInt(appRecord?.State);
  const appState = APP_STATE_NAMES[appStateCode ?? -1] ?? `Unknown(${String(appStateCode ?? 'n/a')})`;
  const itemDatasetIds = readStringArray(appRecord?.ItemDatasetIDs);
  const documentDatasetIds = readStringArray(appRecord?.DocumentDatasetIDs);
  const recommendSceneIds = readStringArray(appRecord?.RecommendSceneIds);
  const datasets = readDatasetSummaries(appRecord?.Datasets);
  const dataConfigs = readDataConfigSummaries(asRecord(unwrapResultEnvelope(listResponse))?.Config);
  const configStateCounts = countConfigStates(dataConfigs);
  const activeConfigCount = dataConfigs.filter(config => ACTIVE_CONFIG_STATES.has(config.stateCode ?? -1)).length;
  const boundDatasetIds = uniqueStrings([
    ...datasets.map(dataset => dataset.datasetId).filter(Boolean),
    ...dataConfigs.map(config => config.datasetId).filter(Boolean)
  ]);

  const ready = appStateCode === 1;
  const runtimeSearchReady = ready && (itemDatasetIds.length > 0 || documentDatasetIds.length > 0);
  const reasons: string[] = [];

  if (appStateCode !== 1) {
    reasons.push(`application state is ${appState}`);
  }
  if (boundDatasetIds.length === 0) {
    reasons.push('no dataset is bound to the application');
  }
  if (boundDatasetIds.length > 0 && activeConfigCount === 0) {
    reasons.push('no dataset config is active yet');
  }
  if (boundDatasetIds.length > 0 && itemDatasetIds.length === 0 && documentDatasetIds.length === 0) {
    reasons.push('no activated item/document dataset is visible on the application');
  }

  const phase = derivePhase({
    ready,
    runtimeSearchReady,
    boundDatasetIds,
    activeConfigCount
  });

  const nextActions = deriveNextActions(phase, query.applicationId);
  const inferredSearchDataset = inferSearchDatasetId({
    itemDatasetIds,
    documentDatasetIds,
    datasets,
    dataConfigs
  });

  return {
    applicationId: query.applicationId,
    projectName: query.projectName,
    appName: readString(appRecord?.Name),
    appStateCode: appStateCode ?? undefined,
    appState,
    phase,
    ready,
    runtimeSearchReady,
    inferredSearchDataset,
    itemDatasetIds,
    documentDatasetIds,
    recommendSceneIds,
    datasets,
    dataConfigs,
    configStateCounts,
    reasons,
    nextActions
  };
}

export function inferSearchDatasetId(input: {
  itemDatasetIds: string[];
  documentDatasetIds: string[];
  datasets: ApplicationDatasetSummary[];
  dataConfigs: AppDataConfigSummary[];
}): SearchDatasetInference {
  const activated = uniqueStrings([...input.itemDatasetIds, ...input.documentDatasetIds]);
  if (activated.length === 1) {
    return { datasetId: activated[0], source: 'activated' };
  }

  const bound = uniqueStrings(input.datasets.map(dataset => dataset.datasetId).filter(Boolean));
  if (bound.length === 1) {
    return { datasetId: bound[0], source: 'bound' };
  }

  const configured = uniqueStrings(input.dataConfigs.map(config => config.datasetId).filter(Boolean));
  if (configured.length === 1) {
    return { datasetId: configured[0], source: 'config' };
  }

  return {};
}

function derivePhase(input: {
  ready: boolean;
  runtimeSearchReady: boolean;
  boundDatasetIds: string[];
  activeConfigCount: number;
}): AppStatusSnapshot['phase'] {
  if (input.runtimeSearchReady) {
    return 'ready';
  }
  if (input.boundDatasetIds.length === 0) {
    return 'unbound';
  }
  if (input.ready) {
    return 'waiting_runtime';
  }
  if (input.activeConfigCount > 0) {
    return 'activating';
  }
  if (input.boundDatasetIds.length > 0) {
    return 'config_saved';
  }
  return 'unknown';
}

function deriveNextActions(phase: AppStatusSnapshot['phase'], applicationId: string): string[] {
  switch (phase) {
    case 'unbound':
      return [
        `Bind a dataset: vs app dataset bind --application-id ${applicationId} --dataset-id <dataset>`,
        `Update app config: vs app dataset-config update --application-id ${applicationId} --dataset-id <dataset> --field-config @config.json`
      ];
    case 'config_saved':
      return [
        `Check config state: vs app dataset-config list --application-id ${applicationId}`,
        `If needed, update the config again so it can enter the activation flow.`
      ];
    case 'activating':
    case 'waiting_runtime':
      return [
        `Wait for the app to become ready: vs app wait-ready --application-id ${applicationId}`,
        `Inspect current state: vs app status --application-id ${applicationId}`
      ];
    case 'ready':
      return [
        `Run search: vs search run --application-id ${applicationId} --query "<query>"`,
        `Run conversational search: vs chat run --application-id ${applicationId} --message "<message>"`
      ];
    default:
      return [`Inspect current state: vs app status --application-id ${applicationId}`];
  }
}

function countConfigStates(configs: AppDataConfigSummary[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const config of configs) {
    counts[config.state] = (counts[config.state] ?? 0) + 1;
  }
  return counts;
}

function unwrapResultEnvelope<T>(value: T): unknown {
  const record = asRecord(value);
  if (record && record.Result !== undefined) {
    return record.Result;
  }
  return value;
}

function readDatasetSummaries(value: unknown): ApplicationDatasetSummary[] {
  if (!Array.isArray(value)) return [];
  const summaries: ApplicationDatasetSummary[] = [];
  for (const entry of value) {
    const record = asRecord(entry);
    if (!record) continue;
    const summary = compactObject({
      datasetId: readString(record.DatasetID),
      name: readString(record.Name),
      type: formatDatasetType(record.Type)
    });
    if (isDatasetSummary(summary)) {
      summaries.push(summary);
    }
  }
  return summaries;
}

function readDataConfigSummaries(value: unknown): AppDataConfigSummary[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(entry => {
      const record = asRecord(entry);
      const dataset = asRecord(record?.Dataset);
      const stateCode = readInt(record?.State);
      return {
        datasetId: readString(dataset?.DatasetID),
        datasetName: readString(dataset?.Name),
        datasetType: formatDatasetType(dataset?.Type),
        schemaVersion: readInt(record?.SchemaVersion),
        stateCode: stateCode ?? undefined,
        state: APP_DATA_CONFIG_STATE_NAMES[stateCode ?? -1] ?? `Unknown(${String(stateCode ?? 'n/a')})`,
        processedDataNum: readInt(record?.DatasetProcessedDataNum),
        firstUpdating: readBoolean(record?.IsFirstUpdating),
        lastUpdatedTimestamp: readString(record?.LastUpdatedTimestamp)
      };
    })
    .filter(config => config.datasetId !== undefined || config.stateCode !== undefined);
}

function formatDatasetType(value: unknown): string | undefined {
  const code = readInt(value);
  if (code === undefined) return readString(value);
  const names: Record<number, string> = {
    1: 'item',
    2: 'query',
    3: 'video',
    4: 'user_event',
    5: 'doc',
    6: 'document'
  };
  return names[code] ?? String(code);
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.length > 0))];
}

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function isDatasetSummary(value: ApplicationDatasetSummary | undefined): value is ApplicationDatasetSummary {
  return value !== undefined;
}
