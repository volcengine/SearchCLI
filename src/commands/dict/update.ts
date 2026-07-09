// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDictUpdateCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DictUpdate extends Command {
  static override description =
    'Update a console dictionary. Backend currently performs a full update, so --name is required.';

  static override examples = [
    '<%= config.bin %> dict update --dict-id dict_xxx --name updated-name',
    '<%= config.bin %> dict update --dict-id dict_xxx --name updated-name --description "updated description"'
  ];

  static override flags = {
    ...serviceFlags,
    'dict-id': Flags.string({ required: true, description: 'Dictionary ID.' }),
    name: Flags.string({
      required: true,
      description: 'Updated dictionary name. Required because backend validates Name on full update.'
    }),
    description: Flags.string({ description: 'Updated dictionary description.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DictUpdate);
    await runDictUpdateCommand({
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
      dictId: flags['dict-id'],
      name: flags.name,
      description: flags.description
    });
  }
}
