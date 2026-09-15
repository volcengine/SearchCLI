// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import './core/node-bootstrap';
import { runPlatformDomainFromArgv } from './app/platform-commands';
import { runProductDomainFromArgv } from './app/product-commands';
import { runSkillDomainFromArgv } from './app/skill-commands';
import { printRootHelp } from './core/root-help';
import { VERSION } from './version';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printRootHelp();
    return;
  }

  if (command === '--version' || command === '-v' || command === 'version') {
    console.log(VERSION);
    return;
  }

  if (command === 'skill') {
    await runSkillDomainFromArgv(argv.slice(1));
    return;
  }

  if (await runPlatformDomainFromArgv(command, argv.slice(1))) {
    return;
  }

  if (await runProductDomainFromArgv(command, argv.slice(1))) {
    return;
  }

  throw new Error(`Unknown command: ${argv.join(' ')}`);
}

void main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
