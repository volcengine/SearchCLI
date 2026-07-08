// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetInferResultCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DatasetInferResult extends Command {
  static override description =
    'Poll the schema-inference task result (V2 GetInferDatasetSchemaResultV2). Returns Status, Schema, FieldDescMap, DataFieldConfig, etc.';

  static override examples = [
    '<%= config.bin %> dataset infer-result --task-id t-12345',
    '<%= config.bin %> dataset infer-result --data @infer-result.json'
  ];

  static override flags = {
    ...serviceFlags,
    'task-id': Flags.string({
      description: 'Task ID returned by `dataset infer-schema`. Required unless --data provides TaskID.'
    }),
    'project-name': Flags.string({
      description: 'Viking project name when the API requires project scoping.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetInferResult);
    await runDatasetInferResultCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      taskId: flags['task-id'],
      projectName: flags['project-name']
    });
  }
}
