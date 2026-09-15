// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppDatasetBindWorkflowCommand } from '../../../app/workflow-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class AppDatasetBind extends Command {
  static override description =
    'Bind a dataset to an application with an explicit bind-time field config. This command does not infer missing fields; for item/video datasets, prefer a reviewed field-config.json that already contains IndexFields, FilterFields, SuggestFields, and media field groups when needed.';

  static override examples = [
    '<%= config.bin %> app dataset bind --application-id 123 --dataset-id 456 --field-config @field-config.json',
    '<%= config.bin %> app dataset bind --application-id 123 --dataset-id 456 --field-config ./.viking/item-plans/<plan>/field-config.json',
    '<%= config.bin %> app dataset bind --application-id 123 --dataset-id 456 --field-config @field-config.json --dry-run'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'dataset-id': Flags.string({ required: true, description: 'Viking dataset ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    'dry-run': Flags.boolean({ description: 'Validate only without persisting the change.' }),
    'backtrack-enable': Flags.boolean({ description: 'Enable backtrack for behavior datasets.' }),
    'backtrack-all': Flags.boolean({ description: 'Backtrack all historical data for behavior datasets.' }),
    'backtrack-start': Flags.string({ description: 'Backtrack start date (e.g., 20230101).' }),
    'backtrack-end': Flags.string({ description: 'Backtrack end date (e.g., 20231231).' }),
    'field-config': Flags.string({
      description:
        'Inline JSON, @file path, or JSON file path for bind-time field config. For item/video datasets, provide IndexFields, FilterFields, SuggestFields, and ImageIndexFields explicitly.'
    }),
    'schema-version': Flags.integer({ description: 'Optional specific schema version.' }),
    'field-config-version': Flags.integer({ description: 'Optional specific field config version.' }),
    'online-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for online config.' }),
    'wait-ready': Flags.boolean({ description: 'Block and wait until the application is ready.' }),
    'wait-timeout-ms': Flags.integer({ description: 'Timeout in milliseconds for wait-ready.' }),
    'poll-interval-ms': Flags.integer({ description: 'Polling interval in milliseconds for wait-ready.' }),
    'activated-only': Flags.boolean({ description: 'Only check activated app instances.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppDatasetBind);
    await runAppDatasetBindWorkflowCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      applicationId: flags['application-id'],
      datasetId: flags['dataset-id'],
      dryRun: flags['dry-run'],
      backtrackEnable: flags['backtrack-enable'],
      backtrackAll: flags['backtrack-all'],
      backtrackStart: flags['backtrack-start'],
      backtrackEnd: flags['backtrack-end'],
      fieldConfig: flags['field-config'],
      schemaVersion: flags['schema-version'],
      fieldConfigVersion: flags['field-config-version'],
      onlineConfig: flags['online-config'],
      waitReady: flags['wait-ready'],
      waitTimeoutMs: flags['wait-timeout-ms'],
      pollIntervalMs: flags['poll-interval-ms'],
      activatedOnly: flags['activated-only']
    });
  }
}
