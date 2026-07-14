// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runConnectorExportCommand } from '../../app/connector-commands';
import { outputFormatFlags } from '../../command-support/service-flags';
import type { ConnectorCursorType, ConnectorSourceType } from '../../core/connector/types';

export default class ConnectorExport extends Command {
  static override description = [
    'Export a source snapshot into a local JSONL bootstrap artifact for dataset creation.',
    'The bootstrap JSONL is always written to /tmp/viking/connector/<job>/bootstrap/items.jsonl.',
    '--output only redirects the rendered command result; it does not change the bootstrap JSONL path.'
  ].join('\n\n');

  static override examples = [
    '<%= config.bin %> connector export --source mysql --source-table products --id-field id --cursor-field updated_at --dataset-name demo-items',
    '<%= config.bin %> connector export --source mysql --source-table products --id-field id --cursor-field id --cursor-type number --dataset-name demo-items --job demo-items-sync',
    '<%= config.bin %> connector export --source mongo --database shop --collection products --id-field _id --cursor-field updatedAt --job shop-products',
    '<%= config.bin %> connector export --source redis-stream --stream products:changes --id-field id --job stream-bootstrap'
  ];

  static override flags = {
    ...outputFormatFlags,
    source: Flags.string({
      required: true,
      options: ['mysql', 'mongo', 'redis-stream'],
      description: 'External source type to export from.'
    }),
    job: Flags.string({
      description: 'Optional local bootstrap job name. It determines /tmp/viking/connector/<job>/bootstrap/items.jsonl. Defaults to dataset name or source object name.'
    }),
    'dataset-name': Flags.string({
      description: 'Optional dataset name hint used when deriving the bootstrap job name when --job is omitted.'
    }),
    'env-prefix': Flags.string({
      description: 'Environment variable prefix for source credentials, for example MYSQL or MONGO.'
    }),
    'id-field': Flags.string({
      description: 'Source record ID field. Defaults to id for MySQL and _id otherwise.'
    }),
    fields: Flags.string({
      description: 'Comma-separated subset of source fields to export. Defaults to all fields.'
    }),
    'cursor-field': Flags.string({
      description: 'Source cursor/watermark field used to record the exported checkpoint. For integer MySQL IDs such as id, pair it with --cursor-type number.'
    }),
    'cursor-type': Flags.string({
      options: ['timestamp', 'number', 'string'],
      description: 'Cursor value type. Use number for integer IDs such as MySQL auto-increment id. Defaults to timestamp for polling sources.'
    }),
    'initial-cursor': Flags.string({
      description: 'Optional initial cursor value.'
    }),
    'source-table': Flags.string({
      description: 'MySQL table name, optionally schema-qualified. Required when --source mysql.'
    }),
    where: Flags.string({
      description: 'Optional MySQL WHERE clause without the WHERE keyword.'
    }),
    database: Flags.string({
      description: 'Mongo database name.'
    }),
    collection: Flags.string({
      description: 'Mongo collection name.'
    }),
    stream: Flags.string({
      description: 'Redis Stream key.'
    }),
    'batch-size': Flags.integer({
      description: 'Maximum source rows/messages per bootstrap batch.'
    }),
    'interval-ms': Flags.integer({
      description: 'Polling interval metadata recorded for later sync setup.'
    }),
    output: Flags.string({
      char: 'o',
      description: 'Write the rendered command result to a file instead of stdout. This does not change the exported JSONL path.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConnectorExport);
    await runConnectorExportCommand({
      source: flags.source as ConnectorSourceType,
      job: flags.job,
      datasetName: flags['dataset-name'],
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
