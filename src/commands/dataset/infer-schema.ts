// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetInferSchemaCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DatasetInferSchema extends Command {
  static override description =
    'Submit an async schema-inference task on a previously uploaded file (V2 AddInferDatasetSchemaTaskV2). Returns the TaskId for polling.';

  static override examples = [
    '<%= config.bin %> dataset infer-schema --tos-key path/to/sample.jsonl --type item',
    '<%= config.bin %> dataset infer-schema --tos-key path/to/sample.jsonl --type video --name demo --industry ecommerce',
    '<%= config.bin %> dataset infer-schema --data @infer-schema.json'
  ];

  static override flags = {
    ...serviceFlags,
    'tos-key': Flags.string({
      description: 'Object key returned from `dataset import-url` after upload. Required unless --data provides TosKey.'
    }),
    type: Flags.string({
      description: 'Dataset type: item|video|user_event|document|multi_modal|query. Required unless --data provides Type.'
    }),
    name: Flags.string({ description: 'Suggested dataset name (passed through to the backend).' }),
    industry: Flags.string({ description: 'Industry hint: none|ecommerce|material|video|news|social-platform|other.' }),
    language: Flags.string({ description: 'Language hint: zh|en|ja.' }),
    theme: Flags.string({ description: 'Free-form theme/description hint to improve inference quality.' }),
    'project-name': Flags.string({
      description: 'Viking project name when the API requires project scoping.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetInferSchema);
    await runDatasetInferSchemaCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
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
