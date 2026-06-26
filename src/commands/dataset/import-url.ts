// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetImportUrlCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DatasetImportUrl extends Command {
  static override description =
    'Request a presigned upload URL for dataset onboarding (V2 GetPresignedImportUrlV2).';

  static override examples = [
    '<%= config.bin %> dataset import-url --file-name items.jsonl',
    '<%= config.bin %> dataset import-url --data @import-url.json'
  ];

  static override flags = {
    ...serviceFlags,
    'file-name': Flags.string({
      description: 'Source file name. Required unless --data already provides FileName.'
    }),
    'project-name': Flags.string({
      description: 'Viking project name when the API requires project scoping.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetImportUrl);
    await runDatasetImportUrlCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      fileName: flags['file-name'],
      projectName: flags['project-name']
    });
  }
}
