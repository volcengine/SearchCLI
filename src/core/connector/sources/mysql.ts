// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import type { ConnectorChange, ConnectorCursor, ConnectorSource, MySqlConnectorSourceConfig } from '../types';
import {
  cursorFromRecord,
  dynamicImport,
  pickFields,
  readEnv
} from './helpers';

type MySqlConnection = {
  query(sql: string, values: unknown[]): Promise<[Record<string, unknown>[]]>;
  end(): Promise<void>;
};

export class MySqlConnectorSource implements ConnectorSource {
  readonly type = 'mysql' as const;
  private connection: MySqlConnection | undefined;

  constructor(private readonly config: MySqlConnectorSourceConfig) {}

  async open(): Promise<void> {
    const mysql = await dynamicImport<{ createConnection(options: Record<string, unknown>): Promise<MySqlConnection> }>('mysql2/promise');
    const charset = readEnv(this.config.envPrefix, 'CHARSET', false)?.trim() || 'utf8mb4';
    this.connection = await mysql.createConnection({
      host: readEnv(this.config.envPrefix, 'HOST'),
      port: Number(readEnv(this.config.envPrefix, 'PORT', false) ?? 3306),
      user: readEnv(this.config.envPrefix, 'USER'),
      password: readEnv(this.config.envPrefix, 'PASSWORD'),
      database: readEnv(this.config.envPrefix, 'DATABASE'),
      charset,
      timezone: 'Z',
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: false
    });
  }

  async close(): Promise<void> {
    if (this.connection) await this.connection.end();
  }

  async *readChanges(cursor: ConnectorCursor | undefined, limit: number): AsyncIterable<ConnectorChange> {
    if (!this.connection) throw new Error('MySQL connector source is not open.');

    const effectiveCursor = cursor?.value === undefined && this.config.cursor.initial !== undefined
      ? { value: this.config.cursor.initial }
      : cursor;
    const params: unknown[] = [];
    const clauses: string[] = [];
    if (this.config.where) clauses.push(`(${this.config.where})`);
    if (effectiveCursor?.value !== undefined) {
      clauses.push(`(${quoteIdentifier(this.config.cursor.field)} > ? OR (${quoteIdentifier(this.config.cursor.field)} = ? AND ${quoteIdentifier(this.config.idField)} > ?))`);
      params.push(effectiveCursor.value, effectiveCursor.value, effectiveCursor.id ?? '');
    }
    params.push(limit);

    const sql = [
      `SELECT * FROM ${quoteIdentifierPath(this.config.table)}`,
      clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      `ORDER BY ${quoteIdentifier(this.config.cursor.field)} ASC, ${quoteIdentifier(this.config.idField)} ASC`,
      'LIMIT ?'
    ].filter(Boolean).join(' ');

    // Use text-protocol query execution here instead of server-side prepared
    // statements. Some MySQL deployments reject the prepared-statement form
    // used by `execute(...)` for this connector query shape with
    // `Incorrect arguments to mysqld_stmt_execute`.
    const [rows] = await this.connection.query(sql, params);
    for (const row of rows) {
      const id = row[this.config.idField];
      if (id === undefined || id === null) {
        throw new Error(`MySQL row is missing id field "${this.config.idField}".`);
      }
      yield {
        op: 'upsert',
        id: String(id),
        fields: pickFields(row, this.config.fields),
        cursor: cursorFromRecord(row, this.config.cursor, this.config.idField)
      };
    }
  }
}

function quoteIdentifierPath(value: string): string {
  return value.split('.').map(quoteIdentifier).join('.');
}

function quoteIdentifier(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Unsafe MySQL identifier: ${value}`);
  }
  return `\`${value}\``;
}
