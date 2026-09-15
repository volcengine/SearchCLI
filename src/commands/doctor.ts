// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command } from '@oclif/core';
import { runDoctorCommand } from '../app/platform-commands';
import { outputFormatFlags } from '../command-support/service-flags';

export default class Doctor extends Command {
  static override description = 'Check local config, auth, and common dependencies.';

  static override flags = outputFormatFlags;

  async run(): Promise<void> {
    await runDoctorCommand();
  }
}
