// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchSceneUpdateCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class SearchSceneUpdate extends Command {
  static override description = 'Update a search scene config.';

  static override examples = [
    '<%= config.bin %> search scene update --application-id 123 --scene-id abc --config @scene.json',
    '<%= config.bin %> search scene update --application-id 123 --scene-id abc --search-config @search.json',
    '<%= config.bin %> search scene update --application-id 123 --scene-id abc --search-config @search.json --query-completion-config @qc.json'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'scene-id': Flags.string({ required: true, description: 'Viking scene ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    config: Flags.string({ description: 'Inline JSON, @file path, or JSON file path for a nested Config payload.' }),
    'search-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for Config.SearchConfig.' }),
    'query-completion-config': Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for Config.QueryCompletionConfig.'
    }),
    'want-to-search-config': Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for Config.WantToSearchConfig.'
    }),
    'overview-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for Config.OverviewConfig.' }),
    'item-dataset-id': Flags.string({ description: 'Viking item dataset ID whose ItemTypeFilter should be updated.' }),
    'item-type-result': Flags.string({
      description: 'Search item hierarchy when the item dataset has ItemType: variant or parent.',
      options: ['variant', 'parent']
    }),
    'item-type-field': Flags.string({ description: 'ItemType field name used by ItemTypeFilter. Defaults to item_type.' }),
    name: Flags.string({ description: 'Search scene name.' }),
    description: Flags.string({ description: 'Search scene description.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchSceneUpdate);
    await runSearchSceneUpdateCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      applicationId: flags['application-id'],
      sceneId: flags['scene-id'],
      name: flags.name,
      description: flags.description,
      itemDatasetId: flags['item-dataset-id'],
      itemTypeResult: flags['item-type-result'] as 'variant' | 'parent' | undefined,
      itemTypeField: flags['item-type-field'],
      config: flags.config,
      searchConfig: flags['search-config'],
      queryCompletionConfig: flags['query-completion-config'],
      wantToSearchConfig: flags['want-to-search-config'],
      overviewConfig: flags['overview-config']
    });
  }
}
