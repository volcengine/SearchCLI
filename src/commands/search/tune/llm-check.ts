// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchTuneLlmCheckCommand } from '../../../app/search-tuning-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class SearchTuneLlmCheck extends Command {
  static override description = 'Check whether the LLM used by search tuning is configured.';

  static override examples = [
    '<%= config.bin %> search tune llm-check',
    '<%= config.bin %> search tune llm-check --live --json'
  ];

  static override flags = {
    ...serviceFlags,
    live: Flags.boolean({ description: 'Send a live test request to the configured LLM.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchTuneLlmCheck);
    await runSearchTuneLlmCheckCommand({
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
      live: flags.live
    });
  }
}
