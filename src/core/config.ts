// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import type { RuntimeConfig } from './types';
import { resolveCliDefaults } from './user-config';

const runtimeConfigSchema = z.object({
  controlPlaneBaseUrl: z.string().url(),
  dataPlaneBaseUrl: z.string().url(),
  dataPlaneHost: z.string().min(1).optional(),
  service: z.string().min(1),
  applicationId: z.string().min(1),
  datasetId: z.string().min(1),
  sceneId: z.string().optional(),
  apiKey: z.string().optional(),
  accessKeyId: z.string().optional(),
  secretKey: z.string().optional(),
  region: z.string().min(1),
  timeoutMs: z.number().int().positive(),
  defaultPageSize: z.number().int().positive(),
  outputDir: z.string().min(1),
  llmBaseUrl: z.string().url().optional(),
  llmApiKey: z.string().optional(),
  llmAccessKeyId: z.string().optional(),
  llmSecretKey: z.string().optional(),
  llmRegion: z.string().optional(),
  llmService: z.string().optional(),
  llmModel: z.string().optional()
});

export interface RuntimeConfigInput {
  baseUrl?: string;
  controlPlaneBaseUrl?: string;
  dataPlaneBaseUrl?: string;
  dataPlaneHost?: string;
  service?: string;
  applicationId?: string;
  datasetId?: string;
  sceneId?: string;
  apiKey?: string;
  accessKeyId?: string;
  secretKey?: string;
  region?: string;
  timeoutMs?: number;
  defaultPageSize?: number;
  outputDir?: string;
  llmBaseUrl?: string;
  llmApiKey?: string;
  llmAccessKeyId?: string;
  llmSecretKey?: string;
  llmRegion?: string;
  llmService?: string;
  llmModel?: string;
}

export function resolveRuntimeConfig(input: RuntimeConfigInput): RuntimeConfig {
  const defaults = resolveCliDefaults({
    baseUrl: input.baseUrl,
    controlPlaneBaseUrl: input.controlPlaneBaseUrl,
    dataPlaneBaseUrl: input.dataPlaneBaseUrl,
    service: input.service,
    apiKey: input.apiKey,
    accessKeyId: input.accessKeyId,
    secretKey: input.secretKey,
    region: input.region,
    timeoutMs: input.timeoutMs,
    defaultPageSize: input.defaultPageSize,
    outputDir: input.outputDir,
    llmBaseUrl: input.llmBaseUrl,
    llmApiKey: input.llmApiKey,
    llmAccessKeyId: input.llmAccessKeyId,
    llmSecretKey: input.llmSecretKey,
    llmRegion: input.llmRegion,
    llmService: input.llmService,
    llmModel: input.llmModel
  });

  return runtimeConfigSchema.parse({
    controlPlaneBaseUrl: defaults.controlPlaneBaseUrl,
    dataPlaneBaseUrl: defaults.dataPlaneBaseUrl,
    dataPlaneHost: input.dataPlaneHost ?? defaults.dataPlaneHost,
    service: defaults.service,
    applicationId: input.applicationId ?? process.env.VIKING_APPLICATION_ID,
    datasetId: input.datasetId ?? process.env.VIKING_DATASET_ID,
    sceneId: input.sceneId ?? process.env.VIKING_SCENE_ID,
    apiKey: defaults.apiKey,
    accessKeyId: defaults.accessKeyId,
    secretKey: defaults.secretKey,
    region: defaults.region,
    timeoutMs: defaults.timeoutMs,
    defaultPageSize: defaults.defaultPageSize,
    outputDir: defaults.outputDir,
    llmBaseUrl: defaults.llmBaseUrl,
    llmApiKey: defaults.llmApiKey,
    llmAccessKeyId: defaults.llmAccessKeyId,
    llmSecretKey: defaults.llmSecretKey,
    llmRegion: defaults.llmRegion,
    llmService: defaults.llmService,
    llmModel: defaults.llmModel
  });
}
