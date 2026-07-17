// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path';
import { printOutput } from '../core/output-format';
import { resolveRuntimeConfig } from '../core/config';
import { resolveLlmClientConfig, requestChatCompletion } from '../core/llm-client';
import { resolveServiceConfig, type ServiceConfigInput } from '../core/service-config';
import { writeText } from '../core/files';
import { VikingOpenApiClient } from '../core/openapi-client';
import { buildSceneApplyDraft, withSceneId } from '../core/search-tuning/apply';
import { compareSearchScenes, compareTuningRuns } from '../core/search-tuning/compare';
import { buildSearchTuningPlan } from '../core/search-tuning/plan';
import { inspectTuningContext, textRetrievableFields } from '../core/search-tuning/inspect';
import { loadTuningReport, loadTuningRunState, runSearchTuning, type TuningProgressEvent } from '../core/search-tuning/runner';
import { generateTuningQueries, generateTuningQuerySet } from '../core/search-tuning/query-generator';
import { stableStringify } from '../core/search-tuning/hash';
import { validateTuningQueryFile } from '../core/search-tuning/validate';
import type { TuningJudgeInput, TuningLabelSource, TuningStrategyOptimizer } from '../core/search-tuning/types';

export interface SearchTuneServiceOptions extends ServiceConfigInput {
  data?: string;
}

export interface SearchTuneRunOptions extends SearchTuneServiceOptions {
  applicationId: string;
  datasetId?: string;
  sceneId?: string;
  queries?: string;
  queryCount?: number;
  topK?: number;
  maxStrategies?: number;
  optimizer?: TuningStrategyOptimizer;
  searchConcurrency?: number;
  llmConcurrency?: number;
  labelSource?: TuningLabelSource;
  judgeInput?: TuningJudgeInput;
  maxJudgeImages?: number;
  llmRetries?: number;
  maxLabelFailureRate?: number;
  verbose?: boolean;
  outputDir?: string;
  profile?: string;
  resumeRunId?: string;
}

export interface SearchTunePlanOptions extends SearchTuneServiceOptions {
  applicationId: string;
  datasetId?: string;
  sceneId?: string;
  queries?: string;
  queryCount?: number;
  topK?: number;
  maxStrategies?: number;
  optimizer?: TuningStrategyOptimizer;
  profile?: string;
}

export interface SearchTuneQueryGenerateOptions extends SearchTuneServiceOptions {
  applicationId: string;
  datasetId?: string;
  sceneId?: string;
  queryCount?: number;
  minQueryCount?: number;
  sampleSize?: number;
  queryBatchSize?: number;
  llmConcurrency?: number;
  retrievableFieldOnly?: boolean;
  outputDir?: string;
}

export interface SearchTuneReportOptions extends SearchTuneServiceOptions {
  runId: string;
  outputDir?: string;
}

export interface SearchTuneValidateOptions extends SearchTuneServiceOptions {
  queries: string;
  queryCount?: number;
}

export interface SearchTuneCompareOptions extends SearchTuneServiceOptions {
  applicationId?: string;
  datasetId?: string;
  runIds?: string[];
  sceneIds?: string[];
  queries?: string;
  topK?: number;
  searchConcurrency?: number;
  baselineRunId?: string;
  baselineSceneId?: string;
  outputDir?: string;
}

export interface SearchTuneApplyOptions extends SearchTuneServiceOptions {
  applicationId: string;
  runId: string;
  outputDir?: string;
  sceneName?: string;
  sceneDescription?: string;
  dryRun?: boolean;
  confirmCreateScene?: boolean;
}

export interface SearchTuneLlmCheckOptions extends SearchTuneServiceOptions {
  live?: boolean;
}

const LLM_CONFIG_GUIDANCE =
  'LLM is not configured. Run `vs llm login` to store an OpenAI-compatible API key securely, or set VIKING_LLM_BASE_URL, VIKING_LLM_API_KEY, and VIKING_LLM_MODEL in a real terminal and run `vs llm import-env`.';

export async function runSearchTuneLlmCheckCommand(options: SearchTuneLlmCheckOptions): Promise<void> {
  const llmConfig = resolveLlmClientConfig({
    timeoutMs: options.timeoutMs
  });
  if (!llmConfig) {
    await printOutput({
      ok: false,
      detail: LLM_CONFIG_GUIDANCE
    });
    return;
  }

  const result: Record<string, unknown> = {
    ok: true,
    baseUrl: llmConfig.baseUrl,
    model: llmConfig.model,
    auth: llmConfig.apiKey ? 'api-key' : 'ak-sk'
  };

  if (options.live) {
    const raw = await requestChatCompletion(llmConfig, 'Return only JSON: {"ok":true}.', {
      ping: true
    });
    result.live = raw;
  }

  await printOutput(result);
}

export async function runSearchTuneRunCommand(options: SearchTuneRunOptions): Promise<void> {
  if (options.profile && options.profile !== 'similarity-only') {
    throw new Error('Only --profile similarity-only is supported in the first version.');
  }

  const effectiveTimeoutMs = options.timeoutMs ?? 120000;
  const resumeState = options.resumeRunId ? await loadTuningRunState(options.outputDir, options.resumeRunId) : undefined;
  const effectiveLabelSource = options.labelSource ?? resumeState?.labelSource ?? 'llm';
  const effectiveJudgeInput = options.judgeInput ?? resumeState?.judgeInput ?? 'text';
  const effectiveMaxJudgeImages = Math.max(1, Math.floor(options.maxJudgeImages ?? resumeState?.maxJudgeImages ?? 1));
  const needsLlmBeforeRun = (!resumeState && !options.queries) || effectiveLabelSource === 'llm';
  const llmConfig = needsLlmBeforeRun
    ? (resolveLlmClientConfig({
        timeoutMs: effectiveTimeoutMs
      }) ?? undefined)
    : undefined;
  if (!llmConfig && needsLlmBeforeRun) {
    throw new Error(`${LLM_CONFIG_GUIDANCE} Run \`vs search tune llm-check\` for details.`);
  }
  const maxLabelFailureRate = options.maxLabelFailureRate ?? 0.01;
  if (!Number.isFinite(maxLabelFailureRate) || maxLabelFailureRate < 0 || maxLabelFailureRate > 1) {
    throw new Error('--max-label-failure-rate must be a number between 0 and 1.');
  }

  const serviceConfig = resolveServiceConfig({
    ...toServiceConfigInput(options),
    timeoutMs: effectiveTimeoutMs
  });
  if (resumeState && resumeState.applicationId !== options.applicationId) {
    throw new Error(
      `Cannot resume ${options.resumeRunId} for application ${options.applicationId}; run-state.json belongs to application ${resumeState.applicationId}.`
    );
  }
  const context = resumeState
    ? await loadResumeContext(resumeState)
    : await inspectTuningContext({
        config: serviceConfig,
        applicationId: options.applicationId,
        datasetId: options.datasetId,
        sceneId: options.sceneId,
        sampleSize: 20,
        includeImageIndexFields: effectiveJudgeInput === 'text-image'
      });
  const effectiveTopK = resumeState?.topK ?? options.topK ?? 20;
  const effectiveQueryCount = resumeState?.queryCount ?? options.queryCount ?? (options.queries ? undefined : 100);
  const effectiveMaxStrategies = resumeState?.strategyCount ?? options.maxStrategies ?? 30;
  const effectiveOptimizer = resumeState?.optimizer ?? options.optimizer ?? 'matrix';
  const effectiveSearchConcurrency = resumeState?.searchConcurrency ?? options.searchConcurrency ?? 18;
  const effectiveLlmConcurrency = options.llmConcurrency ?? resumeState?.llmConcurrency ?? 100;
  const runtimeConfig = resolveRuntimeConfig({
    ...toRuntimeConfigInput(options),
    timeoutMs: effectiveTimeoutMs,
    applicationId: options.applicationId,
    datasetId: context.datasetId,
    sceneId: options.sceneId ?? '',
    defaultPageSize: effectiveTopK
  });
  const report = await runSearchTuning({
    runtimeConfig,
    context,
    llmConfig,
    queriesFile: options.queries,
    queryCount: effectiveQueryCount,
    topK: effectiveTopK,
    maxStrategies: effectiveMaxStrategies,
    optimizer: effectiveOptimizer,
    searchConcurrency: effectiveSearchConcurrency,
    llmConcurrency: effectiveLlmConcurrency,
    labelSource: effectiveLabelSource,
    judgeInput: effectiveJudgeInput,
    maxJudgeImages: effectiveMaxJudgeImages,
    llmRetries: options.llmRetries ?? 1,
    maxLabelFailureRate,
    outputDir: options.outputDir,
    resumeRunId: options.resumeRunId,
    onProgress: createProgressWriter(Boolean(options.verbose))
  });

  await printOutput({
    ok: true,
    runId: report.runId,
    report: report.artifacts.reportMarkdown,
    reportJson: report.artifacts.reportJson,
    recommendation: report.artifacts.recommendation,
    recommendedSearchDynamic: report.artifacts.recommendedSearchDynamic,
    recommendedRequestParams: report.artifacts.recommendedRequestParams,
    performanceSummary: report.artifacts.performanceSummary,
    performance: report.performance,
    optimizer: report.optimizer,
    runState: report.artifacts.runState,
    partialMetrics: report.artifacts.partialMetrics,
    rankings: report.artifacts.rankings,
    labelsUsed: report.artifacts.labelsUsed,
    labelFailures: report.artifacts.labelFailures,
    labelSource: report.labelSource,
    judgeInput: report.judgeInput,
    maxJudgeImages: report.maxJudgeImages,
    imageIndexFields: report.imageIndexFields,
    labelCount: report.labelCount,
    labelFailureCount: report.labelFailureCount,
    recommendedStrategyId: report.recommendedStrategyId
  });
}

async function loadResumeContext(state: Awaited<ReturnType<typeof loadTuningRunState>>) {
  const contextPath = state.artifacts.context;
  const raw = await import('node:fs/promises').then(fs => fs.readFile(contextPath, 'utf8'));
  return JSON.parse(raw) as Awaited<ReturnType<typeof inspectTuningContext>>;
}

export async function runSearchTunePlanCommand(options: SearchTunePlanOptions): Promise<void> {
  if (options.profile && options.profile !== 'similarity-only') {
    throw new Error('Only --profile similarity-only is supported in the first version.');
  }

  const plan = await buildSearchTuningPlan({
    applicationId: options.applicationId,
    datasetId: options.datasetId,
    sceneId: options.sceneId,
    queriesFile: options.queries,
    queryCount: options.queryCount,
    topK: options.topK ?? 20,
    maxStrategies: options.maxStrategies ?? 30,
    optimizer: options.optimizer ?? 'matrix'
  });
  await printOutput(plan);
}

export async function runSearchTuneQueryGenerateCommand(options: SearchTuneQueryGenerateOptions): Promise<void> {
  const effectiveTimeoutMs = options.timeoutMs ?? 120000;
  const startedAt = Date.now();
  const llmConfig = resolveLlmClientConfig({
    timeoutMs: effectiveTimeoutMs
  });
  if (!llmConfig) {
    throw new Error(`${LLM_CONFIG_GUIDANCE} Run \`vs search tune llm-check\` for details.`);
  }

  const serviceConfig = resolveServiceConfig({
    ...toServiceConfigInput(options),
    timeoutMs: effectiveTimeoutMs
  });
  const sampleLoadStartedAt = Date.now();
  const context = await inspectTuningContext({
    config: serviceConfig,
    applicationId: options.applicationId,
    datasetId: options.datasetId,
    sceneId: options.sceneId,
    sampleSize: options.sampleSize ?? 200,
    includeFieldContext: Boolean(options.retrievableFieldOnly)
  });
  const sampleLoadMs = Date.now() - sampleLoadStartedAt;
  const queryCount = options.queryCount ?? 100;
  const minQueryCount = options.minQueryCount ?? defaultMinQueryCount(queryCount);
  const generation = await generateTuningQuerySet({
    llmConfig,
    sampleItems: context.sampleItems,
    count: queryCount,
    batchSize: options.queryBatchSize ?? 10,
    llmConcurrency: options.llmConcurrency ?? 100,
    fieldContext: context.fieldContext,
    retrievableFieldOnly: Boolean(options.retrievableFieldOnly)
  });
  const generatedAt = new Date().toISOString();
  const fileId = generatedAt.replaceAll(':', '-').replace(/\.\d+Z$/, 'Z');
  const rootDir = path.resolve(options.outputDir ?? '.viking/search-tuning');
  const queryFile = path.join(rootDir, 'query-sets', `queries_${fileId}.jsonl`);
  const writeStartedAt = Date.now();
  await writeText(queryFile, `${generation.queries.map(query => stableStringify(query)).join('\n')}\n`);
  const writeMs = Date.now() - writeStartedAt;
  const warnings = [...generation.warnings];
  if (generation.actualQueryCount < minQueryCount) {
    warnings.push(`actual query count ${generation.actualQueryCount} is below minQueryCount ${minQueryCount}.`);
  }
  const ok = generation.actualQueryCount >= minQueryCount;

  await printOutput({
    ok,
    generatedAt,
    applicationId: options.applicationId,
    datasetId: context.datasetId,
    sceneId: context.sceneId,
    querySource: 'generated',
    queryCount: generation.actualQueryCount,
    requestedQueryCount: generation.requestedQueryCount,
    actualQueryCount: generation.actualQueryCount,
    minQueryCount,
    shortfall: generation.shortfall,
    queryFile,
    sampleItemCount: context.sampleItems.length,
    retrievableFieldOnly: Boolean(options.retrievableFieldOnly),
    textRetrievableFields: context.fieldContext ? textRetrievableFields(context.fieldContext) : undefined,
    queryBatchSize: options.queryBatchSize ?? 10,
    llmConcurrency: options.llmConcurrency ?? 100,
    llmRequestCount: generation.llmRequestCount,
    duplicateQueryCount: generation.duplicateQueryCount,
    warnings,
    performance: {
      durationMs: Date.now() - startedAt,
      sampleLoadMs,
      llmWallMs: generation.llmWallMs,
      writeMs
    },
    typeCounts: countBy(generation.queries.map(query => query.type ?? 'unknown')),
    sampleQueries: generation.queries.slice(0, Math.min(20, generation.queries.length))
  });
  if (!ok) {
    process.exitCode = 1;
  }
}

export async function runSearchTuneReportCommand(options: SearchTuneReportOptions): Promise<void> {
  const report = await loadTuningReport(options.outputDir, options.runId);
  await printOutput(report);
}

export async function runSearchTuneValidateCommand(options: SearchTuneValidateOptions): Promise<void> {
  const result = await validateTuningQueryFile({
    queriesFile: options.queries,
    queryCount: options.queryCount
  });
  await printOutput(result);
  if (!result.ok) {
    process.exitCode = 1;
  }
}

export async function runSearchTuneCompareCommand(options: SearchTuneCompareOptions): Promise<void> {
  const runIds = options.runIds ?? [];
  const sceneIds = options.sceneIds ?? [];
  if (runIds.length > 0 && sceneIds.length > 0) {
    throw new Error('Use either --run-ids for offline report comparison or --scene-ids for online scene comparison, not both.');
  }
  if (runIds.length > 0) {
    const result = await compareTuningRuns({
      runIds,
      outputDir: options.outputDir,
      baselineRunId: options.baselineRunId
    });
    await printOutput(result);
    return;
  }
  if (sceneIds.length > 0) {
    if (!options.applicationId) throw new Error('--application-id is required with --scene-ids.');
    if (!options.datasetId) throw new Error('--dataset-id is required with --scene-ids.');
    if (!options.queries) throw new Error('--queries is required with --scene-ids.');
    const runtimeConfig = resolveRuntimeConfig({
      ...toRuntimeConfigInput({
        ...options,
        applicationId: options.applicationId,
        datasetId: options.datasetId
      }),
      timeoutMs: options.timeoutMs,
      applicationId: options.applicationId,
      datasetId: options.datasetId,
      sceneId: '',
      defaultPageSize: options.topK ?? 20
    });
    const result = await compareSearchScenes({
      runtimeConfig,
      queriesFile: options.queries,
      sceneIds,
      topK: options.topK ?? 20,
      searchConcurrency: options.searchConcurrency ?? 18,
      baselineSceneId: options.baselineSceneId
    });
    await printOutput(result);
    return;
  }
  throw new Error('Provide --run-ids <id,id> or --scene-ids <id,id>.');
}

export async function runSearchTuneApplyCommand(options: SearchTuneApplyOptions): Promise<void> {
  const report = await loadTuningReport(options.outputDir, options.runId);
  const draft = buildSceneApplyDraft(report, {
    applicationId: options.applicationId,
    projectName: options.projectName,
    sceneName: options.sceneName,
    sceneDescription: options.sceneDescription
  });

  if (options.dryRun) {
    await printOutput({
      ok: true,
      dryRun: true,
      ...draft,
      notes: buildApplyNotes(draft.unappliedRequestParams)
    });
    return;
  }

  if (!options.confirmCreateScene) {
    throw new Error('Refusing to create a search scene without --confirm-create-scene. Use --dry-run to inspect the payload first.');
  }

  const serviceConfig = resolveServiceConfig(toServiceConfigInput(options));
  const projectName = options.projectName ?? serviceConfig.projectName;
  const openapi = new VikingOpenApiClient(serviceConfig);
  const createResponse = await openapi.post('/api/v1/CreateSearchScene', {
    ...draft.createPayload,
    ProjectName: projectName
  });
  const sceneId = extractSceneId(createResponse);
  if (!sceneId) {
    throw new Error('CreateSearchScene did not return SceneID.');
  }
  const onlinePayload = withSceneId({
    ...draft.onlinePayload,
    ProjectName: projectName
  }, sceneId);
  const onlineResponse = await openapi.post('/api/v1/OnlineSearchScene', onlinePayload);
  const readbackResponse = await openapi.post('/api/v1/GetSearchScene', {
    AppID: options.applicationId,
    ProjectName: projectName,
    SceneID: sceneId
  });

  await printOutput({
    ok: true,
    dryRun: false,
    sceneId,
    ...draft,
    onlinePayload,
    createResponse,
    onlineResponse,
    readbackResponse,
    notes: buildApplyNotes(draft.unappliedRequestParams)
  });
}

function countBy(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function defaultMinQueryCount(queryCount: number): number {
  if (queryCount <= 10) return queryCount;
  return Math.min(queryCount, Math.max(10, Math.ceil(queryCount * 0.8)));
}

function createProgressWriter(verbose: boolean): (event: TuningProgressEvent) => void {
  return event => {
    if (event.detail && !verbose) return;
    const progress =
      event.total && event.total > 0 && event.completed !== undefined ? ` [${event.completed}/${event.total}]` : '';
    process.stderr.write(`[search-tune:${event.phase}]${progress} ${event.message}\n`);
  };
}

function extractSceneId(response: unknown): string | undefined {
  const candidates = [
    response,
    isRecord(response) ? response.Result : undefined,
    isRecord(response) ? response.result : undefined
  ];
  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    for (const key of ['SceneID', 'SceneId', 'scene_id', 'sceneId']) {
      const value = candidate[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return undefined;
}

function buildApplyNotes(unappliedRequestParams: { query_keyword_match_percent?: number; disable_personalize?: boolean }): string[] {
  const notes: string[] = [];
  if (Object.keys(unappliedRequestParams).length > 0) {
    notes.push('Request-only params are not persisted in scene config; keep them in caller request payloads when needed.');
  }
  if (unappliedRequestParams.query_keyword_match_percent !== undefined) {
    notes.push('query_keyword_match_percent is a request-level parameter and is reported as unappliedRequestParams.');
  }
  return notes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toServiceConfigInput(options: SearchTuneServiceOptions): ServiceConfigInput {
  return {
    baseUrl: options.baseUrl,
    controlPlaneBaseUrl: options.controlPlaneBaseUrl,
    dataPlaneBaseUrl: options.dataPlaneBaseUrl,
    apiKey: options.apiKey,
    accessKeyId: options.accessKeyId,
    secretKey: options.secretKey,
    projectName: options.projectName,
    region: options.region,
    timeoutMs: options.timeoutMs
  };
}

function toRuntimeConfigInput(options: SearchTuneRunOptions) {
  return {
    baseUrl: options.baseUrl,
    controlPlaneBaseUrl: options.controlPlaneBaseUrl,
    dataPlaneBaseUrl: options.dataPlaneBaseUrl,
    apiKey: options.apiKey,
    accessKeyId: options.accessKeyId,
    secretKey: options.secretKey,
    region: options.region,
    timeoutMs: options.timeoutMs,
    outputDir: options.outputDir
  };
}
