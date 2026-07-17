// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runPurchaseOrderWaitCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class PurchaseOrderWait extends Command {
  static override description = 'Wait until the onboarding purchase order is visible.';

  static override examples = [
    '<%= config.bin %> purchase order wait --project-name default',
    '<%= config.bin %> purchase order wait --max-attempts 5 --poll-interval-ms 2000'
  ];

  static override flags = {
    ...serviceFlags,
    'max-attempts': Flags.integer({
      default: 5,
      description: 'Maximum order visibility checks before reporting order creation failure.'
    }),
    'poll-interval-ms': Flags.integer({
      default: 2000,
      description: 'Delay between order visibility checks when the order is not found.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PurchaseOrderWait);
    await runPurchaseOrderWaitCommand({
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
      maxAttempts: flags['max-attempts'],
      pollIntervalMs: flags['poll-interval-ms']
    });
  }
}
