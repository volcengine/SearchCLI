// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Args, Command, Flags } from '@oclif/core';
import { runProjectCreateCommand } from '../../app/project-commands';
import { outputFormatFlags } from '../../command-support/service-flags';
import { isProjectFeatureEnabled, requireProjectFeatureEnabled } from '../../core/feature-flags';

export default class ProjectCreate extends Command {
  static override hidden = !isProjectFeatureEnabled();

  static override description = 'Create a full-stack Viking web project.';

  static override examples = [
    '<%= config.bin %> project create demo --app-id app --features search,chat --search-scene-id search --search-dataset-id dataset',
    '<%= config.bin %> project create demo --app-id app --features recommend --rec-scene-id rec --profile staging',
    '<%= config.bin %> project create demo --app-id app --features chat'
  ];

  static override args = {
    'project-name': Args.string({
      required: false,
      description: 'Project directory name. Defaults to viking-web-app, auto-incrementing when that directory is non-empty.'
    })
  };

  static override flags = {
    ...outputFormatFlags,
    'app-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    features: Flags.string({
      description: 'Required. Comma-separated project features, for example chat, search,recommend, or search,recommend,chat.'
    }),
    profile: Flags.string({
      description: 'Viking auth profile to reuse. Defaults to the active profile.'
    }),
    'search-scene-id': Flags.string({ description: 'Search scene ID. Provide with --search-dataset-id.' }),
    'search-dataset-id': Flags.string({ description: 'Search dataset ID. Provide with --search-scene-id.' }),
    'rec-scene-id': Flags.string({ description: 'Recommend scene ID. Can be provided with or without the search flags.' })
  };

  async run(): Promise<void> {
    requireProjectFeatureEnabled();
    const { args, flags } = await this.parse(ProjectCreate);
    await runProjectCreateCommand({
      projectName: args['project-name'],
      appId: flags['app-id'],
      features: flags.features,
      profile: flags.profile,
      searchSceneId: flags['search-scene-id'],
      searchDatasetId: flags['search-dataset-id'],
      recSceneId: flags['rec-scene-id']
    });
  }
}
