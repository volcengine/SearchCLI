// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import type { ConnectorSource, ConnectorSourceConfig } from '../types';
import { JsonlConnectorSource } from './jsonl';
import { MongoConnectorSource } from './mongo';
import { MySqlConnectorSource } from './mysql';
import { RedisStreamConnectorSource } from './redis-stream';

export function createConnectorSource(config: ConnectorSourceConfig): ConnectorSource {
  switch (config.type) {
    case 'mysql':
      return new MySqlConnectorSource(config);
    case 'mongo':
      return new MongoConnectorSource(config);
    case 'redis-stream':
      return new RedisStreamConnectorSource(config);
    case 'jsonl':
      return new JsonlConnectorSource(config);
    default:
      throw new Error(`Unsupported connector source type: ${(config as { type?: string }).type}`);
  }
}
