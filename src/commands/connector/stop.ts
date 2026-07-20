// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runConnectorStopCommand } from '../../app/connector-commands';
import { outputFormatFlags } from '../../command-support/service-flags';

export default class ConnectorStop extends Command {
  static override description = 'Request a running connector job to stop after the current polling iteration.';

  static override examples = [
    '<%= config.bin %> connector stop --job product_mysql',
    '<%= config.bin %> connector stop --pid 12345',
    '<%= config.bin %> connector stop --job product_mysql --pid 12345'
  ];

  static override flags = {
    ...outputFormatFlags,
    job: Flags.string({ description: 'Connector job name.' }),
    pid: Flags.integer({ description: 'Running connector worker pid.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConnectorStop);
    await runConnectorStopCommand(flags.job, flags.pid);
  }
}
