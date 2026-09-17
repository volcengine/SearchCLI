// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchSceneCreateCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class SearchSceneCreate extends Command {
  static override description = 'Create a search scene.';

  static override examples = [
    '<%= config.bin %> search scene create --application-id app_xxx --name default-search',
    '<%= config.bin %> search scene create --application-id app_xxx --name default-search --description "Main search scene"',
    '<%= config.bin %> search scene create --application-id app_xxx --name default-search --search-config @per-dataset.json --item-dataset-id ds_xxx --item-type-result parent',
    '<%= config.bin %> search scene create --data @create-search-scene.json'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    name: Flags.string({ description: 'Search scene name.' }),
    description: Flags.string({ description: 'Search scene description.' }),
    config: Flags.string({ description: 'Inline JSON, @file path, or JSON file path for a nested Config payload.' }),
    'search-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for Config.PerDatasetConfigs.' }),
    'item-dataset-id': Flags.string({ description: 'Viking item dataset ID whose ItemTypeFilter should be set.' }),
    'item-type-result': Flags.string({
      description: 'Search item hierarchy when the item dataset has ItemType: variant or parent.',
      options: ['variant', 'parent']
    }),
    'item-type-field': Flags.string({ description: 'ItemType field name used by ItemTypeFilter. Defaults to item_type.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchSceneCreate);
    await runSearchSceneCreateCommand({
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
      name: flags.name,
      description: flags.description,
      itemDatasetId: flags['item-dataset-id'],
      itemTypeResult: flags['item-type-result'],
      itemTypeField: flags['item-type-field'],
      config: flags.config,
      searchConfig: flags['search-config']
    });
  }
}
