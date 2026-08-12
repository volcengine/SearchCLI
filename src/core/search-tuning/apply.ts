// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import type { SearchDynamic } from '../types';
import { normalizeSearchMode, normalizeUserDefinedRecallMode } from '../search-mode';
import type { TuningRequestParams, TuningRunReportShape, TuningStrategy } from './types';

export interface SceneApplyDraft {
  runId: string;
  applicationId: string;
  datasetId: string;
  recommendedStrategyId: string;
  sceneName: string;
  sceneDescription: string;
  createPayload: Record<string, unknown>;
  onlinePayload: Record<string, unknown>;
  appliedSearchConfig: Record<string, unknown>;
  unappliedRequestParams: TuningRequestParams;
}

export interface BuildSceneApplyDraftOptions {
  applicationId: string;
  projectName?: string;
  sceneName?: string;
  sceneDescription?: string;
}

export function buildSceneApplyDraft(report: TuningRunReportShape, options: BuildSceneApplyDraftOptions): SceneApplyDraft {
  if (report.applicationId !== options.applicationId) {
    throw new Error(`Run ${report.runId} belongs to application ${report.applicationId}, not ${options.applicationId}.`);
  }
  if (!report.recommendedStrategyId) {
    throw new Error(`Run ${report.runId} has no recommended strategy.`);
  }
  const strategy = report.strategies.find(item => item.id === report.recommendedStrategyId);
  if (!strategy) {
    throw new Error(`Run ${report.runId} recommended strategy ${report.recommendedStrategyId}, but it is missing from report.strategies.`);
  }

  const sceneName = options.sceneName ?? defaultSceneName(report.runId, strategy.id);
  const sceneDescription =
    options.sceneDescription ??
    `SearchCLI tuning candidate from run ${report.runId}, strategy ${strategy.id}. Request-only params are not persisted in scene config.`;
  const appliedSearchConfig = {
    PerDatasetConfigs: [buildPerDatasetConfig(report.datasetId, strategy)]
  };
  const unappliedRequestParams: TuningRequestParams = {
    ...(strategy.requestParams.disable_personalize === undefined
      ? {}
      : { disable_personalize: strategy.requestParams.disable_personalize })
  };

  return {
    runId: report.runId,
    applicationId: options.applicationId,
    datasetId: report.datasetId,
    recommendedStrategyId: strategy.id,
    sceneName,
    sceneDescription,
    createPayload: compactObject({
      ApplicationId: options.applicationId,
      ProjectName: options.projectName,
      Name: sceneName,
      Description: sceneDescription
    }),
    onlinePayload: compactObject({
      ApplicationId: options.applicationId,
      ProjectName: options.projectName,
      Name: sceneName,
      Description: sceneDescription,
      Config: appliedSearchConfig
    }),
    appliedSearchConfig,
    unappliedRequestParams
  };
}

export function withSceneId(payload: Record<string, unknown>, sceneId: string): Record<string, unknown> {
  return {
    ...payload,
    SceneId: sceneId
  };
}

function buildPerDatasetConfig(datasetId: string, strategy: TuningStrategy): Record<string, unknown> {
  const dynamic = strategy.searchDynamic;
  return compactObject({
    DatasetId: datasetId,
    MaxRecallNum: dynamic.max_retrieved_num,
    EnableRerankWithHot: dynamic.enable_rerank_with_hot,
    TextSearchConfig: compactObject({
      Mode: normalizeSceneMode(dynamic.mode),
      QueryKeywordMatchPercent: normalizeSceneQueryKeywordMatchPercent(
        strategy.requestParams.query_keyword_match_percent
      ),
      UserDefinedRecallMode: normalizeSceneUserDefinedRecallMode(dynamic.user_defined_recall_mode),
      DenseWeight: dynamic.dense_weight,
      TextWeight: dynamic.text_weight
    }),
    ImageSearchConfig:
      dynamic.enable_image === undefined
        ? undefined
        : {
            Enable: dynamic.enable_image
          },
    RerankConfig: compactObject({
      Enable: dynamic.rerank_enabled,
      RerankTopK: dynamic.rerank_topk,
      RerankModel: dynamic.rerank_model,
      RerankDoubaoConfig: toPascalObject(dynamic.rerank_doubao_config)
    })
  });
}

function normalizeSceneQueryKeywordMatchPercent(value: number | undefined): number | undefined {
  if (value === undefined || value === 0) return undefined;
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`Invalid recommended query_keyword_match_percent: ${String(value)}.`);
  }
  return value;
}

function normalizeSceneMode(value: SearchDynamic['mode']): string | undefined {
  if (value === undefined) return undefined;
  const normalized = normalizeSearchMode(value);
  if (normalized === undefined) {
    throw new Error(`Invalid recommended search_dynamic.mode: ${String(value)}.`);
  }
  switch (normalized) {
    case 1:
      return 'balanced';
    case 2:
      return 'semantic_priority';
    case 3:
      return 'keyword_priority';
    case 4:
      return 'user_defined';
    default:
      return undefined;
  }
}

function normalizeSceneUserDefinedRecallMode(value: SearchDynamic['user_defined_recall_mode']): string | undefined {
  if (value === undefined) return undefined;
  const normalized = normalizeUserDefinedRecallMode(value);
  if (normalized === undefined) {
    throw new Error(`Invalid recommended search_dynamic.user_defined_recall_mode: ${String(value)}.`);
  }
  switch (normalized) {
    case 0:
      return 'keyword_semantic';
    case 1:
      return 'keyword_only';
    case 2:
      return 'semantic_only';
    default:
      return undefined;
  }
}

function defaultSceneName(runId: string, strategyId: string): string {
  return `search-tuning-${runId.replace(/^run_/, '')}-${strategyId}`.slice(0, 120);
}

function toPascalObject(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const input = value as Record<string, unknown>;
  return compactObject({
    ItemFeature: input.item_feature,
    Instruction: input.instruction
  });
}

function compactObject<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
