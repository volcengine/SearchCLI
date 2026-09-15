// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppGetCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class AppGet extends Command {
  static override description = 'Get a Viking application by ID.';

  static override examples = ['<%= config.bin %> app get --id 123456'];

  static override flags = {
    ...serviceFlags,
    id: Flags.string({ description: 'Viking application ID.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppGet);
    await runAppGetCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      id: flags.id
    });
  }
}
