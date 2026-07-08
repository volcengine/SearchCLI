// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetIngestWorkflowCommand } from '../../app/workflow-commands';
import { workflowServiceFlags } from '../../command-support/service-flags';

export default class DatasetIngest extends Command {
  static override description =
    'Onboard data into Viking. Two modes: V2 onboarding chain (`--file --type` → import-url → upload → infer-schema → infer-result → dataset create) for first-time dataset creation; legacy data-write (`--dataset-id --fields`) for runtime ingestion into an existing dataset.';

  static override examples = [
    '<%= config.bin %> dataset ingest --file ./items.jsonl --type item --dataset-name demo-items',
    '<%= config.bin %> dataset ingest --file ./items.jsonl --type item --industry ecommerce --language zh --dry-run',
    '<%= config.bin %> dataset ingest --dataset-id 123 --fields @items.json'
  ];

  static override flags = {
    ...workflowServiceFlags,
    // V2 onboarding chain
    file: Flags.string({
      description: 'Local file path to upload via GetPresignedImportUrlV2. Required for V2 onboarding chain.'
    }),
    type: Flags.string({
      description: 'Dataset type for the V2 chain: item|video|user_event|document|multi_modal.'
    }),
    'dataset-name': Flags.string({
      description: 'Optional dataset name used during inference and create.'
    }),
    industry: Flags.string({ description: 'Industry hint forwarded to V2 inference/create.' }),
    language: Flags.string({ description: 'Language hint: zh|en|ja.' }),
    'schema-wait-timeout-ms': Flags.integer({
      description: 'Timeout in milliseconds for polling the schema inference task. Default 120000.'
    }),
    'schema-poll-interval-ms': Flags.integer({
      description: 'Polling interval in milliseconds for the schema inference task. Default 2000.'
    }),
    'dry-run': Flags.boolean({
      description: 'Validate the dataset create at the end without persisting (DryRun=true).'
    }),
    // Legacy data-write
    'dataset-id': Flags.string({
      description: 'Legacy mode: target dataset ID for runtime data-write. Pair with --fields.'
    }),
    fields: Flags.string({
      description: 'Legacy mode: inline JSON array, @file path, or JSON file path containing the fields array.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetIngest);
    await runDatasetIngestWorkflowCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      file: flags.file,
      type: flags.type,
      datasetName: flags['dataset-name'],
      industry: flags.industry,
      language: flags.language,
      schemaWaitTimeoutMs: flags['schema-wait-timeout-ms'],
      schemaPollIntervalMs: flags['schema-poll-interval-ms'],
      dryRun: flags['dry-run'],
      datasetId: flags['dataset-id'],
      fields: flags.fields
    });
  }
}
