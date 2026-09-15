// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runItemReviewCommand } from '../../app/item-commands';
import { outputFormatFlags } from '../../command-support/service-flags';

export default class ItemReview extends Command {
  static override description =
    'Render the current schema and binding field-config summary, then write review-confirmation.json from the current plan state. This is a review record command and does not provision or verify runtime behavior.';

  static override examples = [
    '<%= config.bin %> item review --plan-dir ./.viking/item-plans/demo',
    '<%= config.bin %> item review --plan-dir ./.viking/item-plans/demo --reviewer alice --review-notes "Reviewed with PM"'
  ];

  static override flags = {
    ...outputFormatFlags,
    'plan-dir': Flags.string({
      required: true,
      description: 'Directory containing plan.json and review-confirmation.json.'
    }),
    reviewer: Flags.string({
      description: 'Reviewer name to record in review-confirmation.json.'
    }),
    'review-notes': Flags.string({
      description: 'Optional notes to record in review-confirmation.json.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ItemReview);
    await runItemReviewCommand({
      planDir: flags['plan-dir'],
      reviewer: flags.reviewer,
      notes: flags['review-notes']
    });
  }
}
