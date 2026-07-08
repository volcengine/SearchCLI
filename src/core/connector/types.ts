// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import type { ServiceConfigInput } from '../service-config';

export type ConnectorSourceType = 'mysql' | 'mongo' | 'redis-stream';
export type ConnectorCursorType = 'timestamp' | 'number' | 'string';
export type ConnectorOperation = 'upsert' | 'delete';

export interface ConnectorBatchConfig {
  maxRows: number;
  intervalMs: number;
}

export interface ConnectorSinkConfig {
  type: 'data-write';
  datasetId: string;
  deleteMode: 'ignore';
}

export interface ConnectorCursorConfig {
  field: string;
  type: ConnectorCursorType;
  initial?: string | number;
}

export interface BaseConnectorSourceConfig {
  type: ConnectorSourceType;
  envPrefix: string;
  idField: string;
  fields?: string[];
}

export interface MySqlConnectorSourceConfig extends BaseConnectorSourceConfig {
  type: 'mysql';
  table: string;
  where?: string;
  cursor: ConnectorCursorConfig;
}

export interface MongoConnectorSourceConfig extends BaseConnectorSourceConfig {
  type: 'mongo';
  database: string;
  collection: string;
  cursor: ConnectorCursorConfig;
}

export interface RedisStreamConnectorSourceConfig extends BaseConnectorSourceConfig {
  type: 'redis-stream';
  stream: string;
}

export type ConnectorSourceConfig =
  | MySqlConnectorSourceConfig
  | MongoConnectorSourceConfig
  | RedisStreamConnectorSourceConfig;

export interface ConnectorJobConfig {
  version: 1;
  name: string;
  source: ConnectorSourceConfig;
  sink: ConnectorSinkConfig;
  batch: ConnectorBatchConfig;
}

export interface ConnectorCursor {
  value?: string | number;
  id?: string;
}

export interface ConnectorState {
  version: 1;
  name: string;
  cursor?: ConnectorCursor;
  startedAt?: string;
  lastRunAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  lastBatch?: {
    iteration: number;
    changeCount: number;
    upsertCount: number;
    ignoredDeleteCount: number;
    importedIds: string[];
    ignoredDeleteIds: string[];
    cursor?: ConnectorCursor;
    completedAt: string;
  };
  stats: {
    upserted: number;
    deleted: number;
    ignoredDeletes: number;
    failed: number;
    batches: number;
  };
}

export interface ConnectorRuntime {
  version: 1;
  job: string;
  pid?: number;
  mode: 'foreground' | 'daemon';
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'completed' | 'error';
  startedAt?: string;
  heartbeatAt?: string;
  exitedAt?: string;
  tracePath: string;
  statePath: string;
  stopPath: string;
  runtimePath: string;
  stdoutPath?: string;
  stderrPath?: string;
  lastError?: string;
  stopReason?: string;
}

export interface ConnectorChange {
  op: ConnectorOperation;
  id: string;
  fields?: Record<string, unknown>;
  cursor: ConnectorCursor;
}

export interface ConnectorSource {
  readonly type: ConnectorSourceType;
  open(): Promise<void>;
  close(): Promise<void>;
  readChanges(cursor: ConnectorCursor | undefined, limit: number): AsyncIterable<ConnectorChange>;
}

export interface ConnectorRunInput extends ServiceConfigInput {
  job: string;
  once?: boolean;
  daemon?: boolean;
  worker?: boolean;
}

export interface ConnectorInitInput {
  name: string;
  datasetId: string;
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
  fields?: string;
  batchSize?: number;
  intervalMs?: number;
}
