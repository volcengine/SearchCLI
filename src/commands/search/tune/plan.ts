// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchTunePlanCommand } from '../../../app/search-tuning-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class SearchTunePlan extends Command {
  static override description = 'Plan first-version search similarity tuning without calling search or LLM services.';

  static override examples = [
    '<%= config.bin %> search tune plan --application-id app --dataset-id ds --queries ./queries.jsonl',
    '<%= config.bin %> search tune plan --application-id app --dataset-id ds --query-count 100 --top-k 20 --max-strategies 30'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'dataset-id': Flags.string({ description: 'Dataset ID. If omitted, the plan only records application scope.' }),
    'scene-id': Flags.string({ description: 'Search scene ID used as the runtime search entry.' }),
    profile: Flags.string({ default: 'similarity-only', options: ['similarity-only'] }),
    queries: Flags.string({ description: 'JSON/JSONL/CSV query set. If omitted, the plan assumes CLI-generated queries.' }),
    'query-count': Flags.integer({
      min: 1,
      description: 'Maximum number of queries to evaluate. Defaults to all queries from --queries, or 100 generated queries when --queries is omitted.'
    }),
    'top-k': Flags.integer({ default: 20, description: 'Number of search results judged per query and strategy.' }),
    'max-strategies': Flags.integer({ default: 30, description: 'Maximum number of candidate strategies to evaluate.' }),
    optimizer: Flags.string({ default: 'matrix', options: ['matrix', 'spa'], description: 'Candidate strategy optimizer. Default: matrix.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchTunePlan);
    await runSearchTunePlanCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      apiKey: flags['api-key'],
      projectName: flags['project-name'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      applicationId: flags['application-id'],
      datasetId: flags['dataset-id'],
      sceneId: flags['scene-id'],
      profile: flags.profile,
      queries: flags.queries,
      queryCount: flags['query-count'],
      topK: flags['top-k'],
      maxStrategies: flags['max-strategies'],
      optimizer: flags.optimizer as 'matrix' | 'spa'
    });
  }
}
