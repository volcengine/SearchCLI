// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppCreateCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class AppCreate extends Command {
  static override description = 'Create a Viking application.';

  static override examples = [
    '<%= config.bin %> app create --name demo-app --industry ecommerce --description "demo application"',
    '<%= config.bin %> app create --data @app.json'
  ];

  static override flags = {
    ...serviceFlags,
    name: Flags.string({ description: 'Application name.' }),
    description: Flags.string({ description: 'Application description.' }),
    industry: Flags.string({
      description: 'Application industry name or numeric code from the current control plane: none|ecommerce|material|video|news|social-platform|other or 0/1/2/3/4/5/20.'
    }),
    language: Flags.string({ description: 'Application language: zh|en|ja' }),
    color: Flags.string({ description: 'Application icon color: cyan|blue|purple|pink' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppCreate);
    await runAppCreateCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      name: flags.name,
      description: flags.description,
      industry: flags.industry,
      language: flags.language,
      color: flags.color
    });
  }
}
