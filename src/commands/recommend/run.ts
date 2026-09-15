// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runRecommendRunCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class RecommendRun extends Command {
  static override description = 'Run the online recommend API.';

  static override examples = [
    '<%= config.bin %> recommend run --application-id 123 --scene-id sceneR01 --user-id user_1',
    '<%= config.bin %> recommend run --application-id 123 --scene-id sceneR01 --parent-id item_42'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true }),
    'scene-id': Flags.string({ required: true }),
    'user-id': Flags.string({ description: 'Optional recommend user ID.' }),
    'parent-id': Flags.string({ description: 'Optional recommend parent item ID.' }),
    'page-size': Flags.integer({ description: 'Number of items to recommend per page.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RecommendRun);
    await runRecommendRunCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      applicationId: flags['application-id'],
      sceneId: flags['scene-id'],
      userId: flags['user-id'],
      parentId: flags['parent-id'],
      pageSize: flags['page-size']
    });
  }
}
