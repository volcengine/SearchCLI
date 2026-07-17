// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchTuneValidateCommand } from '../../../app/search-tuning-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class SearchTuneValidate extends Command {
  static override description = 'Validate a search tuning query set without calling search or LLM services.';

  static override examples = [
    '<%= config.bin %> search tune validate --queries ./queries.jsonl',
    '<%= config.bin %> search tune validate --queries ./queries.jsonl --query-count 100 --json'
  ];

  static override flags = {
    ...serviceFlags,
    queries: Flags.string({ required: true, description: 'JSON/JSONL/CSV query set to validate.' }),
    'query-count': Flags.integer({ description: 'Maximum number of queries to inspect.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchTuneValidate);
    await runSearchTuneValidateCommand({
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
      queries: flags.queries,
      queryCount: flags['query-count']
    });
  }
}
