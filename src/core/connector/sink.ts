// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { VikingRuntimeApiClient } from '../runtime-api-client';
import type { ServiceConfig } from '../service-config';
import type { ConnectorChange, ConnectorSinkConfig, ConnectorState } from './types';

export interface ConnectorFlushResult {
  upsertCount: number;
  importedIds: string[];
  ignoredDeleteCount: number;
  ignoredDeleteIds: string[];
}

export class ConnectorSink {
  private readonly client: VikingRuntimeApiClient;
  private readonly upserts: Array<{ id: string; fields: Record<string, unknown> }> = [];
  private readonly ignoredDeleteIds: string[] = [];

  constructor(
    private readonly config: ConnectorSinkConfig,
    serviceConfig: ServiceConfig
  ) {
    this.client = new VikingRuntimeApiClient(serviceConfig);
  }

  buffer(change: ConnectorChange): void {
    if (change.op === 'delete') {
      if (this.config.deleteMode !== 'ignore') {
        throw new Error(`Unsupported connector delete mode: ${this.config.deleteMode}`);
      }
      this.ignoredDeleteIds.push(change.id);
      return;
    }

    if (!change.fields) {
      throw new Error(`Upsert change ${change.id} did not include fields.`);
    }
    this.upserts.push({
      id: change.id,
      fields: change.fields
    });
  }

  async flush(state: ConnectorState): Promise<ConnectorFlushResult> {
    const batch = this.upserts.splice(0, this.upserts.length);
    const ignoredDeleteIds = this.ignoredDeleteIds.splice(0, this.ignoredDeleteIds.length);

    if (batch.length > 0) {
      await this.client.dataWrite(this.config.datasetId, {
        fields: batch.map(item => item.fields)
      });
      state.stats.upserted += batch.length;
      state.stats.batches += 1;
    }

    if (ignoredDeleteIds.length > 0) {
      state.stats.ignoredDeletes += ignoredDeleteIds.length;
    }

    return {
      upsertCount: batch.length,
      importedIds: batch.map(item => item.id),
      ignoredDeleteCount: ignoredDeleteIds.length,
      ignoredDeleteIds
    };
  }
}
