// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDataSourceSubscriptionCloseCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class DatasetSubscriptionClose extends Command {
  static override description = 'Close a dataset data source subscription.';

  static override examples = [
    '<%= config.bin %> dataset subscription close --task-id task_123',
    '<%= config.bin %> dataset subscription close --data @close-subscription.json'
  ];

  static override flags = {
    ...serviceFlags,
    'task-id': Flags.string({
      description: 'Data source subscription task ID. Required unless --data provides TaskId.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetSubscriptionClose);
    await runDataSourceSubscriptionCloseCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      apiKey: flags['api-key'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      taskId: flags['task-id']
    });
  }
}
