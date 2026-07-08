// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import type { ConnectorChange, ConnectorCursor, ConnectorSource, MongoConnectorSourceConfig } from '../types';
import {
  cursorFromRecord,
  dynamicImport,
  normalizeCursorValue,
  pickFields,
  readEnv
} from './helpers';

type MongoClientType = {
  close(): Promise<void>;
  db(name: string): {
    collection(name: string): MongoCollectionType;
  };
};

type MongoCollectionType = {
  find(query: Record<string, unknown>): {
    sort(value: Record<string, 1 | -1>): {
      limit(value: number): {
        toArray(): Promise<Record<string, unknown>[]>;
      };
    };
  };
};

export class MongoConnectorSource implements ConnectorSource {
  readonly type = 'mongo' as const;
  private client: MongoClientType | undefined;
  private collection: MongoCollectionType | undefined;
  private ObjectId: ((value: string) => unknown) | undefined;

  constructor(private readonly config: MongoConnectorSourceConfig) {}

  async open(): Promise<void> {
    const mongodb = await dynamicImport<{
      MongoClient: { new(uri: string): MongoClientType & { connect(): Promise<MongoClientType> } };
      ObjectId: { new(value: string): unknown };
    }>('mongodb');
    const uri = readEnv(this.config.envPrefix, 'URI');
    if (!uri) throw new Error(`Missing required environment variable ${this.config.envPrefix}_URI.`);
    const client = new mongodb.MongoClient(uri);
    this.client = await client.connect();
    this.collection = this.client.db(this.config.database).collection(this.config.collection);
    this.ObjectId = (value: string) => new mongodb.ObjectId(value);
  }

  async close(): Promise<void> {
    if (this.client) await this.client.close();
  }

  async *readChanges(cursor: ConnectorCursor | undefined, limit: number): AsyncIterable<ConnectorChange> {
    if (!this.collection) throw new Error('Mongo connector source is not open.');

    const effectiveCursor = cursor?.value === undefined && this.config.cursor.initial !== undefined
      ? { value: this.config.cursor.initial }
      : cursor;
    const query = this.buildCursorQuery(effectiveCursor);
    const rows = await this.collection
      .find(query)
      .sort({ [this.config.cursor.field]: 1, [this.config.idField]: 1 })
      .limit(limit)
      .toArray();

    for (const row of rows) {
      const id = row[this.config.idField];
      if (id === undefined || id === null) {
        throw new Error(`Mongo document is missing id field "${this.config.idField}".`);
      }
      yield {
        op: 'upsert',
        id: String(id),
        fields: pickFields(row, this.config.fields),
        cursor: cursorFromRecord(row, this.config.cursor, this.config.idField)
      };
    }
  }

  private buildCursorQuery(cursor: ConnectorCursor | undefined): Record<string, unknown> {
    if (cursor?.value === undefined) return {};
    const cursorValue = this.toMongoCursorValue(cursor.value);
    const idValue = cursor.id === undefined ? '' : this.toMongoIdValue(cursor.id);
    return {
      $or: [
        { [this.config.cursor.field]: { $gt: cursorValue } },
        {
          [this.config.cursor.field]: cursorValue,
          [this.config.idField]: { $gt: idValue }
        }
      ]
    };
  }

  private toMongoCursorValue(value: string | number): unknown {
    const normalized = normalizeCursorValue(value, this.config.cursor.type);
    if (this.config.cursor.type === 'timestamp' && typeof normalized === 'string') {
      return new Date(normalized);
    }
    return normalized;
  }

  private toMongoIdValue(value: string): unknown {
    if (this.config.idField === '_id' && this.ObjectId && /^[a-fA-F0-9]{24}$/.test(value)) {
      return this.ObjectId(value);
    }
    return value;
  }
}
