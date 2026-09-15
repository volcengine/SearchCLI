// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppOnlineConfigGetCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class AppOnlineConfigGet extends Command {
  static override description = 'Get an application online config.';

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    full: Flags.boolean({ description: 'Return the raw GetAppOnlineConfig response instead of the compact summary.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppOnlineConfigGet);
    await runAppOnlineConfigGetCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      applicationId: flags['application-id'],
      full: flags.full
    });
  }
}
