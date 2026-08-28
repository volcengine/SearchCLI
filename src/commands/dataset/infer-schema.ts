// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetInferSchemaCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DatasetInferSchema extends Command {
  static override description =
    'Submit a V2 dataset schema inference task for an uploaded file (TOS key). Prints the TaskID; poll with `vs dataset infer-result --task-id <id>`.';

  static override examples = [
    '<%= config.bin %> dataset infer-schema --tos-key imports/items.jsonl --type multi_modal --name demo-items --industry ecommerce',
    '<%= config.bin %> dataset infer-schema --tos-key imports/products.jsonl --type multi_modal --theme e_commerce --industry ecommerce --language zh'
  ];

  static override flags = {
    ...serviceFlags,
    'tos-key': Flags.string({
      description: 'TOS object key for the uploaded data file. Required unless --data provides TosKey.'
    }),
    type: Flags.string({
      description:
        'Dataset type hint: user_event|multi_modal. Required unless --data provides Type.'
    }),
    name: Flags.string({ description: 'Optional dataset name hint.' }),
    industry: Flags.string({ description: 'Industry hint (e.g. ecommerce|video|news).' }),
    language: Flags.string({ description: 'Language hint: zh|en|ko|ja|hi.' }),
    theme: Flags.string({
      description:
        'Theme/domain hint for multi_modal datasets (general|e_commerce|content|long_video). Required when --type=multi_modal.'
    }),
    'project-name': Flags.string({ description: 'Viking project name.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetInferSchema);
    await runDatasetInferSchemaCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      apiKey: flags['api-key'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      tosKey: flags['tos-key'],
      type: flags.type,
      name: flags.name,
      industry: flags.industry,
      language: flags.language,
      theme: flags.theme,
      projectName: flags['project-name']
    });
  }
}
