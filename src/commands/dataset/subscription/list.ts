// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command } from '@oclif/core';
import { runDataSourceSubscriptionListCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class DatasetSubscriptionList extends Command {
  static override description = 'List data-source subscription tasks in the current project.';

  static override examples = [
    '<%= config.bin %> dataset subscription list',
    '<%= config.bin %> dataset subscription list --project-name default',
    '<%= config.bin %> dataset subscription list --data @subscription-list.json'
  ];

  static override flags = {
    ...serviceFlags
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetSubscriptionList);
    await runDataSourceSubscriptionListCommand({
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
      projectName: flags['project-name']
    });
  }
}
