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

export interface DatasetIngestWorkflowOptions extends DataImportShortcutOptions {}

interface WorkflowStepResult {
  step: string;
  ok: boolean;
  skipped?: boolean;
  detail?: string;
  response?: unknown;
}

import { isUserEventDatasetType } from '../core/types';
import { promptText, toInteger, printResult, isRecord } from './product-commands';

export async function runAppDatasetBindWorkflowCommand(options: AppDatasetBindWorkflowOptions): Promise<void> {
  const config = resolveServiceConfig(toServiceConfigInput(options));
  const client = new VikingOpenApiClient(config);
  const steps: WorkflowStepResult[] = [];

  let backtrackReq: Record<string, unknown> | undefined = undefined;

  const datasetRes = await client.post('/api/v1/GetDataset', compactObject({
    DatasetID: options.datasetId,
    ProjectName: options.projectName
  }));

  const datasetResult = isRecord(datasetRes) && isRecord((datasetRes as any).Result) ? (datasetRes as any).Result : undefined;
  const typeCode = toInteger(datasetResult?.Type);

  if (isUserEventDatasetType(typeCode)) {
    const interactive = process.stdout.isTTY && process.stdin.isTTY;
    let enable = options.backtrackEnable;
    let isAll = options.backtrackAll;
    let startDate = options.backtrackStart;
    let endDate = options.backtrackEnd;

    if (enable === undefined && interactive) {
      console.log('Notice: You are binding a user-event (behavior) dataset.');
      const answer = await promptText('Do you want to enable historical data backtrack? (yes/no): ');
      enable = answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
    }

    if (enable) {
      if (isAll === undefined && interactive) {
        const answer = await promptText('Do you want to backtrack all historical data? (yes/no): ');
        isAll = answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
      }

      if (!isAll) {
        if (!startDate && interactive) {
          startDate = await promptText('Enter start date (e.g., 20230101 or 2023-01-01): ');
        }
        if (!endDate && interactive) {
          endDate = await promptText('Enter end date (e.g., 20231231 or 2023-12-31): ');
        }
      }

      backtrackReq = compactObject({
        Enable: true,
        IsAll: Boolean(isAll),
        StartDate: startDate,
        EndDate: endDate
      });
    } else if (enable === false) {
      backtrackReq = { Enable: false };
    }
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
    AppID: options.applicationId,
    DatasetIDs: [options.datasetId],
    ProjectName: options.projectName,
    BacktrackReq: backtrackReq,
    DataConfig: bindingConfig.dataConfig,
    SchemaVersion: options.schemaVersion,
    FieldsConfigVersion: options.fieldConfigVersion,
    OnlySave: options.dryRun
  });
  const bindResponse = await client.post('/api/v1/BindAppDataset', bindPayload);
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
      ProjectName: options.projectName
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
        projectName: options.projectName,
        activatedOnly: options.activatedOnly,
        waitTimeoutMs: options.waitTimeoutMs,
        pollIntervalMs: options.pollIntervalMs
      })
    : await fetchAppStatusSnapshot(config, {
        applicationId: options.applicationId,
        projectName: options.projectName,
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
  const snapshot = await fetchAppStatusSnapshot(resolveServiceConfig(toServiceConfigInput(options)), {
    applicationId: options.applicationId,
    projectName: options.projectName,
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
  await runDataImportShortcutCommand(options);
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
