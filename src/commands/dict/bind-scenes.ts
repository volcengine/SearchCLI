// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDictBindScenesCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DictBindScenes extends Command {
  static override description = 'Bind a dictionary to search scenes.';

  static override examples = [
    '<%= config.bin %> dict bind-scenes --dict-id dict_xxx --scenes @scenes.json'
  ];

  static override flags = {
    ...serviceFlags,
    'dict-id': Flags.string({ required: true, description: 'Dictionary ID.' }),
    scenes: Flags.string({
      required: true,
      description:
        'Inline JSON, @file path, or JSON file path for Scenes[]. Example: [{"AppId":"app_xxx","SceneId":"scene_xxx","DatasetId":"dataset_xxx"}]'
    }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DictBindScenes);
    await runDictBindScenesCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      dictId: flags['dict-id'],
      scenes: flags.scenes
    });
  }
}
