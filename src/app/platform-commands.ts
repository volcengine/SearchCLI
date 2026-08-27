// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { hasHelpFlag, isDomainHelpRequest, renderUsageBlock } from '../core/help-utils';
import { ApiRequestError } from '../core/http';
import { printOutput } from '../core/output-format';
import type { ServiceConfigInput } from '../core/service-config';
import { runPurchaseOrderStatusCommand } from './product-commands';
import {
  deleteLlmApiCredentialsSync,
  deleteServiceCredentialsSync,
  getCredentialStoreStatus,
  getLlmCredentialStoreStatus,
  loadLlmApiCredentialsSync,
  loadServiceCredentialsSync,
  parseCredentialStoreMode,
  saveLlmApiCredentialsSync,
  saveServiceCredentialsSync,
  type CredentialStoreMode
} from '../core/credential-store';
import {
  configPathExists,
  formatCliConfigEntries,
  getCliProfile,
  loadCliConfig,
  listCliProfiles,
  resolveCliConfigPath,
  resolveActiveCliProfile,
  resolveCliDefaults,
  saveCliConfig,
  setActiveCliProfile,
  setCliConfigValue,
  unsetCliConfigValue,
  upsertCliProfile,
  type ResolvedCliDefaults,
  type VikingCliConfig,
} from '../core/user-config';

export interface PlatformServiceOptions extends ServiceConfigInput {
  data?: string;
}

export interface AuthLoginOptions extends PlatformServiceOptions {
  credentialStore?: CredentialStoreMode;
  noPrompt?: boolean;
  profile?: string;
}

export interface AuthStatusOptions extends PlatformServiceOptions {
  credentialStore?: CredentialStoreMode;
  profile?: string;
}

export interface DoctorOptions extends PlatformServiceOptions {
  credentialStore?: CredentialStoreMode;
  profile?: string;
}

type AuthFailureReason = 'unconfigured' | 'invalid' | 'product-not-enabled' | 'network-error';

type AuthStatusClassification =
  | {
      status: 'ok';
      reason: null;
      reasonDetail: null;
      serviceProbe: { ok: true; detail: string };
    }
  | {
      status: 'failed';
      reason: AuthFailureReason;
      reasonDetail: string;
      serviceProbe: { ok: false; detail: string } | null;
    };

export interface AuthImportEnvOptions extends PlatformServiceOptions {
  credentialStore?: CredentialStoreMode;
  profile?: string;
}

export interface AuthLogoutOptions {
  credentialStore?: CredentialStoreMode;
  profile?: string;
}

export interface LlmLoginOptions extends PlatformServiceOptions {
  credentialStore?: CredentialStoreMode;
  noPrompt?: boolean;
  profile?: string;
  llmProvider?: string;
  llmBaseUrl?: string;
  llmApiKey?: string;
  llmModel?: string;
}

export interface LlmStatusOptions extends PlatformServiceOptions {
  credentialStore?: CredentialStoreMode;
  profile?: string;
}

export interface LlmImportEnvOptions extends PlatformServiceOptions {
  credentialStore?: CredentialStoreMode;
  profile?: string;
}

export interface LlmLogoutOptions {
  credentialStore?: CredentialStoreMode;
  profile?: string;
}

export interface AuthUseOptions {
  profile: string;
}

export async function runAuthLoginCommand(options: AuthLoginOptions): Promise<void> {
  const existingConfig = await loadCliConfig();
  const defaults = resolveCliDefaults({
    baseUrl: options.baseUrl,
    controlPlaneBaseUrl: options.controlPlaneBaseUrl,
    dataPlaneBaseUrl: options.dataPlaneBaseUrl,
    apiKey: options.apiKey,
    accessKeyId: options.accessKeyId,
    secretKey: options.secretKey,
    projectName: options.projectName,
    region: options.region,
    timeoutMs: options.timeoutMs,
    credentialStore: options.credentialStore,
    activeProfile: options.profile
  });
  const projectName = defaults.projectName;
  const selectedProfile = resolveActiveCliProfile(existingConfig, options.profile ?? defaults.activeProfile);
  const interactive = !options.noPrompt && Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const accessKeyId = options.accessKeyId ?? process.env.VIKING_AK ?? (interactive ? await promptText('Viking Access Key ID: ') : undefined);
  const secretKey =
    options.secretKey ?? process.env.VIKING_SK ?? (interactive ? await promptHidden('Viking Secret Access Key: ') : undefined);

  if (!accessKeyId || !secretKey) {
    const guidance = interactive
      ? 'Pass --ak/--sk, set VIKING_AK/VIKING_SK and run `vs auth import-env`, or continue with `vs auth login` in this terminal.'
      : 'The current terminal is not interactive. Set VIKING_AK/VIKING_SK in this shell and run `vs auth import-env`, or rerun `vs auth login` in a real TTY terminal.';
    throw new Error(
      `Missing AK/SK. ${guidance}`
    );
  }

  const persisted = await persistAuthCredentials({
    existingConfig,
    defaults,
    selectedProfile,
    accessKeyId,
    secretKey,
    baseUrl: options.baseUrl,
    controlPlaneBaseUrl: options.controlPlaneBaseUrl,
    dataPlaneBaseUrl: options.dataPlaneBaseUrl,
    projectName,
    region: options.region,
    timeoutMs: options.timeoutMs,
    credentialStore: options.credentialStore
  });

  await printJson({
    ok: true,
    profile: selectedProfile,
    authSource: 'secure-store',
    accessKeyId: maskCredential(accessKeyId),
    baseUrl: persisted.baseUrl,
    controlPlaneBaseUrl: persisted.controlPlaneBaseUrl,
    dataPlaneBaseUrl: persisted.dataPlaneBaseUrl,
    environmentId: persisted.environmentId,
    projectName: persisted.projectName,
    region: persisted.region,
    credentialStore: {
      savedBackend: persisted.savedBackend,
      ...getCredentialStoreStatus(persisted.selectedStore, selectedProfile)
    },
    configPath: persisted.configPath
  });
}

export async function runAuthImportEnvCommand(options: AuthImportEnvOptions): Promise<void> {
  if (options.accessKeyId || options.secretKey) {
    throw new Error('`vs auth import-env` reads VIKING_AK/VIKING_SK from the current shell. Do not pass --ak/--sk.');
  }

  const accessKeyId = process.env.VIKING_AK?.trim();
  const secretKey = process.env.VIKING_SK?.trim();
  if (!accessKeyId || !secretKey) {
    throw new Error('Missing VIKING_AK/VIKING_SK in the current shell. Set them first, then run `vs auth import-env`.');
  }

  const existingConfig = await loadCliConfig();
  const defaults = resolveCliDefaults({
    baseUrl: options.baseUrl,
    controlPlaneBaseUrl: options.controlPlaneBaseUrl,
    dataPlaneBaseUrl: options.dataPlaneBaseUrl,
    projectName: options.projectName,
    region: options.region,
    timeoutMs: options.timeoutMs,
    credentialStore: options.credentialStore,
    activeProfile: options.profile
  });
  const projectName = defaults.projectName;
  const selectedProfile = resolveActiveCliProfile(existingConfig, options.profile ?? defaults.activeProfile);
  const persisted = await persistAuthCredentials({
    existingConfig,
    defaults,
    selectedProfile,
    accessKeyId,
    secretKey,
    baseUrl: options.baseUrl,
    controlPlaneBaseUrl: options.controlPlaneBaseUrl,
    dataPlaneBaseUrl: options.dataPlaneBaseUrl,
    projectName,
    region: options.region,
    timeoutMs: options.timeoutMs,
    credentialStore: options.credentialStore
  });

  const importedKeys = ['VIKING_AK', 'VIKING_SK'];
  if (process.env.VIKING_BASE_URL || options.baseUrl) importedKeys.push('VIKING_BASE_URL');
  if (process.env.VIKING_CONTROL_PLANE_BASE_URL || options.controlPlaneBaseUrl) importedKeys.push('VIKING_CONTROL_PLANE_BASE_URL');
  if (process.env.VIKING_DATA_PLANE_BASE_URL || options.dataPlaneBaseUrl) importedKeys.push('VIKING_DATA_PLANE_BASE_URL');
  if (process.env.VIKING_PROJECT_NAME || options.projectName) importedKeys.push('VIKING_PROJECT_NAME');
  if (process.env.VIKING_REGION || options.region) importedKeys.push('VIKING_REGION');

  await printJson({
    ok: true,
    profile: selectedProfile,
    importedFrom: 'env',
    importedKeys,
    authSource: 'secure-store',
    accessKeyId: maskCredential(accessKeyId),
    baseUrl: persisted.baseUrl,
    controlPlaneBaseUrl: persisted.controlPlaneBaseUrl,
    dataPlaneBaseUrl: persisted.dataPlaneBaseUrl,
    environmentId: persisted.environmentId,
    projectName: persisted.projectName,
    region: persisted.region,
    credentialStore: {
      savedBackend: persisted.savedBackend,
      ...getCredentialStoreStatus(persisted.selectedStore, selectedProfile)
    },
    configPath: persisted.configPath,
    nextSteps: [
      'Unset VIKING_AK/VIKING_SK after import if you do not want secrets to stay in the shell.',
      'Run `vs auth status` and `vs doctor` to verify the secure-store path.'
    ]
  });
}

export async function runLlmLoginCommand(options: LlmLoginOptions): Promise<void> {
  const existingConfig = await loadCliConfig();
  const defaults = resolveCliDefaults({
    timeoutMs: options.timeoutMs,
    credentialStore: options.credentialStore,
    activeProfile: options.profile,
    llmBaseUrl: options.llmBaseUrl,
    llmApiKey: options.llmApiKey,
    llmModel: options.llmModel
  });
  const selectedProfile = resolveActiveCliProfile(existingConfig, options.profile ?? defaults.activeProfile);
  const provider = parseLlmProvider(options.llmProvider ?? process.env.VIKING_LLM_PROVIDER ?? defaults.llmProvider ?? 'openai-compatible');
  const interactive = !options.noPrompt && Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const baseUrl =
    options.llmBaseUrl ??
    optionalEnv('VIKING_LLM_BASE_URL') ??
    defaults.llmBaseUrl ??
    (interactive ? await promptText('LLM Base URL: ') : undefined);
  const model =
    options.llmModel ??
    optionalEnv('VIKING_LLM_MODEL') ??
    defaults.llmModel ??
    (interactive ? await promptText('LLM Model: ') : undefined);
  const apiKey =
    options.llmApiKey ??
    optionalEnv('VIKING_LLM_API_KEY') ??
    (interactive ? await promptHidden('LLM API Key: ') : undefined);

  if (!baseUrl || !model || !apiKey) {
    throw new Error(missingLlmCredentialGuidance(interactive));
  }

  const persisted = await persistLlmCredentials({
    existingConfig,
    defaults,
    selectedProfile,
    provider,
    baseUrl,
    model,
    apiKey,
    credentialStore: options.credentialStore
  });

  await printJson({
    ok: true,
    profile: selectedProfile,
    provider,
    apiKey: maskCredential(apiKey),
    apiKeySource: 'secure-store',
    baseUrl,
    model,
    credentialStore: {
      savedBackend: persisted.savedBackend,
      ...getLlmCredentialStoreStatus(persisted.selectedStore, selectedProfile)
    },
    configPath: persisted.configPath,
    nextSteps: [
      'Run `vs llm status` and `vs search tune llm-check --live` to verify the LLM path.',
      'Do not paste the LLM API key into chat; use `vs llm login` or VIKING_LLM_API_KEY in a real terminal.'
    ]
  });
}

export async function runLlmImportEnvCommand(options: LlmImportEnvOptions): Promise<void> {
  const baseUrl = optionalEnv('VIKING_LLM_BASE_URL');
  const apiKey = optionalEnv('VIKING_LLM_API_KEY');
  const model = optionalEnv('VIKING_LLM_MODEL');
  const provider = parseLlmProvider(process.env.VIKING_LLM_PROVIDER ?? 'openai-compatible');
  if (!baseUrl || !apiKey || !model) {
    throw new Error(
      'Missing VIKING_LLM_BASE_URL/VIKING_LLM_API_KEY/VIKING_LLM_MODEL in the current shell. Set them first, then run `vs llm import-env`.'
    );
  }

  const existingConfig = await loadCliConfig();
  const defaults = resolveCliDefaults({
    timeoutMs: options.timeoutMs,
    credentialStore: options.credentialStore,
    activeProfile: options.profile,
    llmBaseUrl: baseUrl,
    llmApiKey: apiKey,
    llmModel: model
  });
  const selectedProfile = resolveActiveCliProfile(existingConfig, options.profile ?? defaults.activeProfile);
  const persisted = await persistLlmCredentials({
    existingConfig,
    defaults,
    selectedProfile,
    provider,
    baseUrl,
    model,
    apiKey,
    credentialStore: options.credentialStore
  });

  await printJson({
    ok: true,
    profile: selectedProfile,
    provider,
    importedFrom: 'env',
    importedKeys: ['VIKING_LLM_BASE_URL', 'VIKING_LLM_API_KEY', 'VIKING_LLM_MODEL'],
    apiKey: maskCredential(apiKey),
    apiKeySource: 'secure-store',
    baseUrl,
    model,
    credentialStore: {
      savedBackend: persisted.savedBackend,
      ...getLlmCredentialStoreStatus(persisted.selectedStore, selectedProfile)
    },
    configPath: persisted.configPath,
    nextSteps: [
      'Unset VIKING_LLM_API_KEY after import if you do not want the secret to stay in the shell.',
      'Run `vs llm status` and `vs search tune llm-check --live` to verify the LLM path.'
    ]
  });
}

export async function runLlmStatusCommand(options: LlmStatusOptions = {}): Promise<void> {
  const currentConfig = await loadCliConfig();
  const defaults = resolveCliDefaults({
    timeoutMs: options.timeoutMs,
    credentialStore: options.credentialStore,
    activeProfile: options.profile
  });
  let secureStore: ReturnType<typeof loadLlmApiCredentialsSync> = { backend: defaults.resolvedCredentialStoreMode };
  let secureStoreError: string | undefined;
  try {
    secureStore = loadLlmApiCredentialsSync(defaults.credentialStore, defaults.activeProfile);
  } catch (error) {
    secureStoreError = error instanceof Error ? error.message : String(error);
  }
  const envApiKeyConfigured = Boolean(optionalEnv('VIKING_LLM_API_KEY'));
  const legacyConfigApiKeyConfigured = Boolean(currentConfig.llmApiKey);
  const apiKeySource = envApiKeyConfigured
    ? 'env'
    : secureStore.credentials
      ? 'secure-store'
      : legacyConfigApiKeyConfigured
        ? 'config'
        : 'none';
  const credentialStatus = getLlmCredentialStoreStatus(defaults.credentialStore, defaults.activeProfile);

  await printJson({
    configured: Boolean(defaults.llmBaseUrl && defaults.llmModel && defaults.llmApiKey),
    activeProfile: defaults.activeProfile,
    provider: defaults.llmProvider ?? secureStore.credentials?.provider ?? 'openai-compatible',
    baseUrl: defaults.llmBaseUrl ?? null,
    model: defaults.llmModel ?? null,
    apiKeyConfigured: Boolean(defaults.llmApiKey),
    apiKeySource,
    credentialStore: {
      ...credentialStatus,
      resolvedMode: secureStore.backend ?? credentialStatus.resolvedMode,
      secureStoreConfigured: Boolean(secureStore.credentials),
      error: secureStoreError
    },
    configPath: resolveCliConfigPath(),
    warnings: legacyConfigApiKeyConfigured
      ? ['llm-api-key is present in config.json. Prefer `vs llm login` or `vs llm import-env` so the API key is stored in the secure credential store.']
      : []
  });
}

export async function runLlmLogoutCommand(options: LlmLogoutOptions): Promise<void> {
  const defaults = resolveCliDefaults({
    credentialStore: options.credentialStore,
    activeProfile: options.profile
  });
  const result = deleteLlmApiCredentialsSync(defaults.credentialStore, defaults.activeProfile);
  await printJson({
    ok: true,
    profile: defaults.activeProfile,
    deleted: result.deleted,
    backends: result.backends
  });
}

export async function runAuthStatusCommand(options: AuthStatusOptions = {}): Promise<void> {
  const currentConfig = await loadCliConfig();
  const defaults = resolveCliDefaults({
    baseUrl: options.baseUrl,
    controlPlaneBaseUrl: options.controlPlaneBaseUrl,
    dataPlaneBaseUrl: options.dataPlaneBaseUrl,
    accessKeyId: options.accessKeyId,
    secretKey: options.secretKey,
    projectName: options.projectName,
    region: options.region,
    timeoutMs: options.timeoutMs,
    credentialStore: options.credentialStore,
    activeProfile: options.profile
  });
  let secureStore: ReturnType<typeof loadServiceCredentialsSync> = { backend: defaults.resolvedCredentialStoreMode };
  let secureStoreError: string | undefined;
  try {
    secureStore = loadServiceCredentialsSync(defaults.credentialStore, defaults.activeProfile);
  } catch (error) {
    secureStoreError = error instanceof Error ? error.message : String(error);
  }
  const status = getCredentialStoreStatus(defaults.credentialStore, defaults.activeProfile);
  const authClassification = await classifyAuthStatus(defaults);

  await printJson({
    loggedIn: authClassification.status === 'ok',
    status: authClassification.status,
    reason: authClassification.reason,
    reasonDetail: authClassification.reasonDetail,
    serviceProbe: authClassification.serviceProbe,
    recovery: recoveryForAuthStatus(authClassification.reason),
    activeProfile: defaults.activeProfile,
    source: defaults.authSource,
    apiKeyConfigured: Boolean(defaults.apiKey),
    accessKeyId: defaults.accessKeyId ? maskCredential(defaults.accessKeyId) : null,
    baseUrl: defaults.baseUrl,
    controlPlaneBaseUrl: defaults.controlPlaneBaseUrl,
    dataPlaneBaseUrl: defaults.dataPlaneBaseUrl,
    environmentId: defaults.environmentId,
    projectName: defaults.projectName,
    region: defaults.region,
    profileConfig: getCliProfile(currentConfig, defaults.activeProfile) ?? null,
    credentialStore: {
      preferredMode: defaults.credentialStore,
      activeBackend: secureStore.backend,
      keychainSupported: status.keychainSupported,
      credentialPath: status.credentialPath,
      masterKeyPath: status.masterKeyPath,
      secureStoreConfigured: Boolean(secureStore.credentials),
      error: secureStoreError ?? null
    },
    env: {
      hasAk: Boolean(process.env.VIKING_AK),
      hasSk: Boolean(process.env.VIKING_SK)
    },
    profiles: listCliProfiles(currentConfig).map(entry => ({
      name: entry.name,
      active: entry.active,
      baseUrl: entry.config.baseUrl ?? null,
      controlPlaneBaseUrl: entry.config.controlPlaneBaseUrl ?? null,
      dataPlaneBaseUrl: entry.config.dataPlaneBaseUrl ?? null,
      environmentId: entry.config.environmentId ?? null,
      projectName: entry.config.projectName ?? currentConfig.projectName ?? defaults.projectName,
      region: entry.config.region ?? null,
      credentialStore: entry.config.credentialStore ?? currentConfig.credentialStore ?? 'auto'
    }))
  });
}

async function classifyAuthStatus(defaults: ResolvedCliDefaults): Promise<AuthStatusClassification> {
  if (defaults.apiKey && (!defaults.accessKeyId || !defaults.secretKey)) {
    return {
      status: 'ok',
      reason: null,
      reasonDetail: null,
      serviceProbe: {
        ok: true,
        detail: 'API key configured for runtime access; AK/SK billing probe skipped.'
      }
    };
  }

  if (!defaults.accessKeyId || !defaults.secretKey) {
    return {
      status: 'failed',
      reason: 'unconfigured',
      reasonDetail: 'No AK/SK is configured for the active profile.',
      serviceProbe: null
    };
  }

  try {
    await runPurchaseOrderStatusCommand({
      controlPlaneBaseUrl: defaults.controlPlaneBaseUrl,
      dataPlaneBaseUrl: defaults.dataPlaneBaseUrl,
      accessKeyId: defaults.accessKeyId,
      secretKey: defaults.secretKey,
      projectName: defaults.projectName,
      region: defaults.region,
      timeoutMs: Math.min(defaults.timeoutMs, 5000),
      suppressOutput: true
    });
    return {
      status: 'ok',
      reason: null,
      reasonDetail: null,
      serviceProbe: { ok: true, detail: `GetBillingOrder succeeded (project=${defaults.projectName})` }
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message.split('\n')[0] : String(error);
    return {
      status: 'failed',
      reason: classifyAuthProbeFailure(error),
      reasonDetail: detail,
      serviceProbe: { ok: false, detail }
    };
  }
}

function classifyAuthProbeFailure(error: unknown): AuthFailureReason {
  if (isNetworkProbeError(error)) {
    return 'network-error';
  }

  if (error instanceof ApiRequestError) {
    return classifyConsoleApiError(error);
  }

  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes('invalidaccesskey') ||
    normalized.includes('signature') ||
    normalized.includes('authfailure') ||
    normalized.includes('unauthorized') ||
    normalized.includes('request failed: 401')
  ) {
    return 'invalid';
  }

  if (
    normalized.includes('product-not-enabled') ||
    normalized.includes('product not enabled') ||
    normalized.includes('not enabled') ||
    normalized.includes('not open') ||
    normalized.includes('not activated') ||
    normalized.includes('not purchased') ||
    normalized.includes('not subscribed') ||
    normalized.includes('nopermission') ||
    normalized.includes('no permission') ||
    normalized.includes('forbidden') ||
    normalized.includes('request failed: 403')
  ) {
    return 'product-not-enabled';
  }

  return 'invalid';
}

function classifyConsoleApiError(error: ApiRequestError): AuthFailureReason {
  const code = error.apiCode?.toLowerCase();

  if (error.statusCode === 401 || (code && AUTH_INVALID_API_CODES.has(code))) {
    return 'invalid';
  }

  if (code && PRODUCT_NOT_ENABLED_API_CODES.has(code)) {
    return 'product-not-enabled';
  }

  if (error.statusCode === 403) {
    return 'product-not-enabled';
  }

  return 'invalid';
}

function isNetworkProbeError(error: unknown): boolean {
  if (error instanceof ApiRequestError) return false;
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes('aborterror') ||
    normalized.includes('timeout') ||
    normalized.includes('network') ||
    normalized.includes('fetch failed') ||
    normalized.includes('econnreset') ||
    normalized.includes('econnrefused') ||
    normalized.includes('etimedout') ||
    normalized.includes('enotfound') ||
    normalized.includes('eai_again')
  );
}

const AUTH_INVALID_API_CODES = new Set([
  'authfailure',
  'authfailure.signaturemismatch',
  'authfailure.signaturemismatched',
  'authfailure.invalidaccesskey',
  'authfailure.invalidaccesskeyid',
  'authfailure.missingauthenticationtoken',
  'invalidaccesskey',
  'invalidaccesskeyid',
  'invalidsecretkey',
  'signaturedoesnotmatch',
  'signaturemismatch',
  'unauthorized'
]);

const PRODUCT_NOT_ENABLED_API_CODES = new Set([
  // Returned by GetBillingOrder or account/billing state checks when the product instance is missing or inaccessible.
  'accessdenied',
  'resourcenotfound.instance',
  'resourcenotfound.prepostinstance',
  // Returned by CheckAccountAndBillingStateMiddleware when account or billing state is not enabled.
  'operationdenied.statenotenable'
]);

function recoveryForAuthStatus(reason: AuthFailureReason | null): string[] {
  switch (reason) {
    case null:
      return ['Run `vs doctor --json` for a full local readiness check.'];
    case 'unconfigured':
      return [
        'If you already have AK/SK, run `vs auth login` or set VIKING_AK/VIKING_SK and run `vs auth import-env`.',
        'If you are new to Viking AI Search, run `vs skill show vs-user-onboarding`.'
      ];
    case 'invalid':
      return ['Check whether the AK/SK is expired, deleted, mistyped, or belongs to the selected region, then rerun `vs auth login` or `vs auth import-env`.'];
    case 'product-not-enabled':
      return ['The credentials appear usable, but Viking AI Search may not be enabled for this account. Run `vs skill show vs-user-onboarding` for purchase onboarding.'];
    case 'network-error':
      return ['Check network connectivity, proxy, DNS, and endpoint configuration, then rerun `vs auth status --json`.'];
  }
}

export async function runAuthLogoutCommand(options: AuthLogoutOptions = {}): Promise<void> {
  const currentConfig = await loadCliConfig();
  const activeProfile = resolveActiveCliProfile(currentConfig, options.profile);
  const profileConfig = getCliProfile(currentConfig, activeProfile);
  const credentialStore = parseCredentialStoreMode(
    options.credentialStore ?? profileConfig?.credentialStore ?? currentConfig.credentialStore ?? process.env.VIKING_CREDENTIALS_STORE ?? 'auto'
  );
  const deletion = deleteServiceCredentialsSync(credentialStore, activeProfile);

  await printJson({
    ok: true,
    profile: activeProfile,
    deleted: deletion.deleted,
    backends: deletion.backends,
    envStillConfigured: Boolean(process.env.VIKING_AK || process.env.VIKING_SK)
  });
}

export async function runAuthUseCommand(options: AuthUseOptions): Promise<void> {
  const currentConfig = await loadCliConfig();
  const nextConfig = setActiveCliProfile(currentConfig, options.profile);
  const configPath = await saveCliConfig(nextConfig);
  await printJson({
    ok: true,
    activeProfile: resolveActiveCliProfile(nextConfig),
    configPath
  });
}

export async function runAuthListCommand(): Promise<void> {
  const currentConfig = await loadCliConfig();
  const profiles = listCliProfiles(currentConfig).map(entry => {
    const preferredMode = parseCredentialStoreMode(entry.config.credentialStore ?? currentConfig.credentialStore ?? 'auto');
    let hasCredentials = false;
    let backend: string | undefined;
    try {
      const lookup = loadServiceCredentialsSync(preferredMode, entry.name);
      hasCredentials = Boolean(lookup.credentials);
      backend = lookup.backend;
    } catch {
      hasCredentials = false;
    }
    return {
      name: entry.name,
      active: entry.active,
      baseUrl: entry.config.baseUrl ?? null,
      controlPlaneBaseUrl: entry.config.controlPlaneBaseUrl ?? null,
      dataPlaneBaseUrl: entry.config.dataPlaneBaseUrl ?? null,
      environmentId: entry.config.environmentId ?? null,
      region: entry.config.region ?? null,
      credentialStore: preferredMode,
      resolvedBackend: backend ?? getCredentialStoreStatus(preferredMode, entry.name).resolvedMode,
      hasCredentials
    };
  });
  await printJson({
    activeProfile: resolveActiveCliProfile(currentConfig),
    profiles
  });
}

export async function runDoctorCommand(options: DoctorOptions = {}): Promise<void> {
  const config = await loadCliConfig();
  const resolved = resolveCliDefaults({
    baseUrl: options.baseUrl,
    controlPlaneBaseUrl: options.controlPlaneBaseUrl,
    dataPlaneBaseUrl: options.dataPlaneBaseUrl,
    apiKey: options.apiKey,
    accessKeyId: options.accessKeyId,
    secretKey: options.secretKey,
    projectName: options.projectName,
    region: options.region,
    timeoutMs: options.timeoutMs,
    credentialStore: options.credentialStore,
    activeProfile: options.profile
  });
  const credentialStatus = getCredentialStoreStatus(resolved.credentialStore, resolved.activeProfile);
  const llmConfigured = Boolean(
    resolved.llmBaseUrl &&
    resolved.llmModel &&
    ((resolved.llmAccessKeyId && resolved.llmSecretKey) || resolved.llmApiKey)
  );
  const checks = [
    {
      name: 'config_file',
      ok: configPathExists(),
      detail: resolveCliConfigPath()
    },
    {
      name: 'service_auth',
      ok: Boolean(resolved.apiKey || (resolved.accessKeyId && resolved.secretKey)),
      detail:
        resolved.apiKey
          ? `API key configured via ${resolved.authSource}`
          : resolved.accessKeyId && resolved.secretKey
          ? `AK/SK configured via ${resolved.authSource}`
          : 'missing AK/SK'
    },
    {
      name: 'llm',
      ok: llmConfigured,
      detail: llmConfigured ? `${resolved.llmModel} via ${resolved.llmProvider ?? 'openai-compatible'}` : 'LLM not configured; run `vs llm login` or `vs llm import-env`'
    },
    {
      name: 'git',
      ok: commandExists('git'),
      detail: commandExists('git') ? 'found' : 'missing'
    },
    {
      name: 'rg',
      ok: commandExists('rg'),
      detail: commandExists('rg') ? 'found' : 'missing'
    }
  ];

  let auth: { ok: boolean; detail: string } | undefined;
  if (resolved.accessKeyId && resolved.secretKey) {
    try {
      await runPurchaseOrderStatusCommand({
        controlPlaneBaseUrl: resolved.controlPlaneBaseUrl,
        dataPlaneBaseUrl: resolved.dataPlaneBaseUrl,
        accessKeyId: resolved.accessKeyId,
        secretKey: resolved.secretKey,
        projectName: resolved.projectName,
        region: resolved.region,
        timeoutMs: Math.min(resolved.timeoutMs, 5000),
        suppressOutput: true
      });
      auth = { ok: true, detail: `GetBillingOrder succeeded (project=${resolved.projectName})` };
    } catch (error) {
      auth = {
        ok: false,
        detail: error instanceof Error ? error.message.split('\n')[0] : String(error)
      };
    }
  } else if (resolved.apiKey) {
    auth = { ok: true, detail: 'API key configured for runtime access; billing/order probe skipped.' };
  }

  const ok = checks.every(check => check.ok) && (auth?.ok ?? true);
  await printJson({
    ok,
    configPath: resolveCliConfigPath(),
    resolved: {
      baseUrl: resolved.baseUrl,
      controlPlaneBaseUrl: resolved.controlPlaneBaseUrl,
      dataPlaneBaseUrl: resolved.dataPlaneBaseUrl,
      environmentId: resolved.environmentId,
      projectName: resolved.projectName,
      region: resolved.region,
      authSource: resolved.authSource,
      credentialStore: resolved.credentialStore,
      resolvedCredentialStoreMode: resolved.resolvedCredentialStoreMode,
      timeoutMs: resolved.timeoutMs,
      pageSize: resolved.defaultPageSize,
      outputDir: resolved.outputDir,
      sessionDir: resolved.sessionDir
    },
    credentialStore: {
      ...credentialStatus,
      resolvedMode: resolved.resolvedCredentialStoreMode
    },
    configuredKeys: formatCliConfigEntries(config, false),
    checks,
    auth
  });
}

export async function runPlatformDomainFromArgv(domain: string, argv: string[]): Promise<boolean> {
  switch (domain) {
    case 'auth':
      await runAuthCli(argv);
      return true;
    case 'profile':
      printProfileRedirectHelp(argv);
      return true;
    case 'llm':
      await runLlmCli(argv);
      return true;
    case 'doctor':
      await runDoctorCli(argv);
      return true;
    default:
      return false;
  }
}

// `profile` is not a command; credential profiles live under `vs auth`.
// Guide users (and agents) to the real entry points instead of a bare
// "Unknown command" error.
function printProfileRedirectHelp(argv: string[]): void {
  const sub = argv[0];
  const mapped: Record<string, string> = {
    list: 'vs auth list',
    ls: 'vs auth list',
    status: 'vs auth status',
    show: 'vs auth status',
    use: 'vs auth use <profile>',
    switch: 'vs auth use <profile>',
    add: 'vs auth login',
    login: 'vs auth login',
    create: 'vs auth login',
    remove: 'vs auth logout',
    delete: 'vs auth logout',
    logout: 'vs auth logout'
  };
  const suggestion = sub ? mapped[sub.toLowerCase()] : undefined;
  const lines = [
    "`vs profile` is not a command. Credential profiles are managed under `vs auth`."
  ];
  if (suggestion) {
    lines.push(`Did you mean: ${suggestion}`);
  }
  lines.push('Common commands:');
  lines.push('  vs auth list             List configured profiles');
  lines.push('  vs auth status           Show the active profile and its config');
  lines.push('  vs auth use <profile>    Switch the active profile');
  lines.push('  vs auth login            Add or update a profile');
  lines.push('Run `vs auth --help` for details.');
  console.error(lines.join('\n'));
  process.exitCode = 1;
}

export function printPlatformDomainsHelp(): void {
  const publicLines = [
    'vs auth login|import-env|status|logout|list|use',
    'vs llm login|import-env|status|logout',
    'vs doctor'
  ];
  console.log(['PLATFORM COMMANDS', renderUsageBlock(publicLines)].join('\n'));
}

function printDomainHelp(domain: string): void {
  const helpByDomain: Record<string, string> = {
    auth: renderUsageBlock(
      [
        'vs auth login [--profile <name>] [--ak <ak>] [--sk <sk>] [--base-url <url>] [--control-plane-base-url <url>] [--data-plane-base-url <url>] [--region <region>] [--store auto|keychain|file|ephemeral] [--no-prompt] [--format <format>]',
        'vs auth import-env [--profile <name>] [--base-url <url>] [--control-plane-base-url <url>] [--data-plane-base-url <url>] [--region <region>] [--store auto|keychain|file|ephemeral] [--format <format>]',
        'vs auth status [--profile <name>] [--format <format>]',
        'vs auth logout [--profile <name>] [--store auto|keychain|file|ephemeral] [--format <format>]',
        'vs auth list [--format <format>]',
        'vs auth use <profile> [--format <format>]'
      ]
    ),
    llm: renderUsageBlock(
      [
        'vs llm login [--provider openai-compatible] [--base-url <url>] [--model <model>] [--api-key <key>] [--profile <name>] [--store auto|keychain|file|ephemeral] [--no-prompt] [--format <format>]',
        'vs llm import-env [--profile <name>] [--store auto|keychain|file|ephemeral] [--format <format>]',
        'vs llm status [--profile <name>] [--format <format>]',
        'vs llm logout [--profile <name>] [--store auto|keychain|file|ephemeral] [--format <format>]'
      ]
    ),
    doctor: `USAGE
  vs doctor [--project-name <name>] [--region <region>] [--base-url <url>] [--control-plane-base-url <url>] [--data-plane-base-url <url>] [--ak <id>] [--sk <secret>] [--timeout-ms <ms>] [--profile <name>] [--store auto|keychain|file|ephemeral] [--format <format>] [--jq <selector>] [--output <path>]`
  };

  console.log(helpByDomain[domain] ?? `Unknown domain: ${domain}`);
}

async function runAuthCli(argv: string[]): Promise<void> {
  const action = argv[0];
  if (isDomainHelpRequest(argv)) {
    printDomainHelp('auth');
    return;
  }
  switch (action) {
    case 'login': {
      const options = parseStandaloneAuthOptions(argv.slice(1));
      await runAuthLoginCommand(options);
      return;
    }
    case 'import-env': {
      const options = parseStandaloneAuthOptions(argv.slice(1));
      await runAuthImportEnvCommand(options);
      return;
    }
    case 'status':
      await runAuthStatusCommand(parseStandaloneAuthOptions(argv.slice(1)));
      return;
    case 'list':
      await runAuthListCommand();
      return;
    case 'use':
      await runAuthUseCommand({
        profile: requiredPositional(parseStandaloneAuthOptions(argv.slice(1)).positionals, 0, 'profile')
      });
      return;
    case 'logout': {
      const options = parseStandaloneAuthOptions(argv.slice(1));
      await runAuthLogoutCommand({
        credentialStore: options.credentialStore,
        profile: options.profile
      });
      return;
    }
    default:
      throw new Error(`Unknown auth subcommand: ${action}`);
  }
}

async function runLlmCli(argv: string[]): Promise<void> {
  const action = argv[0];
  if (isDomainHelpRequest(argv)) {
    printDomainHelp('llm');
    return;
  }
  switch (action) {
    case 'login':
      await runLlmLoginCommand(parseStandaloneLlmOptions(argv.slice(1)));
      return;
    case 'import-env':
      await runLlmImportEnvCommand(parseStandaloneLlmOptions(argv.slice(1)));
      return;
    case 'status':
      await runLlmStatusCommand(parseStandaloneLlmOptions(argv.slice(1)));
      return;
    case 'logout': {
      const options = parseStandaloneLlmOptions(argv.slice(1));
      await runLlmLogoutCommand({
        credentialStore: options.credentialStore,
        profile: options.profile
      });
      return;
    }
    default:
      throw new Error(`Unknown llm subcommand: ${action}`);
  }
}

async function runDoctorCli(argv: string[]): Promise<void> {
  if (hasHelpFlag(argv)) {
    printDomainHelp('doctor');
    return;
  }
  await runDoctorCommand(parseStandaloneAuthOptions(argv));
}
function parseStandaloneAuthOptions(argv: string[]): AuthLoginOptions & { positionals: string[] } {
  const { values, positionals } = parseArgs({
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
      'base-url': { type: 'string' },
      'control-plane-base-url': { type: 'string' },
      'data-plane-base-url': { type: 'string' },
      'project-name': { type: 'string' },
      'api-key': { type: 'string' },
      ak: { type: 'string' },
      sk: { type: 'string' },
      region: { type: 'string' },
      store: { type: 'string' },
      profile: { type: 'string' },
      'no-prompt': { type: 'boolean' }
    }
  });

  return {
    positionals,
    baseUrl: optionalString(values['base-url']),
    controlPlaneBaseUrl: optionalString(values['control-plane-base-url']),
    dataPlaneBaseUrl: optionalString(values['data-plane-base-url']),
    apiKey: optionalString(values['api-key']),
    accessKeyId: optionalString(values.ak),
    secretKey: optionalString(values.sk),
    projectName: optionalString(values['project-name']),
    region: optionalString(values.region),
    profile: optionalString(values.profile),
    credentialStore: optionalString(values.store) ? parseCredentialStoreMode(String(values.store)) : undefined,
    noPrompt: Boolean(values['no-prompt'])
  };
}

function parseStandaloneLlmOptions(argv: string[]): LlmLoginOptions & { positionals: string[] } {
  const { values, positionals } = parseArgs({
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
      provider: { type: 'string' },
      'base-url': { type: 'string' },
      model: { type: 'string' },
      'api-key': { type: 'string' },
      store: { type: 'string' },
      profile: { type: 'string' },
      'no-prompt': { type: 'boolean' }
    }
  });

  return {
    positionals,
    llmProvider: optionalString(values.provider),
    llmBaseUrl: optionalString(values['base-url']),
    llmModel: optionalString(values.model),
    llmApiKey: optionalString(values['api-key']),
    profile: optionalString(values.profile),
    credentialStore: optionalString(values.store) ? parseCredentialStoreMode(String(values.store)) : undefined,
    noPrompt: Boolean(values['no-prompt'])
  };
}

function commandExists(command: string): boolean {
  const checker = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(checker, [command], {
    stdio: 'ignore'
  });
  return result.status === 0;
}

function requiredPositional(positionals: string[], index: number, label: string): string {
  const value = positionals[index];
  if (!value) {
    throw new Error(`Missing required argument: ${label}`);
  }
  return value;
}

function optionalString(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseLlmProvider(value: string): 'openai-compatible' {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'openai-compatible') return 'openai-compatible';
  throw new Error(`Unsupported LLM provider: ${value}. First version supports only openai-compatible.`);
}

function missingLlmCredentialGuidance(interactive: boolean): string {
  const envGuidance = 'Set VIKING_LLM_BASE_URL, VIKING_LLM_API_KEY, and VIKING_LLM_MODEL in this shell, then run `vs llm import-env`.';
  if (interactive) {
    return `Missing LLM Base URL, model, or API key. Continue with \`vs llm login\`, pass --base-url/--model/--api-key, or ${envGuidance}`;
  }
  return `Missing LLM Base URL, model, or API key. The current terminal is not interactive. ${envGuidance}`;
}

async function persistAuthCredentials(options: {
  existingConfig: VikingCliConfig;
  defaults: ResolvedCliDefaults;
  selectedProfile: string;
  accessKeyId: string;
  secretKey: string;
  baseUrl?: string;
  controlPlaneBaseUrl?: string;
  dataPlaneBaseUrl?: string;
  projectName?: string;
  region?: string;
  timeoutMs?: number;
  credentialStore?: CredentialStoreMode;
}): Promise<{
  selectedStore: CredentialStoreMode;
  savedBackend: ReturnType<typeof saveServiceCredentialsSync>;
  configPath: string;
  baseUrl: string;
  controlPlaneBaseUrl: string;
  dataPlaneBaseUrl: string;
  environmentId?: string;
  projectName: string;
  region: string;
}> {
  const selectedStore = parseCredentialStoreMode(options.credentialStore ?? options.defaults.credentialStore);
  const savedBackend = saveServiceCredentialsSync(
    {
      accessKeyId: options.accessKeyId,
      secretKey: options.secretKey,
      updatedAt: new Date().toISOString()
    },
    selectedStore,
    options.selectedProfile
  );

  const controlPlaneBaseUrl = options.controlPlaneBaseUrl ?? options.defaults.controlPlaneBaseUrl;
  const dataPlaneBaseUrl = options.dataPlaneBaseUrl ?? options.defaults.dataPlaneBaseUrl;
  const environmentId = options.defaults.environmentId;
  const baseUrl = options.baseUrl ?? options.defaults.baseUrl;
  const projectName = options.projectName ?? options.defaults.projectName;
  const region = options.region ?? options.defaults.region;

  let nextConfig = setActiveCliProfile(options.existingConfig, options.selectedProfile);
  nextConfig = upsertCliProfile(nextConfig, options.selectedProfile, {
    baseUrl,
    controlPlaneBaseUrl,
    dataPlaneBaseUrl,
    environmentId,
    projectName,
    region,
    credentialStore: selectedStore,
    timeoutMs: options.timeoutMs ?? options.defaults.timeoutMs
  });

  if (options.existingConfig.credentialStore !== selectedStore) {
    nextConfig = setCliConfigValue(nextConfig, 'credentials-store', selectedStore);
  }

  const configPath = await saveCliConfig(nextConfig);
  return {
    selectedStore,
    savedBackend,
    configPath,
    baseUrl,
    controlPlaneBaseUrl,
    dataPlaneBaseUrl,
    environmentId,
    projectName,
    region
  };
}

async function persistLlmCredentials(options: {
  existingConfig: VikingCliConfig;
  defaults: ResolvedCliDefaults;
  selectedProfile: string;
  provider: 'openai-compatible';
  baseUrl: string;
  model: string;
  apiKey: string;
  credentialStore?: CredentialStoreMode;
}): Promise<{
  selectedStore: CredentialStoreMode;
  savedBackend: ReturnType<typeof saveLlmApiCredentialsSync>;
  configPath: string;
}> {
  const selectedStore = parseCredentialStoreMode(options.credentialStore ?? options.defaults.credentialStore);
  const savedBackend = saveLlmApiCredentialsSync(
    {
      provider: options.provider,
      apiKey: options.apiKey,
      updatedAt: new Date().toISOString()
    },
    selectedStore,
    options.selectedProfile
  );

  let nextConfig = setActiveCliProfile(options.existingConfig, options.selectedProfile);
  nextConfig = setCliConfigValue(nextConfig, 'llm-provider', options.provider);
  nextConfig = setCliConfigValue(nextConfig, 'llm-base-url', options.baseUrl);
  nextConfig = setCliConfigValue(nextConfig, 'llm-model', options.model);
  if (options.existingConfig.credentialStore !== selectedStore) {
    nextConfig = setCliConfigValue(nextConfig, 'credentials-store', selectedStore);
  }
  if ('llmApiKey' in nextConfig) {
    nextConfig = unsetCliConfigValue(nextConfig, 'llm-api-key');
  }

  const configPath = await saveCliConfig(nextConfig);
  return {
    selectedStore,
    savedBackend,
    configPath
  };
}

async function printJson(value: unknown): Promise<void> {
  await printOutput(value);
}

async function promptText(label: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const value = (await rl.question(label)).trim();
    if (!value) {
      throw new Error('Input cannot be empty.');
    }
    return value;
  } finally {
    rl.close();
  }
}

async function promptHidden(label: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return promptText(label);
  }

  return new Promise<string>((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    const wasRaw = stdin.isRaw;
    let buffer = '';

    const cleanup = () => {
      stdin.off('data', onData);
      if (stdin.isTTY) {
        stdin.setRawMode(Boolean(wasRaw));
      }
      stdin.pause();
    };

    const finish = (value: string) => {
      stdout.write('\n');
      cleanup();
      if (!value.trim()) {
        reject(new Error('Input cannot be empty.'));
        return;
      }
      resolve(value.trim());
    };

    const onData = (chunk: Buffer) => {
      const value = chunk.toString('utf8');
      if (value === '\u0003') {
        stdout.write('\n');
        cleanup();
        reject(new Error('Cancelled.'));
        return;
      }
      if (value === '\r' || value === '\n') {
        finish(buffer);
        return;
      }
      if (value === '\u0008' || value === '\u007f') {
        buffer = buffer.slice(0, -1);
        return;
      }
      buffer += value;
    };

    stdout.write(label);
    stdin.resume();
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.on('data', onData);
  });
}

function maskCredential(value: string): string {
  if (value.length <= 8) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 4)}***${value.slice(-2)}`;
}
