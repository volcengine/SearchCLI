// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppStatusCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class AppStatus extends Command {
  static override description = 'Show control-plane readiness for an application and its dataset configs.';

  static override examples = ['<%= config.bin %> app status --application-id 123456'];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    'activated-only': Flags.boolean({
      description: 'Only fetch activated dataset configs.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppStatus);
    await runAppStatusCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      applicationId: flags['application-id'],
      projectName: flags['project-name'],
      activatedOnly: flags['activated-only']
    });
  }
}
