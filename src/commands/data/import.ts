// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDataImportShortcutCommand } from '../../app/shortcut-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DataImport extends Command {
  static override description = 'Import sample records into a dataset with a simpler workflow wrapper.';

  static override examples = ['<%= config.bin %> data import --dataset-id 123 --fields @items.json'];

  static override flags = {
    ...serviceFlags,
    'dataset-id': Flags.string({ required: true }),
    fields: Flags.string({
      description: 'Inline JSON array, @file path, or JSON file path containing the fields array.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DataImport);
    await runDataImportShortcutCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      datasetId: flags['dataset-id'],
      fields: flags.fields
    });
  }
}
