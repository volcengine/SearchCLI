// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetGetCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DatasetGet extends Command {
  static override description = 'Get a Viking dataset by ID.';

  static override examples = ['<%= config.bin %> dataset get --id 123456'];

  static override flags = {
    ...serviceFlags,
    id: Flags.string({ description: 'Viking dataset ID.' }),
    full: Flags.boolean({
      description: 'Return the raw GetDataset response instead of the compact summary.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetGet);
    await runDatasetGetCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      id: flags.id,
      full: flags.full
    });
  }
}
