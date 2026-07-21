// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppItemDataCountCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class AppItemDataCount extends Command {
  static override description =
    'Get the effective item data count (ValidCnt/TotalCnt) for an item/video dataset under an application. Not applicable to document datasets.';

  static override examples = [
    '<%= config.bin %> app item-data-count --application-id 123 --dataset-id 456',
    '<%= config.bin %> app item-data-count --application-id 123 --dataset-id 456 --full'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'dataset-id': Flags.string({ required: true, description: 'Viking item/video dataset ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    full: Flags.boolean({ description: 'Return the raw GetAppItemDataCount response instead of the compact summary.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppItemDataCount);
    await runAppItemDataCountCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      apiKey: flags['api-key'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      applicationId: flags['application-id'],
      datasetId: flags['dataset-id'],
      full: flags.full
    });
  }
}
