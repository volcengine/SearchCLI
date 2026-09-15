// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runRecommendSceneDeleteCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class RecommendSceneDelete extends Command {
  static override description = 'Delete a recommend scene.';

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'scene-id': Flags.string({ required: true, description: 'Viking scene ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RecommendSceneDelete);
    await runRecommendSceneDeleteCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      applicationId: flags['application-id'],
      sceneId: flags['scene-id']
    });
  }
}
