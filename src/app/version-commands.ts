// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { printOutput } from '../core/output-format';
import {
  checkCliVersion,
  formatCliVersionWarning,
  type CliVersionCheckResult
} from '../core/cli-version-check';

export async function runVersionCheckCommand(): Promise<void> {
  const result = await checkCliVersion();
  const warning = formatCliVersionWarning(result);
  if (warning) process.stderr.write(`${warning}\n`);
  await printOutput(result);
}

export async function runCliVersionPreflight(): Promise<CliVersionCheckResult> {
  const result = await checkCliVersion();
  const warning = formatCliVersionWarning(result);
  if (warning) {
    process.stderr.write(`${warning}\n`);
    throw new Error('SearchCLI version is out of date. Update the CLI and retry the command.');
  }
  return result;
}
