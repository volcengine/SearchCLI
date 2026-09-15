// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetDeleteCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DatasetDelete extends Command {
  static override description = 'Delete a Viking dataset.';

  static override examples = ['<%= config.bin %> dataset delete --id 123456'];

  static override flags = {
    ...serviceFlags,
    id: Flags.string({ description: 'Viking dataset ID to delete.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetDelete);
    await runDatasetDeleteCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      id: flags.id
    });
  }
}
