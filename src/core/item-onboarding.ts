// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { inferSchemaArtifactsWithConsole } from './console-schema-inference';
import { ensureDir, slugify, writeJson, writeText } from './files';
import { inferSchemaMetadataWithPrompt } from './schema-prompt-inference';

export type ItemSourceFormat = 'json' | 'jsonl' | 'csv';
export type ItemFieldType =
  | 'string'
  | 'int64'
  | 'float'
  | 'boolean'
  | 'array<string>'
  | 'array<int64>'
  | 'array<float>'
  | 'object'
  | 'array<object>';

export type ItemValidationSeverity = 'error' | 'warning';

export interface ItemCleanupSummary {
  trimmedStringValues: number;
  emptyStringValuesNormalized: number;
  specialValueNormalizations: number;
}

export interface ItemValidationIssue {
  severity: ItemValidationSeverity;
  code: string;
  field?: string;
  detail: string;
  affectedCount?: number;
  examples?: unknown[];
}

export interface ItemValidationSummary {
  totalRecords: number;
  cleanedRecords: number;
  blockingIssueCount: number;
  warningCount: number;
  missingPrimaryKeyCount: number;
  duplicatePrimaryKeyCount: number;
  missingTitleCount: number;
  mixedTypeFieldCount: number;
  emptyRecordCount: number;
}

export interface ItemValidationResult {
  ok: boolean;
  cleanup: ItemCleanupSummary;
  summary: ItemValidationSummary;
  issues: ItemValidationIssue[];
}

export interface ItemFieldProfile {
  sourceName: string;
  name: string;
  inferredType: ItemFieldType;
  nullable: boolean;
  missingCount: number;
  distinctCount: number;
  uniqueRatio: number;
  examples: unknown[];
  roles: string[];
  warnings: string[];
  meaning?: string;
  fields?: ItemFieldProfile[];
}

export interface ItemProfileResult {
  ok: true;
  source: {
    file: string;
    format: ItemSourceFormat;
    totalRecords: number;
    sampledRecords: number;
  };
  inferred: {
    primaryKeyField: string;
    syntheticPrimaryKey: boolean;
    titleField: string | null;
    indexFields: string[];
    filterFields: string[];
    suggestFields: string[];
    imageFields: string[];
  };
  sanitizedFields: Array<{
    sourceName: string;
    name: string;
  }>;
  fields: ItemFieldProfile[];
  warnings: string[];
  validation: ItemValidationResult;
  sample: Record<string, unknown>[];
}

export interface ItemPlanOptions {
  baseUrl?: string;
  controlPlaneBaseUrl?: string;
  dataPlaneBaseUrl?: string;
  accessKeyId?: string;
  secretKey?: string;
  file: string;
  datasetType?: 'item' | 'video';
  goal?: string;
  outputDir?: string;
  datasetName?: string;
  applicationName?: string;
  force?: boolean;
  projectName?: string;
  region?: string;
  timeoutMs?: number;
  skipApp?: boolean;
  schemaSource?: 'auto' | 'console' | 'local';
  schemaWaitTimeoutMs?: number;
  schemaPollIntervalMs?: number;
  language?: string;
}

export interface ItemPlanResult {
  ok: true;
  planDir: string;
  reportPath: string;
  planPath: string;
  generatedFiles: string[];
  profile: ItemProfileResult;
  plan: ItemPlanFile;
}

export interface ItemApplyPlanOptions {
  planDir: string;
  applicationId?: string;
  datasetId?: string;
  applicationName?: string;
  datasetName?: string;
  projectName?: string;
  waitReady?: boolean;
  runTrials?: boolean;
  searchQuery?: string;
  chatMessage?: string;
  confirmReview?: boolean;
  interactiveReview?: boolean;
  reviewer?: string;
  reviewNotes?: string;
  confirmRecommendEntryBinding?: boolean;
  force?: boolean;
  recommendSceneType?: string;
  recommendSceneName?: string;
  recommendBhvSceneTypes?: string[];
  recommendUserId?: string;
  recommendParentId?: string;
  dryRun?: boolean;
  skipApp?: boolean;
}

export interface ItemPlanFile {
  version: 1;
  createdAt: string;
  source: {
    file: string;
    format: ItemSourceFormat;
    totalRecords: number;
  };
  goal: string | null;
  names: {
    dataset: string;
    application: string;
  };
  inferred: ItemProfileResult['inferred'];
  warnings: string[];
  validation: ItemValidationResult;
  files: {
    normalizedItems: string;
    schema: string;
    fieldConfig: string;
    onlineConfig: string;
    validation: string;
    reviewConfirmation: string;
    datasetCreate: string;
    appCreate: string;
    schemaCheck: string;
    searchSceneCreate: string;
    searchSceneUpdate: string;
    recommendSceneCreate: string;
    recommendSceneUpdate: string;
    report: string;
  };
  defaults: {
    searchQuery: string;
    chatMessage: string;
    datasetType: 'item' | 'video';
    search: {
      sceneName: string;
      sceneDescription: string;
      pageSize: number;
    };
    recommend: {
      sceneType: string;
      sceneName: string;
      sceneDescription: string;
      bhvSceneTypes: string[];
      pageSize: number;
      userId: string;
      parentItemId: string | null;
    };
    skipApp?: boolean;
  };
  reviewChecklist: string[];
}

export interface ItemReviewConfirmationFile {
  version: 1;
  status: 'pending' | 'confirmed';
  confirmedBy: string;
  confirmedAt: string | null;
  notes: string;
  requiredChecks: {
    fieldTypesReviewed: boolean;
    fieldAttributesReviewed: boolean;
    displayStyleReviewed: boolean;
    runtimeFieldConfigReviewed: boolean;
  };
  fieldConfigReview?: {
    indexFields: string[];
    filterFields: string[];
    suggestFields: string[];
    imageIndexFields: string[];
    videoIndexFields: string[];
  };
}

interface LoadedItemSource {
  format: ItemSourceFormat;
  records: Array<Record<string, unknown>>;
  cleanup: ItemCleanupSummary;
}

interface SanitizedRecordSet {
  sanitizedFields: Array<{ sourceName: string; name: string }>;
  fieldMap: Map<string, string>;
  records: Array<Record<string, unknown>>;
}

interface PromptInferenceMetadata {
  fieldMeanings: Record<string, string>;
  datasetDescription?: string;
  filterFields?: string[];
  suggestFields?: string[];
  indexFields?: string[];
  notUseFields?: string[];
  attrFields?: Record<string, string[]>;
}

const STRONG_PRIMARY_KEY_NAMES = {
  item: [
    'item_id',
    'itemid',
    'id',
    'doc_id',
    'docid',
    'sku_id',
    'skuid',
    'product_id',
    'productid',
    'content_id',
    'contentid'
  ],
  video: [
    'content_id',
    'video_id',
    'vid',
    'id'
  ]
} as const;

const STRONG_TITLE_NAMES = {
  item: [
    'title',
    'name',
    'item_name',
    'product_name',
    'doc_title',
    'subject'
  ],
  video: [
    'title',
    'video_title',
    'name',
    'video_name',
    'description'
  ]
} as const;

const STRONG_INDEX_NAMES = [
  'title',
  'name',
  'keywords',
  'abstract',
  'summary',
  'description',
  'desc',
  'content',
  'body',
  'brand',
  'category',
  'tags'
] as const;

const STRONG_FILTER_NAMES = [
  'category',
  'brand',
  'channel',
  'type',
  'status',
  'language',
  'creator',
  'operator',
  'region',
  'site',
  'shop'
] as const;

const STRONG_IMAGE_NAMES = ['image', 'image_url', 'image_urls', 'picture', 'cover', 'cover_url', 'thumbnail', 'icon'] as const;

const SYNTHETIC_PRIMARY_KEY = '_viking_item_id';

const DATASET_FIELD_TYPE_CODES: Record<string, number> = {
  string: 1,
  text: 1,
  keyword: 1,
  int32: 2,
  int: 3,
  int64: 3,
  float: 4,
  double: 4,
  boolean: 5,
  bool: 5,
  'array<string>': 6,
  'array<int32>': 7,
  'array<int64>': 8,
  'array<float>': 9,
  'array<double>': 9,
  object: 10,
  json: 10,
  'array<object>': 11,
  'object[]': 11
};

export interface ItemProfileCommandOptions {
  file: string;
  datasetType?: 'item' | 'video';
}

export async function buildItemProfile(options: ItemProfileCommandOptions): Promise<ItemProfileResult> {
  const filePath = options.file;
  const datasetType = options.datasetType ?? 'item';
  const source = await loadItemSource(filePath);
  if (source.records.length === 0) {
    throw new Error(`No records found in ${filePath}.`);
  }

  const sanitized = sanitizeRecords(source.records);
  const profiled = profileSanitizedRecords(sanitized.records);
  const inference = inferRoles(profiled, sanitized.records, datasetType);
  const normalizedRecords = applySyntheticPrimaryKeyIfNeeded(sanitized.records, inference.primaryKeyField, inference.syntheticPrimaryKey);
  const fields = attachFieldRoles(profiled, inference);
  const validation = buildValidationResult(fields, inference, normalizedRecords, source.cleanup, datasetType);
  const warnings = collectProfileWarnings(fields, inference, sanitized.sanitizedFields, validation);

  return {
    ok: true,
    source: {
      file: path.resolve(filePath),
      format: source.format,
      totalRecords: source.records.length,
      sampledRecords: Math.min(source.records.length, 3)
    },
    inferred: {
      primaryKeyField: inference.primaryKeyField,
      syntheticPrimaryKey: inference.syntheticPrimaryKey,
      titleField: inference.titleField,
      indexFields: inference.indexFields,
      filterFields: inference.filterFields,
      suggestFields: inference.suggestFields,
      imageFields: inference.imageFields
    },
    sanitizedFields: sanitized.sanitizedFields,
    fields,
    warnings,
    validation,
    sample: normalizedRecords.slice(0, 3)
  };
}

export async function buildItemPlan(options: ItemPlanOptions): Promise<ItemPlanResult> {
  const datasetType = options.datasetType ?? 'item';
  const profile = await buildItemProfile({ file: options.file, datasetType: options.datasetType });
  const planDir =
    options.outputDir
      ? path.resolve(options.outputDir)
      : path.resolve('.viking', 'item-plans', `${slugify(path.parse(options.file).name || 'item-data') || 'item-data'}-${Date.now()}`);
  const names = {
    dataset: options.datasetName ?? `${slugify(path.parse(options.file).name || 'items') || 'items'}-dataset`,
    application: options.applicationName ?? `${slugify(path.parse(options.file).name || 'items') || 'items'}-app`
  };

  const normalizedItems = profile.sample.length > 0 ? await loadNormalizedItems(options.file, profile) : [];
  const schemaSource = options.schemaSource ?? 'auto';
  const consoleArtifacts = await maybeInferSchemaArtifactsWithConsole(options, normalizedItems, datasetType, schemaSource);
  const promptInference: PromptInferenceMetadata | undefined = consoleArtifacts
    ? undefined
    : await inferSchemaMetadataWithPrompt({
      fields: toPromptInferenceFields(profile.fields),
      records: normalizedItems,
      datasetType: datasetType === 'video' ? 'video' : 'item',
      attrPromptKey: datasetType
    }).catch(() => ({ fieldMeanings: {} }));

  const schema = consoleArtifacts
    ? normalizeSchemaForApi(consoleArtifacts.schema)
    : buildSchemaArtifact(profile, datasetType, promptInference?.fieldMeanings, promptInference?.attrFields);
  const fieldConfig = consoleArtifacts
    ? normalizeFieldConfigForApi(consoleArtifacts.dataFieldConfig)
    : buildFieldConfigArtifact(profile, datasetType, promptInference ?? { fieldMeanings: {} });
  const onlineConfig: Record<string, unknown> = {};
  const defaults = buildDefaultTrials(profile, datasetType);
  const validation = profile.validation;
  const searchSceneCreate = buildSearchSceneCreateArtifact(defaults);
  const searchSceneUpdate = buildSearchSceneUpdateArtifact(defaults);
  const recommendSceneCreate = buildRecommendSceneCreateArtifact(profile, defaults);
  const recommendSceneUpdate = buildRecommendSceneUpdateArtifact(defaults);
  const schemaCheck = {
    Type: datasetType === 'video' ? 3 : 1,
    Schema: schema,
    DataFieldConfig: fieldConfig,
    ProjectName: options.projectName
  };
  const datasetCreate = {
    Name: names.dataset,
    Type: datasetType === 'video' ? 3 : 1,
    Description: extractDatasetDescription(fieldConfig) ?? promptInference?.datasetDescription ?? buildDatasetDescription(options.file, options.goal),
    Schema: schema,
    DataFieldConfig: fieldConfig
  };
  const appCreate = {
    Name: names.application,
    Industry: datasetType === 'video' ? 3 : 1
  };

  const plan: ItemPlanFile = {
    version: 1,
    createdAt: new Date().toISOString(),
    source: {
      file: path.resolve(options.file),
      format: profile.source.format,
      totalRecords: profile.source.totalRecords
    },
    goal: options.goal ?? null,
    names,
    inferred: profile.inferred,
    warnings: profile.warnings,
    validation,
    files: {
      normalizedItems: 'normalized-items.json',
      schema: 'schema.json',
      fieldConfig: 'field-config.json',
      onlineConfig: 'online-config.json',
      validation: 'validation.json',
      reviewConfirmation: 'review-confirmation.json',
      datasetCreate: 'dataset-create.json',
      appCreate: 'app-create.json',
      schemaCheck: 'schema-check.json',
      searchSceneCreate: 'search-scene-create.json',
      searchSceneUpdate: 'search-scene-update.json',
      recommendSceneCreate: 'recommend-scene-create.json',
      recommendSceneUpdate: 'recommend-scene-update.json',
      report: 'report.md'
    },
    defaults: {
      ...defaults,
      skipApp: options.skipApp
    },
    reviewChecklist: buildReviewChecklist(profile)
  };

  const reviewConfirmation: ItemReviewConfirmationFile = {
    version: 1,
    status: 'pending',
    confirmedBy: '',
    confirmedAt: null,
    notes: '',
    requiredChecks: {
      fieldTypesReviewed: false,
      fieldAttributesReviewed: false,
      displayStyleReviewed: false,
      runtimeFieldConfigReviewed: false
    }
  };

  const reportPath = path.join(planDir, plan.files.report);
  const planPath = path.join(planDir, 'plan.json');
  const generatedFiles = [
    path.join(planDir, plan.files.normalizedItems),
    path.join(planDir, plan.files.schema),
    path.join(planDir, plan.files.fieldConfig),
    path.join(planDir, plan.files.onlineConfig),
    path.join(planDir, plan.files.validation),
    path.join(planDir, plan.files.reviewConfirmation),
    path.join(planDir, plan.files.datasetCreate),
    path.join(planDir, plan.files.appCreate),
    path.join(planDir, plan.files.schemaCheck),
    path.join(planDir, plan.files.searchSceneCreate),
    path.join(planDir, plan.files.searchSceneUpdate),
    path.join(planDir, plan.files.recommendSceneCreate),
    path.join(planDir, plan.files.recommendSceneUpdate),
    reportPath,
    planPath
  ];

  await ensureDir(planDir);
  await writeJson(path.join(planDir, plan.files.normalizedItems), normalizedItems);
  await writeJson(path.join(planDir, plan.files.schema), schema);
  await writeJson(path.join(planDir, plan.files.fieldConfig), fieldConfig);
  await writeJson(path.join(planDir, plan.files.onlineConfig), onlineConfig);
  await writeJson(path.join(planDir, plan.files.validation), validation);
  await writeJson(path.join(planDir, plan.files.reviewConfirmation), reviewConfirmation);
  await writeJson(path.join(planDir, plan.files.datasetCreate), datasetCreate);
  await writeJson(path.join(planDir, plan.files.appCreate), appCreate);
  await writeJson(path.join(planDir, plan.files.schemaCheck), schemaCheck);
  await writeJson(path.join(planDir, plan.files.searchSceneCreate), searchSceneCreate);
  await writeJson(path.join(planDir, plan.files.searchSceneUpdate), searchSceneUpdate);
  await writeJson(path.join(planDir, plan.files.recommendSceneCreate), recommendSceneCreate);
  await writeJson(path.join(planDir, plan.files.recommendSceneUpdate), recommendSceneUpdate);
  await writeJson(planPath, plan);
  await writeText(reportPath, renderPlanReport(plan, profile));

  return {
    ok: true,
    planDir,
    reportPath,
    planPath,
    generatedFiles,
    profile,
    plan
  };
}

export async function loadItemPlan(planDir: string): Promise<{ planDir: string; plan: ItemPlanFile }> {
  const resolvedPlanDir = path.resolve(planDir);
  const planPath = path.join(resolvedPlanDir, 'plan.json');
  const raw = JSON.parse(await readFile(planPath, 'utf8')) as ItemPlanFile;
  return {
    planDir: resolvedPlanDir,
    plan: raw
  };
}

export async function loadPlanArtifact<T>(planDir: string, relativePath: string): Promise<T> {
  return JSON.parse(await readFile(path.join(planDir, relativePath), 'utf8')) as T;
}

export function buildApplyDryRunSummary(
  planDir: string,
  plan: ItemPlanFile,
  options: ItemApplyPlanOptions,
  reviewConfirmation?: ItemReviewConfirmationFile
): {
  ok: true;
  dryRun: true;
  planDir: string;
  applicationId: string | null;
  datasetId: string | null;
  steps: Array<{ step: string; action: string; payloadSource?: string; detail?: string }>;
  defaults: ItemPlanFile['defaults'];
  reviewChecklist: string[];
  manualReview: {
    file: string;
    status: 'pending' | 'confirmed' | 'missing';
    confirmedBy: string | null;
    confirmedAt: string | null;
    notes: string | null;
    requiredChecks: Array<{ key: string; label: string; checked: boolean }>;
    pendingChecks: string[];
  };
  validation: ItemValidationResult;
} {
  const recommendBootstrapReady = Array.isArray(options.recommendBhvSceneTypes) && options.recommendBhvSceneTypes.length > 0;
  const recommendEntryBindingConfirmed = options.confirmRecommendEntryBinding === true;
  const skipApp = options.skipApp ?? plan.defaults.skipApp ?? false;
  const requiredChecks = buildManualReviewCheckItems(reviewConfirmation);
  const pendingChecks = requiredChecks.filter(item => !item.checked).map(item => item.label);
  const reviewStatus = reviewConfirmation?.status ?? 'missing';
  return {
    ok: true,
    dryRun: true,
    planDir,
    applicationId: options.applicationId ?? null,
    datasetId: options.datasetId ?? null,
    steps: [
      {
        step: 'validation_gate',
        action: plan.validation.ok || options.force ? 'pass' : 'block apply until validation issues are fixed or --force is used',
        payloadSource: plan.files.validation,
        detail: `${plan.validation.summary.blockingIssueCount} blocking issues, ${plan.validation.summary.warningCount} warnings`
      },
      {
        step: 'review_confirmation',
        action: options.confirmReview
          ? 'pass'
          : 'block apply until manual review is confirmed in review-confirmation.json and --confirm-review is provided',
        detail: options.confirmReview
          ? `CLI confirmation acknowledged. Manual confirmation file: ${plan.files.reviewConfirmation}; status=${reviewStatus}; pending_checks=${pendingChecks.length > 0 ? pendingChecks.join(', ') : 'none'}`
          : `Pass --confirm-review after a human confirms ${plan.files.reviewConfirmation}; pending_checks=${pendingChecks.length > 0 ? pendingChecks.join(', ') : 'none'}.`
      },
      { step: 'schema_check', action: 'CheckDatasetSchema', payloadSource: plan.files.schemaCheck },
      { step: 'create_dataset', action: options.datasetId ? 'skip (use existing dataset)' : 'CreateDataset', payloadSource: plan.files.datasetCreate },
      { step: 'ingest_items', action: 'runtime dataWrite', payloadSource: plan.files.normalizedItems },
      { step: 'create_application', action: skipApp ? 'skip (--skip-app provided)' : options.applicationId ? 'skip (use existing application)' : 'CreateApplication', payloadSource: plan.files.appCreate },
      { step: 'activate_application', action: skipApp ? 'skip (--skip-app provided)' : 'BindAppDataset' },
      { step: 'wait_ready', action: skipApp ? 'skip (--skip-app provided)' : 'skip (phase one ends after activation is requested)' },
      {
        step: 'search_scene_bootstrap',
        action: skipApp ? 'skip (--skip-app provided)' : options.runTrials ? 'CreateSearchScene + update search scene + bind ChatConfig.SearchSceneID' : 'skip',
        payloadSource: plan.files.searchSceneCreate
      },
      { step: 'search_trial', action: skipApp ? 'skip (--skip-app provided)' : options.runTrials ? `search "${options.searchQuery ?? plan.defaults.searchQuery}"` : 'skip' },
      { step: 'chat_trial', action: skipApp ? 'skip (--skip-app provided)' : options.runTrials ? `chat "${options.chatMessage ?? plan.defaults.chatMessage}"` : 'skip' },
      {
        step: 'recommend_bootstrap',
        action: skipApp ? 'skip (--skip-app provided)' : recommendBootstrapReady
          ? recommendEntryBindingConfirmed
            ? 'CreateRecommendScene + update recommend scene'
            : 'block recommend bootstrap until page/module binding is confirmed with the user'
          : 'skip',
        payloadSource: plan.files.recommendSceneCreate,
        detail: skipApp ? undefined : recommendBootstrapReady
          ? recommendEntryBindingConfirmed
            ? `scene=${options.recommendSceneName ?? plan.defaults.recommend.sceneName}, bhv_scene_types=${options.recommendBhvSceneTypes?.join(',')}`
            : 'Pass --confirm-recommend-entry-binding only after the user confirms which page or module this recommend scene belongs to.'
          : 'Pass --recommend-bhv-scene-types only after the user confirms the target page / module for recommend.'
      },
      {
        step: 'recommend_trial',
        action: skipApp ? 'skip (--skip-app provided)' : options.runTrials && recommendBootstrapReady ? 'recommend runtime smoke (if recommend user/parent context is provided)' : 'skip',
        payloadSource: plan.files.recommendSceneUpdate
      }
    ],
    defaults: plan.defaults,
    reviewChecklist: plan.reviewChecklist,
    manualReview: {
      file: plan.files.reviewConfirmation,
      status: reviewStatus,
      confirmedBy: reviewConfirmation?.confirmedBy || null,
      confirmedAt: reviewConfirmation?.confirmedAt ?? null,
      notes: reviewConfirmation?.notes || null,
      requiredChecks,
      pendingChecks
    },
    validation: plan.validation
  };
}

function buildManualReviewCheckItems(
  reviewConfirmation?: ItemReviewConfirmationFile
): Array<{ key: string; label: string; checked: boolean }> {
  const checks = reviewConfirmation?.requiredChecks;
  return [
    {
      key: 'fieldTypesReviewed',
      label: '字段数据类型已人工确认',
      checked: checks?.fieldTypesReviewed ?? false
    },
    {
      key: 'fieldAttributesReviewed',
      label: '字段属性已人工确认',
      checked: checks?.fieldAttributesReviewed ?? false
    },
    {
      key: 'displayStyleReviewed',
      label: '物品展示样式已人工确认',
      checked: checks?.displayStyleReviewed ?? false
    },
    {
      key: 'runtimeFieldConfigReviewed',
      label: '索引/过滤/补全等数据集配置已人工确认',
      checked: checks?.runtimeFieldConfigReviewed ?? false
    }
  ];
}

async function loadNormalizedItems(sourcePath: string, profile: ItemProfileResult): Promise<Record<string, unknown>[]> {
  const source = await loadItemSource(sourcePath);
  const sanitized = sanitizeRecords(source.records);
  return applySyntheticPrimaryKeyIfNeeded(sanitized.records, profile.inferred.primaryKeyField, profile.inferred.syntheticPrimaryKey);
}

async function maybeInferSchemaArtifactsWithConsole(
  options: ItemPlanOptions,
  normalizedItems: Array<Record<string, unknown>>,
  datasetType: 'item' | 'video',
  schemaSource: 'auto' | 'console' | 'local'
) {
  if (schemaSource === 'local') {
    return undefined;
  }

  try {
    return await inferSchemaArtifactsWithConsole({
      filePath: options.file,
      normalizedItems,
      datasetType,
      baseUrl: options.baseUrl,
      controlPlaneBaseUrl: options.controlPlaneBaseUrl,
      dataPlaneBaseUrl: options.dataPlaneBaseUrl,
      accessKeyId: options.accessKeyId,
      secretKey: options.secretKey,
      projectName: options.projectName,
      region: options.region,
      timeoutMs: options.timeoutMs,
      language: options.language,
      pollIntervalMs: options.schemaPollIntervalMs,
      waitTimeoutMs: options.schemaWaitTimeoutMs
    });
  } catch (error) {
    if (schemaSource === 'auto') {
      return undefined;
    }
    throw error;
  }
}

async function loadItemSource(filePath: string): Promise<LoadedItemSource> {
  const absolutePath = path.resolve(filePath);
  const content = await readFile(absolutePath, 'utf8');
  const format = resolveSourceFormat(absolutePath, content);
  const cleanup = createCleanupSummary();

  if (format === 'csv') {
    return {
      format,
      records: parseCsvRecords(content).map(record => normalizeRawRecord(record, cleanup)),
      cleanup
    };
  }

  if (format === 'jsonl') {
    const records = content
      .split(/\r?\n/u)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => JSON.parse(line) as unknown)
      .map(value => normalizeRawRecord(value, cleanup))
      .filter(isRecord);
    return { format, records, cleanup };
  }

  const parsed = JSON.parse(content) as unknown;
  const extracted = extractRecordArray(parsed).map(value => normalizeRawRecord(value, cleanup));
  return { format, records: extracted, cleanup };
}

function resolveSourceFormat(filePath: string, content: string): ItemSourceFormat {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') return 'csv';
  if (ext === '.jsonl' || ext === '.ndjson') return 'jsonl';
  if (ext === '.json') {
    const trimmed = content.trim();
    if (!trimmed.startsWith('[') && trimmed.split(/\r?\n/u).length > 1) {
      const firstLine = trimmed.split(/\r?\n/u)[0]?.trim();
      if (firstLine?.startsWith('{')) {
        return 'jsonl';
      }
    }
    return 'json';
  }
  const trimmed = content.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return 'json';
  return 'csv';
}

function extractRecordArray(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (isRecord(value)) {
    for (const key of ['items', 'records', 'data', 'list', 'fields']) {
      const candidate = value[key];
      if (Array.isArray(candidate) && candidate.every(isRecord)) {
        return candidate;
      }
    }
  }

  throw new Error('Structured item onboarding expects a JSON array, JSONL objects, CSV rows, or an object containing items/records/data/list.');
}

function normalizeRawRecord(value: unknown, cleanup: ItemCleanupSummary): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error('Item onboarding only supports object records.');
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, normalizeSpecialValue(entry, cleanup)])
  );
}

function normalizeSpecialValue(value: unknown, cleanup: ItemCleanupSummary): unknown {
  if (Array.isArray(value)) {
    return value.map(item => normalizeSpecialValue(item, cleanup));
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed !== value) {
      cleanup.trimmedStringValues += 1;
    }
    if (trimmed.length === 0) {
      cleanup.emptyStringValuesNormalized += 1;
      return null;
    }
    return trimmed;
  }

  if (!isRecord(value)) {
    return value;
  }

  const keys = Object.keys(value);
  if (keys.length === 1) {
    if (keys[0] === '$numberInt' || keys[0] === '$numberLong') {
      const parsed = Number.parseInt(String(value[keys[0]]), 10);
      if (Number.isFinite(parsed)) {
        cleanup.specialValueNormalizations += 1;
        return parsed;
      }
    }
    if (keys[0] === '$numberDouble' || keys[0] === '$numberDecimal') {
      const parsed = Number.parseFloat(String(value[keys[0]]));
      if (Number.isFinite(parsed)) {
        cleanup.specialValueNormalizations += 1;
        return parsed;
      }
    }
    if (keys[0] === '$date') {
      cleanup.specialValueNormalizations += 1;
      return String(value.$date);
    }
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, normalizeSpecialValue(entry, cleanup)])
  );
}

function createCleanupSummary(): ItemCleanupSummary {
  return {
    trimmedStringValues: 0,
    emptyStringValuesNormalized: 0,
    specialValueNormalizations: 0
  };
}

function sanitizeRecords(records: Array<Record<string, unknown>>): SanitizedRecordSet {
  const seen = new Map<string, string>();
  const sourceKeys = [...new Set(records.flatMap(record => Object.keys(record)))];
  const sanitizedFields = sourceKeys.map(sourceName => {
    const baseName = sanitizeFieldName(sourceName);
    let candidate = baseName;
    let suffix = 2;
    while ([...seen.values()].includes(candidate)) {
      candidate = `${baseName}_${suffix}`;
      suffix += 1;
    }
    seen.set(sourceName, candidate);
    return {
      sourceName,
      name: candidate
    };
  });

  const fieldMap = new Map(sanitizedFields.map(entry => [entry.sourceName, entry.name]));
  const sanitizedRecords = records.map(record =>
    Object.fromEntries(
      Object.entries(record).map(([key, value]) => [fieldMap.get(key) ?? sanitizeFieldName(key), value])
    )
  );

  return {
    sanitizedFields,
    fieldMap,
    records: sanitizedRecords
  };
}

function sanitizeFieldName(sourceName: string): string {
  if (sourceName === 'content_id' || sourceName === 'content_type' || sourceName === 'video_url' || sourceName === 'parent_content_id' || sourceName === 'sequence_index') {
    return sourceName;
  }

  const trimmed = sourceName.trim();
  const normalized = trimmed
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  const candidate = normalized.length > 0 ? normalized : `field_${randomUUID().slice(0, 8)}`;
  return /^\d/u.test(candidate) ? `f_${candidate}` : candidate;
}

function profileSanitizedRecords(records: Array<Record<string, unknown>>): ItemFieldProfile[] {
  const fields = [...new Set(records.flatMap(record => Object.keys(record)))];
  const total = records.length;

  return fields.map(name => {
    const values = records.map(record => normalizeValueForInference(record[name]));
    const nonNull = values.filter(value => value !== undefined && value !== null);
    const inferredType = inferFieldType(nonNull);
    const distinctValues = new Set(nonNull.map(stableKey));
    const warnings: string[] = [];

    if (isLongTextField(name, inferredType, nonNull)) {
      warnings.push('high-cardinality text field');
    }
    if (looksLikeUrlField(name, nonNull)) {
      warnings.push('contains URL-like values');
    }

    let subFields: ItemFieldProfile[] | undefined = undefined;
    if (inferredType === 'object') {
      const nestedRecords = nonNull.filter(isRecord) as Array<Record<string, unknown>>;
      if (nestedRecords.length > 0) {
        subFields = profileSanitizedRecords(nestedRecords);
      }
    } else if (inferredType === 'array<object>') {
      const nestedRecords = nonNull.flatMap(v => (Array.isArray(v) ? v : [])).filter(isRecord) as Array<Record<string, unknown>>;
      if (nestedRecords.length > 0) {
        subFields = profileSanitizedRecords(nestedRecords);
      }
    }

    return {
      sourceName: name,
      name,
      inferredType,
      nullable: nonNull.length < total,
      missingCount: total - nonNull.length,
      distinctCount: distinctValues.size,
      uniqueRatio: nonNull.length === 0 ? 0 : distinctValues.size / nonNull.length,
      examples: uniqueExampleValues(nonNull, 3),
      roles: [],
      warnings,
      fields: subFields
    };
  });
}

function inferRoles(
  fields: ItemFieldProfile[],
  records: Array<Record<string, unknown>>,
  datasetType: 'item' | 'video'
): {
  primaryKeyField: string;
  syntheticPrimaryKey: boolean;
  titleField: string | null;
  indexFields: string[];
  filterFields: string[];
  suggestFields: string[];
  imageFields: string[];
} {
  const total = records.length;
  const byName = new Map(fields.map(field => [field.name, field]));
  const scalarUniqueCandidates = fields.filter(field =>
    ['string', 'int64'].includes(field.inferredType) && field.missingCount === 0 && field.distinctCount === total
  );
  
  const pkNames = STRONG_PRIMARY_KEY_NAMES[datasetType] as readonly string[];
  const strongPkCandidates = fields
    .filter(field => ['string', 'int64'].includes(field.inferredType) && pkNames.includes(field.name as never))
    .sort((left, right) => {
      if (left.missingCount !== right.missingCount) return left.missingCount - right.missingCount;
      if (left.uniqueRatio !== right.uniqueRatio) return right.uniqueRatio - left.uniqueRatio;
      return right.distinctCount - left.distinctCount;
    });
  const strongPk = strongPkCandidates[0];
  const primaryKeyField = strongPk?.name ?? scalarUniqueCandidates[0]?.name ?? SYNTHETIC_PRIMARY_KEY;
  const syntheticPrimaryKey = primaryKeyField === SYNTHETIC_PRIMARY_KEY;

  const titleNames = STRONG_TITLE_NAMES[datasetType] as readonly string[];
  const stringFields = fields.filter(field => field.inferredType === 'string');
  const strongTitle = stringFields.find(field => titleNames.includes(field.name as never) && !looksLikeUrlField(field.name, field.examples));
  const titleField = strongTitle?.name ?? pickBestFallbackTitleField(stringFields);

  const imageFields = fields
    .filter(field => (field.inferredType === 'string' || field.inferredType === 'array<string>') && STRONG_IMAGE_NAMES.some(name => field.name.includes(name)))
    .map(field => field.name);

  const filterFields = fields
    .filter(field => field.name !== primaryKeyField && field.name !== titleField)
    .filter(field => {
      if (!['string', 'int64', 'float', 'boolean'].includes(field.inferredType)) return false;
      if (field.examples.length === 0) return false;
      if (looksLikeUrlField(field.name, field.examples)) return false;
      if (STRONG_FILTER_NAMES.includes(field.name as never)) return true;
      return field.distinctCount > 1 && (field.distinctCount <= 50 || field.uniqueRatio <= 0.35);
    })
    .map(field => field.name)
    .slice(0, 8);

  const indexFields = [
    ...(titleField ? [titleField] : []),
    ...fields
      .filter(field => field.name !== primaryKeyField && field.name !== titleField)
      .filter(field => field.inferredType === 'string' || field.inferredType === 'array<string>')
      .filter(field => STRONG_INDEX_NAMES.includes(field.name as never) || (!looksLikeUrlField(field.name, field.examples) && !isCategoricalField(field)))
      .map(field => field.name)
  ];

  const dedupedIndexFields = [...new Set(indexFields)].slice(0, 8);
  const suggestFields = [
    ...new Set(
      [
        titleField,
        ...fields
          .filter(field => ['string', 'array<string>'].includes(field.inferredType))
          .filter(field => ['keywords', 'brand', 'category', 'name', 'title'].includes(field.name))
          .map(field => field.name)
      ].filter(Boolean) as string[]
    )
  ].slice(0, 4);

  if (syntheticPrimaryKey && !byName.has(SYNTHETIC_PRIMARY_KEY)) {
    fields.unshift({
      sourceName: SYNTHETIC_PRIMARY_KEY,
      name: SYNTHETIC_PRIMARY_KEY,
      inferredType: 'string',
      nullable: false,
      missingCount: 0,
      distinctCount: total,
      uniqueRatio: 1,
      examples: ['item_000001'],
      roles: [],
      warnings: ['synthetic primary key']
    });
  }

  return {
    primaryKeyField,
    syntheticPrimaryKey,
    titleField: titleField ?? null,
    indexFields: dedupedIndexFields.length > 0 ? dedupedIndexFields : [primaryKeyField],
    filterFields,
    suggestFields,
    imageFields
  };
}

function attachFieldRoles(fields: ItemFieldProfile[], inference: ReturnType<typeof inferRoles>): ItemFieldProfile[] {
  return fields.map(field => ({
    ...field,
    roles: [
      ...(field.name === inference.primaryKeyField ? ['primary_key'] : []),
      ...(field.name === inference.titleField ? ['title'] : []),
      ...(inference.indexFields.includes(field.name) ? ['index'] : []),
      ...(inference.filterFields.includes(field.name) ? ['filter'] : []),
      ...(inference.suggestFields.includes(field.name) ? ['suggest'] : []),
      ...(inference.imageFields.includes(field.name) ? ['image'] : [])
    ]
  }));
}

function toPromptInferenceFields(fields: ItemFieldProfile[]): Array<{ name: string; inferredType: string; fields?: any[] }> {
  return fields.map(field => ({
    name: field.name,
    inferredType: field.inferredType,
    ...(field.fields && field.fields.length > 0 ? { fields: toPromptInferenceFields(field.fields) } : {})
  }));
}

function applySyntheticPrimaryKeyIfNeeded(
  records: Array<Record<string, unknown>>,
  primaryKeyField: string,
  syntheticPrimaryKey: boolean
): Array<Record<string, unknown>> {
  if (!syntheticPrimaryKey) {
    return records;
  }

  return records.map((record, index) => ({
    [primaryKeyField]: `item_${String(index + 1).padStart(6, '0')}`,
    ...record
  }));
}

function collectProfileWarnings(
  fields: ItemFieldProfile[],
  inference: ReturnType<typeof inferRoles>,
  sanitizedFields: Array<{ sourceName: string; name: string }>,
  validation: ItemValidationResult
): string[] {
  const warnings: string[] = [];

  if (inference.syntheticPrimaryKey) {
    warnings.push(`No stable unique primary key was found; ${SYNTHETIC_PRIMARY_KEY} will be generated during apply.`);
  }

  if (!inference.titleField) {
    warnings.push('No strong title-like field was found; search quality may require manual review of IndexFields.');
  }

  const renamed = sanitizedFields.filter(field => field.sourceName !== field.name);
  if (renamed.length > 0) {
    warnings.push(`${renamed.length} field names were sanitized to snake_case for schema safety.`);
  }

  if (fields.some(field => field.inferredType === 'object' || field.inferredType === 'array<object>')) {
    warnings.push('Nested object fields were preserved as object types. Review whether any nested content should be flattened before production ingest.');
  }

  if (!validation.ok) {
    warnings.push(
      `${validation.summary.blockingIssueCount} blocking validation issues were found. Run item plan, inspect validation.json / report.md, and fix the data before item apply.`
    );
  }

  return warnings;
}

function buildValidationResult(
  fields: ItemFieldProfile[],
  inference: ReturnType<typeof inferRoles>,
  records: Array<Record<string, unknown>>,
  cleanup: ItemCleanupSummary,
  datasetType: 'item' | 'video'
): ItemValidationResult {
  const issues: ItemValidationIssue[] = [];
  const primaryKeyField = inference.primaryKeyField;
  const primaryKeyValues = records.map(record => record[primaryKeyField]);
  const missingPrimaryKeyValues = primaryKeyValues.filter(isMissingValue);
  const duplicatePrimaryKeyCount = inference.syntheticPrimaryKey ? 0 : countDuplicateNonMissingValues(primaryKeyValues);
  const titleValues = inference.titleField ? records.map(record => record[inference.titleField as string]) : [];
  const missingTitleCount = inference.titleField ? titleValues.filter(isMissingValue).length : records.length;
  const mixedTypeFields = fields.filter(field => detectObservedKinds(records, field.name).length > 1);
  const emptyRecordCount = records.filter(isEffectivelyEmptyRecord).length;

  if (datasetType === 'video') {
    const hasVideoUrl = fields.some(f => f.name === 'video_url');
    if (!hasVideoUrl) {
      issues.push({
        severity: 'error',
        code: 'video_url_missing',
        detail: 'video_url is required for video datasets but was not found.'
      });
    }
  }

  if (inference.syntheticPrimaryKey) {
    issues.push({
      severity: 'warning',
      code: 'synthetic_primary_key',
      field: primaryKeyField,
      detail: `No stable unique primary key was found. ${primaryKeyField} will be generated during apply.`,
      affectedCount: records.length
    });
  } else {
    if (missingPrimaryKeyValues.length > 0) {
      issues.push({
        severity: 'error',
        code: 'primary_key_missing',
        field: primaryKeyField,
        detail: `Primary key field "${primaryKeyField}" is missing in ${missingPrimaryKeyValues.length} records.`,
        affectedCount: missingPrimaryKeyValues.length
      });
    }

    if (duplicatePrimaryKeyCount > 0) {
      issues.push({
        severity: 'error',
        code: 'primary_key_duplicate',
        field: primaryKeyField,
        detail: `Primary key field "${primaryKeyField}" contains ${duplicatePrimaryKeyCount} duplicate values.`,
        affectedCount: duplicatePrimaryKeyCount,
        examples: collectDuplicateExamples(primaryKeyValues)
      });
    }
  }

  if (!inference.titleField) {
    issues.push({
      severity: 'warning',
      code: 'title_field_missing',
      detail: 'No strong title-like field was inferred. Review IndexFields before production ingest.'
    });
  } else if (missingTitleCount > 0) {
    issues.push({
      severity: missingTitleCount === records.length ? 'error' : 'warning',
      code: 'title_values_missing',
      field: inference.titleField,
      detail: `Title field "${inference.titleField}" is empty in ${missingTitleCount} records.`,
      affectedCount: missingTitleCount
    });
  }

  for (const field of mixedTypeFields) {
    issues.push({
      severity: 'error',
      code: 'mixed_field_types',
      field: field.name,
      detail: `Field "${field.name}" has mixed non-null value types across records. Normalize it before ingest.`,
      examples: field.examples
    });
  }

  if (emptyRecordCount > 0) {
    issues.push({
      severity: 'warning',
      code: 'empty_records',
      detail: `${emptyRecordCount} records are effectively empty after normalization.`,
      affectedCount: emptyRecordCount
    });
  }

  return {
    ok: !issues.some(issue => issue.severity === 'error'),
    cleanup,
    summary: {
      totalRecords: records.length,
      cleanedRecords: records.length,
      blockingIssueCount: issues.filter(issue => issue.severity === 'error').length,
      warningCount: issues.filter(issue => issue.severity === 'warning').length,
      missingPrimaryKeyCount: missingPrimaryKeyValues.length,
      duplicatePrimaryKeyCount,
      missingTitleCount,
      mixedTypeFieldCount: mixedTypeFields.length,
      emptyRecordCount
    },
    issues
  };
}

function buildSchemaArtifact(
  profile: ItemProfileResult,
  datasetType: 'item' | 'video',
  meaningMap?: Record<string, string>,
  attrFields?: Record<string, string[]>
): Array<Record<string, unknown>> {
  function convertFields(fields: ItemFieldProfile[], prefix = ''): Array<Record<string, unknown>> {
    return fields.map(field => {
      const isVideoContentId = datasetType === 'video' && field.name === 'content_id';
      const isVideoContentType = datasetType === 'video' && field.name === 'content_type';
      const isVideoParentContentId = datasetType === 'video' && field.name === 'parent_content_id';
      const isVideoSequenceIndex = datasetType === 'video' && field.name === 'sequence_index';
      const isVideoUrl = datasetType === 'video' && field.name === 'video_url';

      const fieldPath = prefix ? `${prefix}.${field.name}` : field.name;
      const base: Record<string, unknown> = {
        Name: field.name,
        Type: DATASET_FIELD_TYPE_CODES[field.inferredType] ?? 1
      };
      const inferredMeaning = meaningMap?.[fieldPath];
      if (inferredMeaning && inferredMeaning.trim().length > 0) {
        base.Meaning = inferredMeaning.trim();
      }
      if (field.roles.includes('primary_key')) base.PK = true;
      if (field.fields && field.fields.length > 0) base.Fields = convertFields(field.fields, fieldPath);

      const promptAttrs = resolveSchemaAttrOverrides(datasetType, fieldPath, attrFields, field.inferredType);
      if (promptAttrs.BizAttr !== undefined) base.BizAttr = promptAttrs.BizAttr;
      if (promptAttrs.Required !== undefined) base.Required = promptAttrs.Required;
      if (promptAttrs.Type !== undefined) base.Type = promptAttrs.Type;

      if (isVideoContentId) {
        base.BizAttr = 21; // VideoContentID
        base.Required = true;
        base.Type = 1;      // FieldTypeString
      }
      if (isVideoContentType) {
        base.BizAttr = 22; // VideoContentType
        base.Required = true;
        base.Type = 1;
      }
      if (isVideoParentContentId) {
        base.BizAttr = 24; // VideoParentContentID
        base.Type = 1;
      }
      if (isVideoSequenceIndex) {
        base.BizAttr = 25; // VideoSequenceIndex
        base.Type = 3; // FieldTypeInt64
      }
      if (isVideoUrl) {
        base.BizAttr = 23; // VideoURL
        base.Type = 6; // FieldTypeArrayString
      }

      return base;
    });
  }

  const schema = convertFields(profile.fields);
  
  if (datasetType === 'video') {
    if (!schema.some(f => f.Name === 'content_type')) {
      schema.push({ Name: 'content_type', Type: 1, BizAttr: 22, Required: true });
    }
    if (!schema.some(f => f.Name === 'video_url')) {
      schema.push({ Name: 'video_url', Type: 6, BizAttr: 23 });
    }
    if (!schema.some(f => f.Name === 'parent_content_id')) {
      schema.push({ Name: 'parent_content_id', Type: 1, BizAttr: 24 });
    }
    if (!schema.some(f => f.Name === 'sequence_index')) {
      schema.push({ Name: 'sequence_index', Type: 3, BizAttr: 25 });
    }
  }
  
  return schema;
}

function buildFieldConfigArtifact(
  profile: ItemProfileResult,
  datasetType: 'item' | 'video',
  promptInference?: PromptInferenceMetadata
): Record<string, unknown> {
  const fieldDescMap = buildFieldDescMap(profile.fields, profile.inferred, promptInference?.fieldMeanings);
  const availableFields = new Set(flattenFieldPathsFromProfile(profile.fields));
  const titleField =
    profile.inferred.titleField && availableFields.has(profile.inferred.titleField)
      ? profile.inferred.titleField
      : undefined;
  const imageIndexFields = profile.inferred.imageFields.filter(field => availableFields.has(field));
  const videoDefaultFieldConfig =
    datasetType === 'video'
      ? {
          IndexFields: availableFields.has('video_url') ? ['video_url'] : undefined,
          FilterFields: [
            profile.inferred.primaryKeyField,
            'content_type',
            'parent_content_id',
            'sequence_index'
          ].filter((field): field is string => Boolean(field) && availableFields.has(field)),
          SuggestFields: titleField ? [titleField] : undefined,
          ImageIndexFields: imageIndexFields.length > 0 ? imageIndexFields : undefined,
          VideoIndexFields: availableFields.has('video_url') ? ['video_url'] : undefined,
          ...(titleField ? { TitleField: titleField } : {})
        }
      : {};
  return compactObject({
    ...videoDefaultFieldConfig,
    FieldDescMap: Object.keys(fieldDescMap).length > 0 ? fieldDescMap : undefined
  });
}

function buildFieldDescMap(
  fields: ItemFieldProfile[],
  inferred: ItemProfileResult['inferred'],
  meaningMap?: Record<string, string>,
  prefix = ''
): Record<string, string> {
  const descMap: Record<string, string> = {};
  for (const field of fields) {
    const fieldPath = prefix ? `${prefix}.${field.name}` : field.name;
    const inferredMeaning = meaningMap?.[fieldPath];
    const desc = inferFieldDescription(field, inferred, inferredMeaning);
    if (desc) {
      descMap[fieldPath] = desc;
    }
    if (field.fields && field.fields.length > 0) {
      Object.assign(descMap, buildFieldDescMap(field.fields, inferred, meaningMap, fieldPath));
    }
  }
  return descMap;
}

function flattenFieldPathsFromProfile(fields: ItemFieldProfile[], prefix = ''): string[] {
  const results: string[] = [];
  for (const field of fields) {
    const fieldPath = prefix ? `${prefix}.${field.name}` : field.name;
    results.push(fieldPath);
    if (field.fields && field.fields.length > 0) {
      results.push(...flattenFieldPathsFromProfile(field.fields, fieldPath));
    }
  }
  return results;
}

function filterPromptFields(values: string[] | undefined, allowed: Set<string>, notUse: Set<string>): string[] {
  if (!values) return [];
  return [...new Set(values.filter(value => allowed.has(value) && !notUse.has(value)))];
}

function pickPromptTitleField(
  datasetType: 'item' | 'video',
  attrFields: Record<string, string[]> | undefined,
  allowed: Set<string>
): string | undefined {
  const candidates =
    datasetType === 'video'
      ? ['VideoContentTitle', 'multi_modal_title']
      : ['ImageTitle', 'multi_modal_title'];
  for (const attrName of candidates) {
    const field = attrFields?.[attrName]?.find(value => allowed.has(value));
    if (field) return field;
  }
  return undefined;
}

function pickPromptImageFields(
  datasetType: 'item' | 'video',
  attrFields: Record<string, string[]> | undefined,
  allowed: Set<string>
): string[] {
  const attrNames =
    datasetType === 'video'
      ? ['VideoMediaCoverURL', 'multi_modal_image_url', 'ImageURL']
      : ['ImageURL', 'ImageBase64', 'multi_modal_image_url'];
  return [...new Set(attrNames.flatMap(name => (attrFields?.[name] ?? []).filter(value => allowed.has(value))))];
}

function resolveSchemaAttrOverrides(
  datasetType: 'item' | 'video',
  fieldPath: string,
  attrFields: Record<string, string[]> | undefined,
  inferredType: ItemFieldType
): { BizAttr?: number; Required?: boolean; Type?: number } {
  const hasAttr = (attrName: string): boolean => (attrFields?.[attrName] ?? []).includes(fieldPath);
  if (datasetType === 'video') {
    if (hasAttr('VideoContentID') || hasAttr('multi_modal_id')) {
      return { BizAttr: 21, Required: true, Type: 1 };
    }
    if (hasAttr('VideoContentType') || hasAttr('multi_modal_content_type')) {
      return { BizAttr: 22, Required: true, Type: 1 };
    }
    if (hasAttr('video_url') || hasAttr('VideoURL') || hasAttr('multi_modal_video_url')) {
      return { BizAttr: 23, Type: inferredType === 'array<string>' ? 6 : 1 };
    }
    if (hasAttr('VideoParentContentID') || hasAttr('multi_modal_parent_id')) {
      return { BizAttr: 24, Type: 1 };
    }
    if (hasAttr('VideoSequenceIndex') || hasAttr('multi_modal_sequence_index')) {
      return { BizAttr: 25, Type: 3 };
    }
  }
  return {};
}

function inferFieldDescription(
  field: ItemFieldProfile,
  inferred: ItemProfileResult['inferred'],
  inferredMeaning?: string
): string {
  if (inferredMeaning && inferredMeaning.trim().length > 0) {
    return inferredMeaning.trim();
  }
  if (field.name === inferred.primaryKeyField) {
    return `Primary key identifier (${field.inferredType})`;
  }
  if (field.name === inferred.titleField) {
    return `Title field used for search indexing and suggestions (${field.inferredType})`;
  }

  const roles: string[] = [];
  if (inferred.indexFields.includes(field.name)) roles.push('index');
  if (inferred.filterFields.includes(field.name)) roles.push('filter');
  if (inferred.suggestFields.includes(field.name)) roles.push('suggest');
  if (inferred.imageFields.includes(field.name)) roles.push('image');

  const roleSuffix = roles.length > 0 ? `, used for ${roles.join('/')}` : '';
  const typePart = field.inferredType;

  const exampleHint = field.examples.length > 0
    ? `, e.g. ${field.examples.slice(0, 2).map(v => JSON.stringify(v)).join(', ')}`
    : '';

  const statsHint = field.distinctCount > 0
    ? ` (${field.distinctCount} distinct values)`
    : '';

  return `${humanizeFieldName(field.name)} (${typePart}${roleSuffix}${statsHint}${exampleHint})`;
}

function humanizeFieldName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function buildDefaultTrials(profile: ItemProfileResult, datasetType: 'item' | 'video'): ItemPlanFile['defaults'] {
  const titleField = profile.inferred.titleField;
  const sample = profile.sample[0] ?? {};
  const titleValue = titleField ? normalizeDisplayText(sample[titleField]) : '';
  const categoryField = profile.fields.find(field => field.name === 'category' || field.name.endsWith('_category'))?.name;
  const categoryValue = categoryField ? normalizeDisplayText(sample[categoryField]) : '';
  const searchQuery = (titleValue || categoryValue || (datasetType === 'video' ? 'recommended videos' : 'recommended items'))?.slice(0, 24) || (datasetType === 'video' ? 'recommended videos' : 'recommended items');
  const primaryKeySample = normalizeDisplayText(sample[profile.inferred.primaryKeyField]);

  return {
    searchQuery,
    chatMessage: `Based on the ${datasetType} data in this application, recommend a few results related to "${searchQuery}".`,
    datasetType,
    search: {
      sceneName: 'default-search',
      sceneDescription: `Generated default search scene for ${datasetType} onboarding.`,
      pageSize: 10
    },
    recommend: {
      sceneType: 'for_you',
      sceneName: 'homepage',
      sceneDescription: `Generated default recommend scene for ${datasetType} onboarding.`,
      bhvSceneTypes: ['REPLACE_WITH_BHV_SCENE_TYPE'],
      pageSize: 10,
      userId: 'user_demo',
      parentItemId: primaryKeySample || null
    }
  };
}

function buildReviewChecklist(profile: ItemProfileResult): string[] {
  return [
    'Review schema.json and confirm field data types before any real apply.',
    'Review field-config.json and confirm FieldDescMap plus dataset-side field attributes before any real apply.',
    'At bind time, infer and confirm IndexFields / FilterFields / SuggestFields / ImageIndexFields before activating the app.',
    'Confirm the intended item display style and result-card expectations before the real apply.',
    'Open review-confirmation.json and mark all required checks as confirmed after human review.',
    'Review validation.json and fix duplicate keys, mixed types, or critical missing values before running item apply.',
    'If you need recommend bootstrap, confirm the target page / module first and then replace the placeholder BhvSceneTypes in recommend-scene-create.json / recommend-scene-update.json.',
    'If the source data is not product-like item data, adjust the generated plan before running item apply.',
    ...(profile.validation.ok ? [] : ['Resolve blocking validation issues before production-scale ingest or use --force only for controlled tests.']),
    ...(profile.warnings.length > 0 ? ['Resolve warnings listed in report.md before production-scale ingest.'] : [])
  ];
}

function buildRecommendSceneCreateArtifact(
  _profile: ItemProfileResult,
  defaults: ItemPlanFile['defaults']
): Record<string, unknown> {
  return {
    Type: defaults.recommend.sceneType,
    Name: defaults.recommend.sceneName,
    Description: defaults.recommend.sceneDescription,
    RecommendModel: 0,
    RecommendOptimizationTarget: 0,
    BhvSceneTypes: defaults.recommend.bhvSceneTypes
  };
}

function buildSearchSceneCreateArtifact(defaults: ItemPlanFile['defaults']): Record<string, unknown> {
  return {
    Name: defaults.search.sceneName,
    Description: defaults.search.sceneDescription
  };
}

function buildSearchSceneUpdateArtifact(defaults: ItemPlanFile['defaults']): Record<string, unknown> {
  return {
    Name: defaults.search.sceneName,
    Description: defaults.search.sceneDescription,
    Config: {
      SearchConfig: {
        RetrieveConfigs: []
      }
    }
  };
}

function buildRecommendSceneUpdateArtifact(defaults: ItemPlanFile['defaults']): Record<string, unknown> {
  return {
    Type: defaults.recommend.sceneType,
    Name: defaults.recommend.sceneName,
    Description: defaults.recommend.sceneDescription,
    BhvSceneTypes: defaults.recommend.bhvSceneTypes,
    Config: {
      Count: defaults.recommend.pageSize
    }
  };
}

function buildDatasetDescription(sourcePath: string, goal?: string): string {
  const sourceName = path.parse(sourcePath).name;
  if (goal && goal.trim().length > 0) {
    return `Generated from ${sourceName}. Goal: ${goal.trim()}`;
  }
  return `Generated from ${sourceName} by vs item plan.`;
}

function extractDatasetDescription(fieldConfig: Record<string, unknown>): string | undefined {
  const value = fieldConfig.DatasetDescription;
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function renderPlanReport(plan: ItemPlanFile, profile: ItemProfileResult): string {
  const lines = [
    '# Viking Item Onboarding Plan',
    '',
    `Source file: \`${plan.source.file}\``,
    `Detected format: \`${plan.source.format}\``,
    `Record count: \`${plan.source.totalRecords}\``,
    `Dataset name: \`${plan.names.dataset}\``,
    `Application name: \`${plan.names.application}\``,
    '',
    '## Inference',
    '',
    `- Primary key: \`${plan.inferred.primaryKeyField}\`${plan.inferred.syntheticPrimaryKey ? ' (synthetic)' : ''}`,
    `- Title field: ${plan.inferred.titleField ? `\`${plan.inferred.titleField}\`` : '(none inferred)'}`,
    `- Index fields: ${formatInlineList(plan.inferred.indexFields)}`,
    `- Filter fields: ${formatInlineList(plan.inferred.filterFields)}`,
    `- Suggest fields: ${formatInlineList(plan.inferred.suggestFields)}`,
    `- Image fields: ${formatInlineList(plan.inferred.imageFields)}`,
    '',
    '## Generated Files',
    '',
    `- \`${plan.files.normalizedItems}\``,
    `- \`${plan.files.schema}\``,
    `- \`${plan.files.fieldConfig}\``,
    `- \`${plan.files.onlineConfig}\``,
    `- \`${plan.files.validation}\``,
    `- \`${plan.files.reviewConfirmation}\``,
    `- \`${plan.files.datasetCreate}\``,
    `- \`${plan.files.appCreate}\``,
    `- \`${plan.files.schemaCheck}\``,
    `- \`${plan.files.searchSceneCreate}\``,
    `- \`${plan.files.searchSceneUpdate}\``,
    `- \`${plan.files.recommendSceneCreate}\``,
    `- \`${plan.files.recommendSceneUpdate}\``,
    '',
    '## Suggested Commands',
    '',
    `1. Review and update \`${plan.files.reviewConfirmation}\` after human confirmation.`,
    '',
    '```bash',
    `vs item apply --plan-dir ${quoteShellPath('.')} --dry-run`,
    `vs item provision --plan-dir ${quoteShellPath('.')} --confirm-review`,
    `vs item verify --plan-dir ${quoteShellPath('.')}`,
    '```',
    '',
    '## Validation',
    '',
    `- Blocking issues: \`${plan.validation.summary.blockingIssueCount}\``,
    `- Warnings: \`${plan.validation.summary.warningCount}\``,
    `- Missing primary-key values: \`${plan.validation.summary.missingPrimaryKeyCount}\``,
    `- Duplicate primary-key values: \`${plan.validation.summary.duplicatePrimaryKeyCount}\``,
    `- Missing title values: \`${plan.validation.summary.missingTitleCount}\``,
    `- Mixed-type fields: \`${plan.validation.summary.mixedTypeFieldCount}\``,
    '',
    '## Cleanup',
    '',
    `- Trimmed string values: \`${plan.validation.cleanup.trimmedStringValues}\``,
    `- Empty strings normalized to null: \`${plan.validation.cleanup.emptyStringValuesNormalized}\``,
    `- Special values normalized: \`${plan.validation.cleanup.specialValueNormalizations}\``,
    '',
    '## Recommend Bootstrap',
    '',
    `- Default search scene: \`${plan.defaults.search.sceneName}\``,
    `- Search scene template: \`${plan.files.searchSceneCreate}\` + \`${plan.files.searchSceneUpdate}\``,
    '',
    `- Default scene type: \`${plan.defaults.recommend.sceneType}\``,
    `- Default scene name: \`${plan.defaults.recommend.sceneName}\``,
    `- BhvSceneTypes placeholder: ${formatInlineList(plan.defaults.recommend.bhvSceneTypes)}`,
    '- Confirm the target page / module before creating or updating any recommend scene.',
    `- To bootstrap recommend later: \`vs item apply --plan-dir ${quoteShellPath('.')} --confirm-review --confirm-recommend-entry-binding --run-trials --recommend-bhv-scene-types your_scene_type\``,
    '',
    '## Warnings',
    ''
  ];

  if (profile.warnings.length === 0) {
    lines.push('- None');
  } else {
    for (const warning of profile.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push('', '## Review Checklist', '');
  for (const item of plan.reviewChecklist) {
    lines.push(`- ${item}`);
  }

  lines.push('', '## Validation Issues', '');
  if (plan.validation.issues.length === 0) {
    lines.push('- None');
  } else {
    for (const issue of plan.validation.issues) {
      const field = issue.field ? ` [field=${issue.field}]` : '';
      lines.push(`- [${issue.severity}] ${issue.code}${field}: ${issue.detail}`);
    }
  }

  lines.push('', '## Sample Fields', '');
  for (const field of profile.fields.slice(0, 12)) {
    lines.push(`- \`${field.name}\`: ${field.inferredType}${field.roles.length > 0 ? ` (${field.roles.join(', ')})` : ''}`);
  }

  return `${lines.join('\n')}\n`;
}

function inferFieldType(values: unknown[]): ItemFieldType {
  if (values.length === 0) return 'string';

  if (values.every(value => typeof value === 'boolean')) return 'boolean';
  if (values.every(value => Number.isInteger(value))) return 'int64';
  if (values.every(value => typeof value === 'number' && Number.isFinite(value))) return 'float';
  if (values.every(value => typeof value === 'string')) return 'string';

  if (values.every(Array.isArray)) {
    const flattened = values.flatMap(value => value as unknown[]).filter(value => value !== undefined && value !== null);
    if (flattened.length === 0 || flattened.every(value => typeof value === 'string')) return 'array<string>';
    if (flattened.every(value => Number.isInteger(value))) return 'array<int64>';
    if (flattened.every(value => typeof value === 'number' && Number.isFinite(value))) return 'array<float>';
    if (flattened.every(isRecord)) return 'array<object>';
    return 'array<object>';
  }

  if (values.some(isRecord)) return 'object';
  if (values.some(Array.isArray)) return 'array<object>';

  return 'string';
}

function detectObservedKinds(records: Array<Record<string, unknown>>, fieldName: string): string[] {
  const kinds = [
    ...new Set(
      records
        .map(record => record[fieldName])
        .filter(value => value !== undefined && value !== null)
        .map(observedKind)
    )
  ];

  if (kinds.includes('array:unknown') && kinds.some(kind => kind.startsWith('array:') && kind !== 'array:unknown')) {
    return kinds.filter(kind => kind !== 'array:unknown');
  }

  return kinds;
}

function observedKind(value: unknown): string {
  if (Array.isArray(value)) {
    const nestedKinds = [...new Set(value.filter(item => item !== undefined && item !== null).map(observedKind))];
    return nestedKinds.length <= 1 ? `array:${nestedKinds[0] ?? 'unknown'}` : 'array:mixed';
  }
  if (isRecord(value)) return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int64' : 'float';
  return typeof value;
}

function isCategoricalField(field: ItemFieldProfile): boolean {
  return ['string', 'boolean', 'int64'].includes(field.inferredType) && (field.distinctCount <= 30 || field.uniqueRatio <= 0.35);
}

function pickBestFallbackTitleField(fields: ItemFieldProfile[]): string | null {
  const candidates = fields.filter(field => !looksLikeUrlField(field.name, field.examples) && field.distinctCount > 1);
  if (candidates.length === 0) return null;
  candidates.sort((left, right) => scoreTitleCandidate(right) - scoreTitleCandidate(left));
  return candidates[0]?.name ?? null;
}

function scoreTitleCandidate(field: ItemFieldProfile): number {
  const averageLength =
    field.examples.length === 0
      ? 0
      : (field.examples as unknown[]).reduce<number>((sum, value) => sum + String(value).length, 0) / field.examples.length;
  let score = 0;
  if (averageLength >= 4 && averageLength <= 80) score += 2;
  if (field.uniqueRatio > 0.5) score += 1;
  if (field.name.includes('title') || field.name.includes('name')) score += 4;
  return score;
}

function isLongTextField(name: string, type: ItemFieldType, values: unknown[]): boolean {
  if (type !== 'string') return false;
  if (['url', 'image_url'].includes(name)) return false;
  if (values.length === 0) return false;
  const averageLength = values.reduce<number>((sum, value) => sum + String(value).length, 0) / values.length;
  return averageLength > 80;
}

function looksLikeUrlField(name: string, values: unknown[]): boolean {
  if (name.includes('url')) return true;
  return values.some(value => typeof value === 'string' && /^https?:\/\//u.test(value));
}

function stableKey(value: unknown): string {
  if (typeof value === 'string') return `s:${value}`;
  if (typeof value === 'number') return `n:${value}`;
  if (typeof value === 'boolean') return `b:${value}`;
  return JSON.stringify(value);
}

function isMissingValue(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0);
}

function countDuplicateNonMissingValues(values: unknown[]): number {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (isMissingValue(value)) continue;
    const key = stableKey(value);
    if (seen.has(key)) {
      duplicates.add(key);
      continue;
    }
    seen.add(key);
  }
  return duplicates.size;
}

function collectDuplicateExamples(values: unknown[]): unknown[] {
  const counts = new Map<string, { raw: unknown; count: number }>();
  for (const value of values) {
    if (isMissingValue(value)) continue;
    const key = stableKey(value);
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    counts.set(key, { raw: value, count: 1 });
  }

  return [...counts.values()]
    .filter(entry => entry.count > 1)
    .slice(0, 3)
    .map(entry => entry.raw);
}

function isEffectivelyEmptyRecord(record: Record<string, unknown>): boolean {
  return Object.values(record).every(value => {
    if (isMissingValue(value)) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (isRecord(value)) return Object.keys(value).length === 0;
    return false;
  });
}

function uniqueExampleValues(values: unknown[], limit: number): unknown[] {
  const seen = new Set<string>();
  const results: unknown[] = [];
  for (const value of values) {
    const key = stableKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(value);
    if (results.length >= limit) break;
  }
  return results;
}

function normalizeDisplayText(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  return JSON.stringify(value);
}

function normalizeValueForInference(value: unknown): unknown {
  if (typeof value === 'string' && value.trim().length === 0) {
    return null;
  }
  return value;
}

function formatInlineList(values: string[]): string {
  if (values.length === 0) return '(none)';
  return values.map(value => `\`${value}\``).join(', ');
}

function quoteShellPath(value: string): string {
  return value.includes(' ') ? `"${value}"` : value;
}

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCsvRecords(content: string): Record<string, string>[] {
  const normalized = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"';
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === ',') {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') index += 1;
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some(cell => cell.length > 0)) rows.push(currentRow);
      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell.length > 0)) rows.push(currentRow);
  }

  if (rows.length === 0) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? '';
    });
    return record;
  });
}

export function normalizeFieldConfigForApi(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {};
  }

  const titleField = typeof value.TitleField === 'string' ? value.TitleField : undefined;
  const indexFields = mergeStringLists(value.IndexFields, value.IndexField, titleField);
  const filterFields = mergeStringLists(value.FilterFields, value.FilterField);
  const suggestFields = mergeStringLists(value.SuggestFields, value.SuggestField);
  const imageIndexFields = mergeStringLists(value.ImageIndexFields, value.ImageFields, value.ImageField);

  const fieldDescMap = isRecord(value.FieldDescMap) && Object.keys(value.FieldDescMap).length > 0 ? value.FieldDescMap : undefined;

  return compactObject({
    ...(titleField ? { TitleField: titleField } : {}),
    ...(indexFields ? { IndexFields: indexFields } : {}),
    ...(filterFields ? { FilterFields: filterFields } : {}),
    ...(suggestFields ? { SuggestFields: suggestFields } : {}),
    ...(imageIndexFields ? { ImageIndexFields: imageIndexFields } : {}),
    ...(fieldDescMap ? { FieldDescMap: fieldDescMap } : {})
  });
}

export function normalizeSchemaForApi(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    throw new Error('schema.json must contain an array of schema fields.');
  }

  return value.map(entry => {
    if (!isRecord(entry)) {
      throw new Error('Every schema field must be an object.');
    }

    const fieldName = typeof entry.Name === 'string' ? entry.Name : typeof entry.FieldName === 'string' ? entry.FieldName : undefined;
    const rawType = entry.Type ?? entry.FieldType;
    if (!fieldName || rawType === undefined) {
      throw new Error('Every schema field needs Name/FieldName and Type/FieldType.');
    }

    const subFields = entry.Fields ?? entry.SubFields ?? entry.fields ?? entry.subFields;

    return compactObject({
      ...entry,
      Name: fieldName,
      Type: normalizeSchemaFieldType(rawType),
      PK: entry.PK === true ? true : undefined,
      Fields: Array.isArray(subFields) ? normalizeSchemaForApi(subFields) : undefined,
      SubFields: undefined,
      fields: undefined,
      subFields: undefined
    });
  });
}

function normalizeSchemaFieldType(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, '');
    const code = DATASET_FIELD_TYPE_CODES[normalized];
    if (code) return code;
    
    const literalAlias = DATASET_FIELD_TYPE_CODES[value.trim().toLowerCase()];
    if (literalAlias) return literalAlias;
  }

  throw new Error(`Unsupported dataset field type: ${String(value)}`);
}

function mergeStringLists(...values: unknown[]): string[] | undefined {
  const merged: string[] = [];
  for (const value of values) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === 'string' && entry.trim().length > 0 && !merged.includes(entry.trim())) {
          merged.push(entry.trim());
        }
      }
      continue;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      if (!merged.includes(value.trim())) {
        merged.push(value.trim());
      }
    }
  }
  return merged.length > 0 ? merged : undefined;
}
