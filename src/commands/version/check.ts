// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command } from '@oclif/core';
import { runVersionCheckCommand } from '../../app/version-commands';
import { outputFormatFlags } from '../../command-support/service-flags';

export default class VersionCheck extends Command {
  static override description = 'Check the local SearchCLI package version against the online package version.';

  static override examples = [
    '<%= config.bin %> version check',
    '<%= config.bin %> version check --json'
  ];

  static override flags = outputFormatFlags;

  async run(): Promise<void> {
    await this.parse(VersionCheck);
    await runVersionCheckCommand();
  }
}
