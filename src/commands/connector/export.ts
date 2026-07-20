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
    '<%= config.bin %> connector export --source jsonl --file /tmp/crawler/items.jsonl --dataset-name crawler-items'
  ];

  static override flags = {
    ...outputFormatFlags,
    source: Flags.string({
      required: true,
      options: ['mysql', 'jsonl'],
      description: 'External source type to export from. Supported: mysql, jsonl.'
    }),
    job: Flags.string({
      description: 'Optional local bootstrap job name. It determines /tmp/viking/connector/<job>/bootstrap/items.jsonl. Defaults to dataset name or source object name.'
    }),
    'dataset-name': Flags.string({
      description: 'Optional dataset name hint used when deriving the bootstrap job name when --job is omitted.'
    }),
    'env-prefix': Flags.string({
      description: 'Environment variable prefix for source credentials. Defaults to MYSQL for mysql, JSONL for jsonl.'
    }),
    'id-field': Flags.string({
      description: 'Source record ID field. Defaults to id.'
    }),
    fields: Flags.string({
      description: 'Comma-separated subset of source fields to export. Defaults to all fields.'
    }),
    'cursor-field': Flags.string({
      description: 'Source cursor/watermark field used to record the exported checkpoint for mysql sources. For integer MySQL IDs such as id, pair it with --cursor-type number. Not used for jsonl.'
    }),
    'cursor-type': Flags.string({
      options: ['timestamp', 'number', 'string'],
      description: 'Cursor value type for mysql sources. Use number for integer IDs such as MySQL auto-increment id. Defaults to timestamp.'
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
    file: Flags.string({
      description: 'Path to the JSONL file. Required when --source jsonl.'
    }),
    'batch-size': Flags.integer({
      description: 'Maximum records per bootstrap batch.'
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
    if (flags.source !== 'mysql' && flags.source !== 'jsonl') {
      this.error(`Unsupported --source "${flags.source}". Currently only "mysql" and "jsonl" are supported.`);
    }
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
      file: flags.file,
      batchSize: flags['batch-size'],
      intervalMs: flags['interval-ms']
    });
  }
}
