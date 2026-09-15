// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { hasHelpFlag, isDomainHelpRequest, renderUsageBlock } from '../core/help-utils';
import { VikingOpenApiClient } from '../core/openapi-client';
import { printOutput } from '../core/output-format';
import { resolveServiceConfig, type ServiceConfigInput } from '../core/service-config';
import {
  deleteServiceCredentialsSync,
  getCredentialStoreStatus,
  loadServiceCredentialsSync,
  parseCredentialStoreMode,
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

export interface AuthImportEnvOptions extends PlatformServiceOptions {
  credentialStore?: CredentialStoreMode;
  profile?: string;
}

export interface AuthLogoutOptions {
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
    accessKeyId: options.accessKeyId,
    secretKey: options.secretKey,
    projectName: options.projectName,
    region: options.region,
    timeoutMs: options.timeoutMs,
    credentialStore: options.credentialStore,
    activeProfile: options.profile
  });
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
    projectName: options.projectName,
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
    projectName: options.projectName,
    region: options.region,
    timeoutMs: options.timeoutMs,
    credentialStore: options.credentialStore,
    activeProfile: options.profile
  });
  const selectedProfile = resolveActiveCliProfile(existingConfig, options.profile ?? defaults.activeProfile);
  const persisted = await persistAuthCredentials({
    existingConfig,
    defaults,
    selectedProfile,
    accessKeyId,
    secretKey,
    baseUrl: options.baseUrl,
    projectName: options.projectName,
    region: options.region,
    timeoutMs: options.timeoutMs,
    credentialStore: options.credentialStore
  });

  const importedKeys = ['VIKING_AK', 'VIKING_SK'];
  if (process.env.VIKING_BASE_URL || options.baseUrl) importedKeys.push('VIKING_BASE_URL');
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

export async function runAuthStatusCommand(options: AuthStatusOptions = {}): Promise<void> {
  const currentConfig = await loadCliConfig();
  const defaults = resolveCliDefaults({
    baseUrl: options.baseUrl,
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

  await printJson({
    loggedIn: Boolean(defaults.accessKeyId && defaults.secretKey),
    activeProfile: defaults.activeProfile,
    source: defaults.authSource,
    accessKeyId: defaults.accessKeyId ? maskCredential(defaults.accessKeyId) : null,
    baseUrl: defaults.baseUrl,
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
      projectName: entry.config.projectName ?? currentConfig.projectName ?? defaults.projectName,
      region: entry.config.region ?? null,
      credentialStore: entry.config.credentialStore ?? currentConfig.credentialStore ?? 'auto'
    }))
  });
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

export async function runDoctorCommand(): Promise<void> {
  const config = await loadCliConfig();
  const resolved = resolveCliDefaults();
  const credentialStatus = getCredentialStoreStatus(resolved.credentialStore);
  const checks = [
    {
      name: 'config_file',
      ok: configPathExists(),
      detail: resolveCliConfigPath()
    },
    {
      name: 'service_auth',
      ok: Boolean(resolved.accessKeyId && resolved.secretKey),
      detail:
        resolved.accessKeyId && resolved.secretKey
          ? `AK/SK configured via ${resolved.authSource}`
          : 'missing AK/SK'
    },
    {
      name: 'llm',
      ok: Boolean((resolved.llmAccessKeyId && resolved.llmSecretKey) || resolved.llmApiKey),
      detail: resolved.llmModel ?? 'LLM not configured'
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
      const serviceConfig = resolveServiceConfig({
        baseUrl: resolved.baseUrl,
        accessKeyId: resolved.accessKeyId,
        secretKey: resolved.secretKey,
        region: resolved.region,
        timeoutMs: Math.min(resolved.timeoutMs, 5000)
      });
      await runServiceAuthProbe(serviceConfig);
      auth = { ok: true, detail: `GetUserConsoleConfig succeeded (project=${DEFAULT_PROJECT_NAME})` };
    } catch (error) {
      auth = {
        ok: false,
        detail: error instanceof Error ? error.message.split('\n')[0] : String(error)
      };
    }
  }

  const ok = checks.every(check => check.ok) && (auth?.ok ?? true);
  await printJson({
    ok,
    configPath: resolveCliConfigPath(),
    resolved: {
      baseUrl: resolved.baseUrl,
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

const DEFAULT_PROJECT_NAME = 'default';

async function runServiceAuthProbe(config: ReturnType<typeof resolveServiceConfig>): Promise<unknown> {
  return new VikingOpenApiClient(config).post('/api/v1/GetUserConsoleConfig', {
    ProjectName: DEFAULT_PROJECT_NAME
  });
}

export async function runPlatformDomainFromArgv(domain: string, argv: string[]): Promise<boolean> {
  switch (domain) {
    case 'auth':
      await runAuthCli(argv);
      return true;
    case 'doctor':
      await runDoctorCli(argv);
      return true;
    default:
      return false;
  }
}

export function printPlatformDomainsHelp(): void {
  const publicLines = [
    'vs auth login|import-env|status|logout|list|use',
    'vs doctor'
  ];
  console.log(['PLATFORM COMMANDS', renderUsageBlock(publicLines)].join('\n'));
}

function printDomainHelp(domain: string): void {
  const helpByDomain: Record<string, string> = {
    auth: renderUsageBlock(
      [
        'vs auth login [--profile <name>] [--ak <ak>] [--sk <sk>] [--base-url <url>] [--region <region>] [--store auto|keychain|file|ephemeral] [--no-prompt] [--format <format>]',
        'vs auth import-env [--profile <name>] [--base-url <url>] [--region <region>] [--store auto|keychain|file|ephemeral] [--format <format>]',
        'vs auth status [--profile <name>] [--format <format>]',
        'vs auth logout [--profile <name>] [--store auto|keychain|file|ephemeral] [--format <format>]',
        'vs auth list [--format <format>]',
        'vs auth use <profile> [--format <format>]'
      ]
    ),
    doctor: `USAGE
  vs doctor [--format <format>] [--jq <selector>] [--output <path>]`
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

async function runDoctorCli(argv: string[]): Promise<void> {
  if (hasHelpFlag(argv)) {
    printDomainHelp('doctor');
    return;
  }
  await runDoctorCommand();
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
      'project-name': { type: 'string' },
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
    accessKeyId: optionalString(values.ak),
    secretKey: optionalString(values.sk),
    projectName: optionalString(values['project-name']),
    region: optionalString(values.region),
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

async function persistAuthCredentials(options: {
  existingConfig: VikingCliConfig;
  defaults: ResolvedCliDefaults;
  selectedProfile: string;
  accessKeyId: string;
  secretKey: string;
  baseUrl?: string;
  projectName?: string;
  region?: string;
  timeoutMs?: number;
  credentialStore?: CredentialStoreMode;
}): Promise<{
  selectedStore: CredentialStoreMode;
  savedBackend: ReturnType<typeof saveServiceCredentialsSync>;
  configPath: string;
  baseUrl: string;
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

  let nextConfig = setActiveCliProfile(options.existingConfig, options.selectedProfile);
  nextConfig = upsertCliProfile(nextConfig, options.selectedProfile, {
    baseUrl: options.baseUrl ?? options.defaults.baseUrl,
    projectName: options.projectName ?? options.defaults.projectName,
    region: options.region ?? options.defaults.region,
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
    baseUrl: options.baseUrl ?? options.defaults.baseUrl,
    projectName: options.projectName ?? options.defaults.projectName,
    region: options.region ?? options.defaults.region
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
