// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import {
  DEFAULT_CREDENTIAL_PROFILE,
  getCredentialStoreStatus,
  loadServiceCredentialsSync,
  resolveCredentialStoreMode,
  credentialStoreModeSchema,
  type CredentialStoreBackend,
  type CredentialStoreMode
} from './credential-store';
import { ensureDir, writeJson } from './files';

const DEFAULT_BASE_URL = 'https://aisearch.cn-beijing.volces.com';
const DEFAULT_REGION = 'cn-beijing';
const DEFAULT_SERVICE = 'aisearch';
const DEFAULT_PROJECT_NAME = 'default';
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_OUTPUT_DIR = '.viking/reports';
const DEFAULT_SESSION_DIR = '.viking/sessions';
const DEFAULT_LLM_BASE_URL = 'https://ark.cn-beijing.volces.com/api/coding/v3';
const DEFAULT_LLM_REGION = 'cn-beijing';
const DEFAULT_LLM_SERVICE = 'ark';
export const DEFAULT_AUTH_PROFILE = DEFAULT_CREDENTIAL_PROFILE;

const cliProfileSchema = z.object({
  baseUrl: z.string().url().optional(),
  projectName: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  credentialStore: credentialStoreModeSchema.optional(),
  timeoutMs: z.number().int().positive().optional()
});

const cliConfigSchema = z.object({
  baseUrl: z.string().url().optional(),
  service: z.string().min(1).optional(),
  accessKeyId: z.string().min(1).optional(),
  secretKey: z.string().min(1).optional(),
  activeProfile: z.string().min(1).optional(),
  profiles: z.record(cliProfileSchema).optional(),
  credentialStore: credentialStoreModeSchema.optional(),
  projectName: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  timeoutMs: z.number().int().positive().optional(),
  defaultPageSize: z.number().int().positive().optional(),
  outputDir: z.string().min(1).optional(),
  sessionDir: z.string().min(1).optional(),
  llmBaseUrl: z.string().url().optional(),
  llmApiKey: z.string().min(1).optional(),
  llmAccessKeyId: z.string().min(1).optional(),
  llmSecretKey: z.string().min(1).optional(),
  llmRegion: z.string().min(1).optional(),
  llmService: z.string().min(1).optional(),
  llmModel: z.string().min(1).optional(),
  maxCases: z.number().int().positive().optional()
});

export type VikingCliConfig = z.infer<typeof cliConfigSchema>;
export type VikingCliProfile = z.infer<typeof cliProfileSchema>;

export interface ResolvedCliDefaults {
  activeProfile: string;
  baseUrl: string;
  service: string;
  accessKeyId?: string;
  secretKey?: string;
  credentialStore: CredentialStoreMode;
  resolvedCredentialStoreMode: CredentialStoreBackend;
  authSource: 'flag' | 'env' | 'secure-store' | 'none';
  projectName: string;
  region: string;
  timeoutMs: number;
  defaultPageSize: number;
  outputDir: string;
  sessionDir: string;
  llmBaseUrl?: string;
  llmApiKey?: string;
  llmAccessKeyId?: string;
  llmSecretKey?: string;
  llmRegion?: string;
  llmService?: string;
  llmModel?: string;
  maxCases?: number;
}

const configKeySpecs = {
  'base-url': { property: 'baseUrl', type: 'string', secret: false },
  'project-name': { property: 'projectName', type: 'string', secret: false },
  ak: { property: 'accessKeyId', type: 'string', secret: false, visible: false, managedBy: 'auth' },
  sk: { property: 'secretKey', type: 'string', secret: true, visible: false, managedBy: 'auth' },
  'credentials-store': { property: 'credentialStore', type: 'string', secret: false },
  region: { property: 'region', type: 'string', secret: false },
  'timeout-ms': { property: 'timeoutMs', type: 'number', secret: false },
  'page-size': { property: 'defaultPageSize', type: 'number', secret: false },
  'output-dir': { property: 'outputDir', type: 'string', secret: false },
  'session-dir': { property: 'sessionDir', type: 'string', secret: false },
  'max-cases': { property: 'maxCases', type: 'number', secret: false },
  'llm-base-url': { property: 'llmBaseUrl', type: 'string', secret: false },
  'llm-api-key': { property: 'llmApiKey', type: 'string', secret: true },
  'llm-ak': { property: 'llmAccessKeyId', type: 'string', secret: false },
  'llm-sk': { property: 'llmSecretKey', type: 'string', secret: true },
  'llm-region': { property: 'llmRegion', type: 'string', secret: false },
  'llm-service': { property: 'llmService', type: 'string', secret: false },
  'llm-model': { property: 'llmModel', type: 'string', secret: false }
} as const satisfies Record<
  string,
  { property: keyof VikingCliConfig; type: 'string' | 'number'; secret: boolean; visible?: boolean; managedBy?: 'auth' }
>;

export type CliConfigKey = keyof typeof configKeySpecs;

export function listCliConfigKeys(): CliConfigKey[] {
  return (Object.entries(configKeySpecs)
    .filter(([, spec]) => !('visible' in spec) || spec.visible !== false)
    .map(([key]) => key)) as CliConfigKey[];
}

export function resolveCliConfigPath(customPath?: string): string {
  return customPath ?? process.env.VIKING_CONFIG_PATH ?? path.join(os.homedir(), '.viking', 'config.json');
}

export function loadCliConfigSync(customPath?: string): VikingCliConfig {
  const configPath = resolveCliConfigPath(customPath);
  if (!existsSync(configPath)) return {};
  try {
    const raw = readFileSync(configPath, 'utf8');
    return parseCliConfig(raw);
  } catch {
    return {};
  }
}

export async function loadCliConfig(customPath?: string): Promise<VikingCliConfig> {
  const configPath = resolveCliConfigPath(customPath);
  try {
    const raw = await readFile(configPath, 'utf8');
    return parseCliConfig(raw);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
}

export async function saveCliConfig(config: VikingCliConfig, customPath?: string): Promise<string> {
  const configPath = resolveCliConfigPath(customPath);
  const normalized = cliConfigSchema.parse(config);
  await ensureDir(path.dirname(configPath));
  await writeJson(configPath, normalized);
  return configPath;
}

export function configPathExists(customPath?: string): boolean {
  return existsSync(resolveCliConfigPath(customPath));
}

export function getCliConfigValue(config: VikingCliConfig, key: CliConfigKey): string | number | undefined {
  const property = configKeySpecs[key].property;
  return config[property] as string | number | undefined;
}

export function setCliConfigValue(config: VikingCliConfig, key: CliConfigKey, rawValue: string): VikingCliConfig {
  const property = configKeySpecs[key].property;
  const next = { ...config };
  next[property] = parseCliConfigValue(key, rawValue) as never;
  return cliConfigSchema.parse(next);
}

export function unsetCliConfigValue(config: VikingCliConfig, key: CliConfigKey): VikingCliConfig {
  const property = configKeySpecs[key].property;
  const next = { ...config };
  delete next[property];
  return cliConfigSchema.parse(next);
}

export function formatCliConfigEntries(config: VikingCliConfig, revealSecrets = false): Array<{ key: CliConfigKey; value: string | number }> {
  return listCliConfigKeys()
    .map(key => {
      const value = getCliConfigValue(config, key);
      if (value === undefined) return undefined;
      if (!revealSecrets && configKeySpecs[key].secret && typeof value === 'string') {
        return { key, value: maskSecret(value) };
      }
      return { key, value };
    })
    .filter((entry): entry is { key: CliConfigKey; value: string | number } => entry !== undefined);
}

export function isAuthManagedCliConfigKey(key: CliConfigKey): boolean {
  const spec = configKeySpecs[key];
  return 'managedBy' in spec && spec.managedBy === 'auth';
}

export function resolveCliDefaults(input: Partial<ResolvedCliDefaults> = {}, customPath?: string): ResolvedCliDefaults {
  const stored = loadCliConfigSync(customPath);
  const activeProfile = resolveActiveCliProfile(stored, input.activeProfile ?? process.env.VIKING_PROFILE);
  const profileConfig = getCliProfile(stored, activeProfile) ?? {};
  const credentialStore = resolveCredentialStoreMode(
    input.credentialStore ?? process.env.VIKING_CREDENTIALS_STORE ?? profileConfig.credentialStore ?? stored.credentialStore
  );
  const credentialStatus = getCredentialStoreStatus(credentialStore);
  let credentialLookup: ReturnType<typeof loadServiceCredentialsSync> = {
    backend: credentialStatus.resolvedMode
  };
  let credentialLoadError: Error | undefined;
  try {
    credentialLookup = loadServiceCredentialsSync(credentialStore, activeProfile);
  } catch (error) {
    credentialLoadError = error as Error;
  }
  const llmAccessKeyId = input.llmAccessKeyId ?? process.env.VIKING_LLM_AK ?? stored.llmAccessKeyId;
  const llmApiKey = input.llmApiKey ?? process.env.VIKING_LLM_API_KEY ?? stored.llmApiKey;
  const authSource: ResolvedCliDefaults['authSource'] =
    input.accessKeyId || input.secretKey
      ? 'flag'
      : process.env.VIKING_AK || process.env.VIKING_SK
        ? 'env'
        : credentialLookup.credentials
          ? 'secure-store'
          : 'none';

  if (
    credentialLoadError &&
    !input.accessKeyId &&
    !input.secretKey &&
    !process.env.VIKING_AK &&
    !process.env.VIKING_SK
  ) {
    throw credentialLoadError;
  }

  return {
    activeProfile,
    baseUrl: input.baseUrl ?? process.env.VIKING_BASE_URL ?? profileConfig.baseUrl ?? stored.baseUrl ?? DEFAULT_BASE_URL,
    service: input.service ?? stored.service ?? DEFAULT_SERVICE,
    accessKeyId:
      input.accessKeyId ??
      process.env.VIKING_AK ??
      credentialLookup.credentials?.accessKeyId,
    secretKey:
      input.secretKey ??
      process.env.VIKING_SK ??
      credentialLookup.credentials?.secretKey,
    credentialStore,
    resolvedCredentialStoreMode: credentialLookup.backend ?? credentialStatus.resolvedMode,
    authSource,
    projectName: input.projectName ?? process.env.VIKING_PROJECT_NAME ?? profileConfig.projectName ?? stored.projectName ?? DEFAULT_PROJECT_NAME,
    region: input.region ?? process.env.VIKING_REGION ?? profileConfig.region ?? stored.region ?? DEFAULT_REGION,
    timeoutMs:
      input.timeoutMs ??
      optionalNumber(process.env.VIKING_TIMEOUT_MS) ??
      profileConfig.timeoutMs ??
      stored.timeoutMs ??
      DEFAULT_TIMEOUT_MS,
    defaultPageSize: input.defaultPageSize ?? optionalNumber(process.env.VIKING_PAGE_SIZE) ?? stored.defaultPageSize ?? DEFAULT_PAGE_SIZE,
    outputDir: input.outputDir ?? process.env.VIKING_OUTPUT_DIR ?? stored.outputDir ?? DEFAULT_OUTPUT_DIR,
    sessionDir: input.sessionDir ?? process.env.VIKING_SESSION_DIR ?? stored.sessionDir ?? DEFAULT_SESSION_DIR,
    llmBaseUrl:
      input.llmBaseUrl ??
      process.env.VIKING_LLM_BASE_URL ??
      stored.llmBaseUrl ??
      (llmAccessKeyId || llmApiKey ? DEFAULT_LLM_BASE_URL : undefined),
    llmApiKey,
    llmAccessKeyId,
    llmSecretKey: input.llmSecretKey ?? process.env.VIKING_LLM_SK ?? stored.llmSecretKey,
    llmRegion: input.llmRegion ?? process.env.VIKING_LLM_REGION ?? stored.llmRegion ?? DEFAULT_LLM_REGION,
    llmService: input.llmService ?? process.env.VIKING_LLM_SERVICE ?? stored.llmService ?? DEFAULT_LLM_SERVICE,
    llmModel: input.llmModel ?? process.env.VIKING_LLM_MODEL ?? stored.llmModel,
    maxCases: input.maxCases ?? optionalNumber(process.env.VIKING_MAX_CASES) ?? stored.maxCases
  };
}

export function resolveActiveCliProfile(config: VikingCliConfig, requestedProfile?: string): string {
  return normalizeProfileName(requestedProfile ?? config.activeProfile ?? DEFAULT_AUTH_PROFILE);
}

export function getCliProfile(config: VikingCliConfig, profileName: string): VikingCliProfile | undefined {
  const normalized = normalizeProfileName(profileName);
  return config.profiles?.[normalized];
}

export function listCliProfiles(config: VikingCliConfig): Array<{ name: string; active: boolean; config: VikingCliProfile }> {
  const activeProfile = resolveActiveCliProfile(config);
  const names = new Set<string>([activeProfile]);
  for (const name of Object.keys(config.profiles ?? {})) {
    names.add(name);
  }
  return [...names]
    .sort((left, right) => left.localeCompare(right))
    .map(name => ({
      name,
      active: name === activeProfile,
      config: getCliProfile(config, name) ?? {}
    }));
}

export function setActiveCliProfile(config: VikingCliConfig, profileName: string): VikingCliConfig {
  return cliConfigSchema.parse({
    ...config,
    activeProfile: normalizeProfileName(profileName)
  });
}

export function upsertCliProfile(
  config: VikingCliConfig,
  profileName: string,
  patch: Partial<VikingCliProfile>
): VikingCliConfig {
  const normalized = normalizeProfileName(profileName);
  const current = config.profiles?.[normalized] ?? {};
  const merged = cliProfileSchema.parse({
    ...current,
    ...patch
  });
  return cliConfigSchema.parse({
    ...config,
    profiles: {
      ...(config.profiles ?? {}),
      [normalized]: merged
    }
  });
}

export function parseCliConfigKey(value: string): CliConfigKey {
  const normalized = normalizeCliConfigKey(value);
  if (normalized in configKeySpecs) {
    return normalized as CliConfigKey;
  }
  throw new Error(`Unknown config key: ${value}. Use one of: ${listCliConfigKeys().join(', ')}`);
}

function parseCliConfig(raw: string): VikingCliConfig {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  return cliConfigSchema.parse(JSON.parse(trimmed) as unknown);
}

function parseCliConfigValue(key: CliConfigKey, rawValue: string): string | number {
  if (key === 'credentials-store') {
    return resolveCredentialStoreMode(rawValue);
  }

  if (configKeySpecs[key].type === 'number') {
    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`Config key ${key} expects a positive integer.`);
    }
    return parsed;
  }

  if (rawValue.trim().length === 0) {
    throw new Error(`Config key ${key} cannot be empty.`);
  }
  return rawValue;
}

function normalizeCliConfigKey(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

function optionalNumber(rawValue: string | undefined): number | undefined {
  if (!rawValue) return undefined;
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function maskSecret(value: string): string {
  if (value.length <= 6) return '*'.repeat(value.length);
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

function normalizeProfileName(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('Profile name cannot be empty.');
  }
  if (!/^[A-Za-z0-9._-]+$/.test(normalized)) {
    throw new Error(`Invalid profile name: ${value}`);
  }
  return normalized;
}
