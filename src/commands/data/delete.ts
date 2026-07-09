// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDataDeleteCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DataDelete extends Command {
  static override description = 'Delete one item/event from a dataset.';

  static override examples = [
    '<%= config.bin %> data delete --dataset-id 123 --id item-1',
    '<%= config.bin %> data delete --dataset-id 123 --data @payload.json'
  ];

  static override flags = {
    ...serviceFlags,
    'dataset-id': Flags.string({ required: true }),
    id: Flags.string({
      description: 'Item/event ID to delete.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DataDelete);
    await runDataDeleteCommand({
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
      id: flags.id
    });
  }
}
