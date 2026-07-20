// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import type { ConnectorChange, ConnectorCursor, ConnectorSource, RedisStreamConnectorSourceConfig } from '../types';
import { dynamicImport, normalizeRecord, pickFields, readEnv } from './helpers';

type RedisClientType = {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  xRead(
    streams: Array<{ key: string; id: string }>,
    options: { COUNT: number }
  ): Promise<Array<{ name: string; messages: Array<{ id: string; message: Record<string, string> }> }> | null>;
};

export class RedisStreamConnectorSource implements ConnectorSource {
  readonly type = 'redis-stream' as const;
  private client: RedisClientType | undefined;

  constructor(private readonly config: RedisStreamConnectorSourceConfig) {}

  async open(): Promise<void> {
    const redis = await dynamicImport<{ createClient(options: { url: string }): RedisClientType }>('redis');
    const url = readEnv(this.config.envPrefix, 'URL');
    if (!url) throw new Error(`Missing required environment variable ${this.config.envPrefix}_URL.`);
    this.client = redis.createClient({ url });
    await this.client.connect();
  }

  async close(): Promise<void> {
    if (this.client) await this.client.disconnect();
  }

  async *readChanges(cursor: ConnectorCursor | undefined, limit: number): AsyncIterable<ConnectorChange> {
    if (!this.client) throw new Error('Redis Stream connector source is not open.');

    const startId = cursor?.id ?? '0-0';
    const response = await this.client.xRead([{ key: this.config.stream, id: startId }], { COUNT: limit });
    const stream = response?.find(item => item.name === this.config.stream);
    if (!stream) return;

    for (const item of stream.messages) {
      const rawFields = normalizeRecord(item.message);
      const idValue = rawFields[this.config.idField] ?? item.id;
      yield {
        op: 'upsert',
        id: String(idValue),
        fields: pickFields({ ...rawFields, _stream_id: item.id }, this.config.fields),
        cursor: {
          value: item.id,
          id: item.id
        }
      };
    }
  }
}
