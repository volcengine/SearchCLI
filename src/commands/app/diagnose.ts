// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppDiagnoseWorkflowCommand } from '../../app/workflow-commands';
import { workflowServiceFlags } from '../../command-support/service-flags';

export default class AppDiagnose extends Command {
  static override description = 'Summarize why an application is or is not ready for runtime traffic.';

  static override examples = ['<%= config.bin %> app diagnose --application-id 123456'];

  static override flags = {
    ...workflowServiceFlags,
    'application-id': Flags.string({ required: true }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    'activated-only': Flags.boolean({
      description: 'Only inspect activated dataset configs.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppDiagnose);
    await runAppDiagnoseWorkflowCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      applicationId: flags['application-id'],
      projectName: flags['project-name'],
      activatedOnly: flags['activated-only']
    });
  }
}
