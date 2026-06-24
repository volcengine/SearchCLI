// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDictListCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DictList extends Command {
  static override description = 'List console dictionaries.';

  static override examples = [
    '<%= config.bin %> dict list',
    '<%= config.bin %> dict list --types query_completion,bidirection_synonyms',
    '<%= config.bin %> dict list --dict-ids dict_a,dict_b'
  ];

  static override flags = {
    ...serviceFlags,
    'dict-ids': Flags.string({
      description: 'Comma-separated list or JSON array of dictionary IDs to filter.'
    }),
    types: Flags.string({
      description:
        'Comma-separated list or JSON array of dictionary types. Allowed values: query_recommendation, query_completion, query_correction_exemption, bidirection_synonyms, unidirection_synonyms'
    }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DictList);
    await runDictListCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      dictIds: flags['dict-ids'],
      types: flags.types
    });
  }
}
