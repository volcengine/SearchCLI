// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { renderHelpLines, type HelpLine } from './help-utils';

const CORE_COMMANDS: HelpLine[] = [
  { text: 'skill              Manage installable Viking skills' },
  { text: 'auth               Manage Viking credentials' },
  { text: 'llm                Manage LLM credentials for tuning' },
  { text: 'doctor             Check auth, config, and local dependencies' }
];

const PRODUCT_COMMANDS: HelpLine[] = [
  { text: 'dataset            Onboard data and manage datasets (V2 backend-driven schema inference; primary onboarding entry)' },
  { text: 'app                Manage applications, activation, and readiness' },
  { text: 'data               Write and inspect dataset items directly' },
  { text: 'connector          Sync incremental source changes into datasets' },
  { text: 'search             Run search and manage search scenes' },
  { text: 'chat               Run conversational search' },
  { text: 'recommend          Run recommend and manage scenes and rules' }
];

const ADVANCED_COMMANDS: HelpLine[] = [
  { text: 'version            Print the current CLI version' }
];

export function printRootHelp(): void {
  const coreCommands = renderHelpLines(CORE_COMMANDS, false).join('\n  ');
  const productCommands = renderHelpLines(PRODUCT_COMMANDS, false).join('\n  ');
  const advancedCommands = renderHelpLines(ADVANCED_COMMANDS, false).join('\n  ');
  const moreHelpLines = [
    'vs <command> --help',
    'vs dataset --help',
    'vs app --help',
    'vs item --help',
    'vs connector --help',
    'vs skill --help',
    'vs auth --help',
    'vs llm --help'
  ];

  console.log(`SearchCLI

Interactive AI search CLI. Use dataset/app/search/chat for the primary product workflow.

USAGE
  vs <command>

QUICK START
  Sign in and verify access
    vs auth import-env
    vs auth login
    vs llm login
    vs doctor

  Onboard items into a fresh app (V2 — default, backend-driven schema inference)
    vs dataset import-url --file-name items.jsonl
    curl -X PUT --data-binary "@./items.jsonl" "<FileUrl from previous step>"
    vs dataset infer-schema --tos-key <FileKey> --type item --industry e_commerce --language zh --name <dataset-name>
    vs dataset infer-result --task-id <TaskID> --render-schema
    vs dataset create --data @dataset-create.json
    vs data write --dataset-id <DatasetId> --fields @items.json
    vs app create --name <app-name> --industry e_commerce --language zh
    vs app attach-dataset --data @attach.json

  Try one search request
    vs search run --application-id <app> --scene-id <scene> --query "wireless headphones"
    if the app has multiple datasets, add --dataset-id <dataset>

  Run first-version search tuning
    vs search tune llm-check
    vs search tune query-generate --application-id <app> --dataset-id <dataset>
    vs search tune plan --application-id <app> --dataset-id <dataset> --queries ./queries.jsonl
    vs search tune run --application-id <app> --dataset-id <dataset> --profile similarity-only
    vs search tune run --application-id <app> --resume-run-id <run-id>
    vs search tune apply --application-id <app> --run-id <run-id> --dry-run

CORE
  ${coreCommands}

PRODUCT
  ${productCommands}

ADVANCED
  ${advancedCommands}

MORE HELP
  ${moreHelpLines.join('\n  ')}`);
}
