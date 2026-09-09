// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

export type HelpLine = {
  internal?: boolean;
  text: string;
};

const OPENAPI_REFERENCE_HINT = `OPENAPI REFERENCE
  Detailed parameter constraints and request/response contracts: see the matching API Reference in vs-product-qa.
  vs skill show --name vs-product-qa`;

export function hasHelpFlag(argv: string[]): boolean {
  return argv.includes('--help') || argv.includes('-h');
}

export function isDomainHelpRequest(argv: string[]): boolean {
  if (argv.length === 0) {
    return true;
  }

  const first = argv[0];
  return first === '--help' || first === '-h' || first === 'help';
}

export function renderHelpLines(lines: HelpLine[], showInternal: boolean): string[] {
  return lines.filter(line => showInternal || !line.internal).map(line => line.text);
}

export function renderUsageBlock(
  publicLines: string[],
  internalLines: string[] = [],
  showInternal = false
): string {
  const lines: string[] = ['USAGE', ...publicLines.map(line => `  ${line}`)];

  if (showInternal && internalLines.length > 0) {
    lines.push('', 'INTERNAL / DEBUG COMMANDS', ...internalLines.map(line => `  ${line}`));
  }

  return lines.join('\n');
}

export function withOpenApiReferenceHint(help: string): string {
  return `${help}\n\n${OPENAPI_REFERENCE_HINT}`;
}
