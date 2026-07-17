// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAuthStatusCommand } from '../../app/platform-commands';
import { workflowServiceFlags } from '../../command-support/service-flags';
import { parseCredentialStoreMode } from '../../core/credential-store';

export default class AuthStatus extends Command {
  static override description = 'Show the current Viking auth source and credential store status.';

  static override flags = {
    ...workflowServiceFlags,
    profile: Flags.string({
      description: 'Inspect a specific profile instead of the active one.'
    }),
    store: Flags.string({
      options: ['auto', 'keychain', 'file', 'ephemeral'],
      description: 'Credential store mode to inspect.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthStatus);
    await runAuthStatusCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      apiKey: flags['api-key'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      projectName: flags['project-name'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      profile: flags.profile,
      credentialStore: flags.store ? parseCredentialStoreMode(flags.store) : undefined
    });
  }
}
