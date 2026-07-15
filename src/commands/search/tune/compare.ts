// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchTuneCompareCommand } from '../../../app/search-tuning-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class SearchTuneCompare extends Command {
  static override description = 'Compare completed search tuning runs or existing search scenes on one query set.';

  static override examples = [
    '<%= config.bin %> search tune compare --run-ids run_a,run_b',
    '<%= config.bin %> search tune compare --application-id app --dataset-id ds --scene-ids scene_a,scene_b --queries ./queries.jsonl'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ description: 'Viking application ID. Required with --scene-ids.' }),
    'dataset-id': Flags.string({ description: 'Dataset ID. Required with --scene-ids.' }),
    'run-ids': Flags.string({ description: 'Comma-separated completed tuning run IDs for offline report comparison.' }),
    'scene-ids': Flags.string({ description: 'Comma-separated search scene IDs for online source-item silver-label comparison.' }),
    queries: Flags.string({ description: 'JSON/JSONL/CSV query set. Required with --scene-ids.' }),
    'top-k': Flags.integer({ default: 20, description: 'Number of search results evaluated per query and scene. Default: 20.' }),
    'search-concurrency': Flags.integer({ default: 18, min: 1, description: 'Concurrent search requests for --scene-ids. Default: 18.' }),
    'baseline-run-id': Flags.string({ description: 'Baseline run ID. Defaults to the first --run-ids value.' }),
    'baseline-scene-id': Flags.string({ description: 'Baseline scene ID. Defaults to the first --scene-ids value.' }),
    'output-dir': Flags.string({ description: 'Tuning artifact root for --run-ids. Defaults to .viking/search-tuning.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchTuneCompare);
    await runSearchTuneCompareCommand({
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
      runIds: splitCsv(flags['run-ids']),
      sceneIds: splitCsv(flags['scene-ids']),
      queries: flags.queries,
      topK: flags['top-k'],
      searchConcurrency: flags['search-concurrency'],
      baselineRunId: flags['baseline-run-id'],
      baselineSceneId: flags['baseline-scene-id'],
      outputDir: flags['output-dir']
    });
  }
}

function splitCsv(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);
}
