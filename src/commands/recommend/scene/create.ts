// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runRecommendSceneCreateCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class RecommendSceneCreate extends Command {
  static override description = 'Create a recommend scene.';

  static override examples = [
    '<%= config.bin %> recommend scene create --application-id 123 --type for_you --name homepage --item-dataset-id 456 --user-event-scenes scene_a --confirm-entry-binding',
    '<%= config.bin %> recommend scene create --application-id 123 --data @recommend-scene.json --confirm-entry-binding'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    type: Flags.string({ description: 'Scene type (e.g., for_you, related).' }),
    name: Flags.string({ description: 'Recommend scene name.' }),
    description: Flags.string({ description: 'Recommend scene description.' }),
    'item-dataset-id': Flags.string({ description: 'Viking item dataset ID.' }),
    'recommend-model': Flags.string({ description: 'Recommend model code: default or long_sequence.' }),
    'optimization-target': Flags.string({ description: 'Recommend optimization target code, for example ctr.' }),
    'user-event-scenes': Flags.string({
      description: 'Comma-separated UserEvent event_scene values. Required unless --data already includes UserEventScenes.'
    }),
    'bhv-scene-types': Flags.string({
      description: 'Deprecated alias of --user-event-scenes.'
    }),
    'filter-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for FilterConfig.' }),
    'dry-run': Flags.boolean({ description: 'Validate without creating or publishing the recommend scene.' }),
    'confirm-entry-binding': Flags.boolean({
      description: 'Required for real writes. Confirms the user already chose the target page or module for this recommend scene.'
    }),
    'click-event-types': Flags.string({ description: 'Comma-separated click event types.' }),
    'positive-event-types': Flags.string({ description: 'Comma-separated positive event types.' }),
    'negative-event-types': Flags.string({ description: 'Comma-separated negative event types.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RecommendSceneCreate);
    await runRecommendSceneCreateCommand({
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
      type: flags.type,
      name: flags.name,
      description: flags.description,
      itemDatasetId: flags['item-dataset-id'],
      recommendModel: flags['recommend-model'],
      optimizationTarget: flags['optimization-target'],
      userEventScenes: flags['user-event-scenes'] ?? flags['bhv-scene-types'],
      filterConfig: flags['filter-config'],
      dryRun: flags['dry-run'],
      confirmEntryBinding: flags['confirm-entry-binding'],
      clickEventTypes: flags['click-event-types'],
      positiveEventTypes: flags['positive-event-types'],
      negativeEventTypes: flags['negative-event-types']
    });
  }
}
