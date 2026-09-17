// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runItemPlanCommand } from '../../app/item-commands';
import { outputFormatFlags } from '../../command-support/service-flags';

export default class ItemPlan extends Command {
  static override description =
    'Generate a reviewable item-onboarding plan with schema, field-config, and app artifacts. For dataset-only onboarding, pass --skip-app so the plan emits dataset-create.json and normalized-items.json for the follow-up dataset create + ingest flow.';

  static override examples = [
    '<%= config.bin %> item plan --file ./items.json --output-dir ./.viking/item-plan',
    '<%= config.bin %> item plan --file ./items.csv --goal "Build product item search" --application-name catalog-app',
    '<%= config.bin %> item plan --file ./items.jsonl --type item --goal "Build item search" --skip-app'
  ];

  static override flags = {
    ...outputFormatFlags,
    file: Flags.string({
      required: true,
      description: 'Path to a JSON array, JSONL, or CSV file containing structured item records.'
    }),
    type: Flags.string({
      description: 'Dataset type: item or video.',
      options: ['item', 'video'],
      default: 'item'
    }),
    'item-type-result': Flags.string({
      description: 'Generated item hierarchy filter for search/recommend configs.',
      options: ['variant', 'parent'],
      default: 'variant'
    }),
    goal: Flags.string({
      description: 'Optional business goal to carry into the generated report and descriptions.'
    }),
    'output-dir': Flags.string({
      description: 'Directory to write plan artifacts into. Defaults to ./.viking/item-plans/<slug>-<timestamp>.'
    }),
    'dataset-name': Flags.string({
      description: 'Override the generated dataset name.'
    }),
    'application-name': Flags.string({
      description: 'Override the generated application name.'
    }),
    'skip-app': Flags.boolean({
      description: 'Generate plan to skip application creation (only process dataset).'
    }),
    'project-name': Flags.string({
      description: 'Optional project name carried into generated control-plane payloads.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ItemPlan);
    await runItemPlanCommand({
      file: flags.file,
      datasetType: flags.type as 'item' | 'video',
      itemTypeResult: flags['item-type-result'] as 'variant' | 'parent',
      goal: flags.goal,
      outputDir: flags['output-dir'],
      datasetName: flags['dataset-name'],
      applicationName: flags['application-name'],
      projectName: flags['project-name'],
      skipApp: flags['skip-app']
    });
  }
}
