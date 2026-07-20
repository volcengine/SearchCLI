// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import './core/node-bootstrap';
import { handle, run } from '@oclif/core';
import { isProjectFeatureEnabled } from './core/feature-flags';
import { printRootHelp } from './core/root-help';
import { VERSION } from './version';

const argv = process.argv.slice(2);
const command = argv[0];

if (!command || command === '--help' || command === '-h' || command === 'help') {
  printRootHelp();
} else if (command === '--version' || command === '-v' || command === 'version') {
  console.log(VERSION);
} else if (command === 'project' && !isProjectFeatureEnabled()) {
  console.error('Unknown command: project');
  process.exitCode = 1;
} else {
  void run().catch(handle);
}
