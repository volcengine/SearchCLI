// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runRecommendRuleDeleteCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class RecommendRuleDelete extends Command {
  static override description = 'Delete a recommend rule.';

  static override examples = [
    '<%= config.bin %> recommend rule delete --application-id 123 --rule-id 456'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'rule-id': Flags.string({ required: true, description: 'Recommend rule ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    'dry-run': Flags.boolean({ description: 'Validate without deleting the recommend rule.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RecommendRuleDelete);
    await runRecommendRuleDeleteCommand({
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
      dryRun: flags['dry-run']
    });
  }
}
