// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAuthLoginCommand } from '../../app/platform-commands';
import { outputFormatFlags } from '../../command-support/service-flags';

export default class AuthLogin extends Command {
  static override description = 'Store Viking AK/SK in the local credential store.';

  static override flags = {
    ...outputFormatFlags,
    profile: Flags.string({
      description: 'Credential profile to store and activate. Defaults to the active profile or "default".'
    }),
    'base-url': Flags.string({
      description: 'Persist a default API base URL alongside the login.'
    }),
    ak: Flags.string({
      description: 'Viking Access Key ID. Defaults to VIKING_AK.'
    }),
    sk: Flags.string({
      description: 'Viking Secret Access Key. Defaults to VIKING_SK.'
    }),
    region: Flags.string({
      description: 'Persist a default region alongside the login.'
    }),
    store: Flags.string({
      description: 'Credential store backend preference.',
      options: ['auto', 'keychain', 'file', 'ephemeral']
    }),
    'no-prompt': Flags.boolean({
      description: 'Fail instead of prompting when AK/SK are missing.',
      default: false
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin);
    await runAuthLoginCommand({
      profile: flags.profile,
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      credentialStore: flags.store as 'auto' | 'keychain' | 'file' | 'ephemeral' | undefined,
      noPrompt: flags['no-prompt']
    });
  }
}
