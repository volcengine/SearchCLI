// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDictWriteTermsCommand } from '../../app/product-commands';
import { workflowServiceFlags } from '../../command-support/service-flags';

export default class DictWriteTerms extends Command {
  static override description = 'Write or update dictionary terms from a CSV file or inline write-items.';

  static override examples = [
    '<%= config.bin %> dict write-terms --dict-id dict_xxx --file ./terms.csv',
    '<%= config.bin %> dict write-terms --dict-id dict_xxx --entries @entries.json'
  ];

  static override flags = {
    ...workflowServiceFlags,
    'dict-id': Flags.string({ required: true, description: 'Target dictionary ID.' }),
    file: Flags.string({
      description:
        'Local .csv source file path only. The CLI fetches the upload signature, uploads the file, and calls write_terms with file-import payload fields.'
    }),
    entries: Flags.string({
      description:
        'Inline JSON, @file path, or JSON file path for items[]. Example: [{"_last_data":{},"_current_data":{"query":"nike","query_count":10}}]'
    }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DictWriteTerms);
    await runDictWriteTermsCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      projectName: flags['project-name'],
      dictId: flags['dict-id'],
      file: flags.file,
      entries: flags.entries
    });
  }
}
