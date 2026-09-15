// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAuthImportEnvCommand } from '../../app/platform-commands';
import { outputFormatFlags } from '../../command-support/service-flags';

export default class AuthImportEnv extends Command {
  static override description = 'Import VIKING_AK/VIKING_SK from the current shell into the local credential store.';

  static override flags = {
    ...outputFormatFlags,
    profile: Flags.string({
      description: 'Credential profile to store and activate. Defaults to the active profile or "default".'
    }),
    'base-url': Flags.string({
      description: 'Persist a default API base URL alongside the imported credentials.'
    }),
    region: Flags.string({
      description: 'Persist a default region alongside the imported credentials.'
    }),
    store: Flags.string({
      description: 'Credential store backend preference.',
      options: ['auto', 'keychain', 'file', 'ephemeral']
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthImportEnv);
    await runAuthImportEnvCommand({
      profile: flags.profile,
      baseUrl: flags['base-url'],
      region: flags.region,
      credentialStore: flags.store as 'auto' | 'keychain' | 'file' | 'ephemeral' | undefined
    });
  }
}
