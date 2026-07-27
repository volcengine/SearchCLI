// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDataSourceSubscriptionCreateCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class DatasetSubscriptionCreate extends Command {
  static override description = 'Create a dataset data source subscription.';

  static override examples = [
    '<%= config.bin %> dataset subscription create --client-token token-123 --type volc_dts --dataset-id ds_123 --data-source-config @data-source-config.json',
    '<%= config.bin %> dataset subscription create --client-token token-123 --type volc_dts --need-create-dataset --create-dataset-config @create-dataset-config.json --data-source-config @data-source-config.json',
    '<%= config.bin %> dataset subscription create --data @create-subscription.json'
  ];

  static override flags = {
    ...serviceFlags,
    'client-token': Flags.string({
      description: 'Idempotency token. Reusing it requires an identical request payload.'
    }),
    'need-create-dataset': Flags.boolean({
      description: 'Ask the service to sample data and create a new multi_modal dataset.'
    }),
    'dataset-id': Flags.string({
      description: 'Existing multi_modal or user_event dataset ID. Used when --need-create-dataset is omitted.'
    }),
    'create-dataset-config': Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for CreateDatasetConfig.'
    }),
    type: Flags.string({
      description: 'Data source type. Currently only volc_dts is supported.'
    }),
    'data-source-config': Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for DataSourceConfig.'
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
