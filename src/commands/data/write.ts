// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDataWriteCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DataWrite extends Command {
  static override description = 'Write or update items/events in a dataset.';

  static override examples = [
    '<%= config.bin %> data write --dataset-id 123 --fields @fields.json',
    '<%= config.bin %> data write --dataset-id 123 --data @payload.json'
  ];

  static override flags = {
    ...serviceFlags,
    'dataset-id': Flags.string({ required: true }),
    fields: Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for the fields array.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DataWrite);
    await runDataWriteCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      datasetId: flags['dataset-id'],
      fields: flags.fields
    });
  }
}
