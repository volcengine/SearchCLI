// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppAttachDatasetCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class AppAttachDataset extends Command {
  static override description =
    'Attach a dataset to an application (V2 AttachDatasetToApplicationV2). Pairs with the DataConfig produced by `dataset infer-result`.';

  static override examples = [
    '<%= config.bin %> app attach-dataset --app-id 123 --dataset-id 456 --data-config @data-config.json',
    '<%= config.bin %> app attach-dataset --app-id 123 --dataset-id 456 --data-config @data-config.json --dry-run',
    '<%= config.bin %> app attach-dataset --data @attach.json'
  ];

  static override flags = {
    ...serviceFlags,
    'app-id': Flags.string({
      description: 'Viking application ID. Required unless --data provides ApplicationId.'
    }),
    'dataset-id': Flags.string({
      description: 'Viking dataset ID. Required unless --data provides DatasetId.'
    }),
    'data-config': Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for DataConfig (recall/filter/suggest field config).'
    }),
    'dry-run': Flags.boolean({
      description: 'Validate the request without persisting the attachment.'
    }),
    'project-name': Flags.string({
      description: 'Viking project name when the API requires project scoping.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppAttachDataset);
    await runAppAttachDatasetCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      applicationId: flags['app-id'],
      datasetId: flags['dataset-id'],
      dataConfig: flags['data-config'],
      dryRun: flags['dry-run'],
      projectName: flags['project-name']
    });
  }
}
