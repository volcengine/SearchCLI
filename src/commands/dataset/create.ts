// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetCreateCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DatasetCreate extends Command {
  static override description =
    'Create a Viking dataset via V2 CreateDatasetV2. For plan-driven onboarding, prefer `--data @dataset-create.json` so Schema, DataFieldConfig, and FieldDescMap stay together; use the inline flags for the manual schema path.';

  static override examples = [
    '<%= config.bin %> dataset create --name demo-items --type multi_modal --schema-json @schema.json',
    '<%= config.bin %> dataset create --name demo-items --type multi_modal --schema-json @schema.json --field-desc-map @field-desc-map.json --industry ecommerce --dry-run',
    '<%= config.bin %> dataset create --name demo-mm --type multi_modal --theme e_commerce --schema-json @schema.json --industry ecommerce --language zh --abnormal-image-policy skip',
    '<%= config.bin %> dataset create --data @dataset-create.json'
  ];

  static override flags = {
    ...serviceFlags,
    name: Flags.string({
      description: 'Dataset name. Required unless --data already provides Name.'
    }),
    type: Flags.string({
      description: 'Dataset type: user_event|multi_modal. Required unless --data already provides Type.'
    }),
    description: Flags.string({ description: 'Dataset description when building the payload from flags.' }),
    'schema-json': Flags.string({
      description:
        'Inline JSON, @file path, or JSON file path for Schema. Preferred over the legacy --schema alias.'
    }),
    schema: Flags.string({
      description:
        'Deprecated alias for --schema-json. Retained for back-compat; prefer --schema-json.',
      hidden: true
    }),
    industry: Flags.string({
      description: 'Industry hint forwarded to the dataset (e.g. ecommerce|video|news).'
    }),
    language: Flags.string({ description: 'Language hint: zh|en|ko|ja|hi.' }),
    theme: Flags.string({
      description:
        'Theme/domain hint for multi_modal datasets (general|e_commerce|content|long_video). Required when --type=multi_modal.'
    }),
    'abnormal-image-policy': Flags.string({
      description: 'ProcessConfig.AbnormalImageDataProcessPolicy (skip|block). skip=drop bad image rows; block=fail the create.'
    }),
    'abnormal-video-policy': Flags.string({
      description: 'ProcessConfig.AbnormalVideoDataProcessPolicy (skip|block). skip=drop bad video rows; block=fail the create.'
    }),
    'video-auto-delete': Flags.boolean({
      description: 'ProcessConfig.VideoAutoDelete: when set, the backend auto-deletes source videos after processing.'
    }),
    'dry-run': Flags.boolean({
      description: 'Validate the request without persisting the dataset (DryRun=true).'
    }),
    'field-desc-map': Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for FieldDescMap (field path -> description).'
    }),
    'post-paid-type': Flags.string({
      description:
        'Post-paid tier for post-paid billing instances: standard|premium. Post-paid instances must set this; omit for non-post-paid (none).',
      options: ['standard', 'premium', 'none']
    }),
    'project-name': Flags.string({
      description: 'Viking project name when the API requires project scoping.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetCreate);
    await runDatasetCreateCommand({
      baseUrl: flags['base-url'],
      controlPlaneBaseUrl: flags['control-plane-base-url'],
      dataPlaneBaseUrl: flags['data-plane-base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      apiKey: flags['api-key'],
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      name: flags.name,
      type: flags.type,
      description: flags.description,
      schema: flags.schema,
      schemaJson: flags['schema-json'],
      industry: flags.industry,
      language: flags.language,
      theme: flags.theme,
      abnormalImagePolicy: flags['abnormal-image-policy'],
      abnormalVideoPolicy: flags['abnormal-video-policy'],
      videoAutoDelete: flags['video-auto-delete'],
      dryRun: flags['dry-run'],
      fieldDescMap: flags['field-desc-map'],
      postPaidType: flags['post-paid-type'],
      projectName: flags['project-name']
    });
  }
}
