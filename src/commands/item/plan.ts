// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runItemPlanCommand } from '../../app/item-commands';
import { extractServiceConnectionOptions, workflowServiceFlags } from '../../command-support/service-flags';

export default class ItemPlan extends Command {
  static override description =
    'Generate a reviewable item-onboarding plan with schema, field-config, and app artifacts. For dataset-only onboarding, pass --skip-app so the plan emits dataset-create.json and normalized-items.json for the follow-up dataset create + ingest flow.';

  static override examples = [
    '<%= config.bin %> item plan --file ./items.json --output-dir ./.viking/item-plan',
    '<%= config.bin %> item plan --file ./items.csv --goal "Build product item search" --application-name catalog-app',
    '<%= config.bin %> item plan --file ./items.jsonl --type item --goal "Build item search" --skip-app',
    '<%= config.bin %> item plan --file ./items.jsonl --type item --schema-source console --project-name default'
  ];

  static override flags = {
    ...workflowServiceFlags,
    file: Flags.string({
      required: true,
      description: 'Path to a JSON array, JSONL, or CSV file containing structured item records.'
    }),
    type: Flags.string({
      description: 'Dataset type: item or video.',
      options: ['item', 'video'],
      default: 'item'
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
    }),
    'schema-source': Flags.string({
      description: 'Schema inference source: auto prefers console inference when auth is available, console requires the remote chain, local keeps the legacy local-only plan path.',
      options: ['auto', 'console', 'local'],
      default: 'auto'
    }),
    language: Flags.string({
      description: 'Language hint sent to console schema inference. Defaults to zh.'
    }),
    'schema-wait-timeout-ms': Flags.integer({
      description: 'Timeout for polling remote schema inference task status.'
    }),
    'schema-poll-interval-ms': Flags.integer({
      description: 'Polling interval for remote schema inference task status.'
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ItemPlan);
    await runItemPlanCommand({
      ...extractServiceConnectionOptions(flags),
      file: flags.file,
      datasetType: flags.type as 'item' | 'video',
      goal: flags.goal,
      outputDir: flags['output-dir'],
      datasetName: flags['dataset-name'],
      applicationName: flags['application-name'],
      projectName: flags['project-name'],
      skipApp: flags['skip-app'],
      schemaSource: flags['schema-source'] as 'auto' | 'console' | 'local',
      schemaWaitTimeoutMs: flags['schema-wait-timeout-ms'],
      schemaPollIntervalMs: flags['schema-poll-interval-ms'],
      language: flags.language
    });
  }
}
