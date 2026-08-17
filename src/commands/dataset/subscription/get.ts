// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDataSourceSubscriptionGetCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class DatasetSubscriptionGet extends Command {
  static override description = 'Get a data-source subscription task by ID.';

  static override examples = [
    '<%= config.bin %> dataset subscription get --task-id task_xxx',
    '<%= config.bin %> dataset subscription get --data @subscription-get.json'
  ];

  static override flags = {
    ...serviceFlags,
    'task-id': Flags.string({
      description: 'Data-source subscription task ID. Required unless --data provides TaskId.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetSubscriptionGet);
    await runDataSourceSubscriptionGetCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      apiKey: flags['api-key'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      debug: flags.debug,
      data: flags.data,
      projectName: flags['project-name'],
      taskId: flags['task-id']
    });
  }
}
