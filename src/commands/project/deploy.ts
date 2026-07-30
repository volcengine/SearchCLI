// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runProjectDeployCommand } from '../../app/project-commands';
import { outputFormatFlags } from '../../command-support/service-flags';
import { isProjectFeatureEnabled, requireProjectFeatureEnabled } from '../../core/feature-flags';

export default class ProjectDeploy extends Command {
  static override hidden = !isProjectFeatureEnabled();

  static override description = 'Deploy a project created by "vs project create" to Volcengine IGA Pages.';

  static override examples = [
    '<%= config.bin %> project deploy',
    '<%= config.bin %> project deploy --project-dir ./demo --dry-run'
  ];

  static override flags = {
    ...outputFormatFlags,
    'project-dir': Flags.string({
      description: 'Project directory. Defaults to the current working directory.'
    }),
    provider: Flags.string({
      default: 'volcengine-iga',
      description: 'Deployment provider. Defaults to volcengine-iga.',
      options: ['volcengine-iga']
    }),
    'dry-run': Flags.boolean({
      description: 'Validate the project with IGA Pages build without publishing changes.'
    })
  };

  async run(): Promise<void> {
    requireProjectFeatureEnabled();
    const { flags } = await this.parse(ProjectDeploy);
    await runProjectDeployCommand({
      projectDir: flags['project-dir'],
      dryRun: flags['dry-run'],
      provider: flags.provider
    });
  }
}
