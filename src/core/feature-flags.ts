// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

export const PROJECT_FEATURE_FLAG = 'VIKING_ENABLE_PROJECT';

export function isProjectFeatureEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[PROJECT_FEATURE_FLAG] === '1';
}

export function requireProjectFeatureEnabled(): void {
  if (!isProjectFeatureEnabled()) {
    throw new Error('Unknown command: project');
  }
}
