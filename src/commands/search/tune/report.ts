// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchTuneReportCommand } from '../../../app/search-tuning-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class SearchTuneReport extends Command {
  static override description = 'Read a previous search tuning report.';

  static override examples = ['<%= config.bin %> search tune report --run-id run_2026-05-12T00-00-00Z'];

  static override flags = {
    ...serviceFlags,
    'run-id': Flags.string({ required: true, description: 'Tuning run ID.' }),
    'output-dir': Flags.string({ description: 'Tuning artifact root. Defaults to .viking/search-tuning.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchTuneReport);
    await runSearchTuneReportCommand({
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
      runId: flags['run-id'],
      outputDir: flags['output-dir']
    });
  }
}
