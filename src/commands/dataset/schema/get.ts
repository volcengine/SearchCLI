// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetSchemaGetCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class DatasetSchemaGet extends Command {
  static override description = 'Get dataset schema.';

  static override flags = {
    ...serviceFlags,
    id: Flags.string({ required: true, description: 'Viking dataset ID.' }),
    version: Flags.integer({ description: 'Optional specific schema version.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetSchemaGet);
    await runDatasetSchemaGetCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      id: flags.id,
      version: flags.version
    });
  }
}
