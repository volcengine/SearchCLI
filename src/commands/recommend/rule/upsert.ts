// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runRecommendRuleUpsertCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class RecommendRuleUpsert extends Command {
  static override description =
    'Create or update a recommend rule. Omit --rule-id to create a new rule; provide --rule-id to update an existing one.';

  static override examples = [
    '<%= config.bin %> recommend rule upsert --application-id 123 --name "my-filter" --type search_filter --dataset-id 456 --config @rule-config.json',
    '<%= config.bin %> recommend rule upsert --application-id 123 --rule-id 789 --name "updated-name" --config @new-config.json'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'rule-id': Flags.string({
      description:
        'Recommend rule ID. Omit to create a new rule; provide to update an existing one. The response returns the RuleId.'
    }),
    name: Flags.string({ description: 'Rule name (required for create).' }),
    type: Flags.string({
      description:
        'Rule type (required for create). Upsert V2 currently allows: degrade, filter, search_filter, force_item.'
    }),
    description: Flags.string({ description: 'Rule description.' }),
    'dataset-id': Flags.string({ description: 'Dataset ID associated with the rule.' }),
    'item-dataset-id': Flags.string({ description: 'Item dataset ID associated with the rule.' }),
    config: Flags.string({
      description:
        'Inline JSON, @file path, or JSON file path for the rule Config. Structure depends on rule type; for search_filter / filter rules it is a recursive rule tree with group (and/or) and leaf (must/must_not/range/time_range) nodes.'
    }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    'dry-run': Flags.boolean({ description: 'Validate without creating or updating the recommend rule.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RecommendRuleUpsert);
    await runRecommendRuleUpsertCommand({
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
      ruleId: flags['rule-id'],
      name: flags.name,
      type: flags.type,
      description: flags.description,
      datasetId: flags['dataset-id'],
      itemDatasetId: flags['item-dataset-id'],
      config: flags.config,
      dryRun: flags['dry-run']
    });
  }
}
