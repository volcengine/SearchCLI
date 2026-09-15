// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchRunCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class SearchRun extends Command {
  static override description = 'Run the online search API. If the app has exactly one search dataset, the CLI infers it; otherwise pass --dataset-id.';

  static override examples = [
    '<%= config.bin %> search run --application-id 123 --scene-id sceneA --query "wireless headphones" --dataset-id 456',
    '<%= config.bin %> search run --application-id 123 --query "wireless headphones"'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true }),
    'scene-id': Flags.string({ description: 'Optional search scene ID.' }),
    'dataset-id': Flags.string({ description: 'Optional dataset ID.' }),
    query: Flags.string({ description: 'Search query.' }),
    'page-size': Flags.integer({ description: 'Number of search results per page.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchRun);
    await runSearchRunCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      applicationId: flags['application-id'],
      sceneId: flags['scene-id'],
      datasetId: flags['dataset-id'],
      query: flags.query,
      pageSize: flags['page-size']
    });
  }
}
