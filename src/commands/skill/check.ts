// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runSkillCheckCommand } from '../../app/skill-commands';
import { outputFormatFlags } from '../../command-support/service-flags';

export default class SkillCheck extends Command {
  static override description = 'Check installed skill versions against the online SearchCLI catalog.';

  static override examples = [
    '<%= config.bin %> skill check',
    '<%= config.bin %> skill check --name vs-search --json'
  ];

  static override flags = {
    ...outputFormatFlags,
    name: Flags.string({
      description: 'Check only one skill. Defaults to all bundled skills.'
    }),
    root: Flags.string({
      description: 'Skill root directory to inspect. Defaults to the repository skills directory.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SkillCheck);
    await runSkillCheckCommand(flags.name, flags.root);
  }
}
