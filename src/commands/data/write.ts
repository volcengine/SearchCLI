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
      description: 'Inline JSON, @file path, or JSON/JSONL file path for the fields array. JSONL (one record per line) is accepted and converted to an array automatically.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DataWrite);
    await runDataWriteCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      apiKey: flags['api-key'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      datasetId: flags['dataset-id'],
      fields: flags.fields
    });
  }
}
