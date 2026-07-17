// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import type {
  ConnectorCursor,
  ConnectorCursorConfig,
  ConnectorEnvRequirement,
  ConnectorSourceType
} from '../types';

export async function dynamicImport<T = any>(specifier: string): Promise<T> {
  const importer = new Function('specifier', 'return import(specifier)') as (value: string) => Promise<T>;
  try {
    return await importer(specifier);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Missing optional connector dependency "${specifier}". Run npm install in this CLI package before using this connector. Original error: ${message}`);
  }
}

export function readEnv(prefix: string, key: string, required = true): string | undefined {
  const name = `${prefix}_${key}`;
  const value = process.env[name];
  if (required && (!value || value.length === 0)) {
    throw new Error(`Missing required environment variable ${name}.`);
  }
  return value;
}

export function getSourceEnvRequirements(
  source: ConnectorSourceType,
  envPrefix: string
): ConnectorEnvRequirement[] {
  switch (source) {
    case 'mysql':
      return [
        { key: `${envPrefix}_HOST`, required: true, description: 'MySQL host name or IP.' },
        { key: `${envPrefix}_PORT`, required: false, description: 'MySQL port. Defaults to 3306.' },
        { key: `${envPrefix}_USER`, required: true, description: 'MySQL username.' },
        { key: `${envPrefix}_PASSWORD`, required: true, description: 'MySQL password.' },
        { key: `${envPrefix}_DATABASE`, required: true, description: 'MySQL database name.' },
        { key: `${envPrefix}_CHARSET`, required: false, description: 'Optional MySQL connection charset/collation override. Defaults to utf8mb4.' }
      ];
    case 'mongo':
      return [
        { key: `${envPrefix}_URI`, required: true, description: 'Mongo connection URI.' }
      ];
    case 'redis-stream':
      return [
        { key: `${envPrefix}_URL`, required: true, description: 'Redis connection URL.' }
      ];
    case 'jsonl':
      return [];
    default:
      return [];
  }
}

export function assertSourceEnvConfigured(source: ConnectorSourceType, envPrefix: string): void {
  const requirements = getSourceEnvRequirements(source, envPrefix);
  const missing = requirements
    .filter(item => item.required)
    .map(item => item.key)
    .filter(name => {
      const value = process.env[name];
      return !value || value.length === 0;
    });

  if (missing.length === 0) return;

  const guidance = requirements
    .map(item => `${item.key}${item.required ? '' : ' (optional)'}`)
    .join(', ');
  throw new Error(
    `Missing required environment variables for ${source}: ${missing.join(', ')}. Set the source config in environment variables, not in chat. Expected variables: ${guidance}.`
  );
}

export function pickFields(record: Record<string, unknown>, fields: string[] | undefined): Record<string, unknown> {
  const normalized = normalizeRecord(record);
  if (!fields || fields.length === 0) return normalized;
  const selected: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in normalized) selected[field] = normalized[field];
  }
  return selected;
}

export function normalizeRecord(record: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    output[key] = normalizeValue(value);
  }
  return output;
}

export function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (Buffer.isBuffer(value)) return normalizeBufferValue(value);
  if (Array.isArray(value)) return value.map(item => normalizeValue(item));
  if (typeof value === 'object') {
    const maybeObjectId = value as { toHexString?: () => string; _bsontype?: string };
    if (typeof maybeObjectId.toHexString === 'function') return maybeObjectId.toHexString();
    const nested: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      nested[key] = normalizeValue(nestedValue);
    }
    return nested;
  }
  return value;
}

function normalizeBufferValue(value: Buffer): string {
  if (value.length === 0) return '';

  // Prefer human-readable UTF-8 text when the bytes round-trip cleanly.
  const decoded = value.toString('utf8');
  if (decoded.includes('\uFFFD')) {
    return value.toString('base64');
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(decoded)) {
    return value.toString('base64');
  }
  return Buffer.compare(Buffer.from(decoded, 'utf8'), value) === 0
    ? decoded
    : value.toString('base64');
}

export function cursorFromRecord(
  record: Record<string, unknown>,
  cursorConfig: ConnectorCursorConfig,
  idField: string
): ConnectorCursor {
  const value = normalizeCursorValue(record[cursorConfig.field], cursorConfig.type);
  const id = record[idField] === undefined ? undefined : String(normalizeValue(record[idField]));
  return { value, id };
}

export function normalizeCursorValue(value: unknown, type: ConnectorCursorConfig['type']): string | number | undefined {
  if (value === undefined || value === null) return undefined;
  if (type === 'number') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`Cursor value is not numeric: ${String(value)}`);
    return parsed;
  }
  if (value instanceof Date) return value.toISOString();
  return String(normalizeValue(value));
}
