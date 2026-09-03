// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runPurchaseOrderCreateCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class PurchaseOrderCreate extends Command {
  static override description = 'Create a billing order for purchase, renew, or modify and return the EPS OrderNO for FastPay payment.';

  static override examples = [
    '<%= config.bin %> purchase order create --scene purchase --configuration-code ai_search_standard_monthly --purchase-months 1 --auto-renew',
    '<%= config.bin %> purchase order create --scene renew --configuration-code ai_search_standard_monthly --instance-no AISearch123 --purchase-months 3 --client-token my-idempotency-token'
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
    }),
    'auto-renew': Flags.boolean({
      description: 'Enable auto-renewal for the created order. Omit to keep the EPS default.'
    }),
    'client-token': Flags.string({
      description: 'Idempotency token (max 60 characters); reused for retries. Auto-generated when omitted.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PurchaseOrderCreate);
    await runPurchaseOrderCreateCommand({
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
      endTime: flags['end-time'],
      autoRenew: flags['auto-renew'],
      clientToken: flags['client-token']
    });
  }
}
