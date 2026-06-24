// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDictCheckInputCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DictCheckInput extends Command {
  static override description = 'Validate dictionary entries before upload or append.';

  static override examples = [
    '<%= config.bin %> dict check-input --language zh --type bidirection_synonyms --entries @entries.json',
    '<%= config.bin %> dict check-input --dict-id dict_xxx --entries @more-entries.json'
  ];

  static override flags = {
    ...serviceFlags,
    'dict-id': Flags.string({
      description:
        'Existing dictionary ID. When present, backend validates against the existing dictionary type and count.'
    }),
    language: Flags.string({ description: 'Validation language. Allowed values: zh, en, ja.' }),
    type: Flags.string({
      description:
        'Dictionary type for pre-create validation. Allowed values: query_recommendation, query_completion, query_correction_exemption, bidirection_synonyms, unidirection_synonyms'
    }),
    'tos-bucket': Flags.string({ description: 'TOS bucket when validating by uploaded source file.' }),
    'tos-key': Flags.string({ description: 'TOS key when validating by uploaded source file.' }),
    entries: Flags.string({
      description:
        'Inline JSON, @file path, or JSON file path for Entries[]. Example: [{"Fields":["nike","耐克"]}]'
    }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DictCheckInput);
    await runDictCheckInputCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      dictId: flags['dict-id'],
      language: flags.language,
      type: flags.type,
      tosBucket: flags['tos-bucket'],
      tosKey: flags['tos-key'],
      entries: flags.entries
    });
  }
}
