// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { access, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { ensureDir, writeJson } from '../files';
import type {
  ConnectorInitInput,
  ConnectorJobConfig,
  ConnectorSourceConfig,
  ConnectorSourceType
} from './types';

const CONNECTOR_ROOT = resolveConnectorRoot();

const cursorTypeSchema = z.enum(['timestamp', 'number', 'string']);

const batchSchema = z.object({
  maxRows: z.number().int().positive(),
  intervalMs: z.number().int().positive()
});

const sinkSchema = z.object({
  type: z.literal('data-write'),
  datasetId: z.string().min(1),
  deleteMode: z.literal('ignore')
});

const cursorSchema = z.object({
  field: z.string().min(1),
  type: cursorTypeSchema,
  initial: z.union([z.string(), z.number()]).optional()
});

const baseSourceSchema = z.object({
  envPrefix: z.string().min(1),
  idField: z.string().min(1),
  fields: z.array(z.string().min(1)).optional()
});

const sourceSchema = z.discriminatedUnion('type', [
  baseSourceSchema.extend({
    type: z.literal('mysql'),
    table: z.string().min(1),
    where: z.string().min(1).optional(),
    cursor: cursorSchema
  }),
  baseSourceSchema.extend({
    type: z.literal('mongo'),
    database: z.string().min(1),
    collection: z.string().min(1),
    cursor: cursorSchema
  }),
  baseSourceSchema.extend({
    type: z.literal('redis-stream'),
    stream: z.string().min(1)
  })
]);

const jobSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  source: sourceSchema,
  sink: sinkSchema,
  batch: batchSchema
});

export function connectorJobDir(job: string): string {
  return path.join(CONNECTOR_ROOT, sanitizeJobName(job));
}

export function connectorRootDir(): string {
  return CONNECTOR_ROOT;
}

export function connectorConfigPath(job: string): string {
  return path.join(connectorJobDir(job), 'config.json');
}

export function connectorStatePath(job: string): string {
  return path.join(connectorJobDir(job), 'state.json');
}

export function connectorStopPath(job: string): string {
  return path.join(connectorJobDir(job), 'stop');
}

export function connectorTracePath(job: string): string {
  return path.join(connectorJobDir(job), 'trace.ndjson');
}

export function connectorImportLogPath(job: string): string {
  return path.join(connectorJobDir(job), 'imported-records.log');
}

export function connectorRuntimePath(job: string): string {
  return path.join(connectorJobDir(job), 'runtime.json');
}

export function connectorLogPath(job: string): string {
  return connectorTracePath(job);
}

export async function saveConnectorConfig(config: ConnectorJobConfig): Promise<string> {
  const parsed = parseConnectorJobConfig(config);
  const filePath = connectorConfigPath(parsed.name);
  await ensureDir(path.dirname(filePath));
  await writeJson(filePath, parsed);
  return filePath;
}

export async function loadConnectorConfig(job: string): Promise<ConnectorJobConfig> {
  const content = await readFile(connectorConfigPath(job), 'utf8');
  return parseConnectorJobConfig(JSON.parse(content) as unknown);
}

export function parseConnectorJobConfig(value: unknown): ConnectorJobConfig {
  return jobSchema.parse(value) as ConnectorJobConfig;
}

export async function connectorStopRequested(job: string): Promise<boolean> {
  try {
    await access(connectorStopPath(job));
    return true;
  } catch {
    return false;
  }
}

export function buildConnectorJobConfig(input: ConnectorInitInput): ConnectorJobConfig {
  const name = sanitizeJobName(input.name);
  const source = buildSourceConfig(input);
  return parseConnectorJobConfig({
    version: 1,
    name,
    source,
    sink: {
      type: 'data-write',
      datasetId: input.datasetId,
      deleteMode: 'ignore'
    },
    batch: {
      maxRows: input.batchSize ?? 500,
      intervalMs: input.intervalMs ?? 10000
    }
  });
}

function buildSourceConfig(input: ConnectorInitInput): ConnectorSourceConfig {
  const envPrefix = input.envPrefix ?? defaultEnvPrefix(input.source);
  const idField = input.idField ?? '_id';
  const fields = parseFields(input.fields);

  if (input.source === 'mysql') {
    if (!input.table) throw new Error('--source-table is required for mysql connector jobs.');
    if (!input.cursorField) throw new Error('--cursor-field is required for mysql connector jobs.');
    return {
      type: 'mysql',
      envPrefix,
      idField: input.idField ?? 'id',
      table: input.table,
      where: input.where,
      fields,
      cursor: {
        field: input.cursorField,
        type: input.cursorType ?? 'timestamp',
        initial: parseInitialCursor(input.initialCursor, input.cursorType)
      }
    };
  }

  if (input.source === 'mongo') {
    if (!input.database) throw new Error('--database is required for mongo connector jobs.');
    if (!input.collection) throw new Error('--collection is required for mongo connector jobs.');
    if (!input.cursorField) throw new Error('--cursor-field is required for mongo connector jobs.');
    return {
      type: 'mongo',
      envPrefix,
      idField,
      database: input.database,
      collection: input.collection,
      fields,
      cursor: {
        field: input.cursorField,
        type: input.cursorType ?? 'timestamp',
        initial: parseInitialCursor(input.initialCursor, input.cursorType)
      }
    };
  }

  if (input.source === 'redis-stream') {
    if (!input.stream) throw new Error('--stream is required for redis-stream connector jobs.');
    return {
      type: 'redis-stream',
      envPrefix,
      idField,
      stream: input.stream,
      fields
    };
  }

  throw new Error(`Unsupported connector source: ${input.source satisfies never}`);
}

function sanitizeJobName(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!sanitized) throw new Error('Connector job name must contain at least one letter or digit.');
  return sanitized.slice(0, 80);
}

function defaultEnvPrefix(source: ConnectorSourceType): string {
  if (source === 'redis-stream') return 'REDIS';
  return source.toUpperCase();
}

function resolveConnectorRoot(): string {
  const envRoot = process.env.VIKING_CONNECTOR_ROOT?.trim();
  if (envRoot) return path.resolve(envRoot);
  if (process.platform === 'win32') {
    return path.join(os.tmpdir(), 'viking', 'connector');
  }
  return '/tmp/viking/connector';
}

function parseFields(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const fields = value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  return fields.length > 0 ? fields : undefined;
}

function parseInitialCursor(value: string | undefined, type: string | undefined): string | number | undefined {
  if (value === undefined) return undefined;
  if (type === 'number') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`Invalid numeric initial cursor: ${value}`);
    return parsed;
  }
  return value;
}
