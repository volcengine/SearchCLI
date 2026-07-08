// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import type { ConnectorCursor, ConnectorCursorConfig } from '../types';

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
  if (Buffer.isBuffer(value)) return value.toString('base64');
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
