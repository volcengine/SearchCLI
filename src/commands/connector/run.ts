// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runConnectorRunCommand } from '../../app/connector-commands';
import { extractServiceConnectionOptions, workflowServiceFlags } from '../../command-support/service-flags';

export default class ConnectorRun extends Command {
  static override description = 'Run a local connector job and write source changes to the target dataset.';

  static override examples = [
    '<%= config.bin %> connector run --job product_mysql --once',
    '<%= config.bin %> connector run --job product_mysql',
    '<%= config.bin %> connector run --job product_mysql --daemon'
  ];

  static override flags = {
    ...workflowServiceFlags,
    job: Flags.string({ required: true, description: 'Connector job name.' }),
    once: Flags.boolean({ description: 'Run one polling iteration and exit.' }),
    daemon: Flags.boolean({ description: 'Launch the connector as a detached background worker.' }),
    worker: Flags.boolean({
      hidden: true,
      description: 'Internal flag used by detached connector workers.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConnectorRun);
    await runConnectorRunCommand({
      ...extractServiceConnectionOptions(flags),
      job: flags.job,
      once: flags.once,
      daemon: flags.daemon,
      worker: flags.worker
    });
  }
}
