// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Flags } from '@oclif/core';

const outputFormatOptions = ['json', 'table', 'yaml', 'pretty', 'ndjson', 'csv'] as const;

export const outputFormatFlags = {
  format: Flags.string({
    options: outputFormatOptions,
    description: 'Output format. Overrides the shorthand format flags when set.'
  }),
  json: Flags.boolean({
    description: 'Print output as JSON.'
  }),
  table: Flags.boolean({
    description: 'Print output as a compact table when possible.'
  }),
  yaml: Flags.boolean({
    description: 'Print output as YAML.'
  }),
  pretty: Flags.boolean({
    description: 'Print output in a human-friendly compact format.'
  }),
  ndjson: Flags.boolean({
    description: 'Print output as newline-delimited JSON.'
  }),
  csv: Flags.boolean({
    description: 'Print output as CSV when possible.'
  }),
  jq: Flags.string({
    char: 'q',
    description: 'Apply a basic jq-like selector, for example .checks[] or .response.Result.'
  }),
  output: Flags.string({
    char: 'o',
    description: 'Write rendered output to a file instead of stdout.'
  })
} as const;

const connectionFlags = {
  'base-url': Flags.string({
    description: 'API base URL (legacy single-URL form). Auto-derives the matching control/data plane. Defaults to VIKING_BASE_URL.'
  }),
  'control-plane-base-url': Flags.string({
    description: 'OpenAPI control-plane base URL (e.g. aisearch.cn-beijing.volcengineapi.com). Defaults to VIKING_CONTROL_PLANE_BASE_URL.'
  }),
  'data-plane-base-url': Flags.string({
    description: 'Runtime data-plane base URL (e.g. aisearch.cn-beijing.volces.com). Defaults to VIKING_DATA_PLANE_BASE_URL.'
  }),
  'project-name': Flags.string({
    description: 'Viking project name. Defaults to VIKING_PROJECT_NAME or default.'
  }),
  'api-key': Flags.string({
    description: 'Viking runtime API key. Overrides VIKING_API_KEY.'
  }),
  ak: Flags.string({
    description: 'Viking Access Key ID. Overrides auth store and VIKING_AK.'
  }),
  sk: Flags.string({
    description: 'Viking Secret Access Key. Overrides auth store and VIKING_SK.'
  }),
  region: Flags.string({
    description: 'Viking region. Defaults to cn-beijing.'
  }),
  'timeout-ms': Flags.integer({
    default: 15000
  })
} as const;

export const workflowServiceFlags = {
  ...connectionFlags,
  ...outputFormatFlags
} as const;

export const serviceFlags = {
  ...workflowServiceFlags,
  data: Flags.string({
    description: 'Inline JSON, @file path, or JSON file path.'
  })
} as const;

export interface ServiceConnectionFlags {
  'base-url'?: string;
  'control-plane-base-url'?: string;
  'data-plane-base-url'?: string;
  'project-name'?: string;
  'api-key'?: string;
  ak?: string;
  sk?: string;
  region?: string;
  'timeout-ms'?: number;
}

export interface ServiceConnectionOptions {
  baseUrl?: string;
  controlPlaneBaseUrl?: string;
  dataPlaneBaseUrl?: string;
  projectName?: string;
  apiKey?: string;
  accessKeyId?: string;
  secretKey?: string;
  region?: string;
  timeoutMs?: number;
}

export function extractServiceConnectionOptions(
  flags: ServiceConnectionFlags
): ServiceConnectionOptions {
  return {
    baseUrl: flags['base-url'],
    controlPlaneBaseUrl: flags['control-plane-base-url'],
    dataPlaneBaseUrl: flags['data-plane-base-url'],
    projectName: flags['project-name'],
    apiKey: flags['api-key'],
    accessKeyId: flags.ak,
    secretKey: flags.sk,
    region: flags.region,
    timeoutMs: flags['timeout-ms']
  };
}
