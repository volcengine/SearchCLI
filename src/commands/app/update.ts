// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppUpdateCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class AppUpdate extends Command {
  static override description = 'Update an application name, icon, or industry.';

  static override flags = {
    ...serviceFlags,
    id: Flags.string({ required: true, description: 'Viking application ID.' }),
    name: Flags.string({ description: 'Application name.' }),
    industry: Flags.string({
      description: 'Application industry name or numeric code from the current control plane: none|ecommerce|material|video|news|social-platform|other or 0/1/2/3/4/5/20.'
    }),
    icon: Flags.string({ description: 'Inline JSON, @file path, or JSON file path for Icon.' }),
    color: Flags.string({ description: 'Application icon color: cyan|blue|purple|pink' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppUpdate);
    await runAppUpdateCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      id: flags.id,
      name: flags.name,
      industry: flags.industry,
      icon: flags.icon,
      color: flags.color
    });
  }
}
