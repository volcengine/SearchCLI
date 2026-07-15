// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchTuneQueryGenerateCommand } from '../../../app/search-tuning-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class SearchTuneQueryGenerate extends Command {
  static override description = 'Generate a reusable synthetic query set for search tuning.';

  static override examples = [
    '<%= config.bin %> search tune query-generate --application-id app --dataset-id ds --query-count 100',
    '<%= config.bin %> search tune query-generate --application-id app --dataset-id ds --output-dir ./.viking/search-tuning'
  ];

  static override flags = {
    ...serviceFlags,
    'timeout-ms': Flags.integer({ default: 120000, description: 'Request timeout in milliseconds. Default: 120000 for LLM-backed query generation.' }),
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'dataset-id': Flags.string({ description: 'Dataset ID. If omitted, the CLI tries to infer a unique search dataset.' }),
    'scene-id': Flags.string({ description: 'Search scene ID used when inspecting application context.' }),
    'query-count': Flags.integer({ default: 100, description: 'Maximum number of queries to generate.' }),
    'min-query-count': Flags.integer({ min: 1, description: 'Minimum acceptable generated query count. Defaults to the requested count when <=10, otherwise max(10, ceil(query-count * 0.8)).' }),
    'sample-size': Flags.integer({ default: 200, min: 1, description: 'Dataset sample items to load across pages. Default: 200.' }),
    'query-batch-size': Flags.integer({ default: 10, min: 1, description: 'Queries requested from each LLM generation call. Default: 10.' }),
    'llm-concurrency': Flags.integer({ default: 100, min: 1, description: 'Concurrent LLM query generation calls. Default: 100.' }),
    'retrievable-field-only': Flags.boolean({ description: 'Generate queries from text IndexFields only; ImageIndexFields are excluded.' }),
    'output-dir': Flags.string({ description: 'Tuning artifact root. Defaults to .viking/search-tuning.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchTuneQueryGenerate);
    await runSearchTuneQueryGenerateCommand({
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
      queryCount: flags['query-count'],
      minQueryCount: flags['min-query-count'],
      sampleSize: flags['sample-size'],
      queryBatchSize: flags['query-batch-size'],
      llmConcurrency: flags['llm-concurrency'],
      retrievableFieldOnly: flags['retrievable-field-only'],
      outputDir: flags['output-dir']
    });
  }
}
