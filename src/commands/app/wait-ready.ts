// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppWaitReadyCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class AppWaitReady extends Command {
  static override description = 'Poll an application until the runtime search path is ready.';

  static override examples = ['<%= config.bin %> app wait-ready --application-id 123456 --wait-timeout-ms 120000'];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    'activated-only': Flags.boolean({
      description: 'Only inspect activated dataset configs while polling.'
    }),
    'wait-timeout-ms': Flags.integer({
      default: 120000
    }),
    'poll-interval-ms': Flags.integer({
      default: 3000
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppWaitReady);
    await runAppWaitReadyCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      applicationId: flags['application-id'],
      projectName: flags['project-name'],
      activatedOnly: flags['activated-only'],
      waitTimeoutMs: flags['wait-timeout-ms'],
      pollIntervalMs: flags['poll-interval-ms']
    });
  }
}
