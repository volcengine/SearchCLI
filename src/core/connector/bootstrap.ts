// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import path from 'node:path';
import { writeJson, ensureDir, slugify } from '../files';
import { buildConnectorJobConfig, connectorJobDir, saveConnectorConfig } from './config';
import { createConnectorSource } from './sources';
import { assertSourceEnvConfigured, getSourceEnvRequirements } from './sources/helpers';
import {
  appendConnectorImportedRecordLogs,
  getConnectorPaths,
  loadConnectorState,
  saveConnectorState
} from './state-store';
import type {
  ConnectorCursor,
  ConnectorCursorType,
  ConnectorEnvRequirement,
  ConnectorSourceType
} from './types';

export interface SourceBootstrapOptions {
  job?: string;
  datasetId?: string;
  datasetName?: string;
  source: ConnectorSourceType;
  envPrefix?: string;
  idField?: string;
  cursorField?: string;
  cursorType?: ConnectorCursorType;
  initialCursor?: string;
  table?: string;
  where?: string;
  database?: string;
  collection?: string;
  stream?: string;
  file?: string;
  sourceFields?: string;
  batchSize?: number;
  intervalMs?: number;
}

export interface SourceBootstrapResult {
  job: string;
  source: ConnectorSourceType;
  bootstrapDir: string;
  jsonlPath: string;
  metadataPath: string;
  importLogPath: string;
  configPath?: string;
  exportedCount: number;
  cursor?: ConnectorCursor;
  importedIdSample: string[];
  envRequirements: ConnectorEnvRequirement[];
}

export async function bootstrapSourceToJsonl(options: SourceBootstrapOptions): Promise<SourceBootstrapResult> {
  const job = resolveBootstrapJobName(options);
  const config = buildConnectorJobConfig({
    name: job,
    datasetId: options.datasetId ?? '__bootstrap__',
    source: options.source,
    envPrefix: options.envPrefix,
    idField: options.idField,
    cursorField: options.cursorField,
    cursorType: options.cursorType,
    initialCursor: options.initialCursor,
    table: options.table,
    where: options.where,
    database: options.database,
    collection: options.collection,
    stream: options.stream,
    file: options.file,
    fields: options.sourceFields,
    batchSize: options.batchSize,
    intervalMs: options.intervalMs
  });

  const envRequirements = getSourceEnvRequirements(config.source.type, config.source.envPrefix);
  assertSourceEnvConfigured(config.source.type, config.source.envPrefix);

  const source = createConnectorSource(config.source);
  const bootstrapDir = path.join(connectorJobDir(job), 'bootstrap');
  const jsonlPath = path.join(bootstrapDir, 'items.jsonl');
  const metadataPath = path.join(bootstrapDir, 'bootstrap.json');
  const importLogPath = getConnectorPaths(job).importLog;
  await ensureDir(bootstrapDir);

  const output = createWriteStream(jsonlPath, { encoding: 'utf8' });
  let cursor: ConnectorCursor | undefined;
  let exportedCount = 0;
  const importedIdSample: string[] = [];

  await source.open();
  try {
    while (true) {
      let batchCount = 0;
      const batchLogs: Array<Record<string, unknown>> = [];
      for await (const change of source.readChanges(cursor, config.batch.maxRows)) {
        if (change.op !== 'upsert' || !change.fields) continue;
        cursor = change.cursor;
        batchCount += 1;
        exportedCount += 1;
        if (importedIdSample.length < 20) importedIdSample.push(change.id);
        output.write(`${JSON.stringify(change.fields)}\n`);
        batchLogs.push({
          stage: 'bootstrap_export',
          source: config.source.type,
          id: change.id,
          cursor: change.cursor,
          fields: change.fields
        });
      }
      await appendConnectorImportedRecordLogs(job, batchLogs);

      if (batchCount === 0 || batchCount < config.batch.maxRows) {
        break;
      }
    }
  } finally {
    output.end();
    await finished(output);
    await source.close();
  }

  if (exportedCount === 0) {
    throw new Error(`Source ${config.source.type} did not export any records for job ${job}.`);
  }

  await writeJson(metadataPath, {
    version: 1,
    job,
    source: config.source.type,
    exportedCount,
    cursor,
    importedIdSample,
    exportedAt: new Date().toISOString(),
    jsonlPath,
    importLogPath
  });

  const state = await loadConnectorState(job);
  state.startedAt ??= new Date().toISOString();
  state.lastRunAt = new Date().toISOString();
  state.lastSuccessAt = state.lastRunAt;
  state.cursor = cursor;
  state.lastBatch = {
    iteration: 1,
    changeCount: exportedCount,
    upsertCount: exportedCount,
    ignoredDeleteCount: 0,
    importedIds: importedIdSample,
    ignoredDeleteIds: [],
    cursor,
    completedAt: state.lastRunAt
  };
  await saveConnectorState(job, state);

  const configPath = options.datasetId ? await saveConnectorConfig(config) : undefined;

  return {
    job,
    source: config.source.type,
    bootstrapDir,
    jsonlPath,
    metadataPath,
    importLogPath,
    configPath,
    exportedCount,
    cursor,
    importedIdSample,
    envRequirements
  };
}

function resolveBootstrapJobName(options: SourceBootstrapOptions): string {
  const preferred =
    options.job ??
    options.datasetName ??
    options.table ??
    options.collection ??
    options.stream ??
    (options.file ? path.basename(options.file, path.extname(options.file)) : undefined) ??
    `${options.source}-ingest`;
  const value = slugify(preferred);
  return value || `${options.source}-ingest`;
}
