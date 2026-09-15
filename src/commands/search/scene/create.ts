// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSearchSceneCreateCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class SearchSceneCreate extends Command {
  static override description = 'Create a search scene.';

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    name: Flags.string({ description: 'Search scene name.' }),
    description: Flags.string({ description: 'Search scene description.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SearchSceneCreate);
    await runSearchSceneCreateCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      applicationId: flags['application-id'],
      name: flags.name,
      description: flags.description
    });
  }
}
