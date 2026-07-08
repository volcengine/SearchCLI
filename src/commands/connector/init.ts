// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runConnectorInitCommand } from '../../app/connector-commands';
import { outputFormatFlags } from '../../command-support/service-flags';
import type { ConnectorCursorType, ConnectorSourceType } from '../../core/connector/types';

export default class ConnectorInit extends Command {
  static override description = 'Create a local connector job config for incremental source-to-dataset sync.';

  static override examples = [
    '<%= config.bin %> connector init --name product_mysql --source mysql --dataset-id ds_xxx --source-table products --id-field id --cursor-field updated_at',
    '<%= config.bin %> connector init --name product_mongo --source mongo --dataset-id ds_xxx --database shop --collection products --id-field _id --cursor-field updatedAt',
    '<%= config.bin %> connector init --name product_stream --source redis-stream --dataset-id ds_xxx --stream products:changes --id-field id'
  ];

  static override flags = {
    ...outputFormatFlags,
    name: Flags.string({ required: true, description: 'Local connector job name.' }),
    source: Flags.string({
      required: true,
      options: ['mysql', 'mongo', 'redis-stream'],
      description: 'External source connector type.'
    }),
    'dataset-id': Flags.string({ required: true, description: 'Target Viking dataset ID.' }),
    'env-prefix': Flags.string({
      description: 'Environment variable prefix for source credentials, for example MYSQL or MONGO.'
    }),
    'id-field': Flags.string({ description: 'Source record ID field. Defaults to id for MySQL and _id otherwise.' }),
    fields: Flags.string({ description: 'Comma-separated source fields to write. Defaults to all fields.' }),
    'cursor-field': Flags.string({ description: 'Incremental cursor/watermark field for polling sources.' }),
    'cursor-type': Flags.string({
      options: ['timestamp', 'number', 'string'],
      description: 'Cursor value type. Defaults to timestamp for polling sources.'
    }),
    'initial-cursor': Flags.string({ description: 'Initial cursor value when no state exists.' }),
    'source-table': Flags.string({ description: 'MySQL table name, optionally schema-qualified.' }),
    where: Flags.string({ description: 'Additional MySQL WHERE clause without the WHERE keyword.' }),
    database: Flags.string({ description: 'Mongo database name.' }),
    collection: Flags.string({ description: 'Mongo collection name.' }),
    stream: Flags.string({ description: 'Redis Stream key.' }),
    'batch-size': Flags.integer({ description: 'Maximum source rows/messages per polling batch.' }),
    'interval-ms': Flags.integer({ description: 'Polling interval for continuous runs.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConnectorInit);
    await runConnectorInitCommand({
      name: flags.name,
      source: flags.source as ConnectorSourceType,
      datasetId: flags['dataset-id'],
      envPrefix: flags['env-prefix'],
      idField: flags['id-field'],
      fields: flags.fields,
      cursorField: flags['cursor-field'],
      cursorType: flags['cursor-type'] as ConnectorCursorType | undefined,
      initialCursor: flags['initial-cursor'],
      table: flags['source-table'],
      where: flags.where,
      database: flags.database,
      collection: flags.collection,
      stream: flags.stream,
      batchSize: flags['batch-size'],
      intervalMs: flags['interval-ms']
    });
  }
}
