// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runItemApplyCommand } from '../../app/item-commands';
import { workflowServiceFlags } from '../../command-support/service-flags';

export default class ItemApply extends Command {
  static override hidden = true;

  static override description =
    'Compatibility wrapper around item provision / verify. Defaults to phase=provision unless --run-trials or --phase all is passed. Use --confirm-review for a real apply after schema and bind-time field review; use --skip-app to preserve the dataset-only boundary.';

  static override examples = [
    '<%= config.bin %> item apply --plan-dir ./.viking/item-plans/demo --confirm-review',
    '<%= config.bin %> item apply --plan-dir ./.viking/item-plans/demo --phase verify',
    '<%= config.bin %> item apply --plan-dir ./.viking/item-plans/demo --phase all --confirm-review',
    '<%= config.bin %> item apply --plan-dir ./.viking/item-plans/demo --confirm-review --skip-app'
  ];

  static override flags = {
    ...workflowServiceFlags,
    phase: Flags.string({
      description: 'Execution phase: provision, verify, or all. Defaults to provision unless --run-trials is passed.',
      options: ['provision', 'verify', 'all']
    }),
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
    'skip-app': Flags.boolean({
      description: 'Skip application creation and subsequent app-level setup.'
    }),
    'dataset-name': Flags.string({
      description: 'Override the dataset name stored in the plan.'
    }),
    'wait-ready': Flags.boolean({
      description: 'Deprecated for phase=provision. Accepted for compatibility but ignored in stage one.'
    }),
    'wait-timeout-ms': Flags.integer({
      description: 'Maximum time to wait for readiness.'
    }),
    'poll-interval-ms': Flags.integer({
      description: 'Polling interval for app readiness.'
    }),
    'run-trials': Flags.boolean({
      description: 'Legacy compatibility flag. Equivalent to --phase all.'
    }),
    'search-query': Flags.string({
      description: 'Override the generated default search smoke query.'
    }),
    'chat-message': Flags.string({
      description: 'Override the generated default chat smoke message.'
    }),
    'confirm-review': Flags.boolean({
      description: 'Required for real apply. Confirms the user has reviewed schema, field attributes, display style, and the binding field config used for searchable fields.'
    }),
    'interactive-review': Flags.boolean({
      description: 'Render the current review summary, write review-confirmation.json, and continue apply.'
    }),
    reviewer: Flags.string({
      description: 'Reviewer name to prefill for interactive review.'
    }),
    'review-notes': Flags.string({
      description: 'Optional notes to prefill for interactive review.'
    }),
    'confirm-recommend-entry-binding': Flags.boolean({
      description: 'Required before recommend bootstrap. Confirms the user has chosen the target page or module for the recommend scene.'
    }),
    force: Flags.boolean({
      description: 'Proceed even if validation.json contains blocking issues. Use only for controlled testing.'
    }),
    'recommend-scene-type': Flags.string({
      description: 'Override the recommend scene type used for bootstrap. Defaults to the generated template value.'
    }),
    'recommend-scene-name': Flags.string({
      description: 'Override the recommend scene name used for bootstrap.'
    }),
    'recommend-bhv-scene-types': Flags.string({
      description: 'Comma-separated behavior scene types. Required to bootstrap recommend from the generated templates.'
    }),
    'recommend-user-id': Flags.string({
      description: 'Optional user id for runtime recommend smoke after recommend bootstrap.'
    }),
    'recommend-parent-id': Flags.string({
      description: 'Optional parent item id for runtime recommend smoke after recommend bootstrap.'
    }),
    'dry-run': Flags.boolean({
      description: 'Print the planned actions without calling Viking APIs.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ItemApply);
    await runItemApplyCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      apiKey: flags['api-key'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      planDir: flags['plan-dir'],
      projectName: flags['project-name'],
      applicationId: flags['application-id'],
      datasetId: flags['dataset-id'],
      applicationName: flags['application-name'],
      skipApp: flags['skip-app'],
      datasetName: flags['dataset-name'],
      waitReady: flags['wait-ready'],
      waitTimeoutMs: flags['wait-timeout-ms'],
      pollIntervalMs: flags['poll-interval-ms'],
      runTrials: flags['run-trials'],
      phase: flags.phase as 'provision' | 'verify' | 'all' | undefined,
      searchQuery: flags['search-query'],
      chatMessage: flags['chat-message'],
      confirmReview: flags['confirm-review'],
      interactiveReview: flags['interactive-review'],
      reviewer: flags.reviewer,
      reviewNotes: flags['review-notes'],
      confirmRecommendEntryBinding: flags['confirm-recommend-entry-binding'],
      force: flags.force,
      recommendSceneType: flags['recommend-scene-type'],
      recommendSceneName: flags['recommend-scene-name'],
      recommendBhvSceneTypes: splitCommaList(flags['recommend-bhv-scene-types']),
      recommendUserId: flags['recommend-user-id'],
      recommendParentId: flags['recommend-parent-id'],
      dryRun: flags['dry-run']
    });
  }
}

function splitCommaList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}
