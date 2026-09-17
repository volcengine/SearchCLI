// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchSceneUpdateCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class SearchSceneUpdate extends Command {
  static override description = 'Update and publish a search scene.';

  static override examples = [
    '<%= config.bin %> search scene update --application-id 123 --scene-id abc --config @scene.json',
    '<%= config.bin %> search scene update --application-id 123 --scene-id abc --search-config @search.json',
    '<%= config.bin %> search scene update --application-id 123 --scene-id abc --search-config @search.json --query-completion-config @qc.json'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'scene-id': Flags.string({ required: true, description: 'Viking search scene ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    config: Flags.string({ description: 'Inline JSON, @file path, or JSON file path for a nested Config payload.' }),
    'search-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for Config.PerDatasetConfigs.' }),
    'query-completion-config': Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for Config.QueryCompletionConfig.'
    }),
    'want-to-search-config': Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for Config.WantToSearchConfig.'
    }),
    'overview-config': Flags.string({ description: 'Inline JSON, @file path, or JSON file path for Config.OverviewConfig.' }),
    name: Flags.string({ description: 'Search scene name.' }),
    description: Flags.string({ description: 'Search scene description.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchSceneUpdate);
    await runSearchSceneUpdateCommand({
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
      name: flags.name,
      description: flags.description,
      config: flags.config,
      searchConfig: flags['search-config'],
      queryCompletionConfig: flags['query-completion-config'],
      wantToSearchConfig: flags['want-to-search-config'],
      overviewConfig: flags['overview-config']
    });
  }
}
