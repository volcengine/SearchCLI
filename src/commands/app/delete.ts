// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppDeleteCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class AppDelete extends Command {
  static override description = 'Delete a Viking application.';

  static override examples = ['<%= config.bin %> app delete --id 123456'];

  static override flags = {
    ...serviceFlags,
    id: Flags.string({ description: 'Viking application ID to delete.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppDelete);
    await runAppDeleteCommand({
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
