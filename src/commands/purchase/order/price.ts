// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runPurchaseOrderPriceCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class PurchaseOrderPrice extends Command {
  static override description = 'Quote a billing order price for purchase, renew, or modify without creating an order.';

  static override examples = [
    '<%= config.bin %> purchase order price --scene purchase --configuration-code ai_search_standard_monthly --purchase-months 1',
    '<%= config.bin %> purchase order price --scene renew --configuration-code ai_search_standard_monthly --instance-no AISearch123 --purchase-months 3'
  ];

  static override flags = {
    ...serviceFlags,
    scene: Flags.string({
      options: ['purchase', 'renew', 'modify'],
      required: true,
      description: 'Billing order scene: purchase (new instance), renew, or modify.'
    }),
    'configuration-code': Flags.string({
      required: true,
      description: 'Target plan code, e.g. ai_search_standard_monthly.'
    }),
    'instance-no': Flags.string({
      description: 'Current instance number. Required for renew/modify; must be empty for purchase.'
    }),
    'purchase-months': Flags.integer({
      description: 'Purchase duration in months. Mutually exclusive with --end-time.'
    }),
    'end-time': Flags.integer({
      description: 'Custom expiration time as a Unix timestamp in seconds. Mutually exclusive with --purchase-months.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PurchaseOrderPrice);
    await runPurchaseOrderPriceCommand({
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
      scene: flags.scene,
      configurationCode: flags['configuration-code'],
      instanceNo: flags['instance-no'],
      purchaseMonths: flags['purchase-months'],
      endTime: flags['end-time']
    });
  }
}
