// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runConnectorInitCommand } from '../../app/connector-commands';
import { outputFormatFlags } from '../../command-support/service-flags';
import type { ConnectorCursorType, ConnectorSourceType } from '../../core/connector/types';

export default class ConnectorInit extends Command {
  static override description = [
    'Create a local connector job config for incremental source-to-dataset sync.',
    'The job config is stored under /tmp/viking/connector/<name>/config.json and is later consumed by `vs connector run --job <name>`.',
    '--output only redirects the rendered command result; it does not change the saved connector config path.'
  ].join('\n\n');

  static override examples = [
    '<%= config.bin %> connector init --name product_mysql --source mysql --dataset-id ds_xxx --source-table products --id-field id --cursor-field updated_at'
  ];

  static override flags = {
    ...outputFormatFlags,
    name: Flags.string({ required: true, description: 'Local connector job name. It determines the runtime directory /tmp/viking/connector/<name>/.' }),
    source: Flags.string({
      required: true,
      options: ['mysql'],
      description: 'External source connector type. Currently only mysql is supported.'
    }),
    'dataset-id': Flags.string({ required: true, description: 'Target Viking dataset ID.' }),
    'env-prefix': Flags.string({
      description: 'Environment variable prefix for source credentials. Defaults to MYSQL.'
    }),
    'id-field': Flags.string({ description: 'Source record ID field. Defaults to id for MySQL and _id otherwise.' }),
    fields: Flags.string({ description: 'Comma-separated source fields to write. Defaults to all fields.' }),
    'cursor-field': Flags.string({ description: 'Incremental cursor/watermark field for polling sources. For integer MySQL IDs such as id, pair it with --cursor-type number.' }),
    'cursor-type': Flags.string({
      options: ['timestamp', 'number', 'string'],
      description: 'Cursor value type. Use number for integer IDs such as MySQL auto-increment id. Defaults to timestamp for polling sources.'
    }),
    'initial-cursor': Flags.string({ description: 'Initial cursor value when no state exists.' }),
    'source-table': Flags.string({ description: 'MySQL table name, optionally schema-qualified. Required when --source mysql.' }),
    where: Flags.string({ description: 'Additional MySQL WHERE clause without the WHERE keyword.' }),
    database: Flags.string({ description: 'Mongo database name.' }),
    collection: Flags.string({ description: 'Mongo collection name.' }),
    stream: Flags.string({ description: 'Redis Stream key.' }),
    'batch-size': Flags.integer({ description: 'Maximum source rows/messages per polling batch.' }),
    'interval-ms': Flags.integer({ description: 'Polling interval for continuous runs.' }),
    output: Flags.string({
      char: 'o',
      description: 'Write the rendered command result to a file instead of stdout. This does not change the saved connector config path.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConnectorInit);
    if (flags.source !== 'mysql') {
      this.error(`Unsupported --source "${flags.source}". Currently only "mysql" is supported.`);
    }
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
