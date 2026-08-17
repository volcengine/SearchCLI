// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetIngestWorkflowCommand } from '../../app/workflow-commands';
import { workflowServiceFlags } from '../../command-support/service-flags';

export default class DatasetIngest extends Command {
  static override description =
    'Run the remaining dataset-ingest workflow from a local file (`--file --type`) or write explicit rows into an existing dataset (`--dataset-id --fields`).';

  static override examples = [
    '<%= config.bin %> dataset ingest --file ./items.jsonl --type item --dataset-name demo-items',
    '<%= config.bin %> dataset ingest --file ./items.jsonl --type item --industry ecommerce --language zh --dry-run',
    '<%= config.bin %> dataset ingest --file ./products.jsonl --type multi_modal --theme e_commerce --abnormal-image-policy skip --industry ecommerce --language zh',
    '<%= config.bin %> dataset ingest --dataset-id 123 --fields @items.json'
  ];

  static override flags = {
    ...workflowServiceFlags,
    // V2 onboarding chain
    file: Flags.string({
      description: 'Local file path to upload via GetPresignedImportUrlV2. Required for V2 onboarding chain.'
    }),
    type: Flags.string({
      description: 'Dataset type for the V2 chain: user_event|multi_modal.'
    }),
    'dataset-name': Flags.string({
      description: 'Optional dataset name used during inference and create.'
    }),
    industry: Flags.string({ description: 'Industry hint forwarded to V2 inference/create.' }),
    language: Flags.string({ description: 'Language hint: zh|en|ko|ja|hi.' }),
    theme: Flags.string({
      description:
        'Theme/domain hint for multi_modal datasets (general|e_commerce|content|long_video). Required when --type=multi_modal.'
    }),
    'abnormal-image-policy': Flags.string({
      description: 'ProcessConfig.AbnormalImageDataProcessPolicy (skip|block). For multi_modal datasets.'
    }),
    'abnormal-video-policy': Flags.string({
      description: 'ProcessConfig.AbnormalVideoDataProcessPolicy (skip|block). For multi_modal datasets.'
    }),
    'video-auto-delete': Flags.boolean({
      description: 'ProcessConfig.VideoAutoDelete: auto-delete source videos after processing.'
    }),
    'post-paid-type': Flags.string({
      description:
        'Post-paid tier for post-paid billing instances: standard|premium. Post-paid instances must set this; omit for non-post-paid (none).',
      options: ['standard', 'premium', 'none']
    }),
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
      apiKey: flags['api-key'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      file: flags.file,
      type: flags.type,
      datasetName: flags['dataset-name'],
      industry: flags.industry,
      language: flags.language,
      theme: flags.theme,
      abnormalImagePolicy: flags['abnormal-image-policy'],
      abnormalVideoPolicy: flags['abnormal-video-policy'],
      videoAutoDelete: flags['video-auto-delete'],
      postPaidType: flags['post-paid-type'],
      schemaWaitTimeoutMs: flags['schema-wait-timeout-ms'],
      schemaPollIntervalMs: flags['schema-poll-interval-ms'],
      dryRun: flags['dry-run'],
      datasetId: flags['dataset-id'],
      fields: flags.fields
    });
  }
}
