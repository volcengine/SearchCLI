// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetUploadSignatureGetCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class DatasetUploadSignatureGet extends Command {
  static override description = 'Get a TOS presigned upload URL for file import.';

  static override examples = [
    '<%= config.bin %> dataset upload-signature get --file-name terms.csv',
    '<%= config.bin %> dataset upload-signature get'
  ];

  static override flags = {
    ...serviceFlags,
    'file-name': Flags.string({ description: 'Upload file name. Defaults to dict-terms.jsonl.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetUploadSignatureGet);
    await runDatasetUploadSignatureGetCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      fileName: flags['file-name']
    });
  }
}
