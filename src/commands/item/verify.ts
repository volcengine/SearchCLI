// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runItemVerifyCommand } from '../../app/item-commands';
import { workflowServiceFlags } from '../../command-support/service-flags';

export default class ItemVerify extends Command {
  static override hidden = true;

  static override description =
    'Wait until provisioned item data becomes searchable, then run search/chat verification and optional recommend smoke. Use this after provision/apply when you want runtime checks rather than stage-one provisioning.';

  static override examples = [
    '<%= config.bin %> item verify --plan-dir ./.viking/item-plans/demo',
    '<%= config.bin %> item verify --plan-dir ./.viking/item-plans/demo --search-query "wireless headphones"',
    '<%= config.bin %> item verify --plan-dir ./.viking/item-plans/demo --skip-chat'
  ];

  static override flags = {
    ...workflowServiceFlags,
    'plan-dir': Flags.string({
      required: true,
      description: 'Directory containing plan.json and provision artifacts.'
    }),
    'project-name': Flags.string({
      description: 'Optional project name for control-plane requests.'
    }),
    'application-id': Flags.string({
      description: 'Override the application ID stored in provision-result.json.'
    }),
    'dataset-id': Flags.string({
      description: 'Override the dataset ID stored in provision-result.json.'
    }),
    'wait-indexed': Flags.boolean({
      description: 'Poll dataset/app status until the dataset appears searchable. Enabled by default when omitted.'
    }),
    'wait-timeout-ms': Flags.integer({
      description: 'Maximum time to wait for indexing/searchability.'
    }),
    'poll-interval-ms': Flags.integer({
      description: 'Polling interval while waiting for searchability.'
    }),
    'search-query': Flags.string({
      description: 'Override the generated default search smoke query.'
    }),
    'chat-message': Flags.string({
      description: 'Override the generated default chat smoke message.'
    }),
    'skip-search': Flags.boolean({
      description: 'Skip runtime search smoke.'
    }),
    'skip-chat': Flags.boolean({
      description: 'Skip runtime chat smoke.'
    }),
    'confirm-recommend-entry-binding': Flags.boolean({
      description: 'Required before recommend bootstrap. Confirms the target page/module was reviewed.'
    }),
    'recommend-scene-type': Flags.string({
      description: 'Override the recommend scene type used for bootstrap.'
    }),
    'recommend-scene-name': Flags.string({
      description: 'Override the recommend scene name used for bootstrap.'
    }),
    'recommend-bhv-scene-types': Flags.string({
      description: 'Comma-separated behavior scene types. Required to bootstrap recommend from the generated templates.'
    }),
    'recommend-user-id': Flags.string({
      description: 'Optional user id for runtime recommend smoke.'
    }),
    'recommend-parent-id': Flags.string({
      description: 'Optional parent item id for runtime recommend smoke.'
    }),
    'dry-run': Flags.boolean({
      description: 'Print the planned verify actions without calling Viking APIs.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ItemVerify);
    await runItemVerifyCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      apiKey: flags['api-key'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      planDir: flags['plan-dir'],
      applicationId: flags['application-id'],
      datasetId: flags['dataset-id'],
      projectName: flags['project-name'],
      waitIndexed: flags['wait-indexed'],
      waitTimeoutMs: flags['wait-timeout-ms'],
      pollIntervalMs: flags['poll-interval-ms'],
      searchQuery: flags['search-query'],
      chatMessage: flags['chat-message'],
      skipSearch: flags['skip-search'],
      skipChat: flags['skip-chat'],
      confirmRecommendEntryBinding: flags['confirm-recommend-entry-binding'],
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
