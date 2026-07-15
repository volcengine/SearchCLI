// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDictCreateCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DictCreate extends Command {
  static override description = 'Create a console dictionary.';

  static override examples = [
    '<%= config.bin %> dict create --name completion-demo --type query_completion',
    '<%= config.bin %> dict create --name synonym-demo --type bidirection_synonyms --enable-idempotent'
  ];

  static override flags = {
    ...serviceFlags,
    name: Flags.string({ required: true, description: 'Dictionary name.' }),
    type: Flags.string({
      required: true,
      description:
        'Dictionary type. Allowed values: query_recommendation, query_completion, query_correction_exemption, bidirection_synonyms, unidirection_synonyms'
    }),
    description: Flags.string({ description: 'Dictionary description.' }),
    'enable-idempotent': Flags.boolean({
      description: 'Return the existing same-name dictionary when one already exists.'
    }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DictCreate);
    await runDictCreateCommand({
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
      name: flags.name,
      type: flags.type,
      description: flags.description,
      enableIdempotent: flags['enable-idempotent']
    });
  }
}
