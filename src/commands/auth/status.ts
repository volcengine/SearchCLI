// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAuthStatusCommand } from '../../app/platform-commands';
import { outputFormatFlags } from '../../command-support/service-flags';

export default class AuthStatus extends Command {
  static override description = 'Show the current Viking auth source and credential store status.';

  static override flags = {
    ...outputFormatFlags,
    profile: Flags.string({
      description: 'Inspect a specific profile instead of the active one.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthStatus);
    await runAuthStatusCommand({
      profile: flags.profile
    });
  }
}
