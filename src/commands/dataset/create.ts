// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetCreateCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DatasetCreate extends Command {
  static override description =
    'Create a Viking dataset via V2 CreateDatasetV2. For plan-driven onboarding, prefer `--data @dataset-create.json` so Schema, DataFieldConfig, and FieldDescMap stay together; use the inline flags for the manual schema path.';

  static override examples = [
    '<%= config.bin %> dataset create --name demo-items --type item --schema-json @schema.json',
    '<%= config.bin %> dataset create --name demo-items --type item --schema-json @schema.json --field-desc-map @field-desc-map.json --industry ecommerce --dry-run',
    '<%= config.bin %> dataset create --data @dataset-create.json'
  ];

  static override flags = {
    ...serviceFlags,
    name: Flags.string({
      description: 'Dataset name. Required unless --data already provides Name.'
    }),
    type: Flags.string({
      description: 'Dataset type: item|video|user_event|document|multi_modal|query. Required unless --data already provides Type.'
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
    language: Flags.string({ description: 'Language hint: zh|en|ja.' }),
    'abnormal-image-policy': Flags.string({
      description: 'ProcessConfig.AbnormalImageDataProcessPolicy (e.g. drop|keep).'
    }),
    'video-auto-delete': Flags.string({
      description: 'ProcessConfig.VideoAutoDeletePolicy (e.g. on|off).'
    }),
    'dry-run': Flags.boolean({
      description: 'Validate the request without persisting the dataset (DryRun=true).'
    }),
    'field-desc-map': Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for FieldDescMap (field path -> description).'
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
      abnormalImagePolicy: flags['abnormal-image-policy'],
      videoAutoDelete: flags['video-auto-delete'],
      dryRun: flags['dry-run'],
      fieldDescMap: flags['field-desc-map'],
      projectName: flags['project-name']
    });
  }
}
