// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetListCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DatasetList extends Command {
  static override description = 'List Viking datasets.';

  static override examples = [
    '<%= config.bin %> dataset list',
    '<%= config.bin %> dataset list --type behavior',
    '<%= config.bin %> dataset list --name "CLI"'
  ];

  static override flags = {
    ...serviceFlags,
    type: Flags.string({
      description: 'Filter datasets by type, for example item, query, video, behavior, or document.'
    }),
    name: Flags.string({
      description: 'Filter datasets by case-insensitive name substring.'
    }),
    'application-id': Flags.string({
      description: 'Filter datasets bound to a specific application ID.'
    }),
    full: Flags.boolean({
      description: 'Return the raw ListDatasets response instead of the compact summary.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetList);
    await runDatasetListCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      type: flags.type,
      name: flags.name,
      applicationId: flags['application-id'],
      full: flags.full
    });
  }
}
