// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runItemProvisionCommand } from '../../app/item-commands';
import { workflowServiceFlags } from '../../command-support/service-flags';

export default class ItemProvision extends Command {
  static override description =
    'Provision item onboarding resources up to dataset binding and activation start, without waiting for readiness, indexing, or search/chat verification. Use --skip-app to preserve the dataset-only boundary and stop after dataset provisioning.';

  static override examples = [
    '<%= config.bin %> item provision --plan-dir ./.viking/item-plans/demo --confirm-review',
    '<%= config.bin %> item provision --plan-dir ./.viking/item-plans/demo --interactive-review',
    '<%= config.bin %> item provision --plan-dir ./.viking/item-plans/demo --dry-run',
    '<%= config.bin %> item provision --plan-dir ./.viking/item-plans/demo --confirm-review --skip-app'
  ];

  static override flags = {
    ...workflowServiceFlags,
    'plan-dir': Flags.string({
      required: true,
      description: 'Directory containing plan.json and generated item-onboarding artifacts.'
    }),
    'project-name': Flags.string({
      description: 'Optional project name for control-plane requests.'
    }),
    'application-id': Flags.string({
      description: 'Use an existing application instead of creating a new one.'
    }),
    'dataset-id': Flags.string({
      description: 'Use an existing dataset instead of creating a new one.'
    }),
    'application-name': Flags.string({
      description: 'Override the application name stored in the plan.'
    }),
    'dataset-name': Flags.string({
      description: 'Override the dataset name stored in the plan.'
    }),
    'skip-app': Flags.boolean({
      description: 'Skip application creation and app-level binding.'
    }),
    'wait-ready': Flags.boolean({
      description: 'Deprecated for provision. Accepted for compatibility but ignored; stage one ends after activation starts.'
    }),
    'wait-timeout-ms': Flags.integer({
      description: 'Deprecated compatibility flag for --wait-ready.'
    }),
    'poll-interval-ms': Flags.integer({
      description: 'Deprecated compatibility flag for --wait-ready.'
    }),
    'confirm-review': Flags.boolean({
      description: 'Required for real provision. Confirms schema and bind-time field config were reviewed.'
    }),
    'interactive-review': Flags.boolean({
      description: 'Render the current review summary, write review-confirmation.json, and continue provision.'
    }),
    reviewer: Flags.string({
      description: 'Reviewer name to prefill for interactive review.'
    }),
    'review-notes': Flags.string({
      description: 'Optional notes to prefill for interactive review.'
    }),
    force: Flags.boolean({
      description: 'Proceed even if validation.json contains blocking issues. Use only for controlled testing.'
    }),
    'dry-run': Flags.boolean({
      description: 'Print the planned actions without calling Viking APIs.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ItemProvision);
    await runItemProvisionCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      planDir: flags['plan-dir'],
      projectName: flags['project-name'],
      applicationId: flags['application-id'],
      datasetId: flags['dataset-id'],
      applicationName: flags['application-name'],
      datasetName: flags['dataset-name'],
      skipApp: flags['skip-app'],
      waitReady: flags['wait-ready'],
      waitTimeoutMs: flags['wait-timeout-ms'],
      pollIntervalMs: flags['poll-interval-ms'],
      confirmReview: flags['confirm-review'],
      interactiveReview: flags['interactive-review'],
      reviewer: flags.reviewer,
      reviewNotes: flags['review-notes'],
      force: flags.force,
      dryRun: flags['dry-run']
    });
  }
}
