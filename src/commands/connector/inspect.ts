// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runConnectorInspectCommand } from '../../app/connector-commands';
import { outputFormatFlags } from '../../command-support/service-flags';

export default class ConnectorInspect extends Command {
  static override description = 'Show connector config, state, and local artifact paths.';

  static override examples = [
    '<%= config.bin %> connector inspect --job product_mysql'
  ];

  static override flags = {
    ...outputFormatFlags,
    job: Flags.string({ required: true, description: 'Connector job name.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConnectorInspect);
    await runConnectorInspectCommand(flags.job);
  }
}
