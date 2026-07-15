// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDictGetCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DictGet extends Command {
  static override description = 'Get one console dictionary.';

  static override examples = ['<%= config.bin %> dict get --dict-id dict_xxx'];

  static override flags = {
    ...serviceFlags,
    'dict-id': Flags.string({ required: true, description: 'Dictionary ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DictGet);
    await runDictGetCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      apiKey: flags['api-key'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      dictId: flags['dict-id']
    });
  }
}
