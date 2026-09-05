// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runRecommendSceneUpdateCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class RecommendSceneUpdate extends Command {
  static override description = 'Update and publish a recommend scene config.';

  static override examples = [
    '<%= config.bin %> recommend scene update --application-id 123 --scene-id 456 --config @scene.json --confirm-entry-binding'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'scene-id': Flags.string({ required: true, description: 'Viking scene ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    config: Flags.string({ description: 'Inline JSON, @file path, or JSON file path for a nested Config payload.' }),
    count: Flags.integer({ description: 'Max number of items returned in a single recommendation.' }),
    'filter-rule-id': Flags.string({ description: 'Recommend filter rule ID.' }),
    'degrade-rule-id': Flags.string({ description: 'The degrade rule ID to fallback.' }),
    'force-item-rule-id': Flags.string({ description: 'Force-item rule ID.' }),
    'boost-bury-cond-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for BoostBuryCondConfig.' }),
    'shuffle-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for ShuffleConfig.' }),
    'impression-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for ImpressionConfig.' }),
    'suggest-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for SuggestConfig.' }),
    'reason-template-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for ReasonTemplateConfig.' }),
    'cold-start-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for ColdStartConfig.' }),
    'merge-configs': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for MergeConfigs.' }),
    'filter-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for FilterConfig.' }),
    'rec-assistant-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for RecAssistantConfig.' }),
    type: Flags.string({ description: 'Scene type (e.g., for_you, related).' }),
    name: Flags.string({ description: 'Recommend scene name.' }),
    description: Flags.string({ description: 'Recommend scene description.' }),
    'item-dataset-id': Flags.string({ description: 'Viking item dataset ID.' }),
    'user-event-scenes': Flags.string({ description: 'Comma-separated UserEvent event_scene values.' }),
    'bhv-scene-types': Flags.string({ description: 'Deprecated alias of --user-event-scenes.' }),
    'dry-run': Flags.boolean({ description: 'Validate without publishing the recommend scene.' }),
    'confirm-entry-binding': Flags.boolean({
      description: 'Required for real writes. Confirms the user already chose the target page or module for this recommend scene.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RecommendSceneUpdate);
    await runRecommendSceneUpdateCommand({
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
      applicationId: flags['application-id'],
      sceneId: flags['scene-id'],
      type: flags.type,
      name: flags.name,
      description: flags.description,
      itemDatasetId: flags['item-dataset-id'],
      userEventScenes: flags['user-event-scenes'] ?? flags['bhv-scene-types'],
      config: flags.config,
      count: flags.count,
      filterRuleId: flags['filter-rule-id'],
      degradeRuleId: flags['degrade-rule-id'],
      forceItemRuleId: flags['force-item-rule-id'],
      boostBuryCondConfig: flags['boost-bury-cond-config'],
      shuffleConfig: flags['shuffle-config'],
      impressionConfig: flags['impression-config'],
      suggestConfig: flags['suggest-config'],
      reasonTemplateConfig: flags['reason-template-config'],
      coldStartConfig: flags['cold-start-config'],
      mergeConfigs: flags['merge-configs'],
      filterConfig: flags['filter-config'],
      recAssistantConfig: flags['rec-assistant-config'],
      dryRun: flags['dry-run'],
      confirmEntryBinding: flags['confirm-entry-binding']
    });
  }
}
