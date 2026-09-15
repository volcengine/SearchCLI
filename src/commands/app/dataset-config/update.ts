// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runAppDatasetConfigUpdateCommand } from '../../../app/product-commands';
import { serviceFlags } from '../../../command-support/service-flags';

export default class AppDatasetConfigUpdate extends Command {
  static override description =
    'Update an application dataset config. Prefer passing an explicit reviewed field-config.json; use --dry-run to validate before persisting.';

  static override examples = [
    '<%= config.bin %> app dataset-config update --application-id 123 --dataset-id 456 --field-config @field-config.json',
    '<%= config.bin %> app dataset-config update --application-id 123 --dataset-id 456 --field-config ./.viking/item-plans/<plan>/field-config.json --dry-run',
    '<%= config.bin %> app dataset-config update --application-id 123 --dataset-id 456 --schema-version 2 --field-config-version 5 --field-config @field-config.json'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true, description: 'Viking application ID.' }),
    'dataset-id': Flags.string({ required: true, description: 'Viking dataset ID.' }),
    'project-name': Flags.string({ description: 'Viking project name when the API requires project scoping.' }),
    'dry-run': Flags.boolean({ description: 'Validate only without persisting the change.' }),
    'schema-version': Flags.integer({ description: 'Dataset schema version.' }),
    'field-config-version': Flags.integer({ description: 'Dataset field-config version.' }),
    'field-config': Flags.string({
      description: 'Inline JSON, @file path, or JSON file path for DataFieldConfig.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppDatasetConfigUpdate);
    await runAppDatasetConfigUpdateCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      projectName: flags['project-name'],
      applicationId: flags['application-id'],
      datasetId: flags['dataset-id'],
      schemaVersion: flags['schema-version'],
      fieldConfigVersion: flags['field-config-version'],
      fieldConfig: flags['field-config'],
      dryRun: flags['dry-run']
    });
  }
}
