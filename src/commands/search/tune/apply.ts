// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchTuneApplyCommand } from '../../../app/search-tuning-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class SearchTuneApply extends Command {
  static override description = 'Create a new search scene from a completed tuning report recommendation.';

  static override examples = [
    '<%= config.bin %> search tune apply --application-id app --run-id run_2026-05-12T00-00-00Z --dry-run',
    '<%= config.bin %> search tune apply --application-id app --run-id run_2026-05-12T00-00-00Z --confirm-create-scene'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'run-id': Flags.string({ required: true, description: 'Completed tuning run ID.' }),
    'output-dir': Flags.string({ description: 'Tuning artifact root. Defaults to .viking/search-tuning.' }),
    'scene-name': Flags.string({ description: 'Name for the newly created search scene.' }),
    'scene-description': Flags.string({ description: 'Description for the newly created search scene.' }),
    'dry-run': Flags.boolean({ description: 'Print the CreateSearchScene and OnlineSearchScene payloads without calling the service.' }),
    'confirm-create-scene': Flags.boolean({ description: 'Required for real scene creation.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchTuneApply);
    await runSearchTuneApplyCommand({
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
      runId: flags['run-id'],
      outputDir: flags['output-dir'],
      sceneName: flags['scene-name'],
      sceneDescription: flags['scene-description'],
      dryRun: flags['dry-run'],
      confirmCreateScene: flags['confirm-create-scene']
    });
  }
}
