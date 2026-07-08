// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runConnectorStatusCommand } from '../../app/connector-commands';
import { outputFormatFlags } from '../../command-support/service-flags';

export default class ConnectorStatus extends Command {
  static override description = 'Show local connector state and checkpoint information.';

  static override examples = [
    '<%= config.bin %> connector status --job product_mysql'
  ];

  static override flags = {
    ...outputFormatFlags,
    job: Flags.string({ required: true, description: 'Connector job name.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConnectorStatus);
    await runConnectorStatusCommand(flags.job);
  }
}
