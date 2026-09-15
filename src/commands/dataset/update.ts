// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetUpdateCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DatasetUpdate extends Command {
  static override description = 'Update dataset schema or description.';

  static override flags = {
    ...serviceFlags,
    id: Flags.string({ required: true, description: 'Viking dataset ID.' }),
    version: Flags.integer({ description: 'Schema version.' }),
    description: Flags.string({ description: 'Dataset description.' }),
    schema: Flags.string({ description: 'Inline JSON, @file path, or JSON file path.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetUpdate);
    await runDatasetUpdateCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      id: flags.id,
      version: flags.version,
      description: flags.description,
      schema: flags.schema
    });
  }
}
