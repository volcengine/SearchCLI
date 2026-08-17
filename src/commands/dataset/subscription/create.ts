// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDataSourceSubscriptionCreateCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class DatasetSubscriptionCreate extends Command {
  static override description =
    'Create a data-source subscription task. Prefer --data @payload.json for MySQL credentials and source settings.';

  static override examples = [
    '<%= config.bin %> dataset subscription create --data @subscription-create.json',
    '<%= config.bin %> dataset subscription create --dataset-id ds_xxx --type mysql --data-source-config @mysql-source.json --client-token token-1'
  ];

  static override flags = {
    ...serviceFlags,
    'client-token': Flags.string({
      description: 'Idempotency token. Requests with the same ClientToken must use exactly the same payload.'
    }),
    'need-create-dataset': Flags.boolean({
      description: 'Let the backend sample the source and create a new multi_modal dataset.'
    }),
    'dataset-id': Flags.string({
      description: 'Existing dataset ID. Required when NeedCreateDataset=false.'
    }),
    'create-dataset-config': Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for CreateDatasetConfig. Used when --need-create-dataset is set.'
    }),
    type: Flags.string({
      description: 'Data source type. Currently supports mysql.'
    }),
    'data-source-config': Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for DataSourceConfig. Use @file for credentials.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetSubscriptionCreate);
    await runDataSourceSubscriptionCreateCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      apiKey: flags['api-key'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      debug: flags.debug,
      data: flags.data,
      projectName: flags['project-name'],
      clientToken: flags['client-token'],
      needCreateDataset: flags['need-create-dataset'],
      datasetId: flags['dataset-id'],
      createDatasetConfig: flags['create-dataset-config'],
      type: flags.type,
      dataSourceConfig: flags['data-source-config']
    });
  }
}
