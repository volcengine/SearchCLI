// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runDatasetCreateCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class DatasetCreate extends Command {
  static override description =
    'Create a Viking dataset. For plan-driven dataset-only onboarding, prefer `--data @dataset-create.json` when the plan emitted that artifact so Schema and DataFieldConfig stay together; use `--name/--type/--schema` as the manual schema-only path.';

  static override examples = [
    '<%= config.bin %> dataset create --name demo-items --type item --schema @schema.json',
    '<%= config.bin %> dataset create --data @dataset-create.json',
    '<%= config.bin %> item plan --file ./items.json --type item --goal "Build item search" --skip-app',
    '<%= config.bin %> dataset create --data ./.viking/item-plans/<plan>/dataset-create.json'
  ];

  static override flags = {
    ...serviceFlags,
    name: Flags.string({
      description: 'Dataset name. Required unless --data already provides Name.'
    }),
    type: Flags.string({
      description: 'Dataset type enum value. Required unless --data already provides Type.'
    }),
    description: Flags.string({ description: 'Dataset description when building the payload from flags.' }),
    schema: Flags.string({
      description:
        'Inline JSON, @file path, or JSON file path for Schema. Use this for schema-only creation; when a plan already emitted dataset-create.json, prefer --data so DataFieldConfig is also submitted.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DatasetCreate);
    await runDatasetCreateCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      name: flags.name,
      type: flags.type,
      description: flags.description,
      schema: flags.schema
    });
  }
}
