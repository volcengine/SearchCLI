// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runRecommendSceneListCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class RecommendSceneList extends Command {
  static override description = 'List recommend scenes.';

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    types: Flags.string({ description: 'Comma-separated list of recommend scene types to filter.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RecommendSceneList);
    await runRecommendSceneListCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      applicationId: flags['application-id'],
      types: flags.types
    });
  }
}
