// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runItemProfileCommand } from '../../app/item-commands';
import { outputFormatFlags } from '../../command-support/service-flags';

export default class ItemProfile extends Command {
  static override description = 'Profile a structured item dataset and infer schema, key fields, and risks.';

  static override examples = [
    '<%= config.bin %> item profile --file ./items.json',
    '<%= config.bin %> item profile --file ./items.csv --pretty'
  ];

  static override flags = {
    ...outputFormatFlags,
    file: Flags.string({
      required: true,
      description: 'Path to a JSON array, JSONL, or CSV file containing structured item records.'
    }),
    type: Flags.string({
      description: 'Dataset type: item or video.',
      options: ['item', 'video'],
      default: 'item'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ItemProfile);
    await runItemProfileCommand({
      file: flags.file,
      datasetType: flags.type as 'item' | 'video'
    });
  }
}
