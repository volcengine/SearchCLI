// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { formatMissingVikingAuthMessage } from './auth-errors';
import { resolveCliDefaults } from './user-config';
import { setDebugMode } from './debug-logger';

export interface ServiceConfig {
  controlPlaneBaseUrl: string;
  dataPlaneBaseUrl: string;
  dataPlaneHost?: string;
  xTtBackend?: string;
  service: string;
  accessKeyId?: string;
  secretKey?: string;
  authSource?: 'flag' | 'env' | 'secure-store' | 'none';
  projectName: string;
  region: string;
  timeoutMs: number;
  debug: boolean;
}

export interface ServiceConfigInput {
  baseUrl?: string;
  controlPlaneBaseUrl?: string;
  dataPlaneBaseUrl?: string;
  dataPlaneHost?: string;
  xTtBackend?: string;
  service?: string;
  accessKeyId?: string;
  secretKey?: string;
  projectName?: string;
  region?: string;
  timeoutMs?: number;
  debug?: boolean;
}

const serviceConfigSchema = z.object({
  controlPlaneBaseUrl: z.string().url(),
  dataPlaneBaseUrl: z.string().url(),
  dataPlaneHost: z.string().min(1).optional(),
  xTtBackend: z.string().min(1).optional(),
  service: z.string().min(1),
  accessKeyId: z.string().optional(),
  secretKey: z.string().optional(),
  projectName: z.string().min(1),
  region: z.string().min(1),
  timeoutMs: z.number().int().positive(),
  debug: z.boolean()
});

export function resolveServiceConfig(input: ServiceConfigInput): ServiceConfig {
  const defaults = resolveCliDefaults({
    baseUrl: input.baseUrl,
    controlPlaneBaseUrl: input.controlPlaneBaseUrl,
    dataPlaneBaseUrl: input.dataPlaneBaseUrl,
    service: input.service,
    accessKeyId: input.accessKeyId,
    secretKey: input.secretKey,
    projectName: input.projectName,
    region: input.region,
    timeoutMs: input.timeoutMs
  });

  const resolved = serviceConfigSchema.parse({
    controlPlaneBaseUrl: defaults.controlPlaneBaseUrl,
    dataPlaneBaseUrl: defaults.dataPlaneBaseUrl,
    dataPlaneHost: input.dataPlaneHost ?? defaults.dataPlaneHost,
    xTtBackend: input.xTtBackend ?? defaults.xTtBackend,
    service: defaults.service,
    accessKeyId: defaults.accessKeyId,
    secretKey: defaults.secretKey,
    projectName: defaults.projectName,
    region: defaults.region,
    timeoutMs: defaults.timeoutMs,
    debug: input.debug ?? false
  });

  if (!resolved.accessKeyId || !resolved.secretKey) {
    throw new Error(formatMissingVikingAuthMessage());
  }

  if (resolved.debug) {
    setDebugMode(true);
  }

  return {
    ...resolved,
    authSource: defaults.authSource
  };
}
