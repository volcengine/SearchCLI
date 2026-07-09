// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command } from '@oclif/core';
import { runPurchaseOrderStatusCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class PurchaseOrderStatus extends Command {
  static override description = 'Query whether the onboarding purchase order is visible.';

  static override examples = ['<%= config.bin %> purchase order status --project-name default'];

  static override flags = {
    ...serviceFlags
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PurchaseOrderStatus);
    await runPurchaseOrderStatusCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      apiKey: flags['api-key'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name']
    });
  }
}
