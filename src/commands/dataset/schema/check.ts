// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetSchemaCheckCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class DatasetSchemaCheck extends Command {
  static override description = 'Validate dataset schema.';

  static override flags = {
    ...serviceFlags,
    type: Flags.string({ description: 'The dataset type (e.g., 0 for Item, 1 for Document).' }),
    schema: Flags.string({ description: 'Inline JSON, @file path, or JSON file path.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetSchemaCheck);
    await runDatasetSchemaCheckCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      type: flags.type,
      schema: flags.schema
    });
  }
}
