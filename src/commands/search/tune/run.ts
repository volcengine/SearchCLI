// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchTuneRunCommand } from '../../../app/search-tuning-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class SearchTuneRun extends Command {
  static override description = 'Run first-version automated search evaluation and similarity tuning.';

  static override examples = [
    '<%= config.bin %> search tune run --application-id app --dataset-id ds --profile similarity-only',
    '<%= config.bin %> search tune run --application-id app --dataset-id ds --queries ./queries.jsonl --top-k 20 --max-strategies 30 --search-concurrency 18 --llm-concurrency 100',
    '<%= config.bin %> search tune run --application-id app --resume-run-id run_2026-05-12T00-00-00Z'
  ];

  static override flags = {
    ...serviceFlags,
    'timeout-ms': Flags.integer({
      default: 120000,
      description: 'Request timeout in milliseconds. Default: 120000 for LLM-backed tuning.'
    }),
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'dataset-id': Flags.string({ description: 'Dataset ID. If omitted, the CLI tries to infer a unique search dataset.' }),
    'scene-id': Flags.string({ description: 'Search scene ID used as the runtime search entry.' }),
    profile: Flags.string({ default: 'similarity-only', options: ['similarity-only'] }),
    queries: Flags.string({ description: 'JSON/JSONL/CSV query set. If omitted, the CLI uses the configured LLM to generate queries.' }),
    'query-count': Flags.integer({
      min: 1,
      description: 'Maximum number of queries to evaluate. Defaults to all queries from --queries, or 100 generated queries when --queries is omitted.'
    }),
    'top-k': Flags.integer({ default: 20, description: 'Number of search results judged per query and strategy.' }),
    'max-strategies': Flags.integer({ default: 30, description: 'Maximum number of candidate strategies to evaluate.' }),
    optimizer: Flags.string({ default: 'matrix', options: ['matrix', 'spa'], description: 'Candidate strategy optimizer. Default: matrix.' }),
    'search-concurrency': Flags.integer({ default: 18, min: 1, description: 'Concurrent search requests. Default: 18.' }),
    'llm-concurrency': Flags.integer({ min: 1, description: 'Concurrent LLM relevance judgements. Default: 100.' }),
    'label-source': Flags.string({
      default: 'llm',
      options: ['llm', 'source-item', 'auto'],
      description: 'Relevance label source: llm, source-item, or auto. Default: llm.'
    }),
    'judge-input': Flags.string({
      default: 'text',
      options: ['text', 'text-image'],
      description: 'LLM judge input mode. Default: text. Use text-image only when visual relevance should affect labels.'
    }),
    'max-judge-images': Flags.integer({
      default: 1,
      min: 1,
      description: 'Maximum item images sent to each LLM judge request when --judge-input text-image. Default: 1.'
    }),
    'llm-retries': Flags.integer({ default: 1, min: 0, description: 'Retries for each failed LLM relevance judgement. Default: 1.' }),
    'max-label-failure-rate': Flags.string({
      default: '0.01',
      description: 'Maximum failed label ratio allowed before failing the run. Default: 0.01.'
    }),
    verbose: Flags.boolean({ default: false, description: 'Print per-query and per-label progress events.' }),
    'output-dir': Flags.string({ description: 'Tuning artifact root. Defaults to .viking/search-tuning.' }),
    'resume-run-id': Flags.string({ description: 'Resume an incomplete run from run-state.json, rankings.jsonl, labels-used.jsonl, partial-metrics.json, and performance-summary.json.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchTuneRun);
    await runSearchTuneRunCommand({
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
      optimizer: flags.optimizer as 'matrix' | 'spa',
      searchConcurrency: flags['search-concurrency'],
      llmConcurrency: flags['llm-concurrency'],
      labelSource: flags['label-source'] as 'llm' | 'source-item' | 'auto',
      judgeInput: flags['judge-input'] as 'text' | 'text-image',
      maxJudgeImages: flags['max-judge-images'],
      llmRetries: flags['llm-retries'],
      maxLabelFailureRate: Number.parseFloat(flags['max-label-failure-rate']),
      verbose: flags.verbose,
      outputDir: flags['output-dir'],
      resumeRunId: flags['resume-run-id']
    });
  }
}
