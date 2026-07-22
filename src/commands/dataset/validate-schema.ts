// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetValidateSchemaCommand } from '../../app/product-commands';

export default class DatasetValidateSchema extends Command {
  static override description =
    'Validate and render a schema-inference result locally. ' +
    'Reads an infer-result JSON file and renders a deterministic schema-confirm block ' +
    'with metadata, field table, field roles, and warnings. ' +
    'Supply --dataset-type to toggle validation rules (multi_modal vs user_event).';

  static override examples = [
    '<%= config.bin %> dataset validate-schema --input ./infer-result.json --dataset-type multi_modal',
    '<%= config.bin %> dataset validate-schema --input ./.viking/item-plans/my-dataset/infer-result.json --dataset-type user_event'
  ];

  static override flags = {
    input: Flags.string({
      char: 'i',
      description: 'Path to infer-result JSON file (from `vs dataset infer-result`).'
    }),
    'dataset-type': Flags.string({
      char: 't',
      description: 'Dataset type: multi_modal (default) or user_event.',
      default: 'multi_modal'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetValidateSchema);
    await runDatasetValidateSchemaCommand({
      input: flags.input,
      datasetType: flags['dataset-type']
    });
  }
}
