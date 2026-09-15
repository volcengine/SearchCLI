// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetIngestWorkflowCommand } from '../../app/workflow-commands';
import { workflowServiceFlags } from '../../command-support/service-flags';

export default class DatasetIngest extends Command {
  static override description =
    'Import a batch of records into a dataset with a task-oriented workflow command. In a plan-driven dataset-only flow, pair this with `dataset create --data @dataset-create.json` and pass the generated normalized-items artifact to `--fields`.';

  static override examples = [
    '<%= config.bin %> dataset ingest --dataset-id 123 --fields @items.json',
    '<%= config.bin %> dataset ingest --dataset-id 123 --fields ./.viking/item-plans/<plan>/normalized-items.json'
  ];

  static override flags = {
    ...workflowServiceFlags,
    'dataset-id': Flags.string({ required: true }),
    fields: Flags.string({
      description:
        'Inline JSON array, @file path, or JSON file path containing the fields array. When ingesting from an item plan, prefer normalized-items.json.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetIngest);
    await runDatasetIngestWorkflowCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      datasetId: flags['dataset-id'],
      fields: flags.fields
    });
  }
}
