// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { setTimeout as sleep } from 'node:timers/promises';
import { fetchAppStatusSnapshot, type AppStatusSnapshot } from '../core/app-status';
import { getConsoleTopAction } from '../core/console-action-catalog';
import { loadJsonInput } from '../core/json-input';
import { formatOutput, hasExplicitOutputFormatFlag, printOutput } from '../core/output-format';
import { VikingOpenApiClient } from '../core/openapi-client';
import { resolveServiceConfig, type ServiceConfigInput } from '../core/service-config';
import {
  runDataImportShortcutCommand,
  type DataImportShortcutOptions,
} from './shortcut-commands';

export interface WorkflowServiceOptions extends ServiceConfigInput {
  data?: string;
  projectName?: string;
}

export interface AppDatasetBindWorkflowOptions extends WorkflowServiceOptions {
  applicationId: string;
  datasetId: string;
  dryRun?: boolean;
  backtrackEnable?: boolean;
  backtrackAll?: boolean;
  backtrackStart?: string;
  backtrackEnd?: string;
  fieldConfig?: string;
  schemaVersion?: number;
  fieldConfigVersion?: number;
  onlineConfig?: string;
  waitReady?: boolean;
  waitTimeoutMs?: number;
  pollIntervalMs?: number;
  activatedOnly?: boolean;
}

export interface AppDiagnoseWorkflowOptions extends WorkflowServiceOptions {
  applicationId: string;
  activatedOnly?: boolean;
}

export interface DatasetIngestWorkflowOptions extends WorkflowServiceOptions {
  // V2 onboarding chain (file-based)
  file?: string;
  type?: string;
  datasetName?: string;
  industry?: string;
  language?: string;
  schemaWaitTimeoutMs?: number;
  schemaPollIntervalMs?: number;
  dryRun?: boolean;
  // Legacy data-write
  datasetId?: string;
  fields?: string;
}

interface WorkflowStepResult {
  step: string;
  ok: boolean;
  skipped?: boolean;
  detail?: string;
  response?: unknown;
}

import { isUserEventDatasetType } from '../core/types';
import { toInteger, printResult, isRecord, parseDatasetTypeV2Value, INFER_SCHEMA_DATASET_TYPES, CREATE_DATASET_TYPES } from './product-commands';

export async function runAppDatasetBindWorkflowCommand(options: AppDatasetBindWorkflowOptions): Promise<void> {
  console.warn("Warning: 'vs app dataset bind' is deprecated; use 'vs app attach-dataset' instead.");

  const config = resolveServiceConfig(toServiceConfigInput(options));
  const projectName = options.projectName ?? config.projectName;
  const client = new VikingOpenApiClient(config);
  const steps: WorkflowStepResult[] = [];

  const datasetRes = await client.post('/api/v1/GetDataset', compactObject({
    DatasetID: options.datasetId,
    ProjectName: projectName
  }));

  const datasetResult = isRecord(datasetRes) && isRecord((datasetRes as any).Result) ? (datasetRes as any).Result : undefined;
  const typeCode = toInteger(datasetResult?.Type);

  if (isUserEventDatasetType(typeCode)
      && (options.backtrackEnable !== undefined
        || options.backtrackAll !== undefined
        || options.backtrackStart !== undefined
        || options.backtrackEnd !== undefined)) {
    console.warn(
      "Warning: backtrack flags are ignored by 'attach-dataset' (V2). The V2 API no longer accepts BacktrackReq. " +
      'If you need historical backtrack, run it as a separate workflow.'
    );
  }

  const bindingConfig = await resolveBindingDataConfig(client, options, datasetResult, typeCode);
  if (bindingConfig.summary) {
    steps.push({
      step: 'prepare_binding_field_config',
      ok: true,
      detail: bindingConfig.summary
    });
  }
  if (bindingConfig.confirmed === false) {
    steps.push({
      step: 'bind_dataset',
      ok: true,
      skipped: true,
      detail: 'Cancelled after interactive field-config review.'
    });
    await printWorkflowResult(
      'app dataset bind',
      [
        ['application', options.applicationId],
        ['dataset', options.datasetId],
        ['cancelled', 'true']
      ],
      {
        ok: true,
        applicationId: options.applicationId,
        datasetId: options.datasetId,
        cancelled: true,
        steps
      },
      {
        ok: true,
        applicationId: options.applicationId,
        datasetId: options.datasetId,
        cancelled: true
      }
    );
    return;
  }

  const bindPayload = compactObject({
    ApplicationId: options.applicationId,
    DatasetId: options.datasetId,
    ProjectName: projectName,
    DataConfig: bindingConfig.dataConfig,
    SchemaVersion: options.schemaVersion,
    FieldsConfigVersion: options.fieldConfigVersion,
    DryRun: options.dryRun
  });
  const bindResponse = await client.post('/open/AttachDatasetToApplicationV2', bindPayload);
  steps.push({
    step: 'bind_dataset',
    ok: true,
    response: bindResponse
  });

  if (options.dryRun) {
    if (hasExplicitOutputFormatFlag(process.argv)) {
      await printResult(bindResponse);
    } else {
      console.log('Dry run successful. No resources were changed.');
    }
    return;
  }

  if (options.onlineConfig) {
    const onlineConfigAction = getConsoleTopAction('UpsertAppOnlineConfig');
    if (!onlineConfigAction) {
      throw new Error('Missing console-top mapping for UpsertAppOnlineConfig.');
    }
    const onlineConfigPayload = compactObject({
      AppID: options.applicationId,
      Config: await loadJsonInput(options.onlineConfig),
      ProjectName: projectName
    });
    const onlineConfigResponse = await client.post(onlineConfigAction.path, onlineConfigPayload);
    steps.push({
      step: 'update_online_config',
      ok: true,
      response: onlineConfigResponse
    });
  } else {
    steps.push({
      step: 'update_online_config',
      ok: true,
      skipped: true,
      detail: 'No online-config payload was provided.'
    });
  }

  const snapshot = options.waitReady
    ? await waitForAppReady(config, {
        applicationId: options.applicationId,
        projectName,
        activatedOnly: options.activatedOnly,
        waitTimeoutMs: options.waitTimeoutMs,
        pollIntervalMs: options.pollIntervalMs
      })
    : await fetchAppStatusSnapshot(config, {
        applicationId: options.applicationId,
        projectName,
        activatedOnly: options.activatedOnly
      });

  const summary = {
    ok: true,
    applicationId: options.applicationId,
    datasetId: options.datasetId,
    waitedForReady: Boolean(options.waitReady),
    appState: snapshot.appState,
    phase: snapshot.phase,
    runtimeSearchReady: snapshot.runtimeSearchReady,
    inferredSearchDataset: snapshot.inferredSearchDataset ?? null,
    executedSteps: steps.filter(step => !step.skipped).map(step => step.step),
    skippedSteps: steps.filter(step => step.skipped).map(step => step.step),
    reasons: snapshot.reasons,
    nextActions: snapshot.nextActions
  };

  await printWorkflowResult(
    'app dataset bind',
    [
      ['application', options.applicationId],
      ['dataset', options.datasetId],
      ['wait_ready', options.waitReady ? 'true' : 'false'],
      ['phase', snapshot.phase],
      ['runtime_ready', String(snapshot.runtimeSearchReady)]
    ],
    {
      ...summary,
      steps,
      status: snapshot
    },
    summary
  );
}

export async function runAppDiagnoseWorkflowCommand(options: AppDiagnoseWorkflowOptions): Promise<void> {
  const config = resolveServiceConfig(toServiceConfigInput(options));
  const snapshot = await fetchAppStatusSnapshot(config, {
    applicationId: options.applicationId,
    projectName: options.projectName ?? config.projectName,
    activatedOnly: options.activatedOnly
  });

  const summary = {
    ok: true,
    applicationId: options.applicationId,
    appState: snapshot.appState,
    phase: snapshot.phase,
    runtimeSearchReady: snapshot.runtimeSearchReady,
    inferredSearchDataset: snapshot.inferredSearchDataset ?? null,
    reasons: snapshot.reasons,
    nextActions: snapshot.nextActions,
    configStateCounts: snapshot.configStateCounts
  };

  await printWorkflowResult(
    'app diagnose',
    [
      ['application', options.applicationId],
      ['state', snapshot.appState],
      ['phase', snapshot.phase],
      ['runtime_ready', String(snapshot.runtimeSearchReady)],
      ['dataset', snapshot.inferredSearchDataset?.datasetId]
    ],
    {
      ...summary,
      status: snapshot
    },
    summary
  );
}

export async function runDatasetIngestWorkflowCommand(options: DatasetIngestWorkflowOptions): Promise<void> {
  if (options.file && options.type) {
    await runDatasetIngestV2Command(options);
    return;
  }
  if (options.datasetId) {
    const legacyOptions: DataImportShortcutOptions = {
      ...options,
      datasetId: options.datasetId,
      fields: options.fields
    };
    await runDataImportShortcutCommand(legacyOptions);
    return;
  }
  throw new Error(
    'dataset ingest requires either V2 chain inputs (--file --type) or legacy data-write inputs (--dataset-id --fields).'
  );
}

async function runDatasetIngestV2Command(options: DatasetIngestWorkflowOptions): Promise<void> {
  if (!options.file) throw new Error('--file is required for V2 dataset ingest.');
  if (!options.type) throw new Error('--type is required for V2 dataset ingest.');
  const normalizedType = parseDatasetTypeV2Value(options.type, INFER_SCHEMA_DATASET_TYPES);

  const config = resolveServiceConfig(toServiceConfigInput(options));
  const projectName = options.projectName ?? config.projectName;
  const client = new VikingOpenApiClient(config);
  const fs = await import('node:fs/promises');
  const fileBuffer = await fs.readFile(options.file);
  const fileName = options.file.split(/[\\/]/).pop() ?? 'dataset-input';
  const steps: WorkflowStepResult[] = [];

  const importUrlResponse = unwrapResult(
    await client.post('/open/GetPresignedImportUrlV2', compactObject({
      FileName: fileName,
      ProjectName: projectName
    }))
  );
  const fileUrl = stringField(importUrlResponse, ['FileUrl', 'PresignedUrl', 'Url']);
  const fileKey = stringField(importUrlResponse, ['FileKey', 'TosKey', 'Key']);
  if (!fileUrl || !fileKey) {
    throw new Error('GetPresignedImportUrlV2 did not return FileUrl and FileKey.');
  }
  steps.push({ step: 'request_import_url', ok: true, detail: `file_key=${fileKey}` });

  const uploadRes = await fetch(fileUrl, {
    method: 'PUT',
    body: new Uint8Array(fileBuffer),
    headers: { 'content-type': 'application/octet-stream', 'user-agent': 'Search-Cli' }
  });
  if (!uploadRes.ok) {
    throw new Error(`Upload to presigned URL failed: ${uploadRes.status} ${uploadRes.statusText}`);
  }
  steps.push({ step: 'upload_file', ok: true, detail: `bytes=${fileBuffer.length}` });

  const inferTaskResponse = unwrapResult(
    await client.post('/open/AddInferDatasetSchemaTaskV2', compactObject({
      TosKey: fileKey,
      Type: normalizedType,
      Name: options.datasetName,
      Industry: options.industry,
      Language: options.language,
      ProjectName: projectName
    }))
  );
  const taskId = stringField(inferTaskResponse, ['TaskID', 'TaskId']);
  if (!taskId) throw new Error('AddInferDatasetSchemaTaskV2 did not return TaskID.');
  steps.push({ step: 'submit_infer_task', ok: true, detail: `task_id=${taskId}` });

  const waitTimeoutMs = ensurePositiveInt(options.schemaWaitTimeoutMs ?? 120000, '--schema-wait-timeout-ms');
  const pollIntervalMs = ensurePositiveInt(options.schemaPollIntervalMs ?? 2000, '--schema-poll-interval-ms');
  const deadline = Date.now() + waitTimeoutMs;
  let inferResult: Record<string, unknown> | undefined;
  while (Date.now() <= deadline) {
    const polled = unwrapResult(
      await client.post('/open/GetInferDatasetSchemaResultV2', { TaskID: taskId, ProjectName: projectName })
    );
    const status = readStatus(polled.Status);
    if (status === 'success') {
      inferResult = polled;
      break;
    }
    if (status === 'failed') {
      throw new Error(stringField(polled, ['Error', 'Message']) ?? `Schema inference task ${taskId} failed.`);
    }
    await sleep(Math.min(pollIntervalMs, Math.max(0, deadline - Date.now())));
  }
  if (!inferResult) throw new Error(`Timed out waiting for schema inference task ${taskId}.`);
  steps.push({ step: 'poll_infer_result', ok: true, detail: 'status=success' });

  const datasetCreatePayload = compactObject({
    Name: options.datasetName ?? `cli-${fileKey.split('/').pop()?.replace(/\.[^.]*$/, '') ?? Date.now()}`,
    Type: parseDatasetTypeV2Value(normalizedType, CREATE_DATASET_TYPES),
    Schema: inferResult.Schema,
    Industry: options.industry,
    Language: options.language,
    FieldDescMap: inferResult.FieldDescMap,
    DryRun: options.dryRun === true ? true : undefined,
    ProjectName: projectName
  });
  const datasetCreateResponse = unwrapResult(
    await client.post('/open/CreateDatasetV2', datasetCreatePayload)
  );
  const datasetId = stringField(datasetCreateResponse, ['DatasetID', 'DatasetId']);
  steps.push({
    step: 'create_dataset',
    ok: true,
    detail: options.dryRun ? 'dry_run=true' : `dataset_id=${datasetId ?? '(unknown)'}`
  });

  await printWorkflowResult(
    'dataset ingest (V2)',
    [
      ['file', options.file],
      ['file_key', fileKey],
      ['task_id', taskId],
      ['dataset_id', datasetId ?? '(dry-run)'],
      ['dry_run', options.dryRun ? 'true' : 'false']
    ],
    {
      ok: true,
      mode: 'v2',
      file: options.file,
      fileKey,
      taskId,
      datasetId,
      dryRun: Boolean(options.dryRun),
      schema: inferResult.Schema,
      fieldDescMap: inferResult.FieldDescMap,
      dataFieldConfig: inferResult.DataFieldConfig ?? inferResult.FieldConfig,
      steps
    },
    {
      ok: true,
      mode: 'v2',
      datasetId,
      dryRun: Boolean(options.dryRun)
    }
  );
}

function unwrapResult(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {} as Record<string, unknown>;
  const candidates: Array<unknown> = [
    (value as any).Result,
    (value as any).result,
    (value as any).Response,
    (value as any).response
  ];
  for (const candidate of candidates) {
    if (isRecord(candidate)) return candidate as Record<string, unknown>;
  }
  return value as Record<string, unknown>;
}

function stringField(value: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate;
  }
  return undefined;
}

function readStatus(value: unknown): 'processing' | 'success' | 'failed' {
  if (typeof value === 'number') {
    if (value === 2) return 'success';
    if (value === 3) return 'failed';
    return 'processing';
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'success' || normalized.endsWith('_success')) return 'success';
    if (normalized === 'failed' || normalized.endsWith('_failed')) return 'failed';
  }
  return 'processing';
}

async function waitForAppReady(
  config: ReturnType<typeof resolveServiceConfig>,
  options: {
    applicationId: string;
    projectName?: string;
    activatedOnly?: boolean;
    waitTimeoutMs?: number;
    pollIntervalMs?: number;
  }
): Promise<AppStatusSnapshot> {
  const waitTimeoutMs = ensurePositiveInt(options.waitTimeoutMs ?? 120000, '--wait-timeout-ms');
  const pollIntervalMs = ensurePositiveInt(options.pollIntervalMs ?? 3000, '--poll-interval-ms');
  const startedAt = Date.now();
  const deadline = startedAt + waitTimeoutMs;
  let lastSnapshot: AppStatusSnapshot | undefined;

  while (Date.now() <= deadline) {
    lastSnapshot = await fetchAppStatusSnapshot(config, {
      applicationId: options.applicationId,
      projectName: options.projectName,
      activatedOnly: options.activatedOnly
    });

    if (lastSnapshot.runtimeSearchReady) {
      return lastSnapshot;
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      break;
    }
    await sleep(Math.min(pollIntervalMs, remainingMs));
  }

  const reason = lastSnapshot
    ? `Timed out waiting for app readiness. Last state=${lastSnapshot.appState}, phase=${lastSnapshot.phase}, runtimeSearchReady=${String(lastSnapshot.runtimeSearchReady)}`
    : 'Timed out waiting for app readiness.';
  throw new Error(`${reason}\nInspect status: vs app status --application-id ${options.applicationId}`);
}

async function printWorkflowResult(
  title: string,
  rows: Array<[string, string | undefined]>,
  fullValue: unknown,
  prettyValue: unknown
): Promise<void> {
  if (hasExplicitOutputFormatFlag()) {
    await printOutput(fullValue);
    return;
  }

  console.log(`WORKFLOW ${title}`);
  for (const [label, value] of rows) {
    if (value) {
      console.log(`  ${label}: ${value}`);
    }
  }
  console.log('');
  process.stdout.write(`${formatOutput(prettyValue, 'pretty')}\n`);
}

function toServiceConfigInput(options: WorkflowServiceOptions): ServiceConfigInput {
  return {
    baseUrl: options.baseUrl,
    controlPlaneBaseUrl: options.controlPlaneBaseUrl,
    dataPlaneBaseUrl: options.dataPlaneBaseUrl,
    accessKeyId: options.accessKeyId,
    secretKey: options.secretKey,
    projectName: options.projectName,
    region: options.region,
    timeoutMs: options.timeoutMs
  };
}

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

async function resolveBindingDataConfig(
  _client: VikingOpenApiClient,
  options: AppDatasetBindWorkflowOptions,
  _datasetResult: Record<string, unknown> | undefined,
  typeCode: number | undefined
): Promise<{ dataConfig: Record<string, unknown> | undefined; summary?: string; confirmed?: boolean }> {
  const rawFieldConfig = await loadJsonInput<Record<string, unknown>>(options.fieldConfig);
  if (!rawFieldConfig) {
    if (!isUserEventDatasetType(typeCode)) {
      throw new Error(
        'app dataset bind does not infer bind-time field config. ' +
          'Provide --field-config with explicit IndexFields, FilterFields, SuggestFields, and ImageIndexFields.'
      );
    }
    return { dataConfig: undefined };
  }
  if (isUserEventDatasetType(typeCode)) {
    return { dataConfig: rawFieldConfig };
  }

  assertExplicitBindFieldConfig(rawFieldConfig);
  return { dataConfig: rawFieldConfig };
}

function assertExplicitBindFieldConfig(fieldConfig: Record<string, unknown>): void {
  const missingGroups = [
    ['IndexFields', fieldConfig.IndexFields],
    ['FilterFields', fieldConfig.FilterFields],
    ['SuggestFields', fieldConfig.SuggestFields],
    ['ImageIndexFields', fieldConfig.ImageIndexFields]
  ].flatMap(([key, value]) => (Array.isArray(value) ? [] : [key]));

  if (missingGroups.length > 0) {
    throw new Error(
      `app dataset bind requires an explicit bind-time field-config. Missing ${missingGroups.join(', ')}. ` +
        'Prepare these fields manually before running the command.'
    );
  }
}

function ensurePositiveInt(value: number, flagName: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${flagName} must be a positive integer.`);
  }
  return Math.trunc(value);
}
