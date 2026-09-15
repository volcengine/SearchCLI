// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppListCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class AppList extends Command {
  static override description = 'List Viking applications.';

  static override examples = [
    '<%= config.bin %> app list',
    '<%= config.bin %> app list --name "PM"',
    '<%= config.bin %> app list --dataset-id 107149077'
  ];

  static override flags = {
    ...serviceFlags,
    name: Flags.string({
      description: 'Filter applications by case-insensitive name substring.'
    }),
    'dataset-id': Flags.string({
      description: 'Filter applications that reference a specific dataset ID.'
    }),
    industry: Flags.string({
      description: 'Filter applications by industry, for example ecommerce, video, news, or other.'
    }),
    state: Flags.string({
      description: 'Filter applications by state, for example ready or not-ready.'
    }),
    full: Flags.boolean({
      description: 'Return the raw ListApplications response instead of the compact summary.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppList);
    await runAppListCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      name: flags.name,
      datasetId: flags['dataset-id'],
      industry: flags.industry,
      state: flags.state,
      full: flags.full
    });
  }
}
