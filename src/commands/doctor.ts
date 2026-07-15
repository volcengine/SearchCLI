// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDoctorCommand } from '../app/platform-commands';
import { workflowServiceFlags } from '../command-support/service-flags';
import { parseCredentialStoreMode } from '../core/credential-store';

export default class Doctor extends Command {
  static override description = 'Check local config, auth, and common dependencies.';

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
    const { flags } = await this.parse(Doctor);
    await runDoctorCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      apiKey: flags['api-key'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      projectName: flags['project-name'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      credentialStore: flags.store ? parseCredentialStoreMode(flags.store) : undefined,
      profile: flags.profile
    });
  }
}
