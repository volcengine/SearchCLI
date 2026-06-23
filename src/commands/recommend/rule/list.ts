// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runRecommendRuleListCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class RecommendRuleList extends Command {
  static override description = 'List recommend rules.';

  static override examples = [
    '<%= config.bin %> recommend rule list --application-id 123',
    '<%= config.bin %> recommend rule list --application-id 123 --types search_filter,degrade',
    '<%= config.bin %> recommend rule list --application-id 123 --dataset-id 456'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    types: Flags.string({
      description:
        'Comma-separated list of rule types to filter. Allowed values: degrade, filter, search_filter, impression, suggest, userInterest, itemCf, forceItem'
    }),
    'dataset-id': Flags.string({
      description: 'Dataset ID to filter by. For rules with both behavior and item datasets, this is the behavior dataset ID.'
    }),
    'invert-item-dataset-id': Flags.string({
      description: 'Inverted item dataset ID. For inverted-index rule queries, this is the item dataset ID.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RecommendRuleList);
    await runRecommendRuleListCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      applicationId: flags['application-id'],
      types: flags.types,
      datasetId: flags['dataset-id'],
      invertItemDatasetId: flags['invert-item-dataset-id']
    });
  }
}
