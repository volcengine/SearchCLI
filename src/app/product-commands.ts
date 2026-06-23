// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import { loadJsonInput, loadOptionalStringArray, parseBooleanString } from '../core/json-input';
import { fetchAppStatusSnapshot, type AppStatusSnapshot } from '../core/app-status';
import { getConsoleTopAction } from '../core/console-action-catalog';
import { resolvePurchasePageUrl, type EnvironmentId } from '../core/environment';
import { hasHelpFlag, isDomainHelpRequest, renderUsageBlock } from '../core/help-utils';
import { ApiRequestError } from '../core/http';
import { VikingOpenApiClient } from '../core/openapi-client';
import { printOutput } from '../core/output-format';
import { VikingRuntimeApiClient } from '../core/runtime-api-client';
import { resolveServiceConfig, type ServiceConfigInput } from '../core/service-config';
import {
  describeSearchModeOptions,
  describeUserDefinedRecallModeOptions,
  normalizeSearchMode,
  normalizeUserDefinedRecallMode
} from '../core/search-mode';
import {
  isUserEventDatasetType,
  getUserEventBizAttr,
  getUserEventFieldType,
  isUserEventRequiredField,
  USER_EVENT_TYPE_ENUMERATES,
  USER_EVENT_REQUIRED_FIELDS,
} from '../core/types';
import {
  runItemApplyCommand,
  runItemPlanCommand,
  runItemProfileCommand,
  runItemProvisionCommand,
  runItemReviewCommand,
  runItemVerifyCommand
} from './item-commands';
import { runDataImportShortcutCommand } from './shortcut-commands';
import {
  runAppDatasetBindWorkflowCommand,
  runAppDiagnoseWorkflowCommand,
  runDatasetIngestWorkflowCommand
} from './workflow-commands';
import {
  runSearchTuneLlmCheckCommand,
  runSearchTuneApplyCommand,
  runSearchTuneCompareCommand,
  runSearchTunePlanCommand,
  runSearchTuneQueryGenerateCommand,
  runSearchTuneReportCommand,
  runSearchTuneRunCommand,
  runSearchTuneValidateCommand
} from './search-tuning-commands';

export interface ServiceCommandOptions extends ServiceConfigInput {
  data?: string;
}

export interface AppCreateOptions extends ServiceCommandOptions {
  name?: string;
  description?: string;
  industry?: string;
  language?: string;
  color?: string;
}

export interface AppListOptions extends ServiceCommandOptions {
  name?: string;
  datasetId?: string;
  industry?: string;
  state?: string;
  full?: boolean;
}

export interface AppUpdateOptions extends ProjectScopedOptions {
  id: string;
  name?: string;
  industry?: string;
  icon?: string;
  color?: string;
}

export interface ResourceIdOptions extends ServiceCommandOptions {
  id?: string;
  force?: boolean;
}

export async function promptText(label: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const answer = await rl.question(label);
    return answer.trim();
  } finally {
    rl.close();
  }
}

export interface DatasetGetOptions extends ResourceIdOptions {
  full?: boolean;
}

export interface DatasetCreateOptions extends ServiceCommandOptions {
  name?: string;
  type?: string;
  description?: string;
  schema?: string;
}

export interface DatasetListOptions extends ServiceCommandOptions {
  type?: string;
  name?: string;
  applicationId?: string;
  full?: boolean;
}

export interface DatasetSchemaCheckOptions extends ProjectScopedOptions {
  type?: string;
  schema?: string;
}

export interface DatasetSummaryOptions extends ProjectScopedOptions {
  id?: string;
}

export interface DatasetDataSummaryOptions extends ProjectScopedOptions {
  datasetId: string;
}

export interface DatasetDataListOptions extends ProjectScopedOptions {
  datasetId: string;
  pageNumber?: number;
  pageSize?: number;
  contentId?: string;
  statuses?: string;
}

export interface DatasetDataGetOptions extends ProjectScopedOptions {
  datasetId: string;
  contentId?: string;
}

export interface DataWriteOptions extends ServiceCommandOptions {
  datasetId: string;
  fields?: string;
}

export interface DataListOptions extends ServiceCommandOptions {
  datasetId: string;
  filter?: string;
  maxResults?: number;
  outputFields?: string;
  nextToken?: string;
}

export interface DataGetOptions extends ServiceCommandOptions {
  datasetId: string;
  id?: string;
  outputFields?: string;
}

export interface DataDeleteOptions extends ServiceCommandOptions {
  datasetId: string;
  id?: string;
}

export interface SearchRunOptions extends ServiceCommandOptions {
  applicationId: string;
  sceneId?: string;
  datasetId?: string;
  query?: string;
  pageSize?: number;
}

export interface SearchCompleteOptions extends ServiceCommandOptions {
  applicationId: string;
  sceneId: string;
  query?: string;
}

export interface RecommendRunOptions extends ServiceCommandOptions {
  applicationId: string;
  sceneId: string;
  userId?: string;
  parentId?: string;
  pageSize?: number;
}

export interface ChatSearchRunOptions extends ServiceCommandOptions {
  applicationId: string;
  sessionId?: string;
  message?: string;
  openingRemarks?: boolean;
  userId?: string;
  pretty?: boolean;
}

export interface ApiKeyCreateOptions extends ServiceCommandOptions {
  name?: string;
  description?: string;
}

export interface ProjectScopedOptions extends ServiceCommandOptions {
  projectName?: string;
}

export interface AppDatasetBindOptions extends ProjectScopedOptions {
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

export interface AppDatasetUnbindOptions extends ProjectScopedOptions {
  applicationId: string;
  datasetId: string;
}

export interface AppDatasetConfigListOptions extends ProjectScopedOptions {
  applicationId: string;
  datasetType?: string;
  pageNumber?: number;
  pageSize?: number;
  activatedOnly?: boolean;
  full?: boolean;
}

export interface AppDatasetConfigGetOptions extends ProjectScopedOptions {
  applicationId: string;
  datasetId: string;
  fieldConfigVersion?: number;
  full?: boolean;
}

export interface AppDatasetConfigUpdateOptions extends ProjectScopedOptions {
  applicationId: string;
  datasetId: string;
  schemaVersion?: number;
  fieldConfigVersion?: number;
  fieldConfig?: string;
  dryRun?: boolean;
}

export interface AppDataConfigConstraintGetOptions extends ProjectScopedOptions {}

export interface AppDataBacktrackConfGetOptions extends ProjectScopedOptions {
  id: string;
  startDate?: string;
  endDate?: string;
}

export interface AppDatasetStatOptions extends ProjectScopedOptions {
  applicationId: string;
  datasetId: string;
}

export interface AppStatusOptions extends ProjectScopedOptions {
  applicationId: string;
  activatedOnly?: boolean;
}

export interface AppWaitReadyOptions extends AppStatusOptions {
  waitTimeoutMs?: number;
  pollIntervalMs?: number;
}

export interface AppOnlineConfigGetOptions extends ProjectScopedOptions {
  applicationId: string;
  full?: boolean;
}

export interface AppOnlineConfigUpdateOptions extends ProjectScopedOptions {
  applicationId: string;
  config?: string;
  dryRun?: boolean;
}

export interface AppItemFilterUpdateOptions extends ProjectScopedOptions {
  applicationId: string;
  datasetId: string;
  condition?: string;
}

export interface AppItemFilterCountOptions extends ProjectScopedOptions {
  applicationId: string;
  datasetId: string;
}

export interface AppOnlineExpConfigGetOptions extends ProjectScopedOptions {
  applicationId: string;
}

export interface AppDefaultUserPromptGetOptions extends ProjectScopedOptions {
  applicationId: string;
}

export interface AppDisplayMappingUpdateOptions extends ProjectScopedOptions {
  applicationId: string;
  datasetId: string;
  displayMapping?: string;
}

export interface AppConnectorsListOptions extends ProjectScopedOptions {
  applicationId: string;
}

export interface DatasetUpdateOptions extends ProjectScopedOptions {
  id: string;
  version?: number;
  schema?: string;
  description?: string;
}

export interface DatasetCountOptions extends ProjectScopedOptions {
  datasetId: string;
  itemFilter?: string;
}

export interface DatasetSampleGetOptions extends ProjectScopedOptions {
  datasetId: string;
  sampleFields?: string;
  itemPkId?: string;
  random?: boolean;
}

export interface DatasetSampleListOptions extends DatasetSampleGetOptions {
  size?: number;
  itemFilter?: string;
}

export interface DatasetUploadAddOptions extends ProjectScopedOptions {
  datasetId: string;
  tosBucket?: string;
  tosKey?: string;
}

export interface DatasetUploadResultOptions extends ProjectScopedOptions {
  taskId?: string;
}

export interface SearchSceneCreateOptions extends ProjectScopedOptions {
  applicationId: string;
  name?: string;
  description?: string;
}

export interface SearchSceneGetOptions extends ProjectScopedOptions {
  applicationId: string;
  sceneId: string;
}

export interface SearchSceneUpdateOptions extends ProjectScopedOptions {
  applicationId: string;
  sceneId: string;
  name?: string;
  description?: string;
  config?: string;
  searchConfig?: string;
  queryCompletionConfig?: string;
  wantToSearchConfig?: string;
  overviewConfig?: string;
}

export interface RecommendSceneCreateOptions extends ProjectScopedOptions {
  applicationId: string;
  type?: string;
  name?: string;
  description?: string;
  itemDatasetId?: string;
  recommendModel?: number;
  optimizationTarget?: number;
  bhvSceneTypes?: string;
  clickEventTypes?: string;
  positiveEventTypes?: string;
  negativeEventTypes?: string;
  confirmEntryBinding?: boolean;
}

export interface RecommendSceneListOptions extends ProjectScopedOptions {
  applicationId: string;
  types?: string;
}

export interface RecommendSceneGetOptions extends ProjectScopedOptions {
  applicationId: string;
  sceneId: string;
}

export interface RecommendSceneUpdateOptions extends ProjectScopedOptions {
  applicationId: string;
  sceneId: string;
  type?: string;
  name?: string;
  description?: string;
  itemDatasetId?: string;
  bhvSceneTypes?: string;
  config?: string;
  count?: number;
  boostBuryConfig?: string;
  shuffleConfig?: string;
  impressionConfig?: string;
  suggestConfig?: string;
  degradeRuleId?: string;
  confirmEntryBinding?: boolean;
}

export interface RecommendSceneExpConfigOptions extends RecommendSceneUpdateOptions {}

export interface RecommendRuleListOptions extends ProjectScopedOptions {
  applicationId: string;
  types?: string;
  datasetId?: string;
  invertItemDatasetId?: string;
}

export interface RecommendRuleGetOptions extends ProjectScopedOptions {
  applicationId: string;
  ruleId?: string;
}

export interface RecommendRuleUpsertOptions extends ProjectScopedOptions {
  applicationId: string;
  ruleId?: string;
  name?: string;
  type?: string;
  description?: string;
  datasetId?: string;
  config?: string;
}

export interface RecommendUserProfileOptions extends ProjectScopedOptions {
  applicationId: string;
  useRandomUser?: boolean;
  userId?: string;
}

export interface RecommendSuggestOptions extends ProjectScopedOptions {
  applicationId: string;
  sceneId: string;
  userId: string;
  requestId?: string;
  contextItemId?: string;
  items?: string;
  suggestConfig?: string;
}

export interface PurchaseOrderStatusOptions extends ProjectScopedOptions {
  suppressOutput?: boolean;
}

export interface PurchaseOrderWaitOptions extends ProjectScopedOptions {
  maxAttempts?: number;
  pollIntervalMs?: number;
}

export interface PurchaseLinkOptions {
  environmentId?: string;
}

export async function runAppCreateCommand(options: AppCreateOptions): Promise<void> {
  const payload = normalizeAppCreatePayload(
    (await loadJsonInput(options.data)) ??
      compactObject({
        Name: options.name,
        Description: options.description,
        Language: options.language,
        Icon: options.color ? { ColorName: options.color } : undefined
      }),
    options.industry
  );
  requireNonEmptyObject(payload, 'Need --data or --name for app create.');
  await printResult(callOpenApi('/api/v1/CreateApplication', payload, options));
}

export async function runAppUpdateCommand(options: AppUpdateOptions): Promise<void> {
  let icon = await loadJsonInput(options.icon);
  if (!icon && options.color) {
    icon = { ColorName: options.color };
  }
  
  const payload = normalizeAppUpdatePayload(
    (await loadJsonInput(options.data)) ??
      compactObject({
        AppID: options.id,
        Name: options.name,
        Icon: icon,
        ProjectName: options.projectName
      }),
    options.industry
  );
  requireNonEmptyObject(payload, 'Need --data or app update fields for app update.');
  await printResult(callOpenApi('/api/v1/UpdateApplication', payload, options));
}

export async function runAppGetCommand(options: ResourceIdOptions): Promise<void> {
  const payload = (await loadJsonInput(options.data)) ?? requiredNamedIdPayload(options.id, 'application', 'AppID');
  await printResult(callOpenApi('/api/v1/GetApplication', payload, options));
}

export async function runAppListCommand(options: AppListOptions): Promise<void> {
  const payload = (await loadJsonInput(options.data)) ?? {};
  const response = await callOpenApi('/api/v1/ListApplications', payload, options);
  if (options.full) {
    await printResult(response);
    return;
  }

  if (!isRecord(response)) {
    throw new Error('ListApplications returned an unexpected response shape.');
  }

  await printResult(summarizeAppListResponse(response, options));
}

export async function runAppDeleteCommand(options: ResourceIdOptions): Promise<void> {
  const payload = (await loadJsonInput(options.data)) ?? requiredNamedIdPayload(options.id, 'application', 'AppID');
  
  if (!options.force) {
    const appId = (payload as any).AppID || options.id;
    const answer = await promptText(`Are you sure you want to delete application ${appId}? This action cannot be undone. (yes/no): `);
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('Delete operation cancelled.');
      return;
    }
  }
  
  await printResult(callOpenApi('/api/v1/DeleteApplication', payload, options));
}

export async function runAppDatasetUnbindCommand(options: AppDatasetUnbindOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      DatasetID: options.datasetId,
      ProjectName: options.projectName
    });
  await printResult(callOpenApi('/api/v1/UnBindAppDataset', payload, options));
}

export async function runAppDatasetConfigListCommand(options: AppDatasetConfigListOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      DatasetType: options.datasetType,
      ActivatedOnly: options.activatedOnly,
      ProjectName: options.projectName
    });
  const response = await callOpenApi('/api/v1/ListAppDataConfigs', payload, options);
  if (options.full) {
    await printResult(response);
    return;
  }

  if (!isRecord(response)) {
    throw new Error('ListAppDataConfigs returned an unexpected response shape.');
  }

  await printResult(summarizeAppDatasetConfigListResponse(response, options.applicationId));
}

export async function runAppDatasetConfigGetCommand(options: AppDatasetConfigGetOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      DatasetID: options.datasetId,
      FieldsConfigVersion: options.fieldConfigVersion,
      ProjectName: options.projectName
    });
  const response = await callOpenApi('/api/v1/GetAppDataConfig', payload, options);
  if (options.full) {
    await printResult(response);
    return;
  }

  if (!isRecord(response)) {
    throw new Error('GetAppDataConfig returned an unexpected response shape.');
  }

  await printResult(summarizeAppDatasetConfigGetResponse(response, options.applicationId));
}

export async function runAppDatasetConfigUpdateCommand(options: AppDatasetConfigUpdateOptions): Promise<void> {
  const payload = normalizeAppDataConfigPayload(
    (await loadJsonInput(options.data)) ??
      compactObject({
        AppID: options.applicationId,
        DatasetID: options.datasetId,
        SchemaVersion: options.schemaVersion,
        DataConfig: await loadJsonInput(options.fieldConfig),
        FieldsConfigVersion: options.fieldConfigVersion,
        OnlySave: options.dryRun,
        ProjectName: options.projectName
      })
  );
  requireNonEmptyObject(payload, 'Need --data or dataset-config fields for app dataset-config update.');
  await printResult(callOpenApi('/api/v1/UpdateAppDataConfig', payload, options));
}

export async function runAppStatusCommand(options: AppStatusOptions): Promise<void> {
  const snapshot = await fetchAppStatusSnapshot(resolveServiceConfig(toServiceConfigInput(options)), {
    applicationId: options.applicationId,
    projectName: options.projectName,
    activatedOnly: options.activatedOnly
  });
  await printResult(snapshot);
}

export async function runAppWaitReadyCommand(options: AppWaitReadyOptions): Promise<void> {
  const config = resolveServiceConfig(toServiceConfigInput(options));
  const waitTimeoutMs = ensurePositiveInt(options.waitTimeoutMs ?? 120000, '--wait-timeout-ms');
  const pollIntervalMs = ensurePositiveInt(options.pollIntervalMs ?? 3000, '--poll-interval-ms');
  const startedAt = Date.now();
  const deadline = startedAt + waitTimeoutMs;
  let attempts = 0;
  let snapshot: AppStatusSnapshot | undefined;

  while (Date.now() <= deadline) {
    attempts += 1;
    snapshot = await fetchAppStatusSnapshot(config, {
      applicationId: options.applicationId,
      projectName: options.projectName,
      activatedOnly: options.activatedOnly
    });

    if (snapshot.runtimeSearchReady) {
      await printResult({
        ...snapshot,
        waitedMs: Date.now() - startedAt,
        attempts
      });
      return;
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      break;
    }
    await sleep(Math.min(pollIntervalMs, remainingMs));
  }

  throw new Error(buildWaitReadyTimeoutMessage(snapshot, options.applicationId, Date.now() - startedAt, attempts));
}

export async function runAppOnlineConfigGetCommand(options: AppOnlineConfigGetOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      ProjectName: options.projectName
    });
  const response = await callConsoleTopAction('GetAppOnlineConfig', payload, options);
  if (options.full) {
    await printResult(response);
    return;
  }

  if (!isRecord(response)) {
    throw new Error('GetAppOnlineConfig returned an unexpected response shape.');
  }

  await printResult(summarizeAppOnlineConfigResponse(response, options.applicationId));
}

export async function runAppOnlineConfigUpdateCommand(options: AppOnlineConfigUpdateOptions): Promise<void> {
  if (options.dryRun !== undefined) {
    throw new Error('--dry-run is not supported by the console online-config API. Remove --dry-run and retry.');
  }
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      Config: await loadJsonInput(options.config),
      ProjectName: options.projectName
    });
  requireNonEmptyObject(payload, 'Need --data or --config for app online-config update.');
  await printResult(callConsoleTopAction('UpsertAppOnlineConfig', payload, options));
}

export async function runDatasetCreateCommand(options: DatasetCreateOptions): Promise<void> {
  const payload = normalizeDatasetPayload(
    (await loadJsonInput(options.data)) ??
      compactObject({
        Name: options.name,
        Type: options.type,
        Description: options.description,
        Schema: await loadJsonInput(options.schema)
      })
  );
  if (isRecord(payload) && (payload.Type === 2 || payload.Type === 5)) {
    throw new Error(`Creating dataset of type ${payload.Type === 2 ? 'query (2)' : 'dataset type 5'} via CLI is not supported.`);
  }
  requireNonEmptyObject(payload, 'Need --data or --name/--type for dataset create.');
  validateUserEventSchema(payload);
  await printResult(callOpenApi('/api/v1/CreateDataset', payload, options));
}

export async function runDatasetSchemaCheckCommand(options: DatasetSchemaCheckOptions): Promise<void> {
  const payload = normalizeDatasetPayload(
    (await loadJsonInput(options.data)) ??
      compactObject({
        Type: options.type,
        Schema: await loadJsonInput(options.schema),
        ProjectName: options.projectName
      })
  );
  if (isRecord(payload) && (payload.Type === 2 || payload.Type === 5)) {
    throw new Error(`Checking schema for dataset type ${payload.Type === 2 ? 'query (2)' : 'dataset type 5'} via CLI is not supported.`);
  }
  requireNonEmptyObject(payload, 'Need --data or schema check fields for dataset schema check.');
  await printResult(callOpenApi('/api/v1/CheckDatasetSchema', payload, options));
}

export async function runDatasetGetCommand(options: DatasetGetOptions): Promise<void> {
  const payload = (await loadJsonInput(options.data)) ?? requiredNamedIdPayload(options.id, 'dataset', 'DatasetID');
  const response = await callOpenApi('/api/v1/GetDataset', payload, options);
  if (options.full) {
    await printResult(response);
    return;
  }

  if (!isRecord(response)) {
    throw new Error('GetDataset returned an unexpected response shape.');
  }

  await printResult(summarizeDatasetGetResponse(response));
}

export async function runDatasetUpdateCommand(options: DatasetUpdateOptions): Promise<void> {
  const payload = normalizeDatasetPayload(
    (await loadJsonInput(options.data)) ??
      compactObject({
        DatasetID: options.id,
        Version: options.version,
        Schema: await loadJsonInput(options.schema),
        Description: options.description,
        ProjectName: options.projectName
      })
  );
  requireNonEmptyObject(payload, 'Need --data or dataset update fields for dataset update.');
  await printResult(callOpenApi('/api/v1/UpdateDataset', payload, options));
}

export async function runDatasetListCommand(options: DatasetListOptions): Promise<void> {
  const payload = (await loadJsonInput(options.data)) ?? {};
  const response = await callOpenApi('/api/v1/ListDatasets', payload, options);
  if (options.full) {
    await printResult(response);
    return;
  }

  if (!isRecord(response)) {
    throw new Error('ListDatasets returned an unexpected response shape.');
  }

  await printResult(summarizeDatasetListResponse(response, options));
}

export async function runDatasetDeleteCommand(options: ResourceIdOptions): Promise<void> {
  const payload = (await loadJsonInput(options.data)) ?? requiredNamedIdPayload(options.id, 'dataset', 'DatasetID');
  
  if (!options.force) {
    const datasetId = (payload as any).DatasetID || options.id;
    const answer = await promptText(`Are you sure you want to delete dataset ${datasetId}? This action cannot be undone. (yes/no): `);
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('Delete operation cancelled.');
      return;
    }
  }
  
  await printResult(callOpenApi('/api/v1/DeleteDataset', payload, options));
}

export async function runDataWriteCommand(options: DataWriteOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      fields: await loadJsonInput(options.fields)
    });
  requireNonEmptyObject(payload, 'Need --data or --fields for data write.');
  await printResult(callRuntime(runtime => runtime.dataWrite(options.datasetId, payload), options));
}

export async function runDataDeleteCommand(options: DataDeleteOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      _ids: options.id ? [options.id] : undefined
    });
  requireNonEmptyObject(payload, 'Need --data or --id for data delete.');
  await printResult(callRuntime(runtime => runtime.dataDelete(options.datasetId, payload), options));
}

export async function runSearchRunCommand(options: SearchRunOptions): Promise<void> {
  const config = resolveServiceConfig(toServiceConfigInput(options));
  const providedPayload = await loadJsonInput(options.data);
  let snapshot: AppStatusSnapshot | undefined;
  let datasetId = options.datasetId;

  if (!datasetId && !hasDatasetIdInPayload(providedPayload)) {
    snapshot = await fetchAppStatusSnapshot(config, {
      applicationId: options.applicationId
    });
    datasetId = snapshot.inferredSearchDataset?.datasetId;
    if (!datasetId) {
      throw new Error(buildSearchDatasetInferenceError(options.applicationId, snapshot));
    }
  }

  const payload = withDatasetIdIfMissing(
    providedPayload ??
      compactObject({
        query: options.query ? { text: options.query } : undefined,
        dataset_id: datasetId,
        page_number: 1,
        page_size: options.pageSize ?? 10
      }),
    datasetId
  );

  requireNonEmptyObject(payload, 'Need --data or --query for search run.');

  try {
    const result = await new VikingRuntimeApiClient(config).search(options.applicationId, options.sceneId, payload);
    await printResult(result);
  } catch (error) {
    if (!snapshot && isUnsupportedApplicationError(error)) {
      try {
        snapshot = await fetchAppStatusSnapshot(config, {
          applicationId: options.applicationId
        });
      } catch {
        // Ignore status lookup failures and preserve the original runtime error.
      }
    }
    throw buildSearchRunError(error, snapshot, options.applicationId, datasetId);
  }
}

export async function runSearchSceneCreateCommand(options: SearchSceneCreateOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      ProjectName: options.projectName,
      Name: options.name,
      Description: options.description
    });
  requireNonEmptyObject(payload, 'Need --data or --name for search scene create.');
  await printResult(callOpenApi('/api/v1/CreateSearchScene', payload, options));
}

export async function runSearchSceneListCommand(options: ProjectScopedOptions & { applicationId: string }): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      ProjectName: options.projectName
    });
  await printResult(callOpenApi('/api/v1/ListSearchScene', payload, options));
}

export async function runSearchSceneGetCommand(options: SearchSceneGetOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      SceneID: options.sceneId,
      ProjectName: options.projectName
    });
  await printResult(callOpenApi('/api/v1/GetSearchScene', payload, options));
}

function normalizeSearchSceneModeValue(value: unknown, fieldPath: string): number {
  const normalized = normalizeSearchMode(value);
  if (normalized === undefined) {
    throw new Error(`Invalid ${fieldPath}: '${String(value)}'. Allowed values are: ${describeSearchModeOptions()}`);
  }
  return normalized;
}

function normalizeUserDefinedRecallModeValue(value: unknown, fieldPath: string): number {
  const normalized = normalizeUserDefinedRecallMode(value);
  if (normalized === undefined) {
    throw new Error(
      `Invalid ${fieldPath}: '${String(value)}'. Allowed values are: ${describeUserDefinedRecallModeOptions()}`
    );
  }
  return normalized;
}

function normalizeRetrieveConfigEnums(rc: any, fieldPath: string): void {
  if (rc?.Mode !== undefined) {
    rc.Mode = normalizeSearchSceneModeValue(rc.Mode, `${fieldPath}.Mode`);
  }
  if (rc?.UserDefinedRecallMode !== undefined) {
    rc.UserDefinedRecallMode = normalizeUserDefinedRecallModeValue(
      rc.UserDefinedRecallMode,
      `${fieldPath}.UserDefinedRecallMode`
    );
  }
  if (Array.isArray(rc?.ServingControls)) {
    rc.ServingControls.forEach((control: any, index: number) => {
      if (control?.RecallWeight?.Mode !== undefined) {
        control.RecallWeight.Mode = normalizeSearchSceneModeValue(
          control.RecallWeight.Mode,
          `${fieldPath}.ServingControls[${index}].RecallWeight.Mode`
        );
      }
      if (control?.RecallWeight?.UserDefinedRecallMode !== undefined) {
        control.RecallWeight.UserDefinedRecallMode = normalizeUserDefinedRecallModeValue(
          control.RecallWeight.UserDefinedRecallMode,
          `${fieldPath}.ServingControls[${index}].RecallWeight.UserDefinedRecallMode`
        );
      }
    });
  }
}

function validateSearchSceneConfig(config: any): void {
  // Validate SearchConfig
  if (config?.SearchConfig?.RetrieveConfigs) {
    const validOperators = [
      'eq', 'ne', 'contains', 'not_contains', 'must', 'must_not', 
      'any_must', 'any_must_not', 'gt', 'gte', 'lt', 'lte', 
      'geo_distance_inner', 'geo_distance_outer', 'time_gt', 
      'time_gte', 'time_lt', 'time_lte'
    ];
    
    for (const rc of config.SearchConfig.RetrieveConfigs) {
      normalizeRetrieveConfigEnums(rc, 'SearchConfig.RetrieveConfigs[]');

      if (rc.BoostBuryConfig?.Rules) {
        for (const rule of rc.BoostBuryConfig.Rules) {
          if (rule.Operator && !validOperators.includes(rule.Operator)) {
            throw new Error(`Invalid BoostBuryRule Operator: '${rule.Operator}'. Allowed values are: ${validOperators.join(', ')}.\nNote: Make sure the field '${rule.Field}' is configured as a FilterField in the dataset schema, and the operator matches its type (e.g., use 'eq' for strings instead of 'contains' or '==').`);
          }
        }
      }

      if (rc.QueryConfig?.InstructionType) {
        const validQueryInstTypes = ['preset_image', 'preset_item', 'custom'];
        if (!validQueryInstTypes.includes(rc.QueryConfig.InstructionType)) {
          throw new Error(`Invalid QueryConfig.InstructionType: '${rc.QueryConfig.InstructionType}'. Allowed values are: ${validQueryInstTypes.join(', ')}`);
        }
        if (rc.QueryConfig.InstructionType === 'custom' && !rc.QueryConfig.ImageInstruction?.trim()) {
          throw new Error(`QueryConfig.ImageInstruction cannot be empty when InstructionType is 'custom'.`);
        }
      }

      if (rc.RerankDoubaoConfig?.Instruction) {
        if (rc.RerankDoubaoConfig.Instruction.length >= 1024) {
          throw new Error(`RerankDoubaoConfig.Instruction length must be less than 1024 characters.`);
        }
      }
    }
  }

  // Validate WantToSearchConfig
  if (config?.WantToSearchConfig) {
    const wts = config.WantToSearchConfig;
    if (wts.MinWordLength !== undefined && wts.MinWordLength <= 0) {
      throw new Error(`WantToSearchConfig.MinWordLength must be > 0, got: ${wts.MinWordLength}`);
    }
    if (wts.MaxWordLength !== undefined && wts.MaxWordLength <= 0) {
      throw new Error(`WantToSearchConfig.MaxWordLength must be > 0, got: ${wts.MaxWordLength}`);
    }
    if (wts.MinWordLength !== undefined && wts.MaxWordLength !== undefined && wts.MinWordLength > wts.MaxWordLength) {
      throw new Error(`WantToSearchConfig.MinWordLength (${wts.MinWordLength}) cannot be greater than MaxWordLength (${wts.MaxWordLength}).`);
    }
    if (wts.WordNum !== undefined && wts.WordNum < 0) {
      throw new Error(`WantToSearchConfig.WordNum cannot be negative, got: ${wts.WordNum}`);
    }
  }

  // Validate OverviewConfig
  if (config?.OverviewConfig?.Mode) {
    const validModes = ['ondemand', 'always'];
    if (!validModes.includes(config.OverviewConfig.Mode)) {
      throw new Error(`Invalid OverviewConfig.Mode: '${config.OverviewConfig.Mode}'. Allowed values are: ${validModes.join(', ')}`);
    }
  }
}

export async function runSearchSceneUpdateCommand(options: SearchSceneUpdateOptions): Promise<void> {
  let configPayload = await loadJsonInput(options.config);
  
  if (!configPayload && (options.searchConfig || options.queryCompletionConfig || options.wantToSearchConfig || options.overviewConfig)) {
    configPayload = compactObject({
      SearchConfig: await loadJsonInput(options.searchConfig),
      QueryCompletionConfig: await loadJsonInput(options.queryCompletionConfig),
      WantToSearchConfig: await loadJsonInput(options.wantToSearchConfig),
      OverviewConfig: await loadJsonInput(options.overviewConfig)
    });
  }

  if (configPayload) {
    validateSearchSceneConfig(configPayload);
  }

  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      SceneID: options.sceneId,
      Name: options.name,
      Description: options.description,
      Config: configPayload,
      ProjectName: options.projectName
    });
  requireNonEmptyObject(payload, 'Need --data, --config, or advanced config options for search scene update.');
  await printResult(callOpenApi('/api/v1/OnlineSearchScene', payload, options));
}

export async function runSearchSceneDeleteCommand(options: SearchSceneGetOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      SceneID: options.sceneId,
      ProjectName: options.projectName
    });
  await printResult(callOpenApi('/api/v1/DeleteSearchScene', payload, options));
}

export async function runRecommendRunCommand(options: RecommendRunOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      user: options.userId ? { _user_id: options.userId } : undefined,
      parent_items: options.parentId ? [{ _id: options.parentId }] : undefined,
      page_size: options.pageSize ?? 20
    });
  requireNonEmptyObject(payload, 'Need --data or recommend context for recommend run.');
  await printResult(callRuntime(runtime => runtime.recommend(options.applicationId, options.sceneId, payload), options));
}

export async function runRecommendSceneCreateCommand(options: RecommendSceneCreateOptions): Promise<void> {
  requireRecommendEntryBindingConfirmation(options.confirmEntryBinding, 'recommend scene create');
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      ProjectName: options.projectName,
      Type: options.type,
      Name: options.name,
      Description: options.description,
      ItemDatasetID: options.itemDatasetId,
      RecommendModel: options.recommendModel,
      RecommendOptimizationTarget: options.optimizationTarget,
      BhvSceneTypes: await loadOptionalStringArray(options.bhvSceneTypes),
      ClickEventTypes: await loadOptionalStringArray(options.clickEventTypes),
      PositiveEventTypes: await loadOptionalStringArray(options.positiveEventTypes),
      NegativeEventTypes: await loadOptionalStringArray(options.negativeEventTypes)
    });
  requireNonEmptyObject(payload, 'Need --data or required scene fields for recommend scene create.');
  requireNonEmptyArrayField(
    payload,
    'BhvSceneTypes',
    'Need --bhv-scene-types (at least one behavior scene type) or a --data payload containing BhvSceneTypes for recommend scene create.'
  );
  await printResult(callOpenApi('/api/v1/CreateRecommendScene', payload, options));
}

export async function runRecommendSceneListCommand(options: RecommendSceneListOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      ProjectName: options.projectName,
      Types: await loadOptionalStringArray(options.types)
    });
  await printResult(callOpenApi('/api/v1/ListRecommendScene', payload, options));
}

export async function runRecommendSceneGetCommand(options: RecommendSceneGetOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      SceneID: options.sceneId,
      ProjectName: options.projectName
    });
  await printResult(callOpenApi('/api/v1/GetRecommendScene', payload, options));
}

function validateRecommendSceneConfig(config: any): void {
  if (config?.BoostBuryConfig?.Rules) {
    const validOperators = [
      'eq', 'ne', 'contains', 'not_contains', 'must', 'must_not', 
      'any_must', 'any_must_not', 'gt', 'gte', 'lt', 'lte', 
      'geo_distance_inner', 'geo_distance_outer', 'time_gt', 
      'time_gte', 'time_lt', 'time_lte'
    ];
    
    for (const rule of config.BoostBuryConfig.Rules) {
      if (rule.Operator && !validOperators.includes(rule.Operator)) {
        throw new Error(`Invalid BoostBuryRule Operator: '${rule.Operator}'. Allowed values are: ${validOperators.join(', ')}.\nNote: Make sure the field '${rule.Field}' is configured as a FilterField in the dataset schema, and the operator matches its type (e.g., use 'eq' for strings instead of 'contains' or '==').`);
      }
    }
  }
}

export async function runRecommendSceneUpdateCommand(options: RecommendSceneUpdateOptions): Promise<void> {
  requireRecommendEntryBindingConfirmation(options.confirmEntryBinding, 'recommend scene update');
  
  let configPayload = await loadJsonInput(options.config);
  
  if (!configPayload && (options.count !== undefined || options.boostBuryConfig || options.shuffleConfig || options.impressionConfig || options.suggestConfig || options.degradeRuleId)) {
    configPayload = compactObject({
      Count: options.count,
      DegradeRuleID: options.degradeRuleId,
      BoostBuryConfig: await loadJsonInput(options.boostBuryConfig),
      Shuffle: await loadJsonInput(options.shuffleConfig),
      Impression: await loadJsonInput(options.impressionConfig),
      Suggest: await loadJsonInput(options.suggestConfig)
    });
  }

  if (configPayload) {
    validateRecommendSceneConfig(configPayload);
  }

  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      SceneID: options.sceneId,
      Type: options.type,
      Name: options.name,
      Description: options.description,
      ItemDatasetID: options.itemDatasetId,
      BhvSceneTypes: await loadOptionalStringArray(options.bhvSceneTypes),
      Config: configPayload,
      ProjectName: options.projectName
    });
  requireNonEmptyObject(payload, 'Need --data, --config, or advanced config options for recommend scene update.');
  await printResult(callOpenApi('/api/v1/OnlineRecommendScene', payload, options));
}

export async function runRecommendSceneDeleteCommand(options: RecommendSceneGetOptions): Promise<void> {
  const payload =
    (await loadJsonInput(options.data)) ??
    compactObject({
      AppID: options.applicationId,
      SceneID: options.sceneId,
      ProjectName: options.projectName
    });
  await printResult(callOpenApi('/api/v1/DeleteRecommendScene', payload, options));
}

export async function runChatSearchRunCommand(options: ChatSearchRunOptions): Promise<void> {
  const payload = ensureChatSearchSessionId(
    (await loadJsonInput(options.data)) ??
      compactObject({
        session_id: options.sessionId,
        opening_remarks: options.openingRemarks,
        input_message:
          options.openingRemarks === true
            ? undefined
            : options.message
              ? {
                  content: [
                    {
                      type: 'text',
                      text: options.message
                    }
                  ]
                }
              : undefined,
        user: options.userId ? { _user_id: options.userId } : undefined
      }),
    options.sessionId ?? randomUUID()
  );
  requireNonEmptyObject(payload, 'Need --data or --message/--opening-remarks for chat run.');
  const runtimeOptions = {
    ...options,
    timeoutMs: options.timeoutMs ?? 60000
  };
  
  const result = await callRuntime(runtime => runtime.chatSearch(options.applicationId, payload), runtimeOptions);
  
  if (options.pretty) {
    if (typeof result === 'string') {
      printPrettyChatStream(result);
      return;
    } else if (result && typeof (result as any).rawText === 'string') {
      printPrettyChatStream((result as any).rawText);
      return;
    } else if (result && typeof (result as any).value === 'string') {
      printPrettyChatStream((result as any).value);
      return;
    }
  }
  
  await printResult(result);
}

export async function runPurchaseLinkCommand(options: PurchaseLinkOptions): Promise<void> {
  const environmentId = parsePurchaseEnvironmentId(options.environmentId);
  await printResult(resolvePurchasePageUrl(environmentId));
}

export async function runPurchaseOrderStatusCommand(options: PurchaseOrderStatusOptions): Promise<void> {
  const result = await getBillingOrder(options);
  assertBillingOrderHealthy(result);
  if (!options.suppressOutput) {
    await printResult({
      ok: true,
      orderFound: true,
      response: result
    });
  }
}

export async function runPurchaseOrderWaitCommand(options: PurchaseOrderWaitOptions): Promise<void> {
  const maxAttempts = ensurePositiveInt(options.maxAttempts ?? 5, '--max-attempts');
  const pollIntervalMs = ensurePositiveInt(options.pollIntervalMs ?? 2000, '--poll-interval-ms');
  let lastNotFoundMessage = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await getBillingOrder(options);
      assertBillingOrderHealthy(result);
      await printResult({
        ok: true,
        orderFound: true,
        attempts: attempt,
        response: result
      });
      return;
    } catch (error) {
      if (!isBillingOrderNotFoundError(error)) {
        throw error;
      }
      lastNotFoundMessage = error instanceof Error ? error.message : String(error);
      if (attempt < maxAttempts) {
        process.stderr.write(
          `[purchase:order-wait] order not found; retrying in ${pollIntervalMs}ms (${attempt}/${maxAttempts})\n`
        );
        await sleep(pollIntervalMs);
      }
    }
  }

  throw new Error(
    `Billing order was not found after ${maxAttempts} attempts. Ask the user to confirm whether the purchase succeeded, then reopen the purchase page if needed.\n${lastNotFoundMessage}`
  );
}

async function getBillingOrder(options: PurchaseOrderStatusOptions): Promise<unknown> {
  const payload = (await loadJsonInput(options.data)) ?? compactObject({ ProjectName: options.projectName });
  return callOpenApi('/api/v1/GetBillingOrder', payload, options);
}

function isBillingOrderNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /\b404\b/.test(message) || /ResourceNotFound|NotFound|not found/i.test(message);
}

function assertBillingOrderHealthy(response: unknown): void {
  const result = extractOpenApiResult(response);
  const opened = result?.IsAirSearchRecOpened;
  const state = Number(result?.InstanceState);
  if (opened === false || state === 99) {
    throw new ApiRequestError(
      'API Error [ResourceNotFound.Instance]: Viking AI Search billing instance was not found or is not enabled.',
      404,
      'ResourceNotFound.Instance',
      'Viking AI Search billing instance was not found or is not enabled.',
      response
    );
  }
  if (state === 2) {
    throw new Error('Billing order exists but instance creation failed. Ask the user to revisit the purchase page and confirm the order status.');
  }
}

function parsePurchaseEnvironmentId(value: string | undefined): EnvironmentId {
  const normalized = (value ?? 'volcano-cn-beijing').trim().toLowerCase();
  if (
    normalized === 'volcano-cn-beijing' ||
    normalized === 'volcano-ap-southeast-1' ||
    normalized === 'byteplus-ap-southeast-1'
  ) {
    return normalized;
  }
  throw new Error(
    'Invalid --environment-id. Use volcano-cn-beijing, volcano-ap-southeast-1, or byteplus-ap-southeast-1.'
  );
}

function extractOpenApiResult(response: unknown): Record<string, unknown> | undefined {
  if (!isRecord(response)) return undefined;
  const candidates = [response.Result, response.result, response];
  return candidates.find(isRecord);
}

function printPrettyChatStream(rawStream: string): void {
  // `rawStream` is NDJSON. It contains multiple JSON objects separated by newlines.
  const lines = rawStream.split('\n').filter(line => line.trim().length > 0);
  let aggregatedContent = '';
  const citations: any[] = [];
  let relatedItems: any[] = [];
  let requestId = '';
  const searchQueries: string[] = [];
  const steps: string[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.request_id && !requestId) {
        requestId = parsed.request_id;
      }
      const res = parsed.result;
      if (!res) continue;

      if (res.content) {
        aggregatedContent += res.content;
      }
      
      if (Array.isArray(res.citation) && res.citation.length > 0) {
        citations.push(...res.citation);
      }

      if (res.payload && Array.isArray(res.payload.related_items)) {
        relatedItems.push(...res.payload.related_items);
      }

      if (res.step_info) {
        if (res.step_info.step && !steps.includes(res.step_info.step)) {
          steps.push(res.step_info.step);
        }
        if (res.step_info.step === 'tool call' && res.step_info.step_payload?.param?.search_requests) {
          const requests = res.step_info.step_payload.param.search_requests;
          if (Array.isArray(requests)) {
            for (const req of requests) {
              if (req.query?.text) {
                searchQueries.push(req.query.text);
              }
            }
          }
        }
      }
    } catch {
      // Ignore parse errors for individual lines
    }
  }

  console.log('\n[Chat Run Metadata]');
  console.log(`  Request ID: ${requestId || 'N/A'}`);
  console.log(`  Steps Executed: ${steps.join(' -> ') || 'N/A'}`);
  
  if (searchQueries.length > 0) {
    console.log('\n[Generated Search Queries]');
    searchQueries.forEach((q, idx) => console.log(`  ${idx + 1}. "${q}"`));
  }

  console.log('\n[AI Reply]');
  console.log('--------------------------------------------------');
  console.log(aggregatedContent.trim() || '(No content generated)');
  console.log('--------------------------------------------------\n');

  if (citations.length > 0) {
    console.log('[Citations]');
    citations.forEach((c, idx) => {
      const title = c.display_fields?.title ?? c.display_fields?.name ?? c._id ?? 'Unknown';
      console.log(`  [${idx + 1}] ${title} (Dataset: ${c.dataset_id})`);
    });
    console.log();
  }

  if (relatedItems.length > 0) {
    console.log('[Related Items (Recall)]');
    // Deduplicate related items by _id
    const uniqueItems = Array.from(new Map(relatedItems.map(item => [item._id, item])).values());
    uniqueItems.forEach((item, idx) => {
      const fields = item.display_fields ?? item.fields ?? {};
      const title = fields.title ?? fields.name ?? item._id ?? 'Unknown';
      console.log(`  - ${title} (Score: ${item.score?.toFixed(4) ?? 'N/A'}, ID: ${item._id})`);
      
      // Print detailed fields cleanly
      const keys = Object.keys(fields).filter(k => k !== 'title' && k !== 'name' && k !== 'bread_crumbs');
      if (keys.length > 0) {
        console.log(`    Fields:`);
        keys.forEach(k => {
          let val = fields[k];
          if (typeof val === 'string' && val.length > 100) {
            val = val.substring(0, 97) + '...';
          } else if (typeof val === 'object') {
            val = JSON.stringify(val);
          }
          console.log(`      ${k}: ${val}`);
        });
      }
      console.log();
    });
  }
}

export async function runProductDomainFromArgv(domain: string, argv: string[]): Promise<boolean> {
  switch (domain) {
    case 'app':
      if (isDomainHelpRequest(argv)) {
        printDomainHelp(domain);
        return true;
      }
      await runAppCli(argv);
      return true;
    case 'dataset':
      if (isDomainHelpRequest(argv)) {
        printDomainHelp(domain);
        return true;
      }
      await runDatasetCli(argv);
      return true;
    case 'data':
      if (isDomainHelpRequest(argv)) {
        printDomainHelp(domain);
        return true;
      }
      await runDataCli(argv);
      return true;
    case 'search':
      if (isDomainHelpRequest(argv)) {
        printDomainHelp(domain);
        return true;
      }
      await runSearchCli(argv);
      return true;
    case 'recommend':
      if (isDomainHelpRequest(argv)) {
        printDomainHelp(domain);
        return true;
      }
      await runRecommendCli(argv);
      return true;
    case 'chat':
      if (isDomainHelpRequest(argv)) {
        printDomainHelp(domain);
        return true;
      }
      await runChatSearchCli(argv);
      return true;
    case 'purchase':
      if (isDomainHelpRequest(argv)) {
        printDomainHelp(domain);
        return true;
      }
      await runPurchaseCli(argv);
      return true;
    case 'item':
      if (isDomainHelpRequest(argv)) {
        printDomainHelp(domain);
        return true;
      }
      await runItemCli(argv);
      return true;
    default:
      return false;
  }
}

export function printProductDomainsHelp(): void {
  const publicLines = [
    'vs item profile|plan|review|provision|verify|apply',
    'vs app create|get|list|delete|update|diagnose|status|wait-ready',
    'vs app dataset bind',
    'vs app dataset-config get|list|update',
    'vs app online-config get|update',
    'vs dataset create|get|list|delete|update|ingest',
    'vs dataset schema check',
    'vs data write|import|delete',
    'vs search run|scene create|list|get|update|delete',
    'vs recommend run|scene create|list|get|update|delete',
    'vs chat run',
    'vs purchase link|order status|wait'
  ];

  console.log(['PRODUCT COMMANDS', renderUsageBlock(publicLines)].join('\n'));
}

function printDomainHelp(domain: string): void {
  const helpByDomain: Record<string, string> = {
    app: `${renderUsageBlock(
      [
        'vs app create --name <name> [--description <text>] [--industry <type>] [--language <lang>] [--color <color>] [service flags]',
        'vs app update --id <application-id> [--name <name> --industry <type> --icon @icon.json --color <color>] [service flags]',
        'vs app get --id <application-id> [service flags]',
        'vs app list [--name <text> --dataset-id <id> --industry <type> --state <state> --full] [service flags]',
        'vs app delete --id <application-id> [--force] [service flags]',
        'vs app diagnose --application-id <id> [--activated-only] [service flags]',
        'vs app status --application-id <id> [--activated-only] [service flags]',
        'vs app wait-ready --application-id <id> [--wait-timeout-ms <ms> --poll-interval-ms <ms> --activated-only] [service flags]',
        'vs app dataset bind --application-id <id> --dataset-id <id> [--field-config @config.json --dry-run] [service flags]',
        'vs app dataset unbind --application-id <id> --dataset-id <id> [service flags]',
        'vs app dataset-config get --application-id <id> --dataset-id <id> [--field-config-version <n> --full] [service flags]',
        'vs app dataset-config list --application-id <id> [--dataset-type <type> --page-number <n> --page-size <n> --activated-only --full] [service flags]',
        'vs app dataset-config update --application-id <id> --dataset-id <id> [--schema-version <n> --field-config-version <n> --field-config @config.json --dry-run] [service flags]',
        'vs app online-config get --application-id <id> [--full] [service flags]',
        'vs app online-config update --application-id <id> --config @config.json [--dry-run] [service flags]'
      ]
    )}

COMMON FLAGS
  --base-url --ak --sk --region --timeout-ms --project-name --data --format --jq --output`,
    dataset: `${renderUsageBlock(
      [
        'vs dataset create --name <name> --type <item|event|behavior|image_text|video|user-event|document> [--description <text>] [--schema @schema.json] [service flags]',
        'vs dataset get --id <dataset-id> [--full] [service flags]',
        'vs dataset update --id <dataset-id> [--version <n>] [--description <text>] [--schema @schema.json] [service flags]',
        'vs dataset ingest --dataset-id <id> --fields @items.json [workflow flags]',
        'vs dataset schema check --type <item|event|behavior|image_text|video|user-event|document> [--schema @schema.json] [service flags]',
        'vs dataset list [--type <type> --name <text> --application-id <id> --full] [service flags]',
        'vs dataset delete --id <dataset-id> [--force] [service flags]'
      ]
    )}

COMMON FLAGS
  --base-url --ak --sk --region --timeout-ms --project-name --data --format --jq --output`,
    data: `${renderUsageBlock(
      [
        'vs data write --dataset-id <id> --fields @fields.json [service flags]',
        'vs data import --dataset-id <id> --fields @items.json [service flags]',
        'vs data delete --dataset-id <id> --id <item-id> [service flags]'
      ]
    )}

COMMON FLAGS
  --base-url --ak --sk --region --timeout-ms --data --format --jq --output`,
    item: `${renderUsageBlock(
      [
        'vs item profile --file ./items.json [--type <item|video>] [output flags]',
        'vs item plan --file ./items.json [--type <item|video>] [--goal <text>] [--output-dir <dir>] [--dataset-name <name>] [--application-name <name>] [--skip-app] [--project-name <name>] [output flags]',
        'vs item review --plan-dir <dir> [--reviewer <name>] [--review-notes <text>] [output flags]',
        'vs item provision --plan-dir <dir> [--application-id <id> --dataset-id <id>] [--application-name <name> --dataset-name <name>] [--skip-app] [--confirm-review | --interactive-review] [--reviewer <name>] [--review-notes <text>] [--force --dry-run] [workflow flags]',
        'vs item verify --plan-dir <dir> [--application-id <id> --dataset-id <id>] [--wait-indexed] [--search-query <text> --chat-message <text>] [--skip-search --skip-chat] [workflow flags]',
        'vs item apply --plan-dir <dir> [--phase <provision|verify|all>] [--application-id <id> --dataset-id <id>] [--application-name <name> --dataset-name <name>] [--skip-app] [--confirm-review | --interactive-review] [--reviewer <name>] [--review-notes <text>] [--run-trials --force --dry-run] [--confirm-recommend-entry-binding --recommend-bhv-scene-types <scene_a,scene_b>] [--search-query <text> --chat-message <text>] [workflow flags]'
      ]
    )}

DESCRIPTION
  Understand arbitrary structured item data, generate a reviewable onboarding plan, and apply it to
  create / ingest / activate a Viking item-search app. Use \`--dry-run\` first when reviewing a plan.
  Use \`--type item\` for generic图文/卡片/商品类数据，use \`--type video\` for视频内容数据.

COMMON FLAGS
  profile/plan:
    --type <item|video> --format --jq --output
  review:
    --format --jq --output
  apply:
    --base-url --ak --sk --region --timeout-ms --project-name --format --jq --output`,
    search: `${renderUsageBlock(
      [
        'vs search run --application-id <id> --scene-id <id> [--dataset-id <id>] --query <text> [--page-size <n>] [service flags]',
        'vs search scene create --application-id <id> --name <name> [--description <text>] [service flags]',
        'vs search scene list --application-id <id> [service flags]',
        'vs search scene get --application-id <id> --scene-id <id> [service flags]',
        'vs search scene update --application-id <id> --scene-id <id> [--config @scene.json] [--search-config @search.json] [--query-completion-config @qc.json] [--want-to-search-config @wts.json] [--overview-config @overview.json] [service flags]',
        'vs search scene delete --application-id <id> --scene-id <id> [service flags]',
        'vs search tune llm-check [--live] [service flags]',
        'vs search tune validate --queries <file> [--query-count <n>] [service flags]',
        'vs search tune plan --application-id <id> [--dataset-id <id>] [--queries <file>] [--profile similarity-only] [service flags]',
        'vs search tune query-generate --application-id <id> [--dataset-id <id>] [--query-count <n>] [--sample-size <n>] [--query-batch-size <n>] [--llm-concurrency <n>] [--retrievable-field-only] [service flags]',
        'vs search tune run --application-id <id> [--dataset-id <id>] [--queries <file>] [--resume-run-id <id>] [--label-source <llm|source-item|auto>] [--judge-input <text|text-image>] [--profile similarity-only] [--search-concurrency <n>] [--llm-concurrency <n>] [--timeout-ms <ms>] [service flags]',
        'vs search tune apply --application-id <id> --run-id <id> [--dry-run | --confirm-create-scene] [service flags]',
        'vs search tune report --run-id <id> [--output-dir <dir>] [service flags]',
        'vs search tune compare (--run-ids <a,b> | --application-id <id> --dataset-id <id> --scene-ids <a,b> --queries <file>) [service flags]'
      ]
    )}

COMMON FLAGS
  --base-url --ak --sk --region --timeout-ms --project-name --data --format --jq --output

SEARCH SCENE ENUMS
  RetrieveConfigs[].Mode
    Balanced=1
    SemanticPriority=2
    KeywordPriority=3
    UserDefined=4

  RetrieveConfigs[].UserDefinedRecallMode
    KeywordSemantic=0
    KeywordOnly=1
    SemanticOnly=2

  When \`Mode=UserDefined(4)\`, also set \`UserDefinedRecallMode\` in the same retrieve config.`,
    recommend: `${renderUsageBlock(
      [
        'vs recommend run --application-id <id> --scene-id <id> [--user-id <id>] [--parent-id <id>] [--page-size <n>] [service flags]',
        'vs recommend scene create --application-id <id> --type for_you --name <name> [--description <text>] --item-dataset-id <id> [--recommend-model <n>] [--optimization-target <n>] [--bhv-scene-types <types>] [--click-event-types <types>] [--positive-event-types <types>] [--negative-event-types <types>] [--confirm-entry-binding] [service flags]',
        'vs recommend scene list --application-id <id> [--types <types>] [service flags]',
        'vs recommend scene get --application-id <id> --scene-id <id> [service flags]',
        'vs recommend scene update --application-id <id> --scene-id <id> [--type <type>] [--name <name>] [--description <text>] [--item-dataset-id <id>] [--bhv-scene-types <types>] [--config @scene.json] [--confirm-entry-binding] [service flags]',
        'vs recommend scene delete --application-id <id> --scene-id <id> [service flags]'
      ]
    )}

COMMON FLAGS
  --base-url --ak --sk --region --timeout-ms --project-name --data --format --jq --output`,
    chat: `${renderUsageBlock(
      [
        'vs chat run --application-id <id> [--session-id <id>] [--message <text>|--opening-remarks true] [--pretty] [service flags]'
      ]
    )}

COMMON FLAGS
  --base-url --ak --sk --region --timeout-ms --data --format --jq --output`,
    purchase: `${renderUsageBlock(
      [
        'vs purchase link [--environment-id <environment-id>]',
        'vs purchase order status [service flags]',
        'vs purchase order wait [--max-attempts <n>] [--poll-interval-ms <ms>] [service flags]'
      ]
    )}

DESCRIPTION
  Print the onboarding purchase page link, then check whether the onboarding purchase order is visible.
  Use wait after the user explicitly says the purchase has completed.

COMMON FLAGS
  link: --environment-id
  order: --base-url --ak --sk --region --timeout-ms --project-name --data --format --jq --output`,
  };

  console.log(helpByDomain[domain] ?? `Unknown domain: ${domain}`);
}

function printDatasetCommandHelp(action: string): void {
  const helpByAction: Record<string, string> = {
    create: `Create a Viking dataset.

USAGE
  vs dataset create --name <name> --type <item|event|behavior|image_text|video|user-event|document> [--description <text>] [--schema @schema.json] [service flags]
  vs dataset create --data @dataset-create.json [service flags]

DESCRIPTION
  For plan-driven dataset-only onboarding, prefer \`--data @dataset-create.json\` when the plan emitted
  that artifact so Schema and DataFieldConfig stay together. Use \`--name/--type/--schema\` as the
  manual schema-only path.

KEY FLAGS
  --data           Full create payload. Recommended when you already have dataset-create.json.
  --name           Dataset name. Required unless --data already provides Name.
  --type           Dataset type. Required unless --data already provides Type.
  --description    Dataset description when building the payload from flags.
  --schema         Schema JSON. Use for schema-only creation; prefer --data when dataset-create.json
                   is available so DataFieldConfig is also submitted.

EXAMPLES
  vs dataset create --name demo-items --type item --schema @schema.json
  vs dataset create --data @dataset-create.json
  vs item plan --file ./items.json --type item --goal "Build item search" --skip-app
  vs dataset create --data ./.viking/item-plans/<plan>/dataset-create.json`,
    get: `Get one Viking dataset.

USAGE
  vs dataset get --id <dataset-id> [--full] [service flags]

KEY FLAGS
  --id      Target dataset ID.
  --full    Return the raw GetDataset response.

EXAMPLES
  vs dataset get --id 123
  vs dataset get --id 123 --full`,
    list: `List Viking datasets.

USAGE
  vs dataset list [--type <type>] [--name <text>] [--application-id <id>] [--full] [service flags]

KEY FLAGS
  --type            Optional dataset type filter.
  --name            Optional name filter.
  --application-id  Optional application ID filter.
  --full            Return the raw ListDatasets response.

EXAMPLES
  vs dataset list
  vs dataset list --type item
  vs dataset list --name catalog --full`,
    ingest: `Import a batch of records into a dataset with a task-oriented workflow command.

USAGE
  vs dataset ingest --dataset-id <id> --fields @items.json [workflow flags]
  vs dataset ingest --dataset-id <id> --fields ./.viking/item-plans/<plan>/normalized-items.json [workflow flags]

DESCRIPTION
  In a plan-driven dataset-only flow, pair this with \`dataset create --data @dataset-create.json\`
  and pass the generated normalized-items artifact to \`--fields\`.

KEY FLAGS
  --dataset-id     Target dataset ID.
  --fields         JSON array payload. When ingesting from an item plan, prefer normalized-items.json.

EXAMPLES
  vs dataset ingest --dataset-id 123 --fields @items.json
  vs dataset ingest --dataset-id 123 --fields ./.viking/item-plans/<plan>/normalized-items.json`
  };

  console.log(helpByAction[action] ?? `Unknown dataset subcommand: ${action}`);
}

function printAppCommandHelp(action: string, subAction?: string): void {
  const helpByAction: Record<string, string> = {
    'dataset:bind': `Bind a dataset to an application with an explicit bind-time field config.

USAGE
  vs app dataset bind --application-id <id> --dataset-id <id> --field-config @field-config.json [service flags]
  vs app dataset bind --application-id <id> --dataset-id <id> [--field-config @field-config.json] [--dry-run] [--wait-ready] [service flags]

DESCRIPTION
  This command does not infer missing bind-time fields. For item/video datasets, review the field groups
  first and pass an explicit \`field-config.json\` that includes IndexFields, FilterFields, SuggestFields,
  and media field groups when needed.

KEY FLAGS
  --application-id        Target application ID.
  --dataset-id            Target dataset ID.
  --field-config          Bind-time field config JSON. Preferred for item/video datasets.
  --schema-version        Optional schema version to bind.
  --field-config-version  Optional field-config version to bind.
  --online-config         Optional online-config payload to apply together with the bind.
  --dry-run               Validate without persisting the bind.
  --wait-ready            Wait until the application becomes ready after the bind.

EXAMPLES
  vs app dataset bind --application-id 123 --dataset-id 456 --field-config @field-config.json
  vs app dataset bind --application-id 123 --dataset-id 456 --field-config ./.viking/item-plans/<plan>/field-config.json
  vs app dataset bind --application-id 123 --dataset-id 456 --field-config @field-config.json --dry-run`,
    'dataset-config:get': `Get one application dataset config.

USAGE
  vs app dataset-config get --application-id <id> --dataset-id <id> [--field-config-version <n>] [service flags]
  vs app dataset-config get --application-id <id> --dataset-id <id> --full [service flags]

DESCRIPTION
  Use this to inspect the effective bind-time dataset config on an application. The compact output is
  suitable for quick inspection; pass \`--full\` when you need the raw response payload.

KEY FLAGS
  --application-id        Target application ID.
  --dataset-id            Target dataset ID.
  --field-config-version  Optional field-config version to inspect.
  --full                  Return the raw GetAppDataConfig response.

EXAMPLES
  vs app dataset-config get --application-id 123 --dataset-id 456
  vs app dataset-config get --application-id 123 --dataset-id 456 --field-config-version 3
  vs app dataset-config get --application-id 123 --dataset-id 456 --full`,
    'dataset-config:list': `List application dataset configs.

USAGE
  vs app dataset-config list --application-id <id> [--dataset-type <type>] [--page-number <n>] [--page-size <n>] [--activated-only] [service flags]
  vs app dataset-config list --application-id <id> --full [service flags]

DESCRIPTION
  Lists dataset configs currently known to an application. Use filters to narrow the result set or
  \`--full\` when you need the raw ListAppDataConfigs response for debugging.

KEY FLAGS
  --application-id  Target application ID.
  --dataset-type    Optional dataset-type filter.
  --page-number     Pagination page number.
  --page-size       Pagination page size.
  --activated-only  Only show activated configs.
  --full            Return the raw ListAppDataConfigs response.

EXAMPLES
  vs app dataset-config list --application-id 123
  vs app dataset-config list --application-id 123 --activated-only
  vs app dataset-config list --application-id 123 --dataset-type item --page-size 20`,
    'dataset-config:update': `Update an application dataset config.

USAGE
  vs app dataset-config update --application-id <id> --dataset-id <id> --field-config @field-config.json [service flags]
  vs app dataset-config update --application-id <id> --dataset-id <id> [--schema-version <n>] [--field-config-version <n>] [--dry-run] [service flags]

DESCRIPTION
  Updates the bind-time config already attached to an application dataset. Prefer passing an explicit
  reviewed \`field-config.json\`; use \`--dry-run\` to validate the proposed change before persisting it.

KEY FLAGS
  --application-id        Target application ID.
  --dataset-id            Target dataset ID.
  --field-config          DataFieldConfig payload to apply.
  --schema-version        Optional schema version to target.
  --field-config-version  Optional current field-config version to update from.
  --dry-run               Validate without persisting the update.

EXAMPLES
  vs app dataset-config update --application-id 123 --dataset-id 456 --field-config @field-config.json
  vs app dataset-config update --application-id 123 --dataset-id 456 --field-config ./.viking/item-plans/<plan>/field-config.json --dry-run
  vs app dataset-config update --application-id 123 --dataset-id 456 --schema-version 2 --field-config-version 5 --field-config @field-config.json`,
  };

  console.log(helpByAction[`${action}:${subAction ?? ''}`] ?? `Unknown app subcommand: ${[action, subAction].filter(Boolean).join(' ')}`);
}

function printItemCommandHelp(action: string): void {
  const helpByAction: Record<string, string> = {
    plan: `Generate a reviewable item-onboarding plan with schema, field-config, and app artifacts.

USAGE
  vs item plan --file ./items.json [--type <item|video>] [--goal <text>] [--output-dir <dir>] [--dataset-name <name>] [--application-name <name>] [--skip-app] [--schema-source <auto|console|local>] [service flags]
  vs item plan --file ./items.jsonl --type item --goal "Build item search" --skip-app --schema-source console [service flags]

DESCRIPTION
  Use this command to generate the plan artifacts an agent or operator will review before provisioning.
  For dataset-only onboarding, pass \`--skip-app\`; the generated plan will include \`dataset-create.json\`
  and \`normalized-items.json\` for the follow-up \`dataset create + dataset ingest\` flow. With
  \`--schema-source console\`, the plan first runs the signed-upload + remote schema inference chain.

KEY FLAGS
  --file               Source JSON array, JSONL, or CSV file.
  --type               Dataset type: item or video. Pass it explicitly for video data.
  --goal               Business goal carried into generated reports and payload descriptions.
  --output-dir         Custom directory for plan artifacts.
  --dataset-name       Override the generated dataset name.
  --application-name   Override the generated application name.
  --skip-app           Generate a dataset-only plan without app creation artifacts.
  --schema-source      auto uses console inference when auth is available; console requires it; local keeps the legacy local-only schema path.
  --project-name       Project name for the console OpenAPI chain when remote inference is used.
  --ak --sk --region   Service auth used by remote schema inference when \`schema-source\` is auto/console.

EXAMPLES
  vs item plan --file ./items.json --output-dir ./.viking/item-plan
  vs item plan --file ./items.csv --goal "Build product item search" --application-name catalog-app
  vs item plan --file ./items.jsonl --type item --goal "Build item search" --skip-app --schema-source console`,
    apply: `Compatibility wrapper around item provision / verify.

USAGE
  vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review [workflow flags]
  vs item apply --plan-dir ./.viking/item-plans/<plan> --phase verify [workflow flags]
  vs item apply --plan-dir ./.viking/item-plans/<plan> --phase all --confirm-review [workflow flags]

DESCRIPTION
  Defaults to \`phase=provision\` unless \`--run-trials\` or \`--phase all\` is passed. Use
  \`--confirm-review\` for a real apply after schema and bind-time field config review. Use
  \`--skip-app\` to stop at dataset provisioning when you need to preserve the dataset-only boundary.

KEY FLAGS
  --plan-dir                        Directory containing plan.json and generated artifacts.
  --phase                           Execution phase: provision, verify, or all.
  --confirm-review                  Required for a real apply path.
  --interactive-review              Render review summary and continue interactively.
  --skip-app                        Skip app creation and app-level setup.
  --application-id / --dataset-id   Reuse existing resources instead of creating new ones.
  --run-trials                      Legacy alias for \`--phase all\`.
  --dry-run                         Print planned actions without calling Viking APIs.

EXAMPLES
  vs item apply --plan-dir ./.viking/item-plans/demo --confirm-review
  vs item apply --plan-dir ./.viking/item-plans/demo --phase verify
  vs item apply --plan-dir ./.viking/item-plans/demo --phase all --confirm-review
  vs item apply --plan-dir ./.viking/item-plans/demo --confirm-review --skip-app`,
    provision: `Provision item onboarding resources up to dataset binding and activation start.

USAGE
  vs item provision --plan-dir ./.viking/item-plans/<plan> --confirm-review [workflow flags]
  vs item provision --plan-dir ./.viking/item-plans/<plan> --interactive-review [workflow flags]
  vs item provision --plan-dir ./.viking/item-plans/<plan> --dry-run [workflow flags]

DESCRIPTION
  Stage-one provisioning command. It creates or reuses the dataset and, unless \`--skip-app\` is passed,
  continues through app creation and dataset binding. It does not wait for runtime readiness or run
  search/chat verification.

KEY FLAGS
  --plan-dir                        Directory containing plan.json and generated artifacts.
  --confirm-review                  Required for real provisioning after review is complete.
  --interactive-review              Render review summary and continue interactively.
  --skip-app                        Stop after dataset provisioning and skip app-level binding.
  --application-id / --dataset-id   Reuse existing resources instead of creating new ones.
  --dry-run                         Print planned actions without calling Viking APIs.

EXAMPLES
  vs item provision --plan-dir ./.viking/item-plans/demo --confirm-review
  vs item provision --plan-dir ./.viking/item-plans/demo --interactive-review
  vs item provision --plan-dir ./.viking/item-plans/demo --dry-run
  vs item provision --plan-dir ./.viking/item-plans/demo --confirm-review --skip-app`,
    verify: `Wait until provisioned item data becomes searchable, then run runtime verification.

USAGE
  vs item verify --plan-dir ./.viking/item-plans/<plan> [workflow flags]
  vs item verify --plan-dir ./.viking/item-plans/<plan> --search-query "wireless headphones" [workflow flags]
  vs item verify --plan-dir ./.viking/item-plans/<plan> --skip-chat [workflow flags]

DESCRIPTION
  Use this after provisioning to wait for indexing and run search/chat smoke checks. You can override
  the generated search query or chat message, skip individual runtime checks, or bootstrap recommend
  verification when the required recommend flags are present.

KEY FLAGS
  --plan-dir             Directory containing plan.json and provision artifacts.
  --wait-indexed         Wait for dataset/app searchability before runtime checks.
  --search-query         Override the generated search smoke query.
  --chat-message         Override the generated chat smoke message.
  --skip-search          Skip runtime search smoke.
  --skip-chat            Skip runtime chat smoke.
  --dry-run              Print planned verify actions without calling Viking APIs.

EXAMPLES
  vs item verify --plan-dir ./.viking/item-plans/demo
  vs item verify --plan-dir ./.viking/item-plans/demo --search-query "wireless headphones"
  vs item verify --plan-dir ./.viking/item-plans/demo --skip-chat`,
    review: `Render the current schema and bind-time field-config summary for a plan.

USAGE
  vs item review --plan-dir ./.viking/item-plans/<plan> [output flags]
  vs item review --plan-dir ./.viking/item-plans/<plan> --reviewer alice --review-notes "Reviewed with PM" [output flags]

DESCRIPTION
  Use this to inspect the current review state and write \`review-confirmation.json\` from the plan's
  current artifacts. This is a review record command; it does not provision or verify runtime behavior.

KEY FLAGS
  --plan-dir      Directory containing plan.json and review-confirmation.json.
  --reviewer      Reviewer name to record.
  --review-notes  Optional notes to persist in review-confirmation.json.

EXAMPLES
  vs item review --plan-dir ./.viking/item-plans/demo
  vs item review --plan-dir ./.viking/item-plans/demo --reviewer alice --review-notes "Reviewed with PM"`,
  };

  console.log(helpByAction[action] ?? `Unknown item subcommand: ${action}`);
}

function printSearchCommandHelp(action: string, subAction?: string): void {
  const helpByAction: Record<string, string> = {
    run: `Run a search request against an application scene.

USAGE
  vs search run --application-id <id> --scene-id <id> [--dataset-id <id>] --query <text> [--page-size <n>] [service flags]

DESCRIPTION
  Sends a normal runtime search request against an explicit search scene. When the application is bound
  to exactly one dataset, \`--dataset-id\` is usually optional.

KEY FLAGS
  --application-id  Target application ID.
  --scene-id        Search scene ID.
  --dataset-id      Optional dataset override for the request.
  --query           Search query text.
  --page-size       Optional result page size.

EXAMPLES
  vs search run --application-id 123 --scene-id default-search --query "wireless headphones"
  vs search run --application-id 123 --scene-id default-search --query "running shoes" --page-size 5`,
    'scene:create': `Create a search scene for an application.

USAGE
  vs search scene create --application-id <id> --name <name> [--description <text>] [service flags]
  vs search scene create --application-id <id> --data @payload.json [service flags]

DESCRIPTION
  Creates a new search scene under the target application. Use \`--name\` and \`--description\` for the
  simple path, or pass \`--data\` when you need full control over the create payload.

KEY FLAGS
  --application-id  Target application ID.
  --name            Search scene name.
  --description     Optional scene description.
  --data            Full request payload. Use this when you need to set top-level fields directly.

EXAMPLES
  vs search scene create --application-id 123 --name "default-search"
  vs search scene create --application-id 123 --name "image-search" --description "Search scene for image-heavy queries"
  vs search scene create --application-id 123 --data @payload.json`,
    'scene:list': `List search scenes for an application.

USAGE
  vs search scene list --application-id <id> [service flags]
  vs search scene list --application-id <id> --data @payload.json [service flags]

DESCRIPTION
  Lists the search scenes currently attached to the target application. Use this first when you are
  not sure which scene is default or which scene ID should be updated.

KEY FLAGS
  --application-id  Target application ID.
  --data            Full request payload. Optional advanced path.

EXAMPLES
  vs search scene list --application-id 123
  vs search scene list --application-id 123 --format json
  vs search scene list --application-id 123 --data @payload.json`,
    'scene:get': `Get one search scene configuration.

USAGE
  vs search scene get --application-id <id> --scene-id <id> [service flags]
  vs search scene get --application-id <id> --scene-id <id> --data @payload.json [service flags]

DESCRIPTION
  Returns the current definition of one search scene, including its published \`Config\`. Use this
  before \`scene update\` so you can modify only the intended parts of the existing configuration.

KEY FLAGS
  --application-id  Target application ID.
  --scene-id        Target search scene ID.
  --data            Full request payload. Optional advanced path.

EXAMPLES
  vs search scene get --application-id 123 --scene-id abc
  vs search scene get --application-id 123 --scene-id abc --format json
  vs search scene get --application-id 123 --scene-id abc --jq '.Result.Scene.Config'`,
    'scene:delete': `Delete a search scene from an application.

USAGE
  vs search scene delete --application-id <id> --scene-id <id> [service flags]
  vs search scene delete --application-id <id> --scene-id <id> --data @payload.json [service flags]

DESCRIPTION
  Deletes the specified search scene. Inspect the scene first with \`vs search scene get\` or
  \`vs search scene list\` when you are not fully sure about the target scene ID.

KEY FLAGS
  --application-id  Target application ID.
  --scene-id        Target search scene ID.
  --data            Full request payload. Optional advanced path.

EXAMPLES
  vs search scene delete --application-id 123 --scene-id abc
  vs search scene delete --application-id 123 --scene-id abc --format json
  vs search scene delete --application-id 123 --scene-id abc --data @payload.json`,
    'scene:update': `Update and publish a search scene configuration.

USAGE
  vs search scene update --application-id <id> --scene-id <id> --config @scene.json [service flags]
  vs search scene update --application-id <id> --scene-id <id> --search-config @search.json [--query-completion-config @qc.json] [--want-to-search-config @wts.json] [--overview-config @overview.json] [service flags]
  vs search scene update --application-id <id> --scene-id <id> --data @payload.json [service flags]

DESCRIPTION
  Updates a published search scene through \`OnlineSearchScene\`. Prefer inspecting the current scene with
  \`vs search scene get\` first, then update only the intended parts. Use \`--config\` when you already
  have a complete \`Config\` object; use \`--search-config\` and companion flags when you only want to
  replace selected config sections.

KEY FLAGS
  --application-id           Target application ID.
  --scene-id                 Target search scene ID.
  --config                   Full scene \`Config\` object.
  --search-config            \`Config.SearchConfig\` object only.
  --query-completion-config  \`Config.QueryCompletionConfig\` object only.
  --want-to-search-config    \`Config.WantToSearchConfig\` object only.
  --overview-config          \`Config.OverviewConfig\` object only.
  --data                     Full request payload. Use this when you need to control top-level fields directly.

SEARCH MODE ENUMS
  RetrieveConfigs[].Mode
    Balanced=1
    SemanticPriority=2
    KeywordPriority=3
    UserDefined=4

  RetrieveConfigs[].UserDefinedRecallMode
    KeywordSemantic=0
    KeywordOnly=1
    SemanticOnly=2

  When \`RetrieveConfigs[].Mode=UserDefined(4)\`, also set \`RetrieveConfigs[].UserDefinedRecallMode\`
  in the same retrieve config.

EXAMPLES
  vs search scene get --application-id 123 --scene-id abc --format json > scene.json
  vs search scene update --application-id 123 --scene-id abc --config @scene.json
  vs search scene update --application-id 123 --scene-id abc --search-config @search.json
  vs search scene update --application-id 123 --scene-id abc --data @payload.json`,
    tune: `Evaluate and tune text search similarity.

USAGE
  vs search tune llm-check [--live] [service flags]
  vs search tune validate --queries <file> [--query-count <n>] [service flags]
  vs search tune query-generate --application-id <id> [--dataset-id <id>] [--query-count <n>] [--retrievable-field-only] [service flags]
  vs search tune plan --application-id <id> [--dataset-id <id>] [--queries <file>] [service flags]
  vs search tune run --application-id <id> [--dataset-id <id>] [--queries <file>] [service flags]
  vs search tune report --run-id <id> [--output-dir <dir>] [service flags]
  vs search tune compare (--run-ids <a,b> | --application-id <id> --dataset-id <id> --scene-ids <a,b> --queries <file>) [service flags]
  vs search tune apply --application-id <id> --run-id <id> [--dry-run | --confirm-create-scene] [service flags]

DESCRIPTION
  First-version tuning covers text-query similarity only. It fixes mode=UserDefined and excludes
  rerank, personalization, hotness, boost/bury rules, sort rules, serving controls, and business rules.`,
    'tune:llm-check': `Check the LLM configuration used by search tuning.

USAGE
  vs search tune llm-check [--live] [service flags]

DESCRIPTION
  Verifies that VIKING_LLM_BASE_URL, VIKING_LLM_API_KEY or VIKING_LLM_AK/SK, and VIKING_LLM_MODEL
  resolve to a usable LLM configuration. Pass --live to send a small test request.

EXAMPLES
  vs search tune llm-check
  vs search tune llm-check --live --json`,
    'tune:validate': `Validate a search tuning query set.

USAGE
  vs search tune validate --queries <file> [--query-count <n>] [service flags]

DESCRIPTION
  Checks JSON, JSONL, or CSV query sets locally without calling search or LLM services. Reports
  parse/schema errors, duplicate ids, duplicate query text, sourceItemIds coverage, query type
  distribution, and the recommended label source for a tuning run.

KEY FLAGS
  --queries      Query set file to validate.
  --query-count  Maximum number of queries to inspect.

EXAMPLES
  vs search tune validate --queries ./queries.jsonl
  vs search tune validate --queries ./queries.jsonl --query-count 100 --json`,
    'tune:plan': `Plan first-version automated search evaluation and similarity tuning.

USAGE
  vs search tune plan --application-id <id> [--dataset-id <id>] [--queries <file>] [--optimizer <matrix|spa>] [--profile similarity-only] [service flags]

DESCRIPTION
  Prints the fixed scope, query source, candidate strategy count, cost estimate, and strategy coverage.
  This command does not call search or LLM services. First-version tuning fixes mode=UserDefined and excludes rerank.

KEY FLAGS
  --application-id  Target application ID.
  --dataset-id      Dataset ID.
  --queries         JSON, JSONL, or CSV query set. If omitted, the plan assumes CLI-generated queries.
  --query-count     Maximum query count. Defaults to all queries from --queries, or 100 generated queries when --queries is omitted.
  --top-k           Results judged per query and strategy. Default: 20.
  --max-strategies  Maximum candidate strategies. Default: 30.
  --optimizer       Candidate strategy optimizer: matrix or spa. Default: matrix.

EXAMPLES
  vs search tune plan --application-id 123 --dataset-id 456 --queries ./queries.jsonl
  vs search tune plan --application-id 123 --dataset-id 456 --query-count 100 --top-k 20 --max-strategies 30 --optimizer spa`,
    'tune:query-generate': `Generate a reusable synthetic query set for search tuning.

USAGE
  vs search tune query-generate --application-id <id> [--dataset-id <id>] [--query-count <n>] [--min-query-count <n>] [--sample-size <n>] [--query-batch-size <n>] [--llm-concurrency <n>] [--retrievable-field-only] [--output-dir <dir>] [service flags]

DESCRIPTION
  Uses paged dataset samples and the configured CLI LLM to generate a JSONL query set in multiple
  batches. Review the returned sample queries, warnings, and shortfall before passing the query file
  to \`search tune plan\` and \`search tune run\`.

KEY FLAGS
  --application-id  Target application ID.
  --dataset-id      Dataset ID. If omitted, the CLI tries to infer a unique search dataset.
  --query-count     Maximum query count. Default: 100.
  --min-query-count Minimum acceptable query count. Defaults to query-count for <=10, otherwise max(10, ceil(query-count * 0.8)).
  --sample-size     Dataset sample items to load across pages. Default: 200.
  --query-batch-size Queries requested from each LLM generation call. Default: 10.
  --llm-concurrency Concurrent LLM generation calls. Default: 100.
  --retrievable-field-only Generate queries from text IndexFields only; ImageIndexFields are excluded.
  --output-dir      Artifact root. Default: .viking/search-tuning.

EXAMPLES
  vs search tune query-generate --application-id 123 --dataset-id 456 --query-count 100 --sample-size 200 --query-batch-size 10 --llm-concurrency 100
  vs search tune query-generate --application-id 123 --dataset-id 456 --output-dir ./.viking/search-tuning`,
    'tune:run': `Run first-version automated search evaluation and similarity tuning.

USAGE
  vs search tune run --application-id <id> [--dataset-id <id>] [--queries <file>] [--resume-run-id <id>] [--optimizer <matrix|spa>] [--label-source <llm|source-item|auto>] [--judge-input <text|text-image>] [--profile similarity-only] [--search-concurrency <n>] [--llm-concurrency <n>] [--timeout-ms <ms>] [service flags]

DESCRIPTION
  Runs text-query similarity tuning with CLI-managed LLM query generation and pointwise relevance judging.
  The first version disables personalization in requests and evaluates user-defined recall strategies only.
  While running, it writes run-state.json, rankings.jsonl, labels-used.jsonl, partial-metrics.json,
  and performance-summary.json under the run artifact directory so interrupted runs can be inspected
  and resumed.

KEY FLAGS
  --application-id  Target application ID.
  --dataset-id      Dataset ID. If omitted, the CLI tries to infer a unique search dataset.
  --queries         JSON, JSONL, or CSV query set. If omitted, the CLI generates queries from sample items.
  --query-count     Maximum query count. Defaults to all queries from --queries, or 100 generated queries when --queries is omitted.
  --top-k           Results judged per query and strategy. Default: 20.
  --max-strategies  Maximum candidate strategies. Default: 30.
  --optimizer       Candidate strategy optimizer: matrix or spa. Default: matrix.
  --label-source    Relevance label source: llm, source-item, or auto. Default: llm.
  --judge-input     LLM judge input mode: text or text-image. Default: text.
  --max-judge-images  Max item images per LLM judge request for text-image. Default: 1.
  --search-concurrency  Concurrent search requests. Default: 18.
  --llm-concurrency     Concurrent LLM relevance judgements. Default: 100.
  --llm-retries         Retries per failed LLM judgement. Default: 1.
  --max-label-failure-rate  Allowed failed label ratio before aborting. Default: 0.01.
  --verbose         Print per-query/per-label progress lines.
  --timeout-ms      Request timeout. Default: 120000 for LLM-backed tuning.
  --resume-run-id   Resume an incomplete run from its existing artifact directory.
  --output-dir      Artifact root. Default: .viking/search-tuning.

EXAMPLES
  vs search tune run --application-id 123 --dataset-id 456 --profile similarity-only
  vs search tune run --application-id 123 --dataset-id 456 --queries ./queries.jsonl --top-k 20 --max-strategies 30 --optimizer spa --search-concurrency 18 --llm-concurrency 100
  vs search tune run --application-id 123 --dataset-id 456 --queries ./queries.jsonl --label-source llm --judge-input text-image --max-judge-images 1
  vs search tune run --application-id 123 --dataset-id 456 --queries ./queries.jsonl --label-source source-item`,
    'tune:apply': `Create a new search scene from a completed tuning report recommendation.

USAGE
  vs search tune apply --application-id <id> --run-id <id> [--scene-name <name>] [--scene-description <text>] [--dry-run | --confirm-create-scene] [service flags]

DESCRIPTION
  Loads a completed tuning report, converts the recommended SearchDynamic into SearchConfig.RetrieveConfigs[0],
  creates a new search scene, publishes it with OnlineSearchScene, and reads it back.
  Request-only params such as query_keyword_match_percent cannot be persisted in scene config and are returned
  as unappliedRequestParams. Use --dry-run first to inspect payloads.

KEY FLAGS
  --application-id         Target application ID.
  --run-id                 Completed tuning run ID.
  --scene-name             Optional new scene name.
  --scene-description      Optional new scene description.
  --dry-run                Print payloads without creating a scene.
  --confirm-create-scene   Required for real scene creation.
  --output-dir             Artifact root. Default: .viking/search-tuning.

EXAMPLES
  vs search tune apply --application-id 123 --run-id run_2026-05-12T00-00-00Z --dry-run
  vs search tune apply --application-id 123 --run-id run_2026-05-12T00-00-00Z --confirm-create-scene`,
    'tune:report': `Read a previous search tuning report.

USAGE
  vs search tune report --run-id <id> [--output-dir <dir>] [service flags]

EXAMPLES
  vs search tune report --run-id run_2026-05-12T00-00-00Z`,
    'tune:compare': `Compare completed tuning runs or existing search scenes.

USAGE
  vs search tune compare --run-ids <run_a,run_b> [--baseline-run-id <run>] [--output-dir <dir>] [service flags]
  vs search tune compare --application-id <id> --dataset-id <id> --scene-ids <scene_a,scene_b> --queries <file> [--baseline-scene-id <scene>] [--top-k <n>] [--search-concurrency <n>] [service flags]

DESCRIPTION
  Offline mode compares completed tuning reports by recommended strategy metrics. Online scene mode
  sends the same query set to multiple scenes and evaluates them with source-item silver labels.
  Scene mode requires every query to include sourceItemIds.

KEY FLAGS
  --run-ids              Comma-separated completed tuning run IDs.
  --scene-ids            Comma-separated search scene IDs.
  --application-id       Target application ID. Required with --scene-ids.
  --dataset-id           Dataset ID. Required with --scene-ids.
  --queries              Query set file. Required with --scene-ids.
  --baseline-run-id      Baseline run for delta metrics. Defaults to the first --run-ids value.
  --baseline-scene-id    Baseline scene for delta metrics. Defaults to the first --scene-ids value.
  --search-concurrency   Concurrent online search requests for scene mode. Default: 18.

EXAMPLES
  vs search tune compare --run-ids run_a,run_b
  vs search tune compare --application-id 123 --dataset-id 456 --scene-ids scene_a,scene_b --queries ./queries.jsonl`
  };

  console.log(helpByAction[`${action}:${subAction ?? ''}`] ?? helpByAction[action] ?? `Unknown search subcommand: ${[action, subAction].filter(Boolean).join(' ')}`);
}

async function runAppCli(argv: string[]): Promise<void> {
  const action = argv[0];
  if ((action === 'dataset' || action === 'dataset-config') && hasHelpFlag(argv.slice(2))) {
    printAppCommandHelp(action, argv[1]);
    return;
  }
  const values = parseStandaloneOptions(argv.slice(1));
  const serviceOptions = toStandaloneServiceOptions(values);
  const projectOptions = toProjectScopedOptions(values);
  switch (action) {
    case 'create':
      await runAppCreateCommand({
        ...serviceOptions,
        name: optionalString(values.name),
        description: optionalString(values.description),
        industry: optionalString(values.industry),
        language: optionalString(values.language),
        color: optionalString(values.color)
      });
      return;
    case 'update':
      await runAppUpdateCommand({
        ...projectOptions,
        id: requiredString(values.id, '--id'),
        name: optionalString(values.name),
        industry: optionalString(values.industry),
        icon: optionalString(values.icon),
        color: optionalString(values.color)
      });
      return;
    case 'get':
      await runAppGetCommand({ ...serviceOptions, id: optionalString(values.id) });
      return;
    case 'list':
      await runAppListCommand({
        ...serviceOptions,
        name: optionalString(values.name),
        datasetId: optionalString(values['dataset-id']),
        industry: optionalString(values.industry),
        state: optionalString(values.state),
        full: optionalBoolean(values.full)
      });
      return;
    case 'delete':
      await runAppDeleteCommand({ 
        ...serviceOptions, 
        id: optionalString(values.id),
        force: optionalBoolean(values.force)
      });
      return;
    case 'diagnose':
      await runAppDiagnoseWorkflowCommand({
        ...projectOptions,
        applicationId: requiredString(values['application-id'], '--application-id'),
        activatedOnly: optionalBoolean(values['activated-only'])
      });
      return;
    case 'status':
      await runAppStatusCommand({
        ...projectOptions,
        applicationId: requiredString(values['application-id'], '--application-id'),
        activatedOnly: optionalBoolean(values['activated-only'])
      });
      return;
    case 'wait-ready':
      await runAppWaitReadyCommand({
        ...projectOptions,
        applicationId: requiredString(values['application-id'], '--application-id'),
        activatedOnly: optionalBoolean(values['activated-only']),
        waitTimeoutMs: parseOptionalInt(optionalString(values['wait-timeout-ms'])),
        pollIntervalMs: parseOptionalInt(optionalString(values['poll-interval-ms']))
      });
      return;
    case 'dataset': {
      const subAction = argv[1];
      if (subAction === 'bind') {
        await runAppDatasetBindWorkflowCommand({
          ...projectOptions,
          applicationId: requiredString(values['application-id'], '--application-id'),
          datasetId: requiredString(values['dataset-id'], '--dataset-id'),
          dryRun: optionalBoolean(values['dry-run']),
          backtrackEnable: optionalBoolean(values['backtrack-enable']),
          backtrackAll: optionalBoolean(values['backtrack-all']),
          backtrackStart: optionalString(values['backtrack-start']),
          backtrackEnd: optionalString(values['backtrack-end']),
          fieldConfig: optionalString(values['field-config']),
          schemaVersion: parseOptionalInt(optionalString(values['schema-version'])),
          fieldConfigVersion: parseOptionalInt(optionalString(values['field-config-version'])),
          onlineConfig: optionalString(values['online-config']),
          waitReady: optionalBoolean(values['wait-ready']),
          waitTimeoutMs: parseOptionalInt(optionalString(values['wait-timeout-ms'])),
          pollIntervalMs: parseOptionalInt(optionalString(values['poll-interval-ms'])),
          activatedOnly: optionalBoolean(values['activated-only'])
        });
        return;
      }
      if (subAction === 'unbind') {
        await runAppDatasetUnbindCommand({
          ...projectOptions,
          applicationId: requiredString(values['application-id'], '--application-id'),
          datasetId: requiredString(values['dataset-id'], '--dataset-id')
        });
        return;
      }
      throw new Error(`Unknown app dataset subcommand: ${subAction}`);
    }
    case 'dataset-config': {
      const subAction = argv[1];
      if (subAction === 'get') {
        await runAppDatasetConfigGetCommand({
          ...projectOptions,
          applicationId: requiredString(values['application-id'], '--application-id'),
          datasetId: requiredString(values['dataset-id'], '--dataset-id'),
          fieldConfigVersion: parseOptionalInt(optionalString(values['field-config-version'])),
          full: optionalBoolean(values.full)
        });
        return;
      }
      if (subAction === 'list') {
        await runAppDatasetConfigListCommand({
          ...projectOptions,
          applicationId: requiredString(values['application-id'], '--application-id'),
          datasetType: optionalString(values['dataset-type']),
          pageNumber: parseOptionalInt(optionalString(values['page-number'])),
          pageSize: parseOptionalInt(optionalString(values['page-size'])),
          activatedOnly: optionalBoolean(values['activated-only']),
          full: optionalBoolean(values.full)
        });
        return;
      }
      if (subAction === 'update') {
        await runAppDatasetConfigUpdateCommand({
          ...projectOptions,
          applicationId: requiredString(values['application-id'], '--application-id'),
          datasetId: requiredString(values['dataset-id'], '--dataset-id'),
          schemaVersion: parseOptionalInt(optionalString(values['schema-version'])),
          fieldConfigVersion: parseOptionalInt(optionalString(values['field-config-version'])),
          fieldConfig: optionalString(values['field-config']),
          dryRun: optionalBoolean(values['dry-run'])
        });
        return;
      }
      throw new Error(`Unknown app dataset-config subcommand: ${subAction}`);
    }
    case 'online-config': {
      const subAction = argv[1];
      if (subAction === 'get') {
        await runAppOnlineConfigGetCommand({
          ...projectOptions,
          applicationId: requiredString(values['application-id'], '--application-id'),
          full: optionalBoolean(values.full)
        });
        return;
      }
      if (subAction === 'update') {
        await runAppOnlineConfigUpdateCommand({
          ...projectOptions,
          applicationId: requiredString(values['application-id'], '--application-id'),
          config: optionalString(values.config),
          dryRun: optionalBoolean(values['dry-run'])
        });
        return;
      }
      throw new Error(`Unknown app online-config subcommand: ${subAction}`);
    }
    default:
      throw new Error(`Unknown app subcommand: ${action}`);
  }
}

async function runDatasetCli(argv: string[]): Promise<void> {
  const action = argv[0];
  if (hasHelpFlag(argv.slice(1))) {
    printDatasetCommandHelp(action);
    return;
  }
  const values = parseStandaloneOptions(argv.slice(1));
  const serviceOptions = toStandaloneServiceOptions(values);
  const projectOptions = toProjectScopedOptions(values);
  switch (action) {
    case 'create':
      await runDatasetCreateCommand({
        ...serviceOptions,
        name: optionalString(values.name),
        type: optionalString(values.type),
        description: optionalString(values.description),
        schema: optionalString(values.schema)
      });
      return;
    case 'get':
      await runDatasetGetCommand({ ...serviceOptions, id: optionalString(values.id), full: optionalBoolean(values.full) });
      return;
    case 'schema': {
      const subAction = argv[1];
      if (subAction === 'check') {
        await runDatasetSchemaCheckCommand({
          ...projectOptions,
          type: optionalString(values.type),
          schema: optionalString(values.schema)
        });
        return;
      }
      throw new Error(`Unknown dataset schema subcommand: ${subAction}`);
    }
    case 'update':
      await runDatasetUpdateCommand({
        ...projectOptions,
        id: requiredString(values.id, '--id'),
        version: parseOptionalInt(optionalString(values.version)),
        schema: optionalString(values.schema),
        description: optionalString(values.description)
      });
      return;
    case 'ingest':
      await runDatasetIngestWorkflowCommand({
        ...serviceOptions,
        datasetId: requiredString(values['dataset-id'], '--dataset-id'),
        fields: optionalString(values.fields)
      });
      return;
    case 'list':
      await runDatasetListCommand({
        ...serviceOptions,
        type: optionalString(values.type),
        name: optionalString(values.name),
        applicationId: optionalString(values['application-id']),
        full: optionalBoolean(values.full)
      });
      return;
    case 'delete':
      await runDatasetDeleteCommand({ 
        ...serviceOptions, 
        id: optionalString(values.id),
        force: optionalBoolean(values.force)
      });
      return;
    default:
      throw new Error(`Unknown dataset subcommand: ${action}`);
  }
}

async function runDataCli(argv: string[]): Promise<void> {
  const action = argv[0];
  const values = parseStandaloneOptions(argv.slice(1));
  const serviceOptions = toStandaloneServiceOptions(values);
  const datasetId = requiredString(values['dataset-id'], '--dataset-id');
  switch (action) {
    case 'write':
      await runDataWriteCommand({ ...serviceOptions, datasetId, fields: optionalString(values.fields) });
      return;
    case 'import':
      await runDataImportShortcutCommand({ ...serviceOptions, datasetId, fields: optionalString(values.fields) });
      return;
    case 'delete':
      await runDataDeleteCommand({ ...serviceOptions, datasetId, id: optionalString(values.id) });
      return;
    default:
      throw new Error(`Unknown data subcommand: ${action}`);
  }
}

async function runItemCli(argv: string[]): Promise<void> {
  const action = argv[0];
  if (hasHelpFlag(argv.slice(1)) && ['plan', 'apply', 'provision', 'verify', 'review'].includes(action)) {
    printItemCommandHelp(action);
    return;
  }
  const values = parseStandaloneOptions(argv.slice(1));

  switch (action) {
    case 'profile':
      await runItemProfileCommand({
        file: requiredString(values.file, '--file'),
        datasetType: optionalString(values.type) as 'item' | 'video'
      });
      return;
    case 'plan':
      await runItemPlanCommand({
        ...toStandaloneServiceOptions(values),
        file: requiredString(values.file, '--file'),
        datasetType: optionalString(values.type) as 'item' | 'video',
        goal: optionalString(values.goal),
        outputDir: optionalString(values['output-dir']),
        datasetName: optionalString(values['dataset-name']),
        applicationName: optionalString(values['application-name']),
        projectName: optionalString(values['project-name']),
        skipApp: optionalBoolean(values['skip-app']),
        schemaSource: optionalString(values['schema-source']) as 'auto' | 'console' | 'local' | undefined,
        schemaWaitTimeoutMs: parseOptionalInt(optionalString(values['schema-wait-timeout-ms'])),
        schemaPollIntervalMs: parseOptionalInt(optionalString(values['schema-poll-interval-ms'])),
        language: optionalString(values.language)
      });
      return;
    case 'apply':
      await runItemApplyCommand({
        ...toStandaloneServiceOptions(values),
        planDir: requiredString(values['plan-dir'], '--plan-dir'),
        projectName: optionalString(values['project-name']),
        applicationId: optionalString(values['application-id']),
        datasetId: optionalString(values['dataset-id']),
        applicationName: optionalString(values['application-name']),
        datasetName: optionalString(values['dataset-name']),
        phase: optionalString(values.phase) as 'provision' | 'verify' | 'all' | undefined,
        waitReady: optionalBoolean(values['wait-ready']),
        waitTimeoutMs: parseOptionalInt(optionalString(values['wait-timeout-ms'])),
        pollIntervalMs: parseOptionalInt(optionalString(values['poll-interval-ms'])),
        runTrials: optionalBoolean(values['run-trials']),
        searchQuery: optionalString(values['search-query']),
        chatMessage: optionalString(values['chat-message']),
        confirmReview: optionalBoolean(values['confirm-review']),
        interactiveReview: optionalBoolean(values['interactive-review']),
        reviewer: optionalString(values.reviewer),
        reviewNotes: optionalString(values['review-notes']),
        confirmRecommendEntryBinding: optionalBoolean(values['confirm-recommend-entry-binding']),
        force: optionalBoolean(values.force),
        recommendSceneType: optionalString(values['recommend-scene-type']),
        recommendSceneName: optionalString(values['recommend-scene-name']),
        recommendBhvSceneTypes: splitCommaList(optionalString(values['recommend-bhv-scene-types'])),
        recommendUserId: optionalString(values['recommend-user-id']),
        recommendParentId: optionalString(values['recommend-parent-id']),
        dryRun: optionalBoolean(values['dry-run'])
      });
      return;
    case 'provision':
      await runItemProvisionCommand({
        ...toStandaloneServiceOptions(values),
        planDir: requiredString(values['plan-dir'], '--plan-dir'),
        projectName: optionalString(values['project-name']),
        applicationId: optionalString(values['application-id']),
        datasetId: optionalString(values['dataset-id']),
        applicationName: optionalString(values['application-name']),
        datasetName: optionalString(values['dataset-name']),
        skipApp: optionalBoolean(values['skip-app']),
        waitReady: optionalBoolean(values['wait-ready']),
        waitTimeoutMs: parseOptionalInt(optionalString(values['wait-timeout-ms'])),
        pollIntervalMs: parseOptionalInt(optionalString(values['poll-interval-ms'])),
        confirmReview: optionalBoolean(values['confirm-review']),
        interactiveReview: optionalBoolean(values['interactive-review']),
        reviewer: optionalString(values.reviewer),
        reviewNotes: optionalString(values['review-notes']),
        force: optionalBoolean(values.force),
        dryRun: optionalBoolean(values['dry-run'])
      });
      return;
    case 'verify':
      await runItemVerifyCommand({
        ...toStandaloneServiceOptions(values),
        planDir: requiredString(values['plan-dir'], '--plan-dir'),
        projectName: optionalString(values['project-name']),
        applicationId: optionalString(values['application-id']),
        datasetId: optionalString(values['dataset-id']),
        waitIndexed: optionalBoolean(values['wait-indexed']),
        waitTimeoutMs: parseOptionalInt(optionalString(values['wait-timeout-ms'])),
        pollIntervalMs: parseOptionalInt(optionalString(values['poll-interval-ms'])),
        searchQuery: optionalString(values['search-query']),
        chatMessage: optionalString(values['chat-message']),
        skipSearch: optionalBoolean(values['skip-search']),
        skipChat: optionalBoolean(values['skip-chat']),
        confirmRecommendEntryBinding: optionalBoolean(values['confirm-recommend-entry-binding']),
        recommendSceneType: optionalString(values['recommend-scene-type']),
        recommendSceneName: optionalString(values['recommend-scene-name']),
        recommendBhvSceneTypes: splitCommaList(optionalString(values['recommend-bhv-scene-types'])),
        recommendUserId: optionalString(values['recommend-user-id']),
        recommendParentId: optionalString(values['recommend-parent-id']),
        dryRun: optionalBoolean(values['dry-run'])
      });
      return;
    case 'review':
      await runItemReviewCommand({
        planDir: requiredString(values['plan-dir'], '--plan-dir'),
        reviewer: optionalString(values.reviewer),
        notes: optionalString(values['review-notes'])
      });
      return;
    default:
      throw new Error(`Unknown item subcommand: ${action}`);
  }
}

async function runSearchCli(argv: string[]): Promise<void> {
  const action = argv[0];
  if (action === 'run' && hasHelpFlag(argv.slice(1))) {
    printSearchCommandHelp(action);
    return;
  }
  if (action === 'scene' && hasHelpFlag(argv.slice(2))) {
    printSearchCommandHelp(action, argv[1]);
    return;
  }
  if (action === 'tune' && hasHelpFlag(argv.slice(1))) {
    const subAction = argv[1];
    printSearchCommandHelp(action, subAction === '--help' || subAction === '-h' ? undefined : subAction);
    return;
  }
  const values = parseStandaloneOptions(argv.slice(1));
  const serviceOptions = toStandaloneServiceOptions(values);
  const projectOptions = toProjectScopedOptions(values);
  switch (action) {
    case 'run':
      await runSearchRunCommand({
        ...serviceOptions,
        applicationId: requiredString(values['application-id'], '--application-id'),
        sceneId: requiredString(values['scene-id'], '--scene-id'),
        datasetId: optionalString(values['dataset-id']),
        query: optionalString(values.query),
        pageSize: parseOptionalInt(optionalString(values['page-size']))
      });
      return;
    case 'scene': {
      const subAction = argv[1];
      switch (subAction) {
        case 'create':
          await runSearchSceneCreateCommand({
            ...projectOptions,
            applicationId: requiredString(values['application-id'], '--application-id'),
            name: optionalString(values.name),
            description: optionalString(values.description)
          });
          return;
        case 'list':
          await runSearchSceneListCommand({ ...projectOptions, applicationId: requiredString(values['application-id'], '--application-id') });
          return;
        case 'get':
          await runSearchSceneGetCommand({
            ...projectOptions,
            applicationId: requiredString(values['application-id'], '--application-id'),
            sceneId: requiredString(values['scene-id'], '--scene-id')
          });
          return;
        case 'update':
          await runSearchSceneUpdateCommand({
            ...projectOptions,
            applicationId: requiredString(values['application-id'], '--application-id'),
            sceneId: requiredString(values['scene-id'], '--scene-id'),
            name: optionalString(values.name),
            description: optionalString(values.description),
            config: optionalString(values.config),
            searchConfig: optionalString(values['search-config']),
            queryCompletionConfig: optionalString(values['query-completion-config']),
            wantToSearchConfig: optionalString(values['want-to-search-config']),
            overviewConfig: optionalString(values['overview-config'])
          });
          return;
        case 'delete':
          await runSearchSceneDeleteCommand({
            ...projectOptions,
            applicationId: requiredString(values['application-id'], '--application-id'),
            sceneId: requiredString(values['scene-id'], '--scene-id')
          });
          return;
        default:
          throw new Error(`Unknown search scene subcommand: ${subAction}`);
      }
    }
    case 'tune': {
      const subAction = argv[1];
      switch (subAction) {
        case 'llm-check':
          await runSearchTuneLlmCheckCommand({
            ...serviceOptions,
            live: optionalBoolean(values.live)
          });
          return;
        case 'validate':
          await runSearchTuneValidateCommand({
            ...serviceOptions,
            projectName: optionalString(values['project-name']),
            queries: requiredString(values.queries, '--queries'),
            queryCount: parseOptionalInt(optionalString(values['query-count']))
          });
          return;
        case 'plan':
          await runSearchTunePlanCommand({
            ...serviceOptions,
            projectName: optionalString(values['project-name']),
            applicationId: requiredString(values['application-id'], '--application-id'),
            datasetId: optionalString(values['dataset-id']),
            profile: optionalString(values.profile),
            queries: optionalString(values.queries),
            queryCount: parseOptionalInt(optionalString(values['query-count'])),
            topK: parseOptionalInt(optionalString(values['top-k'])),
            maxStrategies: parseOptionalInt(optionalString(values['max-strategies'])),
            optimizer: parseTuningOptimizer(optionalString(values.optimizer))
          });
          return;
        case 'query-generate':
          await runSearchTuneQueryGenerateCommand({
            ...serviceOptions,
            projectName: optionalString(values['project-name']),
            applicationId: requiredString(values['application-id'], '--application-id'),
            datasetId: optionalString(values['dataset-id']),
            queryCount: parseOptionalInt(optionalString(values['query-count'])),
            minQueryCount: parseOptionalInt(optionalString(values['min-query-count'])),
            sampleSize: parseOptionalInt(optionalString(values['sample-size'])),
            queryBatchSize: parseOptionalInt(optionalString(values['query-batch-size'])),
            llmConcurrency: parseOptionalInt(optionalString(values['llm-concurrency'])),
            retrievableFieldOnly: optionalBoolean(values['retrievable-field-only']),
            outputDir: optionalString(values['output-dir'])
          });
          return;
        case 'run':
          await runSearchTuneRunCommand({
            ...serviceOptions,
            projectName: optionalString(values['project-name']),
            applicationId: requiredString(values['application-id'], '--application-id'),
            datasetId: optionalString(values['dataset-id']),
            profile: optionalString(values.profile),
            queries: optionalString(values.queries),
            queryCount: parseOptionalInt(optionalString(values['query-count'])),
            topK: parseOptionalInt(optionalString(values['top-k'])),
            maxStrategies: parseOptionalInt(optionalString(values['max-strategies'])),
            optimizer: parseTuningOptimizer(optionalString(values.optimizer)),
            searchConcurrency: parseOptionalInt(optionalString(values['search-concurrency'])),
            llmConcurrency: parseOptionalInt(optionalString(values['llm-concurrency'])),
            labelSource: parseTuningLabelSource(optionalString(values['label-source'])),
            judgeInput: parseTuningJudgeInput(optionalString(values['judge-input'])),
            maxJudgeImages: parseOptionalInt(optionalString(values['max-judge-images'])),
            llmRetries: parseOptionalInt(optionalString(values['llm-retries'])),
            maxLabelFailureRate: parseOptionalNumber(optionalString(values['max-label-failure-rate'])),
            verbose: optionalBoolean(values.verbose),
            outputDir: optionalString(values['output-dir']),
            resumeRunId: optionalString(values['resume-run-id'])
          });
          return;
        case 'apply':
          await runSearchTuneApplyCommand({
            ...serviceOptions,
            projectName: optionalString(values['project-name']),
            applicationId: requiredString(values['application-id'], '--application-id'),
            runId: requiredString(values['run-id'], '--run-id'),
            outputDir: optionalString(values['output-dir']),
            sceneName: optionalString(values['scene-name']),
            sceneDescription: optionalString(values['scene-description']),
            dryRun: optionalBoolean(values['dry-run']),
            confirmCreateScene: optionalBoolean(values['confirm-create-scene'])
          });
          return;
        case 'report':
          await runSearchTuneReportCommand({
            ...serviceOptions,
            projectName: optionalString(values['project-name']),
            runId: requiredString(values['run-id'], '--run-id'),
            outputDir: optionalString(values['output-dir'])
          });
          return;
        case 'compare':
          await runSearchTuneCompareCommand({
            ...serviceOptions,
            projectName: optionalString(values['project-name']),
            applicationId: optionalString(values['application-id']),
            datasetId: optionalString(values['dataset-id']),
            runIds: splitCommaList(optionalString(values['run-ids'])),
            sceneIds: splitCommaList(optionalString(values['scene-ids'])),
            queries: optionalString(values.queries),
            topK: parseOptionalInt(optionalString(values['top-k'])),
            searchConcurrency: parseOptionalInt(optionalString(values['search-concurrency'])),
            baselineRunId: optionalString(values['baseline-run-id']),
            baselineSceneId: optionalString(values['baseline-scene-id']),
            outputDir: optionalString(values['output-dir'])
          });
          return;
        default:
          throw new Error(`Unknown search tune subcommand: ${subAction}`);
      }
    }
    default:
      throw new Error(`Unknown search subcommand: ${action}`);
  }
}

async function runRecommendCli(argv: string[]): Promise<void> {
  const action = argv[0];
  const values = parseStandaloneOptions(argv.slice(1));
  const serviceOptions = toStandaloneServiceOptions(values);
  const projectOptions = toProjectScopedOptions(values);
  const applicationId = requiredString(values['application-id'], '--application-id');
  if (action === 'run') {
    await runRecommendRunCommand({
      ...serviceOptions,
      applicationId,
      sceneId: requiredString(values['scene-id'], '--scene-id'),
      userId: optionalString(values['user-id']),
      parentId: optionalString(values['parent-id']),
      pageSize: parseOptionalInt(optionalString(values['page-size']))
    });
    return;
  }

  if (action === 'scene') {
    const subAction = argv[1];
    switch (subAction) {
      case 'create':
        await runRecommendSceneCreateCommand({
          ...projectOptions,
          applicationId,
          type: optionalString(values.type),
          name: optionalString(values.name),
          description: optionalString(values.description),
          itemDatasetId: optionalString(values['item-dataset-id']),
          recommendModel: parseOptionalInt(optionalString(values['recommend-model'])),
          optimizationTarget: parseOptionalInt(optionalString(values['optimization-target'])),
          bhvSceneTypes: optionalString(values['bhv-scene-types']),
          confirmEntryBinding: optionalBoolean(values['confirm-entry-binding']),
          clickEventTypes: optionalString(values['click-event-types']),
          positiveEventTypes: optionalString(values['positive-event-types']),
          negativeEventTypes: optionalString(values['negative-event-types'])
        });
        return;
      case 'list':
        await runRecommendSceneListCommand({
          ...projectOptions,
          applicationId,
          types: optionalString(values.types)
        });
        return;
      case 'get':
        await runRecommendSceneGetCommand({
          ...projectOptions,
          applicationId,
          sceneId: requiredString(values['scene-id'], '--scene-id')
        });
        return;
      case 'update':
        await runRecommendSceneUpdateCommand({
          ...projectOptions,
          applicationId,
          sceneId: requiredString(values['scene-id'], '--scene-id'),
          type: optionalString(values.type),
          name: optionalString(values.name),
          description: optionalString(values.description),
          itemDatasetId: optionalString(values['item-dataset-id']),
          bhvSceneTypes: optionalString(values['bhv-scene-types']),
          config: optionalString(values.config),
          count: parseOptionalInt(optionalString(values.count)),
          boostBuryConfig: optionalString(values['boost-bury-config']),
          shuffleConfig: optionalString(values['shuffle-config']),
          impressionConfig: optionalString(values['impression-config']),
          suggestConfig: optionalString(values['suggest-config']),
          degradeRuleId: optionalString(values['degrade-rule-id']),
          confirmEntryBinding: optionalBoolean(values['confirm-entry-binding'])
        });
        return;
      case 'delete':
        await runRecommendSceneDeleteCommand({
          ...projectOptions,
          applicationId,
          sceneId: requiredString(values['scene-id'], '--scene-id')
        });
        return;
      default:
        throw new Error(`Unknown recommend scene subcommand: ${subAction}`);
    }
  }

  throw new Error(`Unknown recommend subcommand: ${action}`);
}

async function runChatSearchCli(argv: string[]): Promise<void> {
  const action = argv[0];
  const values = parseStandaloneOptions(argv.slice(1));
  const serviceOptions = toStandaloneServiceOptions(values);
  if (action !== 'run') {
    throw new Error(`Unknown chat subcommand: ${action}`);
  }

  await runChatSearchRunCommand({
    ...serviceOptions,
    applicationId: requiredString(values['application-id'], '--application-id'),
    sessionId: optionalString(values['session-id']),
    message: optionalString(values.message),
    openingRemarks: parseBooleanString(optionalString(values['opening-remarks'])),
    userId: optionalString(values['user-id']),
    pretty: optionalBoolean(values.pretty)
  });
}

async function runPurchaseCli(argv: string[]): Promise<void> {
  const action = argv[0];
  const subAction = argv[1];
  if (action === 'link') {
    const values = parseStandaloneOptions(argv.slice(1));
    await runPurchaseLinkCommand({
      environmentId: optionalString(values['environment-id'])
    });
    return;
  }
  if (action === 'order' && hasHelpFlag(argv.slice(2))) {
    printDomainHelp('purchase');
    return;
  }
  if (action !== 'order') {
    throw new Error(`Unknown purchase subcommand: ${action}`);
  }

  const values = parseStandaloneOptions(argv.slice(2));
  const projectOptions = toProjectScopedOptions(values);
  switch (subAction) {
    case 'status':
      await runPurchaseOrderStatusCommand(projectOptions);
      return;
    case 'wait':
      await runPurchaseOrderWaitCommand({
        ...projectOptions,
        maxAttempts: parseOptionalInt(optionalString(values['max-attempts'])),
        pollIntervalMs: parseOptionalInt(optionalString(values['poll-interval-ms']))
      });
      return;
    default:
      throw new Error(`Unknown purchase order subcommand: ${subAction}`);
  }
}

function parseStandaloneOptions(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      format: { type: 'string' },
      json: { type: 'boolean' },
      table: { type: 'boolean' },
      yaml: { type: 'boolean' },
      pretty: { type: 'boolean' },
      ndjson: { type: 'boolean' },
      csv: { type: 'boolean' },
      jq: { type: 'string', short: 'q' },
      output: { type: 'string', short: 'o' },
      'output-dir': { type: 'string' },
      'base-url': { type: 'string' },
      'control-plane-base-url': { type: 'string' },
      'data-plane-base-url': { type: 'string' },
      ak: { type: 'string' },
      sk: { type: 'string' },
      region: { type: 'string' },
      'timeout-ms': { type: 'string' },
      data: { type: 'string' },
      live: { type: 'boolean' },
      file: { type: 'string' },
      goal: { type: 'string' },
      profile: { type: 'string' },
      id: { type: 'string' },
      'plan-dir': { type: 'string' },
      name: { type: 'string' },
      'application-name': { type: 'string' },
      'dataset-name': { type: 'string' },
      description: { type: 'string' },
      industry: { type: 'string' },
      icon: { type: 'string' },
      language: { type: 'string' },
      color: { type: 'string' },
      type: { type: 'string' },
      schema: { type: 'string' },
      'field-config': { type: 'string' },
      'online-config': { type: 'string' },
      'dataset-id': { type: 'string' },
      fields: { type: 'string' },
      full: { type: 'boolean' },
      'application-id': { type: 'string' },
      'scene-id': { type: 'string' },
      'project-name': { type: 'string' },
      'dry-run': { type: 'boolean' },
      'schema-version': { type: 'string' },
      'field-config-version': { type: 'string' },
      version: { type: 'string' },
      config: { type: 'string' },
      query: { type: 'string' },
      queries: { type: 'string' },
      'query-count': { type: 'string' },
      'min-query-count': { type: 'string' },
      'sample-size': { type: 'string' },
      'query-batch-size': { type: 'string' },
      'top-k': { type: 'string' },
      'max-strategies': { type: 'string' },
      optimizer: { type: 'string' },
      'search-concurrency': { type: 'string' },
      'llm-concurrency': { type: 'string' },
      'label-source': { type: 'string' },
      'judge-input': { type: 'string' },
      'max-judge-images': { type: 'string' },
      'llm-retries': { type: 'string' },
      'max-label-failure-rate': { type: 'string' },
      verbose: { type: 'boolean' },
      'run-id': { type: 'string' },
      'run-ids': { type: 'string' },
      'resume-run-id': { type: 'string' },
      'scene-ids': { type: 'string' },
      'baseline-run-id': { type: 'string' },
      'baseline-scene-id': { type: 'string' },
      'scene-name': { type: 'string' },
      'scene-description': { type: 'string' },
      'confirm-create-scene': { type: 'boolean' },
      'search-query': { type: 'string' },
      'chat-message': { type: 'string' },
      'page-size': { type: 'string' },
      'user-id': { type: 'string' },
      'parent-id': { type: 'string' },
      'session-id': { type: 'string' },
      message: { type: 'string' },
      'opening-remarks': { type: 'string' },
      'item-dataset-id': { type: 'string' },
      'dataset-type': { type: 'string' },
      'page-number': { type: 'string' },
      'activated-only': { type: 'boolean' },
      'wait-ready': { type: 'boolean' },
      'wait-indexed': { type: 'boolean' },
      'run-trials': { type: 'boolean' },
      'skip-app': { type: 'boolean' },
      'schema-source': { type: 'string' },
      'schema-wait-timeout-ms': { type: 'string' },
      'schema-poll-interval-ms': { type: 'string' },
      'confirm-review': { type: 'boolean' },
      'interactive-review': { type: 'boolean' },
      'confirm-recommend-entry-binding': { type: 'boolean' },
      'confirm-entry-binding': { type: 'boolean' },
      reviewer: { type: 'string' },
      'review-notes': { type: 'string' },
      force: { type: 'boolean' },
      'wait-timeout-ms': { type: 'string' },
      'poll-interval-ms': { type: 'string' },
      'max-attempts': { type: 'string' },
      'environment-id': { type: 'string' },
      phase: { type: 'string' },
      'skip-search': { type: 'boolean' },
      'skip-chat': { type: 'boolean' },
      types: { type: 'string' },
      'recommend-model': { type: 'string' },
      'optimization-target': { type: 'string' },
      'recommend-scene-type': { type: 'string' },
      'recommend-scene-name': { type: 'string' },
      'recommend-bhv-scene-types': { type: 'string' },
      'recommend-user-id': { type: 'string' },
      'recommend-parent-id': { type: 'string' },
      'bhv-scene-types': { type: 'string' },
      'click-event-types': { type: 'string' },
      'positive-event-types': { type: 'string' },
      'negative-event-types': { type: 'string' },
      count: { type: 'string' },
      'boost-bury-config': { type: 'string' },
      'shuffle-config': { type: 'string' },
      'impression-config': { type: 'string' },
      'suggest-config': { type: 'string' },
      'degrade-rule-id': { type: 'string' },
      'search-config': { type: 'string' },
      'query-completion-config': { type: 'string' },
      'want-to-search-config': { type: 'string' },
      'overview-config': { type: 'string' },
    }
  });

  return values;
}

type StandaloneValues = ReturnType<typeof parseStandaloneOptions>;

function toStandaloneServiceOptions(values: StandaloneValues): ServiceCommandOptions {
  return compactObject({
    baseUrl: optionalString(values['base-url']),
    controlPlaneBaseUrl: optionalString(values['control-plane-base-url']),
    dataPlaneBaseUrl: optionalString(values['data-plane-base-url']),
    accessKeyId: optionalString(values.ak),
    secretKey: optionalString(values.sk),
    projectName: optionalString(values['project-name']),
    region: optionalString(values.region),
    timeoutMs: parseOptionalInt(optionalString(values['timeout-ms'])),
    data: optionalString(values.data)
  });
}

function toProjectScopedOptions(values: StandaloneValues): ProjectScopedOptions {
  return compactObject({
    ...toStandaloneServiceOptions(values),
    projectName: optionalString(values['project-name'])
  });
}

async function callOpenApi(pathname: string, payload: unknown, options: ServiceCommandOptions): Promise<unknown> {
  const config = resolveServiceConfig(toServiceConfigInput(options));
  return new VikingOpenApiClient(config).post(pathname, withProjectName(payload, config.projectName));
}

async function callConsoleTopAction(action: string, payload: unknown, options: ServiceCommandOptions): Promise<unknown> {
  const entry = getConsoleTopAction(action);
  if (!entry) {
    throw new Error(`Unknown console top action: ${action}`);
  }
  return callOpenApi(entry.path, payload, options);
}

async function callRuntime(
  callback: (client: VikingRuntimeApiClient) => Promise<unknown>,
  options: ServiceCommandOptions
): Promise<unknown> {
  const config = resolveServiceConfig(toServiceConfigInput(options));
  const client = new VikingRuntimeApiClient(config);
  return callback(client);
}

function toServiceConfigInput(options: ServiceCommandOptions): ServiceConfigInput {
  return {
    baseUrl: options.baseUrl,
    controlPlaneBaseUrl: options.controlPlaneBaseUrl,
    dataPlaneBaseUrl: options.dataPlaneBaseUrl,
    accessKeyId: options.accessKeyId,
    secretKey: options.secretKey,
    projectName: (options as ProjectScopedOptions).projectName,
    region: options.region,
    timeoutMs: options.timeoutMs
  };
}

export async function printResult(result: unknown): Promise<void> {
  await printOutput(result);
}

const DATASET_TYPE_ALIASES: Record<string, number> = {
  item: 1,
  query: 2,
  video: 3,
  'user-event': 4,
  behavior: 4,
  event: 4,
  doc: 5,
  document: 6
};

const DATASET_FIELD_TYPE_ALIASES: Record<string, number> = {
  string: 1,
  text: 1,
  keyword: 1,
  int32: 2,
  int: 3,
  int64: 3,
  long: 3,
  float: 4,
  double: 4,
  number: 4,
  bool: 5,
  boolean: 5,
  'array<string>': 6,
  'string[]': 6,
  arraystring: 6,
  strings: 6,
  'array<int32>': 7,
  'int32[]': 7,
  arrayint32: 7,
  'array<int64>': 8,
  'int64[]': 8,
  'int[]': 8,
  arrayint64: 8,
  longs: 8,
  'array<float>': 9,
  'float[]': 9,
  'number[]': 9,
  arrayfloat: 9,
  object: 10,
  json: 10,
  'array<object>': 11,
  'object[]': 11,
  arrayobject: 11
};

const DATASET_STATE_LABELS: Record<number, string> = {
  0: 'unknown',
  1: 'init',
  2: 'pending',
  3: 'ready',
  4: 'deleting',
  5: 'deleted'
};

const DATASET_TYPE_LABELS: Record<number, string> = {
  0: 'unknown',
  1: 'item',
  2: 'query',
  3: 'video',
  4: 'user_event',
  5: 'doc',
  6: 'document'
};

const DATASET_FIELD_TYPE_LABELS: Record<number, string> = {
  1: 'string',
  2: 'int32',
  3: 'int64',
  4: 'float',
  5: 'bool',
  6: 'array<string>',
  7: 'array<int32>',
  8: 'array<int64>',
  9: 'array<float>',
  10: 'object',
  11: 'array<object>'
};

const APP_STATE_LABELS: Record<number, string> = {
  0: 'AppInit',
  1: 'AppReady',
  2: 'AppDeleting',
  3: 'AppDeleted',
  4: 'AppNotReady'
};

const APP_DATA_CONFIG_STATE_LABELS: Record<number, string> = {
  0: 'AppDataConfigInit',
  1: 'AppDataConfigInActive',
  2: 'AppDataConfigActive',
  3: 'AppDataConfigUpdating',
  4: 'AppDataConfigActivated',
  5: 'AppDataConfigDeleting',
  6: 'AppDataConfigDeleted',
  7: 'AppDataConfigOffline',
  8: 'AppDataConfigOfflining'
};

const DEFAULT_APPLICATION_INDUSTRY = 1;
const VALID_APPLICATION_INDUSTRIES = new Set([1, 2, 3, 4, 5, 20]);
const APPLICATION_INDUSTRY_ALIASES: Record<string, number> = {
  none: 0,
  ecommerce: 1,
  'e-commerce': 1,
  material: 2,
  video: 3,
  news: 4,
  social: 5,
  'social-platform': 5,
  'social-platforms': 5,
  socialplatform: 5,
  other: 20
};

function normalizeAppCreatePayload(payload: unknown, industry?: string): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  const explicitIndustry = industry ? parseApplicationIndustry(industry, '--industry') : undefined;
  const payloadIndustry = parseApplicationIndustryValue(payload.Industry);

  return {
    ...payload,
    Industry: explicitIndustry ?? payloadIndustry ?? DEFAULT_APPLICATION_INDUSTRY
  };
}

function normalizeAppUpdatePayload(payload: unknown, industry?: string): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  const explicitIndustry = industry ? parseApplicationIndustry(industry, '--industry') : undefined;
  const payloadIndustry = payload.Industry === undefined ? undefined : parseApplicationIndustryValue(payload.Industry);

  return compactObject({
    ...payload,
    Industry: explicitIndustry ?? payloadIndustry
  });
}

function normalizeDatasetPayload(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  const normalized: Record<string, unknown> = { ...payload };

  if (payload.Type !== undefined) {
    normalized.Type = parseDatasetTypeValue(payload.Type);
  }

  if (payload.Schema !== undefined) {
    normalized.Schema = normalizeDatasetSchemaFields(payload.Schema);
  }

  if (isUserEventDatasetType(normalized.Type) && Array.isArray(normalized.Schema)) {
    normalized.Schema = enrichUserEventSchema(normalized.Schema as Array<Record<string, unknown>>);
  }

  return normalized;
}

function normalizeAppDataConfigPayload(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  const normalized: Record<string, unknown> = { ...payload };
  delete normalized.FieldConfig;

  const normalizedConfig = normalizeDataFieldConfig(payload.DataConfig ?? payload.FieldConfig);
  if (normalizedConfig !== undefined) {
    normalized.DataConfig = normalizedConfig;
  }

  if (payload.DatasetType !== undefined) {
    normalized.DatasetType = parseDatasetTypeValue(payload.DatasetType);
  }

  return normalized;
}

function summarizeAppListResponse(response: Record<string, unknown>, options: AppListOptions): Record<string, unknown> {
  const apps = extractAppListEntries(response);
  const requestedName = options.name?.trim().toLowerCase();
  const requestedDatasetId = options.datasetId?.trim();
  const requestedIndustry = options.industry ? parseApplicationIndustry(options.industry, '--industry') : undefined;
  const requestedState = options.state ? parseAppStateValue(options.state) : undefined;
  const filtered = apps.filter(entry => {
    if (requestedName && !String(entry.Name ?? '').toLowerCase().includes(requestedName)) {
      return false;
    }

    if (requestedDatasetId) {
      const itemDatasetIds = asStringArray(entry.ItemDatasetIDs);
      const documentDatasetIds = asStringArray(entry.DocumentDatasetIDs);
      const datasets = asObjectArray(entry.Datasets).map(dataset => String(dataset.DatasetID ?? '')).filter(Boolean);
      const allDatasetIds = new Set([...itemDatasetIds, ...documentDatasetIds, ...datasets]);
      if (!allDatasetIds.has(requestedDatasetId)) {
        return false;
      }
    }

    if (requestedIndustry !== undefined && toInteger(entry.Industry) !== requestedIndustry) {
      return false;
    }

    if (requestedState !== undefined && toInteger(entry.State) !== requestedState) {
      return false;
    }

    return true;
  });

  return {
    ResponseMetadata: response.ResponseMetadata,
    Result: compactObject({
      totalApplications: apps.length,
      returnedApplications: filtered.length,
      filters: compactObject({
        name: options.name?.trim() || undefined,
        datasetId: requestedDatasetId,
        industry: requestedIndustry !== undefined ? formatApplicationIndustryLabel(requestedIndustry) : undefined,
        state: requestedState !== undefined ? formatAppStateLabel(requestedState) : undefined
      }),
      applications: filtered.map(summarizeAppEntry)
    })
  };
}

function extractAppListEntries(response: Record<string, unknown>): Array<Record<string, unknown>> {
  if (!isRecord(response.Result) || !Array.isArray(response.Result.Apps)) {
    return [];
  }

  return response.Result.Apps.filter(isRecord);
}

function summarizeAppEntry(entry: Record<string, unknown>): Record<string, unknown> {
  const itemDatasetIds = asStringArray(entry.ItemDatasetIDs);
  const documentDatasetIds = asStringArray(entry.DocumentDatasetIDs);
  const recommendSceneIds = asStringArray(entry.RecommendSceneIds);
  const appState = toInteger(entry.State);
  const industry = toInteger(entry.Industry);

  return compactObject({
    applicationId: entry.AppID,
    name: entry.Name,
    state: appState !== undefined ? formatAppStateLabel(appState) : undefined,
    stateCode: appState,
    industry: industry !== undefined ? formatApplicationIndustryLabel(industry) : undefined,
    industryCode: industry,
    itemDatasetCount: itemDatasetIds.length,
    documentDatasetCount: documentDatasetIds.length,
    recommendSceneCount: recommendSceneIds.length,
    itemDatasetIds,
    documentDatasetIds,
    recommendSceneIds,
    description: entry.Description,
    language: entry.Language,
    updatedAt: entry.UpdatedAt,
    createdAt: entry.CreatedAt
  });
}

function summarizeDatasetGetResponse(response: Record<string, unknown>): Record<string, unknown> {
  const dataset = isRecord(response.Result) ? response.Result : undefined;
  if (!dataset) {
    throw new Error('GetDataset response is missing Result.');
  }

  return {
    ResponseMetadata: response.ResponseMetadata,
    Result: summarizeDatasetRecord(dataset)
  };
}

function summarizeDatasetRecord(dataset: Record<string, unknown>): Record<string, unknown> {
  const dataFieldConfig = isRecord(dataset.DataFieldConfig) ? dataset.DataFieldConfig : undefined;
  const applications = asObjectArray(dataset.Applications).map(application =>
    compactObject({
      appId: application.AppID,
      name: application.Name
    })
  );

  return compactObject({
    datasetId: dataset.DatasetID,
    name: dataset.Name,
    type: formatDatasetTypeOrUndefined(dataset.Type),
    typeCode: toInteger(dataset.Type),
    state: formatDatasetStateOrUndefined(dataset.State),
    stateCode: toInteger(dataset.State),
    dataNum: dataset.DataNum,
    preProcessedDataNum: dataset.PreProcessedDataNum,
    version: dataset.Version,
    fieldsConfigVersion: dataset.FieldsConfigVersion,
    description: dataset.Description,
    datasetDescription: dataFieldConfig?.DatasetDescription,
    applicationCount: applications.length,
    applications,
    indexFields: asStringArray(dataFieldConfig?.IndexFields),
    filterFields: asStringArray(dataFieldConfig?.FilterFields),
    suggestFields: asStringArray(dataFieldConfig?.SuggestFields),
    imageIndexFields: asStringArray(dataFieldConfig?.ImageIndexFields),
    fields: summarizeDatasetFields(asObjectArray(dataset.Schema), dataFieldConfig),
    updatedAt: dataset.UpdatedAt,
    createdAt: dataset.CreatedAt
  });
}

function summarizeAppDatasetConfigListResponse(response: Record<string, unknown>, applicationId: string): Record<string, unknown> {
  const result = isRecord(response.Result) ? response.Result : undefined;
  const configs = result && Array.isArray(result.Config) ? result.Config.filter(isRecord) : [];
  return {
    ResponseMetadata: response.ResponseMetadata,
    Result: {
      applicationId,
      returnedConfigs: configs.length,
      datasetConfigs: configs.map(config => summarizeAppDatasetConfig(config, false))
    }
  };
}

function summarizeAppDatasetConfigGetResponse(response: Record<string, unknown>, applicationId: string): Record<string, unknown> {
  const result = isRecord(response.Result) ? response.Result : undefined;
  const config = result && isRecord(result.Config) ? result.Config : undefined;
  if (!config) {
    throw new Error('GetAppDataConfig response is missing Result.Config.');
  }

  return {
    ResponseMetadata: response.ResponseMetadata,
    Result: {
      applicationId,
      datasetConfig: summarizeAppDatasetConfig(config, true)
    }
  };
}

function summarizeAppDatasetConfig(config: Record<string, unknown>, includeFields: boolean): Record<string, unknown> {
  const dataset = isRecord(config.Dataset) ? config.Dataset : undefined;
  const dataConfig = isRecord(config.DataConfig) ? config.DataConfig : undefined;
  const schema = asObjectArray(config.Schema);
  const fields = includeFields ? summarizeDatasetFields(schema, dataConfig) : undefined;

  return compactObject({
    datasetId: dataset?.DatasetID,
    datasetName: dataset?.Name,
    datasetType: formatDatasetTypeOrUndefined(dataset?.Type),
    datasetTypeCode: toInteger(dataset?.Type),
    schemaVersion: config.SchemaVersion,
    state: formatAppDataConfigStateOrUndefined(config.State),
    stateCode: toInteger(config.State),
    processedDataNum: config.DatasetProcessedDataNum,
    firstUpdating: config.IsFirstUpdating,
    lastUpdatedTimestamp: config.LastUpdatedTimestamp,
    datasetDescription: dataConfig?.DatasetDescription,
    indexFields: asStringArray(dataConfig?.IndexFields),
    filterFields: asStringArray(dataConfig?.FilterFields),
    suggestFields: asStringArray(dataConfig?.SuggestFields),
    imageIndexFields: asStringArray(dataConfig?.ImageIndexFields),
    fieldDescriptionCount: objectSize(dataConfig?.FieldDescMap),
    fields
  });
}

function summarizeAppOnlineConfigResponse(response: Record<string, unknown>, applicationId: string): Record<string, unknown> {
  const result = isRecord(response.Result) ? response.Result : undefined;
  const config = result && isRecord(result.Config) ? result.Config : undefined;
  const chatConfig = config && isRecord(config.ChatConfig) ? config.ChatConfig : undefined;
  const openingConfig = chatConfig && isRecord(chatConfig.OpeningRemarksConfig) ? chatConfig.OpeningRemarksConfig : undefined;
  const banWords = asStringArray(chatConfig?.BanWords);

  return {
    ResponseMetadata: response.ResponseMetadata,
    Result: compactObject({
      applicationId,
      configDomains: config ? Object.keys(config) : [],
      chat: chatConfig
        ? compactObject({
            searchSceneId: chatConfig.SearchSceneID,
            networkSearchMode: chatConfig.NetworkSearchMode,
            banWordCount: banWords.length,
            hasRoleInfo: hasNonEmptyString(chatConfig.RoleInfo),
            hasAnswerInfo: hasNonEmptyString(chatConfig.AnswerInfo),
            hasFollowUpInfo: hasNonEmptyString(chatConfig.FollowUpInfo),
            openingSuggestionEnabled: openingConfig?.EnableOpeningSuggestion,
            openingSuggestionLimit: openingConfig?.SuggestionLimit,
            openingRecommendEnabled: openingConfig?.EnableRecommend,
            openingRecommendSceneId: openingConfig?.RecommendSceneId
          })
        : undefined
    })
  };
}

function summarizeDatasetFields(schema: Array<Record<string, unknown>>, config?: Record<string, unknown>): Array<Record<string, unknown>> {
  const fieldDescriptions = isRecord(config?.FieldDescMap) ? config.FieldDescMap : undefined;
  const indexFields = new Set(asStringArray(config?.IndexFields));
  const filterFields = new Set(asStringArray(config?.FilterFields));
  const suggestFields = new Set(asStringArray(config?.SuggestFields));
  const imageIndexFields = new Set(asStringArray(config?.ImageIndexFields));

  return schema.map(field => {
    const name = String(field.Name ?? '');
    const roles = [];
    if (readBoolean(field, ['Metadata', 'IsPK'])) roles.push('primary_key');
    if (indexFields.has(name)) roles.push('index');
    if (filterFields.has(name)) roles.push('filter');
    if (suggestFields.has(name)) roles.push('suggest');
    if (imageIndexFields.has(name)) roles.push('image_index');

    const bizAttrCode = toInteger(field.BizAttr);
    const description = fieldDescriptions && typeof fieldDescriptions[name] === 'string' ? String(fieldDescriptions[name]) : undefined;

    return compactObject({
      name,
      type: formatDatasetFieldTypeOrUndefined(field.Type),
      typeCode: toInteger(field.Type),
      description,
      meaning: hasNonEmptyString(field.Meaning) ? String(field.Meaning) : undefined,
      primaryKey: readBoolean(field, ['Metadata', 'IsPK']) || undefined,
      required: typeof field.Required === 'boolean' ? field.Required : undefined,
      readOnly: readBoolean(field, ['Metadata', 'IsReadOnly']) || undefined,
      bizAttrCode: bizAttrCode && bizAttrCode > 0 ? bizAttrCode : undefined,
      roles
    });
  });
}

function summarizeDatasetListResponse(response: Record<string, unknown>, options: DatasetListOptions): Record<string, unknown> {
  const datasets = extractDatasetListEntries(response);
  const requestedType = options.type ? parseDatasetTypeValue(options.type) : undefined;
  const requestedName = options.name?.trim().toLowerCase();
  const requestedApplicationId = options.applicationId?.trim();
  const filtered = datasets.filter(entry => {
    if (requestedType !== undefined && toInteger(entry.Type) !== requestedType) {
      return false;
    }

    if (requestedName && !String(entry.Name ?? '').toLowerCase().includes(requestedName)) {
      return false;
    }

    if (requestedApplicationId) {
      const applications = asObjectArray(entry.Applications);
      if (!applications.some(application => String(application.AppID ?? '') === requestedApplicationId)) {
        return false;
      }
    }

    return true;
  });

  return {
    ResponseMetadata: response.ResponseMetadata,
    Result: compactObject({
      totalDatasets: datasets.length,
      returnedDatasets: filtered.length,
      filters: compactObject({
        type: requestedType !== undefined ? formatDatasetTypeLabel(requestedType) : undefined,
        name: options.name?.trim() || undefined,
        applicationId: requestedApplicationId
      }),
      datasets: filtered.map(summarizeDatasetEntry)
    })
  };
}

function extractDatasetListEntries(response: Record<string, unknown>): Array<Record<string, unknown>> {
  if (!isRecord(response.Result) || !Array.isArray(response.Result.Dataset)) {
    return [];
  }

  return response.Result.Dataset.filter(isRecord);
}

function summarizeDatasetEntry(entry: Record<string, unknown>): Record<string, unknown> {
  const datasetType = toInteger(entry.Type);
  const datasetState = toInteger(entry.State);
  const schema = asObjectArray(entry.Schema);
  const applications = asObjectArray(entry.Applications).map(application =>
    compactObject({
      appId: application.AppID,
      name: application.Name
    })
  );

  return compactObject({
    datasetId: entry.DatasetID,
    name: entry.Name,
    type: datasetType !== undefined ? formatDatasetTypeLabel(datasetType) : undefined,
    typeCode: datasetType,
    state: datasetState !== undefined ? formatDatasetStateLabel(datasetState) : undefined,
    stateCode: datasetState,
    dataNum: entry.DataNum,
    preProcessedDataNum: entry.PreProcessedDataNum,
    fieldCount: schema.length,
    fieldsConfigVersion: entry.FieldsConfigVersion,
    version: entry.Version,
    projectName: entry.ProjectName,
    description: entry.Description,
    applicationCount: applications.length,
    applications,
    updatedAt: entry.UpdatedAt,
    createdAt: entry.CreatedAt
  });
}

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function withProjectName(payload: unknown, projectName: string): unknown {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  const currentProjectName = (payload as Record<string, unknown>).ProjectName;
  if (typeof currentProjectName === 'string' && currentProjectName.trim().length > 0) {
    return payload;
  }
  return {
    ...(payload as Record<string, unknown>),
    ProjectName: projectName
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asObjectArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord);
}

export function toInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  const parsed = parseIntegerLike(value);
  if (parsed !== undefined) {
    return parsed;
  }

  return undefined;
}

function requiredNamedIdPayload(id: string | undefined, kind: string, fieldName: string): Record<string, string> {
  if (!id) {
    throw new Error(`Missing --id for ${kind} command.`);
  }
  return { [fieldName]: id };
}

function requireNonEmptyObject(value: unknown, message: string): void {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length === 0) {
    throw new Error(message);
  }
}

export function validateFieldDescriptions(payload: unknown): void {
  if (!isRecord(payload)) return;
  const fieldConfig = isRecord(payload.DataFieldConfig) ? payload.DataFieldConfig : isRecord(payload.DataConfig) ? payload.DataConfig : undefined;
  if (!fieldConfig) return;
  const fieldDescMap = isRecord(fieldConfig.FieldDescMap) ? fieldConfig.FieldDescMap : undefined;
  if (!fieldDescMap || Object.keys(fieldDescMap).length === 0) {
    throw new Error(
      'DataFieldConfig.FieldDescMap must contain at least one field description. ' +
      'Add field descriptions to improve search quality and data discoverability.'
    );
  }
}

function enrichUserEventSchema(schema: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return schema.map(field => {
    if (!isRecord(field)) return field;
    const name = typeof field.Name === 'string' ? field.Name : undefined;
    if (!name) return field;

    const enriched: Record<string, unknown> = { ...field };

    const bizAttr = getUserEventBizAttr(name);
    if (bizAttr !== undefined && enriched.BizAttr === undefined) {
      enriched.BizAttr = bizAttr;
    }

    if (isUserEventRequiredField(name) && enriched.Required === undefined) {
      enriched.Required = true;
    }

    const forcedType = getUserEventFieldType(name);
    if (forcedType !== undefined) {
      enriched.Type = forcedType;
    }

    if (name === 'event_type' && !Array.isArray(enriched.EnumerateMeta)) {
      enriched.EnumerateMeta = USER_EVENT_TYPE_ENUMERATES;
    }

    return enriched;
  });
}

function validateUserEventSchema(payload: unknown): void {
  if (!isRecord(payload) || !isUserEventDatasetType(payload.Type)) return;
  const schema = Array.isArray(payload.Schema) ? payload.Schema : [];
  const fieldNames = new Set(
    schema
      .filter((f): f is Record<string, unknown> => isRecord(f))
      .map(f => typeof f.Name === 'string' ? f.Name : '')
      .filter(Boolean)
  );
  const missing = [...USER_EVENT_REQUIRED_FIELDS].filter(name => !fieldNames.has(name));
  if (missing.length > 0) {
    throw new Error(
      `User-event (behavior) dataset schema is missing required fields: ${missing.join(', ')}. ` +
      'These fields must be present with correct BizAttr codes for the platform to accept the dataset.'
    );
  }
}

function requireNonEmptyArrayField(value: unknown, fieldName: string, message: string): void {
  if (!isRecord(value) || !Array.isArray(value[fieldName]) || value[fieldName].length === 0) {
    throw new Error(message);
  }
}

function requireRecommendEntryBindingConfirmation(confirmed: boolean | undefined, commandName: string): void {
  if (confirmed) {
    return;
  }
  throw new Error(
    `Real ${commandName} requires an explicit entry-binding confirmation. Confirm the target page or module with the user first, then rerun with --confirm-entry-binding.`
  );
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function objectSize(value: unknown): number {
  return isRecord(value) ? Object.keys(value).length : 0;
}

function readBoolean(value: unknown, path: string[]): boolean {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) {
      return false;
    }
    current = current[key];
  }

  return current === true;
}

function splitCommaList(value?: string): string[] | undefined {
  if (!value) return undefined;
  const values = value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function normalizeDatasetSchemaFields(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map(entry => {
    if (!isRecord(entry)) {
      return entry;
    }

    const normalized: Record<string, unknown> = { ...entry };
    const fieldName = optionalString(entry.Name) ?? optionalString(entry.FieldName);
    const fieldType = entry.Type ?? entry.FieldType;

    delete normalized.FieldName;
    delete normalized.FieldType;

    if (fieldName) {
      normalized.Name = fieldName;
    }

    if (fieldType !== undefined) {
      normalized.Type = parseDatasetFieldTypeValue(fieldType);
    }

    const subFields = entry.Fields ?? entry.SubFields ?? entry.fields ?? entry.subFields;
    if (Array.isArray(subFields)) {
      normalized.Fields = normalizeDatasetSchemaFields(subFields);
      delete normalized.SubFields;
      delete normalized.fields;
      delete normalized.subFields;
    }

    return normalized;
  });
}

function normalizeDataFieldConfig(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const normalized: Record<string, unknown> = { ...value };
  const titleField = optionalString(value.TitleField);
  const indexFields = mergeStringLists(value.IndexFields, value.IndexField, titleField);
  const filterFields = mergeStringLists(value.FilterFields, value.FilterField);
  const suggestFields = mergeStringLists(value.SuggestFields, value.SuggestField);
  const imageIndexFields = mergeStringLists(value.ImageIndexFields, value.ImageFields, value.ImageField);

  delete normalized.TitleField;
  delete normalized.IndexField;
  delete normalized.FilterField;
  delete normalized.SuggestField;
  delete normalized.ImageFields;
  delete normalized.ImageField;

  if (indexFields) {
    normalized.IndexFields = indexFields;
  }
  if (filterFields) {
    normalized.FilterFields = filterFields;
  }
  if (suggestFields) {
    normalized.SuggestFields = suggestFields;
  }
  if (imageIndexFields) {
    normalized.ImageIndexFields = imageIndexFields;
  }

  return normalized;
}

function requiredString(value: unknown, flag: string): string {
  const parsed = optionalString(value);
  if (!parsed) {
    throw new Error(`Missing required flag: ${flag}`);
  }
  return parsed;
}

function parseOptionalInt(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid integer value: ${value}`);
  }
  return parsed;
}

function parseOptionalNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number value: ${value}`);
  }
  return parsed;
}

function parseTuningLabelSource(value?: string): 'llm' | 'source-item' | 'auto' | undefined {
  if (!value) return undefined;
  if (value === 'llm' || value === 'source-item' || value === 'auto') {
    return value;
  }
  throw new Error(`Invalid --label-source value: ${value}`);
}

function parseTuningJudgeInput(value?: string): 'text' | 'text-image' | undefined {
  if (!value) return undefined;
  if (value === 'text' || value === 'text-image') {
    return value;
  }
  throw new Error(`Invalid --judge-input value: ${value}`);
}

function parseTuningOptimizer(value?: string): 'matrix' | 'spa' | undefined {
  if (!value) return undefined;
  if (value === 'matrix' || value === 'spa') {
    return value;
  }
  throw new Error(`Invalid --optimizer value: ${value}`);
}

function parseDatasetTypeValue(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  const parsed = parseIntegerLike(value);
  if (parsed !== undefined && parsed > 0) {
    return parsed;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, '-');
    const alias = DATASET_TYPE_ALIASES[normalized];
    if (alias !== undefined) {
      return alias;
    }
  }

  throw new Error(
    `Invalid dataset Type value: ${String(value)}. Use item|query|video|user-event|behavior|document|image_text or a positive integer enum.`
  );
}

function parseDatasetFieldTypeValue(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  const parsed = parseIntegerLike(value);
  if (parsed !== undefined && parsed > 0) {
    return parsed;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, '');
    const alias = DATASET_FIELD_TYPE_ALIASES[normalized];
    if (alias !== undefined) {
      return alias;
    }
    const literalAlias = DATASET_FIELD_TYPE_ALIASES[value.trim().toLowerCase()];
    if (literalAlias !== undefined) {
      return literalAlias;
    }
  }

  throw new Error(
    `Invalid dataset field Type value: ${String(value)}. Use string|int32|int64|float|bool|array<string>|array<int64>|object|array<object> or an enum integer.`
  );
}

function parseIntegerLike(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseAppStateValue(value: string): number {
  const normalized = value.trim();
  const parsed = Number.parseInt(normalized, 10);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  const lowered = normalized.toLowerCase();
  switch (lowered) {
    case 'ready':
    case 'appready':
      return 1;
    case 'creating':
    case 'appcreating':
      return 2;
    case 'deleting':
    case 'appdeleting':
      return 3;
    case 'not-ready':
    case 'not_ready':
    case 'appnotready':
    case 'notready':
      return 4;
    default:
      throw new Error('Unsupported app state. Use ready|creating|deleting|not-ready or a positive integer enum.');
  }
}

function formatApplicationIndustryLabel(value: number): string {
  switch (value) {
    case 0:
      return 'none';
    case 1:
      return 'ecommerce';
    case 2:
      return 'material';
    case 3:
      return 'video';
    case 4:
      return 'news';
    case 5:
      return 'social-platform';
    case 20:
      return 'other';
    default:
      return `unknown(${value})`;
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(entry => (typeof entry === 'string' ? entry : String(entry ?? '')))
    .filter(entry => entry.length > 0);
}

function mergeStringLists(...sources: unknown[]): string[] | undefined {
  const values: string[] = [];
  for (const source of sources) {
    if (typeof source === 'string') {
      const trimmed = source.trim();
      if (trimmed) {
        values.push(trimmed);
      }
      continue;
    }
    if (Array.isArray(source)) {
      for (const entry of source) {
        if (typeof entry === 'string' && entry.trim()) {
          values.push(entry.trim());
        }
      }
    }
  }

  if (values.length === 0) {
    return undefined;
  }

  return Array.from(new Set(values));
}

function parseApplicationIndustry(value: string, source: string): number {
  const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, '-');
  const alias = APPLICATION_INDUSTRY_ALIASES[normalized];
  if (alias !== undefined) {
    return alias;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isInteger(parsed) && VALID_APPLICATION_INDUSTRIES.has(parsed)) {
    return parsed;
  }

  throw new Error(
    `Invalid ${source} value: ${value}. Use none|ecommerce|material|video|news|social-platform|other or 0/1/2/3/4/5/20.`
  );
}

function parseApplicationIndustryValue(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '' || value === 0 || value === '0') {
    return undefined;
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value) && VALID_APPLICATION_INDUSTRIES.has(value)) {
      return value;
    }
    throw new Error(`Invalid Industry value in payload: ${value}`);
  }

  if (typeof value === 'string') {
    return parseApplicationIndustry(value, 'Industry');
  }

  throw new Error(`Invalid Industry value type in payload: ${typeof value}`);
}

function ensurePositiveInt(value: number, flag: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${flag} value: ${value}. Use a positive integer.`);
  }
  return value;
}

function hasDatasetIdInPayload(payload: unknown): boolean {
  return isRecord(payload) && typeof payload.dataset_id === 'string' && payload.dataset_id.length > 0;
}

function withDatasetIdIfMissing(payload: unknown, datasetId?: string): unknown {
  if (!datasetId || !isRecord(payload) || hasDatasetIdInPayload(payload)) {
    return payload;
  }
  return {
    ...payload,
    dataset_id: datasetId
  };
}

function ensureChatSearchSessionId(payload: unknown, sessionId: string): unknown {
  if (!isRecord(payload) || (typeof payload.session_id === 'string' && payload.session_id.length > 0)) {
    return payload;
  }
  return {
    ...payload,
    session_id: sessionId
  };
}

function isUnsupportedApplicationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /unsupported application/i.test(message);
}

function buildSearchRunError(
  error: unknown,
  snapshot: AppStatusSnapshot | undefined,
  applicationId: string,
  datasetId?: string
): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (!snapshot || !isUnsupportedApplicationError(error)) {
    return error instanceof Error ? error : new Error(message);
  }

  const hints = [
    `Application readiness: state=${snapshot.appState}, phase=${snapshot.phase}, runtimeSearchReady=${String(snapshot.runtimeSearchReady)}`,
    datasetId ? `Dataset used for this request: ${datasetId}` : undefined,
    snapshot.inferredSearchDataset?.datasetId
      ? `Auto-inferred dataset: ${snapshot.inferredSearchDataset.datasetId} (${snapshot.inferredSearchDataset.source})`
      : undefined,
    ...snapshot.reasons.map(reason => `Reason: ${reason}`),
    ...snapshot.nextActions.map(action => `Next: ${action}`),
    `Inspect status: vs app status --application-id ${applicationId}`
  ].filter((line): line is string => Boolean(line));

  return new Error(`${message}\n\n${hints.join('\n')}`);
}

function buildSearchDatasetInferenceError(applicationId: string, snapshot: AppStatusSnapshot): string {
  const activated = [...snapshot.itemDatasetIds, ...snapshot.documentDatasetIds];
  const bound = snapshot.datasets.map(dataset => dataset.datasetId).filter((value): value is string => Boolean(value));
  const configured = snapshot.dataConfigs.map(config => config.datasetId).filter((value): value is string => Boolean(value));
  const candidates = [...new Set([...activated, ...bound, ...configured])];
  const candidateText = candidates.length > 0 ? candidates.join(', ') : '(none)';
  return [
    `Could not infer a unique dataset for application ${applicationId}.`,
    `Pass --dataset-id <dataset>.`,
    `Observed candidate datasets: ${candidateText}`,
    `Inspect current state: vs app status --application-id ${applicationId}`
  ].join('\n');
}

function buildWaitReadyTimeoutMessage(
  snapshot: AppStatusSnapshot | undefined,
  applicationId: string,
  waitedMs: number,
  attempts: number
): string {
  const lines = [
    `Timed out waiting for application ${applicationId} to become runtime-ready after ${waitedMs}ms (${attempts} checks).`
  ];

  if (snapshot) {
    lines.push(`Last observed state: ${snapshot.appState}, phase=${snapshot.phase}, runtimeSearchReady=${String(snapshot.runtimeSearchReady)}`);
    for (const reason of snapshot.reasons) {
      lines.push(`Reason: ${reason}`);
    }
    for (const action of snapshot.nextActions) {
      lines.push(`Next: ${action}`);
    }
  }

  return lines.join('\n');
}

function formatDatasetTypeLabel(value: number): string {
  return DATASET_TYPE_LABELS[value] ?? `unknown(${value})`;
}

function formatDatasetStateLabel(value: number): string {
  return DATASET_STATE_LABELS[value] ?? `unknown(${value})`;
}

function formatAppStateLabel(value: number): string {
  return APP_STATE_LABELS[value] ?? `Unknown(${value})`;
}

function formatAppDataConfigStateOrUndefined(value: unknown): string | undefined {
  const parsed = toInteger(value);
  return parsed !== undefined ? (APP_DATA_CONFIG_STATE_LABELS[parsed] ?? `Unknown(${parsed})`) : undefined;
}

function formatDatasetTypeOrUndefined(value: unknown): string | undefined {
  const parsed = toInteger(value);
  return parsed !== undefined ? formatDatasetTypeLabel(parsed) : undefined;
}

function formatDatasetStateOrUndefined(value: unknown): string | undefined {
  const parsed = toInteger(value);
  return parsed !== undefined ? formatDatasetStateLabel(parsed) : undefined;
}

function formatDatasetFieldTypeOrUndefined(value: unknown): string | undefined {
  const parsed = toInteger(value);
  return parsed !== undefined ? (DATASET_FIELD_TYPE_LABELS[parsed] ?? `unknown(${parsed})`) : undefined;
}
